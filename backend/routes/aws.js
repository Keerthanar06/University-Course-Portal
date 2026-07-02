import express from 'express';
import fs from 'fs';
import path from 'path';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken, authorizeRoles } from './auth.js';
import { UPLOAD_DIR } from './materials.js';

const router = express.Router();

// Mock network security group rules
let securityGroupRules = {
  http: { port: 80, desc: 'HTTP Web Traffic', allowed: true },
  https: { port: 443, desc: 'HTTPS Secure Web Traffic', allowed: true },
  ssh: { port: 22, desc: 'SSH Admin Terminal Access', allowed: false },
  database: { port: 5432, desc: 'RDS PostgreSQL Database Connection', allowed: false }, // only allowed inside VPC
};

// GET AWS Dashboard Status & Metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // 1. Calculate S3 Bucket stats
    let s3Size = 0;
    let s3Count = 0;
    
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      s3Count = files.length;
      files.forEach(file => {
        const stats = fs.statSync(path.join(UPLOAD_DIR, file));
        s3Size += stats.size;
      });
    }

    // 2. Fetch RDS Stats (row counts)
    const tablesCount = {
      users: (await getQuery('SELECT COUNT(*) as count FROM users')).count,
      courses: (await getQuery('SELECT COUNT(*) as count FROM courses')).count,
      materials: (await getQuery('SELECT COUNT(*) as count FROM materials')).count,
      submissions: (await getQuery('SELECT COUNT(*) as count FROM submissions')).count,
    };

    // 3. Generate EC2 performance stats (some dynamic, some stable)
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const ec2Uptime = `${hours}h ${mins}m ${secs}s`;

    // Dynamic CPU simulator
    const cpuBase = 12.5;
    const cpuNoise = Math.sin(Date.now() / 20000) * 5 + Math.random() * 2;
    const ec2Cpu = Math.max(2.1, Math.min(99.0, +(cpuBase + cpuNoise).toFixed(1)));

    // Memory usage
    const memory = process.memoryUsage();
    const usedMemoryMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
    const maxMemoryMb = 2048; // Simulating t3.small (2GB)

    // VPC details
    const vpcConfig = {
      vpcId: 'vpc-07a829e011f0ca93d',
      cidrBlock: '10.0.0.0/16',
      subnets: {
        publicA: { subnetId: 'subnet-09f182cba874', cidr: '10.0.1.0/24', zone: 'us-east-1a' },
        publicB: { subnetId: 'subnet-081a9bc27a19', cidr: '10.0.2.0/24', zone: 'us-east-1b' },
        privateA: { subnetId: 'subnet-0d8a1c9ef007', cidr: '10.0.3.0/24', zone: 'us-east-1a' },
        privateB: { subnetId: 'subnet-05ca081bfae2', cidr: '10.0.4.0/24', zone: 'us-east-1b' },
      }
    };

    // Log RDS read
    runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['RDS_QUERY', 'Queried AWS Cloud metrics data for Admin Dashboard', req.user.email]
    ).catch(console.error);

    res.json({
      s3: {
        bucketName: 'university-course-portal-bucket-prod',
        region: 'us-east-1',
        arn: 'arn:aws:s3:::university-course-portal-bucket-prod',
        objectCount: s3Count,
        storageBytes: s3Size,
        storageFormatted: `${(s3Size / 1024 / 1024).toFixed(2)} MB`,
        encryption: 'SSE-S3 (AES-256)'
      },
      rds: {
        dbInstanceId: 'postgres-apex-prod',
        engine: 'PostgreSQL 15.4',
        endpoint: 'postgres-apex-prod.c123456789.us-east-1.rds.amazonaws.com:5432',
        status: 'Available',
        tablesCount,
        maxConnections: 100,
        activeConnections: Math.floor(Math.random() * 5) + 3,
        storageAllocatedGb: 20,
        storageUsedGb: +(0.15 + (s3Size / 1024 / 1024 / 1024)).toFixed(3)
      },
      ec2: {
        instanceId: 'i-0ffca123c5e88899a',
        instanceType: 't3.small',
        state: 'running',
        publicIp: '54.210.88.109',
        privateIp: '10.0.1.15',
        uptime: ec2Uptime,
        cpuPercent: ec2Cpu,
        memoryUsedMb: usedMemoryMb,
        memoryTotalMb: maxMemoryMb,
        securityGroupRules
      },
      vpc: vpcConfig
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve AWS details.' });
  }
});

// GET AWS Cloud Trail Logs (Admin only)
router.get('/logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const logs = await allQuery('SELECT * FROM aws_logs ORDER BY timestamp DESC LIMIT 40');
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve AWS CloudTrail Audit Logs.' });
  }
});

// POST toggle Security Group rules (Admin only)
router.post('/security-group/toggle', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { ruleKey } = req.body;

  if (!ruleKey || !securityGroupRules[ruleKey]) {
    return res.status(400).json({ message: 'Invalid firewall security group rule key.' });
  }

  try {
    const rule = securityGroupRules[ruleKey];
    rule.allowed = !rule.allowed;

    const action = rule.allowed ? 'ALLOWED' : 'REVOKED';
    const logDetails = `VPC Security Group rule updated: ${action} inbound port ${rule.port} (${rule.desc}) for source 0.0.0.0/0.`;

    await runQuery(
      `INSERT INTO aws_logs (event_type, details, user_email) VALUES (?, ?, ?)`,
      ['VPC_SECURITY_GROUP_CHANGE', logDetails, req.user.email]
    );

    res.json({
      message: `Security group rule updated: Port ${rule.port} is now ${rule.allowed ? 'OPEN' : 'CLOSED'}.`,
      rules: securityGroupRules
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to modify firewall rules.' });
  }
});

export default router;
