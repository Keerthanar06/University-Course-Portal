import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken, authorizeRoles } from './auth.js';

const router = express.Router();

// GET all courses (with optional enrollments state)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await allQuery(`
        SELECT c.*, u.name as instructor_name 
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
      `);
    } else if (req.user.role === 'faculty') {
      courses = await allQuery(`
        SELECT c.*, u.name as instructor_name 
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.instructor_id = ?
      `, [req.user.id]);
    } else { // student
      // Return all courses, but tag whether student is enrolled
      courses = await allQuery(`
        SELECT c.*, u.name as instructor_name,
        (SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = ?) as is_enrolled
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
      `, [req.user.id]);
    }
    
    // Log RDS Select Query
    runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['RDS_QUERY', `Executed SELECT query on courses for user: ${req.user.email}`, req.user.email]
    ).catch(console.error);

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve courses.' });
  }
});

// GET single course details
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await getQuery(`
      SELECT c.*, u.name as instructor_name, u.email as instructor_email
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // If student, check if they are enrolled
    if (req.user.role === 'student') {
      const enrollment = await getQuery(
        'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.id, id]
      );
      course.is_enrolled = !!enrollment;
    }

    // Fetch course announcements
    const announcements = await allQuery(`
      SELECT a.*, u.name as posted_by_name 
      FROM announcements a
      LEFT JOIN users u ON a.posted_by = u.id
      WHERE a.course_id = ? OR a.course_id IS NULL
      ORDER BY a.posted_at DESC
    `, [id]);

    res.json({ course, announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve course details.' });
  }
});

// POST Create Course (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { code, title, description, instructor_id } = req.body;

  if (!code || !title) {
    return res.status(400).json({ message: 'Course code and title are required.' });
  }

  try {
    const existing = await getQuery('SELECT id FROM courses WHERE code = ?', [code.trim().toUpperCase()]);
    if (existing) {
      return res.status(400).json({ message: 'Course code already exists.' });
    }

    const result = await runQuery(
      `INSERT INTO courses (code, title, description, instructor_id) VALUES (?, ?, ?, ?)`,
      [code.trim().toUpperCase(), title, description, instructor_id || null]
    );

    // Log in RDS logs
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['RDS_QUERY_WRITE', `Admin created course ${code} (ID: ${result.lastID}) in DB.`, req.user.email]
    );

    res.status(201).json({
      message: 'Course created successfully.',
      courseId: result.lastID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create course.' });
  }
});

// POST Enroll in Course (Student only)
router.post('/:id/enroll', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { id } = req.params;

  try {
    const course = await getQuery('SELECT title, code FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ message: 'Course does not exist.' });
    }

    const enrollment = await getQuery(
      'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, id]
    );

    if (enrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course.' });
    }

    await runQuery(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, id]
    );

    // Log RDS write
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['RDS_QUERY_WRITE', `Student enrolled in course ${course.code}: ${course.title}`, req.user.email]
    );

    res.json({ message: 'Successfully enrolled in course.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Enrollment failed.' });
  }
});

// POST Drop Course (Student only)
router.post('/:id/drop', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery(
      'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, id]
    );

    res.json({ message: 'Successfully dropped course.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to drop course.' });
  }
});

// POST Create Announcement (Faculty or Admin only)
router.post('/:id/announcements', authenticateToken, authorizeRoles('faculty', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    // If faculty, verify they teach this course
    if (req.user.role === 'faculty') {
      const teaches = await getQuery(
        'SELECT 1 FROM courses WHERE id = ? AND instructor_id = ?',
        [id, req.user.id]
      );
      if (!teaches) {
        return res.status(403).json({ message: 'You are not the instructor for this course.' });
      }
    }

    await runQuery(
      'INSERT INTO announcements (course_id, title, content, posted_by) VALUES (?, ?, ?, ?)',
      [id, title, content, req.user.id]
    );

    res.status(201).json({ message: 'Announcement posted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to post announcement.' });
  }
});

export default router;
