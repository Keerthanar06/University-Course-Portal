import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getQuery, runQuery, allQuery } from '../db.js';

const router = express.Router();
const JWT_SECRET = 'apex_university_jwt_secret_kms_key'; // Simulated AWS KMS managed key

// Middleware to verify JWT token and extract user
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authorization token required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired session token.' });
    req.user = user;
    next();
  });
}

// Middleware to check specific role
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt in AWS logs
      runQuery(
        `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
        [
          'IAM_UNAUTHORIZED_ACCESS',
          `Access denied for ${req.user.email} (Role: ${req.user.role}) trying to access restricted resources.`,
          req.user.email
        ]
      ).catch(console.error);

      return res.status(403).json({ message: 'Access Denied: Insufficient IAM permissions.' });
    }
    next();
  };
}

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, iam_arn: user.iam_arn },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Log successful IAM Signin in AWS Logs
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['IAM_SIGNIN', `User signed in successfully using role: ${user.role} (ARN: ${user.iam_arn})`, user.email]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        iam_arn: user.iam_arn
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error during authentication.' });
  }
});

// GET Me (Session verify)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, email, role, name, iam_arn, avatar FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Database query error.' });
  }
});

// POST Create User (Admin only)
router.post('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { email, password, role, name } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ message: 'All fields (email, password, role, name) are required.' });
  }

  if (!['admin', 'faculty', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role assignment.' });
  }

  try {
    const existing = await getQuery('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    
    // Map role to IAM ARN
    const capsRole = role.charAt(0).toUpperCase() + role.slice(1);
    const iam_arn = `arn:aws:iam::123456789012:role/ApexPortal${capsRole}Role`;

    const result = await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      [email.trim().toLowerCase(), password_hash, role, name, iam_arn]
    );

    // Log User Creation in AWS logs
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['IAM_USER_CREATED', `Admin created user ${email} and assigned role: ${role} (ARN: ${iam_arn})`, req.user.email]
    );

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: result.lastID,
        email,
        role,
        name,
        iam_arn
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// GET All Users (Admin only)
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await allQuery('SELECT id, email, role, name, iam_arn, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// DELETE User (Admin only)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own administrative account.' });
  }

  try {
    const userToDelete = await getQuery('SELECT email, role FROM users WHERE id = ?', [id]);
    if (!userToDelete) return res.status(404).json({ message: 'User not found.' });

    await runQuery('DELETE FROM users WHERE id = ?', [id]);

    // Log deletion in AWS Logs
    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['IAM_USER_DELETED', `Admin deleted user ${userToDelete.email} (Role: ${userToDelete.role})`, req.user.email]
    );

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

export default router;
