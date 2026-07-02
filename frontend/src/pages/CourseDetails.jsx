import React, { useState, useEffect } from 'react';
import { BookOpen, FolderOpen, FileText, Megaphone, ArrowLeft, Upload, Trash2, Award, Calendar, FileDown, Plus } from 'lucide-react';

export default function CourseDetails({ user, token, courseId, setView }) {
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('materials'); // materials, assignments, announcements, info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matFile, setMatFile] = useState(null);
  
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  
  const [submissionFiles, setSubmissionFiles] = useState({}); // { assignmentId: File }
  const [gradingStates, setGradingStates] = useState({}); // { submissionId: { grade, feedback } }
  const [activeAssignmentSubmissions, setActiveAssignmentSubmissions] = useState(null); // assignmentId for faculty grading list
  const [submissionsList, setSubmissionsList] = useState([]);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch course details
      const detailRes = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!detailRes.ok) throw new Error('Failed to retrieve course data.');
      const data = await detailRes.json();
      setCourse(data.course);
      setAnnouncements(data.announcements);

      // 2. Fetch materials (S3 files)
      const materialsRes = await fetch(`http://localhost:5000/api/materials/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (materialsRes.ok) {
        const matData = await materialsRes.json();
        setMaterials(matData);
      }

      // 3. Fetch assignments
      const assignmentsRes = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assignmentsRes.ok) {
        const assignData = await assignmentsRes.json();
        setAssignments(assignData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: annTitle, content: annContent })
      });
      if (!res.ok) throw new Error('Announcement posting failed.');
      
      setAnnTitle('');
      setAnnContent('');
      fetchCourseDetails();
      alert('Announcement posted successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle || !matFile) {
      alert('Please fill title and choose file.');
      return;
    }

    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('title', matTitle);
    formData.append('description', matDesc);
    formData.append('file', matFile);

    try {
      const res = await fetch('http://localhost:5000/api/materials/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'File upload failed.');

      setMatTitle('');
      setMatDesc('');
      setMatFile(null);
      // Reset input element
      document.getElementById('mat-file-input').value = null;
      
      fetchCourseDetails();
      alert(`Uploaded! Simulated AWS S3 Key: ${data.s3Response.key}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Are you sure you want to delete this resource from S3?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete material.');
      fetchCourseDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDueDate) return;

    try {
      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          title: assignTitle,
          description: assignDesc,
          dueDate: assignDueDate
        })
      });
      if (!res.ok) throw new Error('Failed to create assignment.');

      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      fetchCourseDetails();
      alert('Assignment created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmissionFileChange = (assignmentId, file) => {
    setSubmissionFiles(prev => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const file = submissionFiles[assignmentId];
    if (!file) {
      alert('Please select a file to submit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Assignment submission failed.');

      // Clear selection
      setSubmissionFiles(prev => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });
      document.getElementById(`sub-file-${assignmentId}`).value = null;

      fetchCourseDetails();
      alert('Assignment submitted successfully! Key saved to S3 bucket.');
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch submissions.');
      const data = await res.json();
      setSubmissionsList(data);
      setActiveAssignmentSubmissions(assignmentId);
      
      // Initialize grading state
      const initialGrading = {};
      data.forEach(sub => {
        initialGrading[sub.id] = { grade: sub.grade || '', feedback: sub.feedback || '' };
      });
      setGradingStates(initialGrading);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGradingChange = (subId, field, val) => {
    setGradingStates(prev => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: val }
    }));
  };

  const handleGradeSubmission = async (subId) => {
    const { grade, feedback } = gradingStates[subId] || {};
    if (!grade) {
      alert('Please specify a grade.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/assignments/submissions/${subId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade, feedback })
      });
      if (!res.ok) throw new Error('Grading action failed.');

      alert('Submission graded successfully!');
      fetchSubmissions(activeAssignmentSubmissions);
      fetchCourseDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Retrieving course files & records...</div>;
  if (error) return <div className="container" style={{ padding: '4rem 0', color: 'var(--danger)' }}>Error: {error}</div>;
  if (!course) return <div className="container" style={{ padding: '4rem 0' }}>Course data empty.</div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Back Button and Course Info Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => setView('dashboard')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                {course.code}
              </span>
              <h2 className="academic-title" style={{ fontSize: '1.85rem', color: 'var(--primary)' }}>
                {course.title}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Instructor: <strong>{course.instructor_name}</strong> ({course.instructor_email})
            </p>
          </div>
        </div>
      </div>

      {/* Course Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', minHeight: '400px' }} className="dashboard-layout-grid">
        {/* Course Menu Tab Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className={`sidebar-link ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => { setActiveTab('materials'); setActiveAssignmentSubmissions(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', textAlign: 'left', font: 'inherit', padding: '0.75rem 1rem' }}
          >
            <FolderOpen size={18} />
            <span>S3 Notes & media</span>
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('assignments'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', textAlign: 'left', font: 'inherit', padding: '0.75rem 1rem' }}
          >
            <FileText size={18} />
            <span>Assignments</span>
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => { setActiveTab('announcements'); setActiveAssignmentSubmissions(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', textAlign: 'left', font: 'inherit', padding: '0.75rem 1rem' }}
          >
            <Megaphone size={18} />
            <span>Announcements</span>
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => { setActiveTab('info'); setActiveAssignmentSubmissions(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', textAlign: 'left', font: 'inherit', padding: '0.75rem 1rem' }}
          >
            <BookOpen size={18} />
            <span>Syllabus details</span>
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="card" style={{ padding: '2rem' }}>
          {/* TAB 1: MATERIALS (S3 notes upload/download) */}
          {activeTab === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>S3 Course Notes sharing Repository</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Files are distributed privately inside <code>s3://university-course-portal-bucket-prod/courses/{course.code}/materials/</code>
                  </p>
                </div>
              </div>

              {/* Upload Form for Faculty */}
              {user.role === 'faculty' && (
                <form onSubmit={handleUploadMaterial} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', marginBottom: '2rem', border: '1px dashed var(--accent)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--primary)' }}>
                    <Upload size={18} className="text-warning" />
                    <span>Upload Study Resource to S3</span>
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1rem' }} className="dashboard-layout-grid">
                    <div className="form-group">
                      <label className="form-label">Material Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Lecture 1 Slides" 
                        className="form-input" 
                        value={matTitle}
                        onChange={(e) => setMatTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resource Description (optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Overview of Big-O notations" 
                        className="form-input" 
                        value={matDesc}
                        onChange={(e) => setMatDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select File (PDF, Video, PPTX, Doc)</label>
                      <input 
                        id="mat-file-input"
                        type="file" 
                        onChange={(e) => setMatFile(e.target.files[0])}
                        style={{ fontSize: '0.9rem' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-accent btn-sm" style={{ alignSelf: 'end' }}>
                      Publish to Bucket
                    </button>
                  </div>
                </form>
              )}

              {/* Materials Files List */}
              {materials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--surface-border)', borderRadius: '6px' }}>
                  No materials posted yet. Click 'Syllabus details' for course info.
                </div>
              ) : (
                <div className="file-list">
                  <div className="file-row" style={{ fontWeight: 600, border: 'none', borderBottom: '2px solid var(--surface-border)', backgroundColor: 'transparent', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    <span></span>
                    <span>Title / File Key</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Action</span>
                  </div>

                  {materials.map(mat => (
                    <div key={mat.id} className="file-row">
                      <div className="file-icon">
                        <FolderOpen size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{mat.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          s3://{mat.s3_bucket}/{mat.s3_key.split('/').pop()}
                        </div>
                      </div>
                      <span className="badge" style={{ fontSize: '0.65rem', alignSelf: 'center', justifySelf: 'start', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
                        {mat.file_type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>{formatBytes(mat.file_size)}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Download link */}
                        <a 
                          href={`http://localhost:5000/api/materials/download/${mat.file_name}`}
                          target="_blank"
                          rel="noreferrer"
                          headers={{ 'Authorization': `Bearer ${token}` }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center' }}
                          onClick={(e) => {
                            // Note: Native browser anchor tags cannot attach authorization headers directly.
                            // To solve this neatly, we construct a fetch and download trigger, or let the server accept auth token as query parameter.
                            // Let's use fetch with blob creation to guarantee auth token works securely!
                            e.preventDefault();
                            fetch(`http://localhost:5000/api/materials/download/${mat.file_name}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            })
                            .then(res => {
                              if (!res.ok) throw new Error('Download failed.');
                              return res.blob();
                            })
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = mat.s3_key.split('/').pop();
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            })
                            .catch(err => alert(err.message));
                          }}
                          title="Simulate secure pre-signed download"
                        >
                          <FileDown size={14} />
                        </a>
                        
                        {user.role === 'faculty' && (
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '0.3rem 0.6rem' }}
                            onClick={() => handleDeleteMaterial(mat.id)}
                            title="Delete file from S3 bucket"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS (Submit & Grade) */}
          {activeTab === 'assignments' && (
            <div>
              {/* Return from Submissions view for Faculty */}
              {activeAssignmentSubmissions && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => setActiveAssignmentSubmissions(null)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Assignment List</span>
                  </button>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Student submissions list ({submissionsList.length})
                  </h3>

                  {submissionsList.length === 0 ? (
                    <div style={{ padding: '2rem', border: '1px dashed var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No submissions uploaded for this task.
                    </div>
                  ) : (
                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Submitted At</th>
                            <th>S3 Resource Key</th>
                            <th>Download</th>
                            <th>Grade Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionsList.map(sub => (
                            <tr key={sub.id}>
                              <td>
                                <strong style={{ color: 'var(--text-primary)' }}>{sub.student_name}</strong>
                                <div style={{ fontSize: '0.75rem' }}>{sub.student_email}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                              <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                s3://university-course-portal-bucket-prod/{sub.s3_key.split('/').pop()}
                              </td>
                              <td>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    fetch(`http://localhost:5000/api/assignments/download-submission/${sub.file_name}`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    .then(res => {
                                      if (!res.ok) throw new Error('Download failed.');
                                      return res.blob();
                                    })
                                    .then(blob => {
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = sub.s3_key.split('/').pop();
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                      window.URL.revokeObjectURL(url);
                                    })
                                    .catch(err => alert(err.message));
                                  }}
                                >
                                  <FileDown size={14} />
                                </button>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. A, B+, 92/100" 
                                    className="form-input"
                                    value={gradingStates[sub.id]?.grade || ''}
                                    onChange={(e) => handleGradingChange(sub.id, 'grade', e.target.value)}
                                    style={{ width: '80px', padding: '0.4rem', height: '32px', fontSize: '0.85rem' }}
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Feedback details" 
                                    className="form-input"
                                    value={gradingStates[sub.id]?.feedback || ''}
                                    onChange={(e) => handleGradingChange(sub.id, 'feedback', e.target.value)}
                                    style={{ width: '150px', padding: '0.4rem', height: '32px', fontSize: '0.85rem' }}
                                  />
                                  <button 
                                    className="btn btn-accent btn-sm"
                                    onClick={() => handleGradeSubmission(sub.id)}
                                    style={{ height: '32px', padding: '0 0.6rem' }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Assignment Hub View */}
              {!activeAssignmentSubmissions && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Course Assignments Hub</h3>
                  </div>

                  {/* Create Assignment Form for Faculty */}
                  {user.role === 'faculty' && (
                    <form onSubmit={handleCreateAssignment} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', marginBottom: '2rem', border: '1px dashed var(--accent)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--primary)' }}>
                        <Plus size={18} className="text-warning" />
                        <span>Create New Assignment</span>
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }} className="dashboard-layout-grid">
                        <div className="form-group">
                          <label className="form-label">Assignment Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Assignment 2: Security Groups Setup" 
                            className="form-input" 
                            value={assignTitle}
                            onChange={(e) => setAssignTitle(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Due Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="form-input" 
                            value={assignDueDate}
                            onChange={(e) => setAssignDueDate(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Assignment Requirements Description</label>
                        <textarea 
                          rows="3" 
                          placeholder="Detail submission rules, file formats, and VPC topology deliverables..." 
                          className="form-input"
                          value={assignDesc}
                          onChange={(e) => setAssignDesc(e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <button type="submit" className="btn btn-accent btn-sm">
                        Release Assignment
                      </button>
                    </form>
                  )}

                  {/* Assignments Cards list */}
                  {assignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--surface-border)', borderRadius: '6px' }}>
                      No assignments configured.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {assignments.map(ass => (
                        <div key={ass.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>{ass.title}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                <Calendar size={14} />
                                <span>Due date: {new Date(ass.due_date).toLocaleString()}</span>
                              </div>
                            </div>

                            {user.role === 'student' && ass.submission_id && (
                              <span className="badge badge-student" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Award size={12} />
                                <span>Submitted</span>
                              </span>
                            )}
                          </div>
                          
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                            {ass.description}
                          </p>

                          {/* Student Upload Panel */}
                          {user.role === 'student' && (
                            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: '1.5rem' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Submit File (PDF/ZIP)</label>
                                <input 
                                  id={`sub-file-${ass.id}`}
                                  type="file" 
                                  onChange={(e) => handleSubmissionFileChange(ass.id, e.target.files[0])}
                                  style={{ fontSize: '0.85rem' }}
                                />
                              </div>
                              <button 
                                className="btn btn-accent btn-sm"
                                onClick={() => handleSubmitAssignment(ass.id)}
                              >
                                Submit Solution
                              </button>
                            </div>
                          )}

                          {/* Student Grade review */}
                          {user.role === 'student' && ass.submission_id && (
                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span>Grade Received:</span>
                                <strong style={{ color: ass.grade ? 'var(--success)' : 'var(--warning)', fontSize: '1rem' }}>
                                  {ass.grade || 'Awaiting Grading Evaluation'}
                                </strong>
                              </div>
                              {ass.feedback && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Instructor Feedback:</span>
                                  <span style={{ fontStyle: 'italic', marginTop: '0.2rem' }}>"{ass.feedback}"</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Faculty Submissions trigger */}
                          {user.role === 'faculty' && (
                            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Submissions: <strong>{ass.submission_count}</strong>
                              </span>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => fetchSubmissions(ass.id)}
                              >
                                Review Submissions
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Class Announcements</h3>
              </div>

              {/* Faculty write post */}
              {user.role === 'faculty' && (
                <form onSubmit={handlePostAnnouncement} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', marginBottom: '2rem', border: '1px dashed var(--accent)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--primary)' }}>
                    <Plus size={18} className="text-warning" />
                    <span>Create Announcements Board Alert</span>
                  </h4>
                  <div className="form-group">
                    <label className="form-label">Alert Header</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Midterm Grades Posted" 
                      className="form-input" 
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Content Message</label>
                    <textarea 
                      rows="3" 
                      placeholder="Type details for all students enrolled in this course..." 
                      className="form-input"
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-accent btn-sm">
                    Publish Alert
                  </button>
                </form>
              )}

              {/* Board List */}
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No announcements released yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {announcements.map(ann => (
                    <div key={ann.id} className="card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--accent)' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{ann.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{ann.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--background)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span>Post Author: {ann.posted_by_name}</span>
                        <span>{new Date(ann.posted_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYLLABUS DETAILS */}
          {activeTab === 'info' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                Course Specifications
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.4rem' }}>
                    Syllabus Overview
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                    {course.description || 'No detailed specifications configured.'}
                  </p>
                </div>

                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.85rem'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>AWS Compute Layer details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontFamily: 'monospace' }}>
                    <div>Instance Node: <code>i-0ffca123c5e88899a</code></div>
                    <div>Hosting VPC Subnet: <code>subnet-09f182cba874 (Public-1A)</code></div>
                    <div>Private Database Host: <code>postgres-apex-prod</code></div>
                    <div>S3 Resource Folder: <code>/courses/{course.code}/</code></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
