import React, { useState, useEffect } from 'react';
import AWSVisualizer from '../components/AWSVisualizer';
import { Shield, Users, BookOpen, Terminal, Trash2, Plus, RefreshCw, Key } from 'lucide-react';

export default function AdminPanel({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('aws'); // aws, users, courses
  const [awsMetrics, setAwsMetrics] = useState(null);
  const [awsLogs, setAwsLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('student');

  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeSubTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'aws') {
        // 1. Fetch S3/RDS/EC2 metrics
        const metricsRes = await fetch('http://localhost:5000/api/aws/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setAwsMetrics(metricsData);
        }

        // 2. Fetch VPC/IAM audit logs
        const logsRes = await fetch('http://localhost:5000/api/aws/logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setAwsLogs(logsData);
        }
      } else if (activeSubTab === 'users') {
        const usersRes = await fetch('http://localhost:5000/api/auth/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } else if (activeSubTab === 'courses') {
        // Fetch courses catalog
        const coursesRes = await fetch('http://localhost:5000/api/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }
        // Fetch instructors as potential course directors
        const usersRes = await fetch('http://localhost:5000/api/auth/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.filter(u => u.role === 'faculty'));
        }
      }
    } catch (err) {
      console.error('Admin panel fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleKey) => {
    try {
      const res = await fetch('http://localhost:5000/api/aws/security-group/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ruleKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Refresh AWS metrics and logs
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPass) return;

    try {
      const res = await fetch('http://localhost:5000/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPass,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Creation failed.');

      setNewEmail('');
      setNewName('');
      setNewPass('');
      fetchAdminData();
      alert('User and associated AWS IAM Role provisioned successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and revoke their IAM roles?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed.');

      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseTitle) return;

    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCourseCode,
          title: newCourseTitle,
          description: newCourseDesc,
          instructor_id: newCourseInstructor ? parseInt(newCourseInstructor) : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course.');

      setNewCourseCode('');
      setNewCourseTitle('');
      setNewCourseDesc('');
      setNewCourseInstructor('');
      fetchAdminData();
      alert('Course details saved in RDS DB instance successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="academic-title" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>
            AWS Cloud Control & Administrative Panel
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Modify security configurations, review CloudTrail logs, and map institutional credentials.
          </p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Force refresh database status"
        >
          <RefreshCw size={14} />
          <span>Sync Resources</span>
        </button>
      </div>

      {/* Sub tabs nav */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        borderBottom: '2px solid var(--surface-border)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem'
      }}>
        <button
          className={`btn ${activeSubTab === 'aws' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('aws')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: activeSubTab === 'aws' ? '3px solid var(--accent)' : 'none' }}
        >
          <Shield size={16} />
          <span>VPC & Cloud Topology</span>
        </button>
        <button
          className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: activeSubTab === 'users' ? '3px solid var(--accent)' : 'none' }}
        >
          <Users size={16} />
          <span>Manage Users & IAM</span>
        </button>
        <button
          className={`btn ${activeSubTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('courses')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: activeSubTab === 'courses' ? '3px solid var(--accent)' : 'none' }}
        >
          <BookOpen size={16} />
          <span>Manage Courses (RDS)</span>
        </button>
      </div>

      {/* SUB TAB 1: AWS VPC Topology Visualizer */}
      {activeSubTab === 'aws' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* SVG Visualizer */}
          <AWSVisualizer metrics={awsMetrics} onToggleRule={handleToggleRule} />

          {/* CloudTrail logs terminal */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} />
              <span>AWS CloudTrail Audit logs (Real-time)</span>
            </h3>
            
            <div className="log-terminal">
              {loading && !awsLogs.length ? (
                <div style={{ color: 'var(--text-secondary)' }}>Polling audit pipeline...</div>
              ) : awsLogs.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>Log pipeline empty. Perform some portal actions (uploads/logins) to generate entries.</div>
              ) : (
                awsLogs.map(log => {
                  const rawType = log.event_type.split('_')[0];
                  let typeClass = 'VPC';
                  if (['S3'].includes(rawType)) typeClass = 'S3';
                  else if (['RDS'].includes(rawType)) typeClass = 'RDS';
                  else if (['IAM'].includes(rawType)) typeClass = 'IAM';

                  return (
                    <div key={log.id} className="log-entry">
                      <span className="log-ts">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`log-type ${typeClass}`}>{log.event_type}</span>
                      <span style={{ color: '#e2e8f0' }}>{log.details}</span>
                      {log.user_email && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>({log.user_email})</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: Manage Users (IAM Roles assignment) */}
      {activeSubTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }} className="dashboard-layout-grid">
          {/* User List Table */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Active Security Identities ({users.length})
            </h3>
            
            {loading && !users.length ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading roster...</div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Identity / Name</th>
                      <th>IAM Role / Policy ARN</th>
                      <th>Registration Date</th>
                      <th>Revoke</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.8rem' }}>{u.email}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${u.role}`} style={{ fontSize: '0.6rem', marginBottom: '0.3rem', display: 'inline-block' }}>
                            {u.role}
                          </span>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{u.iam_arn}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ padding: '0.4rem' }}
                            title="Revoke IAM Role & user credentials"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="card" style={{ height: 'fit-content' }}>
            <div className="card-header-accent" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} className="text-warning" />
              <span>Provision User (IAM)</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Marie Curie" 
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. marie.curie@apex.edu" 
                className="form-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input 
                type="password" 
                placeholder="Password" 
                className="form-input"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Institutional AWS Role Profile</label>
              <select 
                className="form-input"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="student">Student (ApexPortalStudentRole)</option>
                <option value="faculty">Faculty (ApexPortalFacultyRole)</option>
                <option value="admin">Administrator (ApexPortalAdminRole)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-accent btn-sm" style={{ width: '100%' }}>
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* SUB TAB 3: Manage Courses (RDS SQL writes) */}
      {activeSubTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }} className="dashboard-layout-grid">
          {/* Courses Catalog Table */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Active RDS Database Catalog Courses ({courses.length})
            </h3>
            
            {loading && !courses.length ? (
              <div style={{ color: 'var(--text-secondary)' }}>Syncing RDS instances...</div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Details</th>
                      <th>Instructor Details</th>
                      <th>Creation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{c.code}</span>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                        </td>
                        <td>{c.instructor_name || <em style={{ color: 'var(--text-secondary)' }}>None Assigned</em>}</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Course Form */}
          <form onSubmit={handleCreateCourse} className="card" style={{ height: 'fit-content' }}>
            <div className="card-header-accent" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} className="text-warning" />
              <span>Register New Course</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Course Code</label>
              <input 
                type="text" 
                placeholder="e.g. CS-495" 
                className="form-input"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Name</label>
              <input 
                type="text" 
                placeholder="e.g. Advanced Cybersecurity" 
                className="form-input"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Description</label>
              <textarea 
                rows="3" 
                placeholder="Syllabus overview..." 
                className="form-input"
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Assign Faculty Member</label>
              <select 
                className="form-input"
                value={newCourseInstructor}
                onChange={(e) => setNewCourseInstructor(e.target.value)}
              >
                <option value="">-- Choose Instructor --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-accent btn-sm" style={{ width: '100%' }}>
              Save to RDS Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
