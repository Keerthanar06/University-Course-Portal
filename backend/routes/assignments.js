import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken, authorizeRoles } from './auth.js';
import { UPLOAD_DIR } from './materials.js';

const router = express.Router();

// Multer Setup for submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'submission-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB file limit
});

// GET assignments for a course (students see their submission status, faculty see all assignments)
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  const { courseId } = req.params;

  try {
    if (req.user.role === 'student') {
      // Return assignments + student submission status
      const assignments = await allQuery(`
        SELECT a.*, 
        s.id as submission_id, s.file_name as submitted_file, s.submitted_at, s.grade, s.feedback
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
        WHERE a.course_id = ?
        ORDER BY a.due_date ASC
      `, [req.user.id, courseId]);
      res.json(assignments);
    } else {
      // Faculty / Admin see assignments
      const assignments = await allQuery(`
        SELECT a.*, 
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
        FROM assignments a
        WHERE a.course_id = ?
        ORDER BY a.due_date ASC
      `, [courseId]);
      res.json(assignments);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve assignments.' });
  }
});

// POST Create Assignment (Faculty only)
router.post('/', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  const { courseId, title, description, dueDate } = req.body;

  if (!courseId || !title || !dueDate) {
    return res.status(400).json({ message: 'Course ID, title, and due date are required.' });
  }

  try {
    // Verify faculty teaches this course
    const course = await getQuery('SELECT code FROM courses WHERE id = ? AND instructor_id = ?', [courseId, req.user.id]);
    if (!course) {
      return res.status(403).json({ message: 'You do not teach this course.' });
    }

    await runQuery(
      'INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)',
      [courseId, title, description || '', dueDate]
    );

    res.status(201).json({ message: 'Assignment created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create assignment.' });
  }
});

// POST Submit Assignment (Student only)
router.post('/:id/submit', authenticateToken, authorizeRoles('student'), upload.single('file'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No submission file uploaded.' });
  }

  try {
    // 1. Get assignment & course details
    const assignment = await getQuery(`
      SELECT a.title, c.code, c.id as course_id
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (!assignment) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // 2. Verify student is enrolled in the course
    const enrolled = await getQuery('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, assignment.course_id]);
    if (!enrolled) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You are not enrolled in this course.' });
    }

    // 3. Format simulated S3 Key
    const s3Bucket = 'university-course-portal-bucket-prod';
    const s3Key = `courses/${assignment.code}/assignments/${id}/student-${req.user.id}-${req.file.originalname}`;

    // Check if submission already exists
    const existing = await getQuery('SELECT id, file_name FROM submissions WHERE assignment_id = ? AND student_id = ?', [id, req.user.id]);

    if (existing) {
      // Delete old file from storage
      const oldFilePath = path.join(UPLOAD_DIR, existing.file_name);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Update submission
      await runQuery(
        `UPDATE submissions SET file_name = ?, s3_key = ?, submitted_at = CURRENT_TIMESTAMP, grade = NULL, feedback = NULL 
         WHERE id = ?`,
        [req.file.filename, s3Key, existing.id]
      );
    } else {
      // Create new submission
      await runQuery(
        `INSERT INTO submissions (assignment_id, student_id, file_name, s3_key) 
         VALUES (?, ?, ?, ?)`,
        [id, req.user.id, req.file.filename, s3Key]
      );
    }

    // Log S3 Write Event
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_PUT_OBJECT', `Student submission file uploaded to S3 Bucket '${s3Bucket}' with key: '${s3Key}'`, req.user.email]
    );

    res.json({ message: 'Assignment submitted successfully.' });

  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Submission failed.' });
  }
});

// GET list of submissions for a specific assignment (Faculty only)
router.get('/:id/submissions', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  const { id } = req.params;

  try {
    // Verify instructor owns course for assignment
    const ownsAssignment = await getQuery(`
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ? AND c.instructor_id = ?
    `, [id, req.user.id]);

    if (!ownsAssignment) {
      return res.status(403).json({ message: 'You are not authorized to view submissions for this assignment.' });
    }

    const submissions = await allQuery(`
      SELECT s.*, u.name as student_name, u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [id]);

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve submissions.' });
  }
});

// POST grade assignment (Faculty only)
router.post('/submissions/:submissionId/grade', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  if (!grade) {
    return res.status(400).json({ message: 'Grade is required.' });
  }

  try {
    // Verify instructor teaches the course for this submission
    const ownsSubmission = await getQuery(`
      SELECT 1 FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = ? AND c.instructor_id = ?
    `, [submissionId, req.user.id]);

    if (!ownsSubmission) {
      return res.status(403).json({ message: 'You are not authorized to grade this submission.' });
    }

    await runQuery(
      'UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?',
      [grade, feedback || '', submissionId]
    );

    // Log RDS write
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['RDS_QUERY_WRITE', `Updated grade/feedback for submission ID ${submissionId}. Set Grade: '${grade}'`, req.user.email]
    );

    res.json({ message: 'Submission graded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to grade submission.' });
  }
});

// GET download student submission file (Faculty/Student only)
router.get('/download-submission/:filename', authenticateToken, async (req, res) => {
  const { filename } = req.params;

  try {
    const submission = await getQuery('SELECT * FROM submissions WHERE file_name = ?', [filename]);
    if (!submission) {
      return res.status(404).json({ message: 'Submission file entry not found.' });
    }

    // Verify user owns submission or teaches course
    let authorized = false;
    if (req.user.role === 'student' && submission.student_id === req.user.id) {
      authorized = true;
    } else if (req.user.role === 'faculty') {
      const owns = await getQuery(`
        SELECT 1 FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ? AND c.instructor_id = ?
      `, [submission.assignment_id, req.user.id]);
      if (owns) authorized = true;
    } else if (req.user.role === 'admin') {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Access Denied: You do not have permissions to access this assignment.' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found.' });
    }

    // Log S3 Access Event
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['S3_GET_OBJECT', `Downloaded submission S3 Object key '${submission.s3_key}'`, req.user.email]
    );

    res.download(filePath, submission.s3_key.split('/').pop());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving submission file.' });
  }
});

export default router;
