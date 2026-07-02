import React from 'react';
import { BookOpen, Network, Database, Lock, ShieldCheck, Layers, HelpCircle, HardDrive } from 'lucide-react';

export default function DocPortal() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
        <h2 className="academic-title" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>
          Cloud Portal Documentation & AWS Deployment Guide
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Overview of VPC subnets, RDS relational data architectures, S3 permissions, and deployment procedures.
        </p>
      </div>

      {/* Docs Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {/* Section 1: VPC Network Architecture */}
        <section>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Network className="text-warning" size={22} />
            <span>VPC Network Configuration & Security</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            The portal is designed to operate within a dedicated Amazon VPC to isolate cloud resources from public cyber threats.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.25rem'
          }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary)' }}>CIDR Address Space</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                VPC Scope: 10.0.0.0/16<br />
                Public-1A Subnet: 10.0.1.0/24<br />
                Public-1B Subnet: 10.0.2.0/24<br />
                Private-1A Subnet: 10.0.3.0/24<br />
                Private-1B Subnet: 10.0.4.0/24
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary)' }}>Routing & Gateways</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Public Subnets route standard HTTP/S (80/443) traffic through an Internet Gateway (IGW). Private Subnets contain no routes to the internet; they resolve storage endpoints privately via VPC S3 Endpoints.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary)' }}>Security Groups</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                EC2 Web Node allows ports 80 & 443 from all origins (0.0.0.0/0). RDS Database node strictly restricts port 5432 inbound access, allowing connections ONLY from the EC2 security group (VPC internal peering).
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: IAM Identity Claims */}
        <section>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lock className="text-warning" size={22} />
            <span>Multi-User IAM Policies (Access Control)</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            System accounts map to AWS IAM Roles defining exact resource rules. Actions authenticate on the Express server using JWT claims.
          </p>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IAM Role Profile</th>
                  <th>Assigned ARN</th>
                  <th>Permissions Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ApexPortalAdminRole</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>arn:aws:iam::12345678:role/AdminRole</td>
                  <td style={{ fontSize: '0.85rem' }}>Full permissions. Access EC2 configs, S3 bucket audits, RDS catalogs, and SG firewalls.</td>
                </tr>
                <tr>
                  <td><strong>ApexPortalFacultyRole</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>arn:aws:iam::12345678:role/FacultyRole</td>
                  <td style={{ fontSize: '0.85rem' }}>S3 uploads (<code>s3:PutObject</code>) in course folders, S3 list, grade assignments.</td>
                </tr>
                <tr>
                  <td><strong>ApexPortalStudentRole</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>arn:aws:iam::12345678:role/StudentRole</td>
                  <td style={{ fontSize: '0.85rem' }}>Download lecture notes (<code>s3:GetObject</code>), upload submission solutions.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Relational RDS Database schema */}
        <section>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Database className="text-warning" size={22} />
            <span>Relational Database Schema (RDS)</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            The database stores institutional records in structured SQL format. The relational layout connects profiles, catalog courses, notes URLs, and grades:
          </p>

          <div style={{
            backgroundColor: 'var(--primary-dark)',
            border: '1px solid #14253d',
            borderRadius: 'var(--border-radius-md)',
            padding: '1.5rem',
            color: '#a5b4fc',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            overflowX: 'auto',
            lineHeight: 1.5
          }}>
            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>-- Relational Entity-Relationship Outline --</div>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>users</strong> (id [PK], email [Unique], password_hash, role, name, iam_arn, created_at)<br />
              &nbsp;│<br />
              &nbsp;├─► <strong>enrollments</strong> (student_id [FK], course_id [FK], enrolled_at) [PK: student_id + course_id]<br />
              &nbsp;│<br />
              &nbsp;├─► <strong>courses</strong> (id [PK], code [Unique], title, description, instructor_id [FK])<br />
              &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─► <strong>materials</strong> (id [PK], course_id [FK], title, description, file_name, file_type, file_size, s3_key, s3_bucket, uploaded_by [FK])<br />
              &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─► <strong>assignments</strong> (id [PK], course_id [FK], title, description, due_date, created_at)<br />
              &nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;└───────────┼─► <strong>submissions</strong> (id [PK], assignment_id [FK], student_id [FK], file_name, s3_key, submitted_at, grade, feedback)<br />
              <br />
              <strong>aws_logs</strong> (id [PK], event_type, details, user_email, timestamp)
            </div>
          </div>
        </section>

        {/* Section 4: S3 Object Folder Structure */}
        <section>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <HardDrive className="text-warning" size={22} />
            <span>S3 Bucket Structure (Online Notes Sharing)</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Study resources and homework answers upload to Amazon S3. We structure the folders using course code prefixes to compartmentalize directories:
          </p>

          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Bucket Root: s3://university-course-portal-bucket-prod/</div>
            <div style={{ fontFamily: 'monospace', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              ├── <strong>courses/</strong><br />
              │   ├── <strong>CS-101/</strong><br />
              │   │   ├── <strong>materials/</strong> (S3 keys for study slides / notes PDFs)<br />
              │   │   │   ├── 17169824-lecture-1.pdf<br />
              │   │   │   └── 17169838-syllabus.docx<br />
              │   │   └── <strong>assignments/</strong> (S3 keys for student task uploads)<br />
              │   │       └── <strong>1/</strong> (Assignment ID)<br />
              │   │           ├── student-3-basics.py<br />
              │   │           └── student-4-basics.py<br />
              │   └── <strong>CS-302/</strong><br />
              │       ├── <strong>materials/</strong><br />
              │       │   └── 17170119-vpc-tutorial.mp4<br />
              │       └── <strong>assignments/</strong><br />
              │           └── 2/<br />
              │               └── student-3-vpc-stage1.pdf
            </div>
          </div>
        </section>

        {/* Section 5: Real AWS Deployment Steps */}
        <section>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Layers className="text-warning" size={22} />
            <span>Step-by-Step AWS Deployment Procedures</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--primary)',
                color: 'var(--accent)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0
              }}>1</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                  Deploy VPC Network Base
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Go to AWS VPC Console. Click 'Create VPC' and choose 'VPC and more'. Assign CIDR block <code>10.0.0.0/16</code>. Configure 2 Public subnets and 2 Private subnets across different Availability Zones (e.g. 1a and 1b) to support RDS failover systems. Make sure an Internet Gateway (IGW) attaches to the public subnet route table.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--primary)',
                color: 'var(--accent)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0
              }}>2</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                  Provision Relational RDS Database
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  In the RDS Console, click 'Create Database'. Select PostgreSQL Engine (version 15.x). Under network, place the database inside the VPC subnets, specifying <strong>Private Subnets ONLY</strong> (Disable public accessibility). Set database security group to block port 5432 inbound, allowing access ONLY from the subnet CIDRs or the EC2 web server security group.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--primary)',
                color: 'var(--accent)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0
              }}>3</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                  Configure S3 Document Buckets
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Create an Amazon S3 Bucket: <code>university-course-portal-bucket-prod</code>. Set Default encryption to SSE-S3. Block all public access configurations. To access S3 without routing files through the public web, create a <strong>VPC Gateway Endpoint for S3</strong> in your VPC console and map it to your Private Subnets route tables. Write an IAM Role Policy for EC2 granting <code>s3:PutObject</code> and <code>s3:GetObject</code>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--primary)',
                color: 'var(--accent)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0
              }}>4</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                  Deploy Node Web Application (EC2)
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Launch an EC2 Instance (t3.small running Ubuntu Server 22.04 LTS) in one of your Public Subnets. Edit security group rules to open ports 80 and 443. Connect via SSH (Port 22). Clone this project code repository. Install Node.js v22 and run `npm run install-all`. Build frontend static assets using `npm run build` from the frontend folder. Create an `.env` file pointing the app backend to the RDS postgres endpoint and S3 bucket, then launch the process with `pm2 start backend/server.js`. Set up Nginx reverse proxy to forward port 80 to port 5000.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: FAQs */}
        <section style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '2.5rem' }}>
          <h3 className="academic-title" style={{ fontSize: '1.3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <HelpCircle className="text-warning" size={22} />
            <span>Frequently Asked Questions (FAQ)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)' }}>Q: How are files protected inside the simulated S3 bucket?</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Files can only be retrieved by requesting pre-signed download streams. When a student requests a file, the API checks their course enrollment registry claim inside SQLite (RDS simulation) before streaming the file bytes, preventing unauthorized anonymous downloads.
              </p>
            </div>
            
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)' }}>Q: Why does the Admin console show security warnings when toggling Port 5432 or Port 22?</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                This simulates real-world AWS security audits. Databases should remain in isolated private subnets and never be exposed to the public internet. Opening port 5432 directly to the world (0.0.0.0/0) allows anyone to attempt dictionary attacks on database credentials. SSH port 22 should also be restricted to VPN IPs.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
