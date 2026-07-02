import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import materialRoutes from './routes/materials.js';
import assignmentRoutes from './routes/assignments.js';
import awsRoutes from './routes/aws.js';

// DB Init
import './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files (S3 bucket mock)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/aws', awsRoutes);

// Serve Static Frontend files in production
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
  console.log('Serving frontend from production build: /frontend/dist');
} else {
  // Simple check route when frontend isn't built
  app.get('/', (req, res) => {
    res.json({
      status: 'Apex University API Server is active.',
      environment: 'AWS Local Simulator',
      ports: {
        backend: PORT,
        frontend: '5173 (Vite Dev Server)'
      }
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`APEX UNIVERSITY CLOUD PORTAL RUNNING ON PORT ${PORT}`);
  console.log(`Simulating S3 Local Storage in backend/uploads/`);
  console.log(`Simulating RDS DB in backend/portal.db`);
  console.log(`VPC & IAM controls running inside API Router`);
  console.log(`==================================================`);
});
