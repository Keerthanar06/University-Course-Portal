import React from 'react';
import { Cloud, Shield, Database, FolderGit, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--primary-dark)',
      color: 'var(--text-light)',
      padding: '4rem 0 2rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Col 1: Bio */}
          <div>
            <h3 className="academic-title" style={{ color: 'var(--accent)', marginBottom: '1.2rem', fontSize: '1.2rem' }}>
              APEX UNIVERSITY
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Pioneering advanced education systems backed by robust cloud infrastructures. Secure learning ecosystems for tomorrow's engineers.
            </p>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 600 }}>Portal Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <li>Online Notes Sharing System (S3)</li>
              <li>University Course Portal Engine</li>
              <li>Multi-User Security Control (IAM Roles)</li>
              <li>Static VPC Topology Documentation</li>
            </ul>
          </div>

          {/* Col 3: Cloud Architecture */}
          <div>
            <h4 style={{ marginBottom: '1.2rem', fontSize: '1rem', fontWeight: 600 }}>Simulated AWS Architecture</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Cpu size={16} style={{ color: '#f97316' }} />
                <span>EC2 App Instance (t3.small)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Cloud size={16} style={{ color: '#0ea5e9' }} />
                <span>VPC (10.0.0.0/16 Network)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <FolderGit size={16} style={{ color: '#eab308' }} />
                <span>Amazon S3 Bucket Storage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Database size={16} style={{ color: '#3b82f6' }} />
                <span>Amazon RDS PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            © {new Date().getFullYear()} Apex University Cloud Systems. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Security Compliance</span>
            <span>AWS Console Audit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
