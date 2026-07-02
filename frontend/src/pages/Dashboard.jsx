import React, { useState, useEffect } from 'react';
import { BookOpen, FolderSync, FileText, Megaphone, Search, UserCheck, Calendar } from 'lucide-react';

export default function Dashboard({ user, token, setView, setCourseId }) {
  const [courses, setCourses] = useState([]);
  const [globalAnnouncements, setGlobalAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch courses
      const courseRes = await fetch('http://localhost:5000/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!courseRes.ok) throw new Error('Failed to retrieve course catalog.');
      const courseData = await courseRes.json();
      setCourses(courseData);

      // 2. Fetch portal announcements (using a mock course ID 0 or null from endpoints)
      // Since courses/:id fetches single details, we can pull announcements from any course or we can get global ones
      // Let's filter global ones from a separate mock fetch or just fetch the first course details for announcements
      if (courseData.length > 0) {
        const firstCourseRes = await fetch(`http://localhost:5000/api/courses/${courseData[0].id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (firstCourseRes.ok) {
          const detail = await firstCourseRes.json();
          // Filter announcements that have course_id === null
          setGlobalAnnouncements(detail.announcements.filter(a => a.course_id === null));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId, title) => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Enrollment failed.');

      alert(`Successfully enrolled in ${title}!`);
      fetchDashboardData(); // Refresh page
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter courses by search
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalCourses = courses.length;
  const enrolledCourses = courses.filter(c => c.is_enrolled || user.role === 'faculty').length;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      {/* Header and Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="academic-title" style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>
            Welcome back, {user.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Role scope active: <strong>{user.role.toUpperCase()}</strong> | IAM session ARN: <code>{user.iam_arn}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>
          <Calendar size={16} />
          <span>Session Local Time: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <div className="card">
          <div className="card-header-accent" />
          <div style={{ color: 'var(--accent)', display: 'flex', justifyContent: 'space-between' }}>
            <BookOpen size={24} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CATALOG</span>
          </div>
          <div className="stat-value">{totalCourses}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Courses Offered</div>
        </div>

        <div className="card">
          <div className="card-header-accent" />
          <div style={{ color: 'var(--success)', display: 'flex', justifyContent: 'space-between' }}>
            <UserCheck size={24} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ACTIVE</span>
          </div>
          <div className="stat-value">{enrolledCourses}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {user.role === 'faculty' ? 'Courses Directed' : 'Courses Enrolled'}
          </div>
        </div>

        <div className="card">
          <div className="card-header-accent" />
          <div style={{ color: 'var(--warning)', display: 'flex', justifyContent: 'space-between' }}>
            <Megaphone size={24} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ALERTS</span>
          </div>
          <div className="stat-value">{globalAnnouncements.length || 1}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>General Announcements</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }} className="dashboard-layout-grid">
        {/* Main Courses Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Your Academic Dashboard</h3>
            
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text"
                placeholder="Search courses..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '240px', paddingRight: '1rem', height: '38px', fontSize: '0.85rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading catalog data...</div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', border: '1px solid var(--danger)', borderRadius: '6px' }}>{error}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No courses match your query.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredCourses.map(c => (
                <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                  <div className="card-header-accent" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>
                      {c.code}
                    </span>
                    {user.role === 'student' && (
                      <span className={`badge badge-${c.is_enrolled ? 'student' : 'admin'}`} style={{ fontSize: '0.6rem' }}>
                        {c.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    {c.title}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', flexGrow: 1, marginBottom: '1.25rem' }}>
                    {c.description ? c.description.slice(0, 100) + (c.description.length > 100 ? '...' : '') : 'No syllabus overview configured.'}
                  </p>
                  
                  <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Instructor: {c.instructor_name || 'TBA'}</span>
                    
                    {user.role === 'student' && !c.is_enrolled ? (
                      <button 
                        className="btn btn-accent btn-sm"
                        onClick={() => handleEnroll(c.id, c.title)}
                      >
                        Enroll
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setCourseId(c.id);
                          setView('course-details');
                        }}
                      >
                        Open Course
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements Sidebar */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={18} className="text-warning" />
            <span>Campus Alerts</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {globalAnnouncements.length > 0 ? (
              globalAnnouncements.map(ann => (
                <div key={ann.id} className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ann.content}</p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>By: {ann.posted_by_name}</span>
                    <span>{new Date(ann.posted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <p>Welcome to Apex University Portal!</p>
                <p style={{ marginTop: '0.5rem' }}>All services are active in AWS us-east-1.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
