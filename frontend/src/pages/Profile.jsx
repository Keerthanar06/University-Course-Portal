import React from 'react';
import { User, Key, Lock, ShieldCheck, Clock, Server } from 'lucide-react';

export default function Profile({ user }) {
  if (!user) return <div className="container" style={{ padding: '4rem 0' }}>No active session found.</div>;

  // Mock policy statements based on roles
  const getPolicyStatements = () => {
    if (user.role === 'admin') {
      return [
        { Action: "*", Resource: "*", Effect: "Allow", Description: "Administrative full access to all cloud components" }
      ];
    } else if (user.role === 'faculty') {
      return [
        { Action: ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"], Resource: "arn:aws:s3:::university-course-portal-bucket-prod/courses/*", Effect: "Allow", Description: "Manage S3 lecture material vaults" },
        { Action: ["rds:Select", "rds:Update", "rds:Insert"], Resource: "arn:aws:rds:us-east-1:12345678:db/postgres-apex-prod/*", Effect: "Allow", Description: "Write assignment grades and course announcements" }
      ];
    } else {
      return [
        { Action: ["s3:GetObject"], Resource: "arn:aws:s3:::university-course-portal-bucket-prod/courses/*/materials/*", Effect: "Allow", Description: "Private read access to study resources" },
        { Action: ["s3:PutObject"], Resource: "arn:aws:s3:::university-course-portal-bucket-prod/courses/*/assignments/*", Effect: "Allow", Description: "Upload assignment solutions" },
        { Action: ["rds:Select"], Resource: "arn:aws:rds:us-east-1:12345678:db/postgres-apex-prod/*", Effect: "Allow", Description: "Browse courses and enrollment states" }
      ];
    }
  };

  const policies = getPolicyStatements();

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
        <h2 className="academic-title" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>
          IAM User Security Profile
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Overview of active AWS credentials, security keys, and policy definitions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Row 1: Profile card */}
        <div className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="card-header-accent" />
          <div style={{
            background: 'var(--primary)',
            color: 'var(--accent)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700
          }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>{user.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Security Principal: <code>{user.email}</code></p>
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`badge badge-${user.role}`} style={{ fontSize: '0.65rem' }}>
                {user.role}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {user.iam_arn}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Security credentials */}
        <div className="card">
          <div className="card-header-accent" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Key className="text-warning" size={18} />
            <span>Active AWS Security Keys</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Access Key ID:</span>
              <strong style={{ fontFamily: 'monospace' }}>AKIAIOSFODNN7EXAMPLE</strong>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Security Token Status:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} />
                <span>Active & Encrypted</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Token Expiration:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} />
                <span>In 1h 45m (Auto-rotates)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Active Policies list */}
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lock className="text-warning" size={18} />
            <span>Assigned IAM Policy Statements (Inline Policies)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {policies.map((p, idx) => (
              <div key={idx} style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--primary)' }}>Policy Statement #{idx + 1}: {p.Description}</strong>
                  <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                    {p.Effect}
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'var(--background)',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--surface-border)'
                }}>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Action:</span>{' '}
                    <span>{Array.isArray(p.Action) ? `[ ${p.Action.join(', ')} ]` : `"${p.Action}"`}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Resource:</span>{' '}
                    <span>"{p.Resource}"</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
