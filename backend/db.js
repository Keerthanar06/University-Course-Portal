import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'portal.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database (simulating AWS RDS PostgreSQL).');
    initializeSchema();
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeSchema() {
  try {
    // 1. Users Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'faculty', 'student')),
        name TEXT NOT NULL,
        avatar TEXT,
        iam_arn TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Courses Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        instructor_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(instructor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 3. Enrollments Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS enrollments (
        student_id INTEGER,
        course_id INTEGER,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(student_id, course_id),
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // 4. Materials Table (S3 simulation metadata)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        s3_key TEXT NOT NULL,
        s3_bucket TEXT NOT NULL,
        uploaded_by INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 5. Assignments Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // 6. Submissions Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER,
        student_id INTEGER,
        file_name TEXT NOT NULL,
        s3_key TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        grade TEXT,
        feedback TEXT,
        FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(assignment_id, student_id)
      )
    `);

    // 7. Announcements Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER, -- NULL means portal-wide announcement
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        posted_by INTEGER,
        posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY(posted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 8. AWS Audit Logs (For simulated AWS VPC / IAM event tracking)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS aws_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        details TEXT NOT NULL,
        user_email TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables verified/created successfully.');
    await seedData();

  } catch (err) {
    console.error('Error setting up tables:', err.message);
  }
}

async function seedData() {
  try {
    // Check if user table is seeded
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding initial database content...');

    // 1. Create Default Users (Admin, Faculty, Students)
    const salt = bcrypt.genSaltSync(10);
    const adminPass = bcrypt.hashSync('admin123', salt);
    const facultyPass = bcrypt.hashSync('faculty123', salt);
    const studentPass = bcrypt.hashSync('student123', salt);

    const adminId = (await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      ['admin@apex.edu', adminPass, 'admin', 'Dr. Sarah Jenkins (Admin)', 'arn:aws:iam::123456789012:role/ApexPortalAdminRole']
    )).lastID;

    const fac1Id = (await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      ['alan.turing@apex.edu', facultyPass, 'faculty', 'Prof. Alan Turing', 'arn:aws:iam::123456789012:role/ApexPortalFacultyRole']
    )).lastID;

    const fac2Id = (await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      ['ada.lovelace@apex.edu', facultyPass, 'faculty', 'Prof. Ada Lovelace', 'arn:aws:iam::123456789012:role/ApexPortalFacultyRole']
    )).lastID;

    const stud1Id = (await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      ['student.alice@apex.edu', studentPass, 'student', 'Alice Cooper', 'arn:aws:iam::123456789012:role/ApexPortalStudentRole']
    )).lastID;

    const stud2Id = (await runQuery(
      `INSERT INTO users (email, password_hash, role, name, iam_arn) VALUES (?, ?, ?, ?, ?)`,
      ['student.bob@apex.edu', studentPass, 'student', 'Bob Vance', 'arn:aws:iam::123456789012:role/ApexPortalStudentRole']
    )).lastID;

    // 2. Create Courses
    const course1Id = (await runQuery(
      `INSERT INTO courses (code, title, description, instructor_id) VALUES (?, ?, ?, ?)`,
      ['CS-101', 'Introduction to Computer Science', 'Fundamental concepts of programming, algorithms, and computational thinking using Python.', fac1Id]
    )).lastID;

    const course2Id = (await runQuery(
      `INSERT INTO courses (code, title, description, instructor_id) VALUES (?, ?, ?, ?)`,
      ['CS-302', 'Cloud Computing Architecture', 'Design principles of distributed systems using cloud architectures with AWS (VPC, EC2, S3, RDS).', fac2Id]
    )).lastID;

    const course3Id = (await runQuery(
      `INSERT INTO courses (code, title, description, instructor_id) VALUES (?, ?, ?, ?)`,
      ['CS-204', 'Data Structures & Algorithms', 'In-depth exploration of arrays, linked lists, trees, graphs, sorting, and search algorithms.', fac1Id]
    )).lastID;

    // 3. Enroll Students
    // Alice enrolled in all courses
    await runQuery(`INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`, [stud1Id, course1Id]);
    await runQuery(`INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`, [stud1Id, course2Id]);
    await runQuery(`INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`, [stud1Id, course3Id]);

    // Bob enrolled in CS-101 and CS-302
    await runQuery(`INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`, [stud2Id, course1Id]);
    await runQuery(`INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`, [stud2Id, course2Id]);

    // 4. Create Announcements
    await runQuery(`
      INSERT INTO announcements (course_id, title, content, posted_by) VALUES (?, ?, ?, ?)
    `, [null, 'Welcome to Apex University Course Portal!', 'We are excited to launch our cloud-hosted course portal. All materials are stored in our secure, encrypted S3 buckets. If you experience issues, consult the system documentation.', adminId]);

    await runQuery(`
      INSERT INTO announcements (course_id, title, content, posted_by) VALUES (?, ?, ?, ?)
    `, [course2Id, 'Term Project Released: AWS Deployment', 'The cloud computing project guidelines have been posted in the assignments tab. You will be building a secure VPC. Mid-term review is on June 15th.', fac2Id]);

    // 5. Create Assignments
    await runQuery(`
      INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)
    `, [course1Id, 'Problem Set 1: Python Basics', 'Write script solutions for the 5 programming exercises attached. Submit a single .py file or zip.', '2026-06-10 23:59:59']);

    await runQuery(`
      INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)
    `, [course2Id, 'Project Stage 1: VPC Architecture Setup', 'Deploy a standard AWS VPC with 2 public subnets and 2 private subnets. Submit a PDF report outlining the route table and security groups configuration.', '2026-06-20 23:59:59']);

    // 6. Log Initial AWS setup
    await runQuery(`
      INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)
    `, ['VPC_INITIALIZED', 'Default VPC (10.0.0.0/16) initialized with 2 public subnets (10.0.1.0/24, 10.0.2.0/24) and 2 private subnets (10.0.3.0/24, 10.0.4.0/24).', 'admin@apex.edu']);
    await runQuery(`
      INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)
    `, ['RDS_SEEDED', 'RDS DB Instance postgres-apex-prod initialized and database tables seeded.', 'admin@apex.edu']);
    await runQuery(`
      INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)
    `, ['S3_BUCKET_CREATED', 'S3 bucket s3://university-course-portal-bucket-prod/ provisioned with default AES-256 SSE encryption.', 'admin@apex.edu']);

    console.log('Database successfully seeded!');
  } catch (err) {
    console.error('Error seeding initial data:', err.message);
  }
}

export {
  db,
  runQuery,
  getQuery,
  allQuery
};
