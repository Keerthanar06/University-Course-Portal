import React from 'react';
import { Server, Shield, FileText, Database, ArrowRight, UserCheck, BookOpen, Lock } from 'lucide-react';

export default function LandingPage({ onOpenLogin }) {
  const sampleUsers = [
    { role: 'Student', email: 'student.alice@apex.edu', pass: 'student123', desc: 'Browse course catalog, view announcements, download lectures, and submit assignments.' },
    { role: 'Faculty', email: 'alan.turing@apex.edu', pass: 'faculty123', desc: 'Create course resources, upload notes, set up assignments, and review/grade submissions.' },
    { role: 'Administrator', email: 'admin@apex.edu', pass: 'admin123', desc: 'Manage courses, enroll users, monitor EC2/RDS stats, and configure VPC security firewalls.' }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="hero-title">
              Next-Generation Cloud Course Management Portal
            </h1>
            <p className="hero-subtitle">
              Apex University's secure, AWS-hosted academic engine. Powered by EC2 hosts, S3 document vaults, private subnet RDS instances, and structured VPC security groups.
            </p>
            <div className="hero-cta">
              <button className="btn btn-accent" onClick={onOpenLogin} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Enter Course Portal</span>
                <ArrowRight size={18} />
              </button>
              <a href="#demo-accounts" className="btn btn-secondary" style={{ color: 'var(--text-light)', borderColor: 'rgba(255,255,255,0.3)' }}>
                Demo Credentials
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{
              padding: '2.5rem',
              borderRadius: 'var(--border-radius-lg)',
              maxWidth: '400px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(10, 25, 47, 0.4)'
            }}>
              <h3 className="academic-title" style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                Secure Cloud Infrastructure
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <Shield size={18} className="text-warning" style={{ flexShrink: 0 }} />
                  <span><strong>IAM Roles:</strong> Cryptographically verified JWT sessions mapping user scopes to least-privilege policies.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <Database size={18} className="text-info" style={{ flexShrink: 0 }} />
                  <span><strong>RDS Layer:</strong> Highly structured relational databases housed safely inside private VPC boundaries.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem' }}>
                  <Server size={18} className="text-success" style={{ flexShrink: 0 }} />
                  <span><strong>S3 Storage:</strong> AES-256 server-side encrypted object repositories hosting PDFs, videos, and zip files.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="academic-title" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              Core Learning Management Modules
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              A modular web application designed for seamless faculty uploading, student submissions, and administrative control.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <div className="landing-card">
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}><BookOpen size={36} /></div>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>University Course Portal</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Complete syllabus tracking, user-friendly listings, enrollment controls, and real-time class announcements from course directors.
              </p>
            </div>
            <div className="landing-card">
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}><Server size={36} /></div>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Online Notes Sharing System</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Store PDFs, lecture slide files, and videos. Files upload directly to S3 and stream to students using pre-signed secure references.
              </p>
            </div>
            <div className="landing-card">
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}><Lock size={36} /></div>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Multi-User Security Controls</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Authenticates logins with bcrypt hashing, mapping credentials to custom IAM scopes that secure system endpoints.
              </p>
            </div>
            <div className="landing-card">
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}><FileText size={36} /></div>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>VPC Documentation Hub</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Includes visual blueprints, route tables, subnets IP distributions, and installation guides on launching on AWS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section id="demo-accounts" style={{ padding: '6rem 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--surface-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="academic-title" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              Developer Demo Sandbox
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Test the platform immediately using our pre-seeded AWS roles. Choose any account profile to log in.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {sampleUsers.map((u, i) => (
              <div key={i} style={{
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '2rem',
                backgroundColor: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="academic-title" style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>
                    {u.role} Account
                  </h3>
                  <span className={`badge badge-${u.role.toLowerCase().slice(0, 5)}`}>
                    {u.role}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: '60px' }}>
                  {u.desc}
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.85rem',
                  border: '1px solid var(--surface-border)',
                  fontFamily: 'monospace'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                    <strong>{u.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Password:</span>
                    <strong>{u.pass}</strong>
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenLogin(u.email, u.pass)}
                  style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserCheck size={14} />
                  <span>Log in as {u.role}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
