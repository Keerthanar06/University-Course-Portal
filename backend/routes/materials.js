import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken, authorizeRoles } from './auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Upload Directory (Acts as S3 bucket storage locally)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Prefix filename with timestamp to prevent collisions, just like S3 keys can use prefixes
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file limit
});

// GET all materials for a specific course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    const materials = await allQuery(`
      SELECT m.*, u.name as uploaded_by_name 
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = ?
      ORDER BY m.uploaded_at DESC
    `, [courseId]);

    // Log simulated S3 Read action
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_GET_OBJECT', `Listed materials for course ID ${courseId}. Simulating S3 bucket scan on s3://university-course-portal-bucket-prod/`, req.user.email]
    );

    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve course materials.' });
  }
});

// POST upload course notes/study material (Faculty only)
router.post('/upload', authenticateToken, authorizeRoles('faculty'), upload.single('file'), async (req, res) => {
  const { courseId, title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!courseId || !title) {
    return res.status(400).json({ message: 'Course ID and title are required.' });
  }

  try {
    // 1. Verify faculty teaches this course
    const course = await getQuery('SELECT code FROM courses WHERE id = ? AND instructor_id = ?', [courseId, req.user.id]);
    if (!course) {
      // Remove file from disk since unauthorized
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You are not the designated instructor for this course.' });
    }

    // 2. Format details for simulated AWS S3 Response
    const s3Bucket = 'university-course-portal-bucket-prod';
    const cleanFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `courses/${course.code}/materials/${Date.now()}-${cleanFileName}`;
    const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();
    const fileSize = req.file.size;

    // 3. Save reference in DB
    await runQuery(
      `INSERT INTO materials (course_id, title, description, file_name, file_type, file_size, s3_key, s3_bucket, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, description || '', req.file.filename, fileType, fileSize, s3Key, s3Bucket, req.user.id]
    );

    // 4. Log simulated AWS Cloud events
    const eTag = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_PUT_OBJECT', `Uploaded file '${req.file.originalname}' (Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB) as S3 Key '${s3Key}' to S3 Bucket '${s3Bucket}'. ETag: ${eTag}`, req.user.email]
    );

    res.status(201).json({
      message: 'File uploaded successfully (Stored in S3).',
      s3Response: {
        bucket: s3Bucket,
        key: s3Key,
        location: `/api/materials/download/${req.file.filename}`, // Download path
        eTag,
        size: fileSize
      }
    });

  } catch (err) {
    console.error(err);
    // Cleanup file in case of crash
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload study materials.' });
  }
});

// GET download / stream resource (accessible by students/faculty enrolled)
router.get('/download/:filename', authenticateToken, async (req, res) => {
  const { filename } = req.params;

  try {
    // Get file record from DB
    const fileRecord = await getQuery('SELECT * FROM materials WHERE file_name = ?', [filename]);
    if (!fileRecord) {
      return res.status(404).json({ message: 'Material not found in database registry.' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found in storage bucket.' });
    }

    // Verify access
    if (req.user.role === 'student') {
      const isEnrolled = await getQuery(
        'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.id, fileRecord.course_id]
      );
      if (!isEnrolled) {
        return res.status(403).json({ message: 'Access Denied: You are not enrolled in this course.' });
      }
    } else if (req.user.role === 'faculty') {
      const teaches = await getQuery(
        'SELECT 1 FROM courses WHERE id = ? AND instructor_id = ?',
        [fileRecord.course_id, req.user.id]
      );
      if (!teaches) {
        return res.status(403).json({ message: 'Access Denied: You are not the instructor for this course.' });
      }
    }

    // Log S3 Access Event (GetObject)
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_GET_OBJECT', `Downloaded S3 Object key '${fileRecord.s3_key}' from Bucket '${fileRecord.s3_bucket}' (Simulated pre-signed URL request)`, req.user.email]
    );

    res.download(filePath, fileRecord.s3_key.split('/').pop());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving file.' });
  }
});

// DELETE material (Faculty only)
router.delete('/:id', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  const { id } = req.params;

  try {
    const fileRecord = await getQuery('SELECT * FROM materials WHERE id = ?', [id]);
    if (!fileRecord) {
      return res.status(404).json({ message: 'Material record not found.' });
    }

    // Verify instructor teaches this course
    const course = await getQuery('SELECT 1 FROM courses WHERE id = ? AND instructor_id = ?', [fileRecord.course_id, req.user.id]);
    if (!course) {
      return res.status(403).json({ message: 'You are not the designated instructor for this course.' });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, fileRecord.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete reference in DB
    await runQuery('DELETE FROM materials WHERE id = ?', [id]);

    // Log S3 Delete event
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_DELETE_OBJECT', `Deleted S3 Object '${fileRecord.s3_key}' from S3 Bucket '${fileRecord.s3_bucket}'`, req.user.email]
    );

    res.json({ message: 'Material deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete material.' });
  }
});

export default router;
export { UPLOAD_DIR };
