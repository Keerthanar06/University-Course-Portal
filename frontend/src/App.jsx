import React, { useState, useEffect } from 'react';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CourseDetails from './pages/CourseDetails';
import AdminPanel from './pages/AdminPanel';
import DocPortal from './pages/DocPortal';
import Profile from './pages/Profile';

function App() {
  const [view, setView] = useState('landing'); // landing, dashboard, course-details, admin, profile, documentation
  const [courseId, setCourseId] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('apex_auth_token') || '');
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('apex_theme') || 'light');

  // Modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Set theme on body
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('apex_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      // Validate session and retrieve user properties
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        // If logged in and on landing page, redirect to dashboard
        if (view === 'landing') {
          setView('dashboard');
        }
      })
      .catch(() => {
        // Clear expired credentials
        handleLogout();
      });
    }
  }, [token]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login credentials incorrect.');
      }

      localStorage.setItem('apex_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      // Reset modal and inputs
      setIsLoginOpen(false);
      setLoginEmail('');
      setLoginPassword('');
      setView('dashboard');

    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleOpenLogin = (email = '', password = '') => {
    setLoginEmail(email);
    setLoginPassword(password);
    setLoginError('');
    setIsLoginOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_auth_token');
    setToken('');
    setUser(null);
    setView('landing');
  };

  const renderActivePage = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onOpenLogin={handleOpenLogin} />;
      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            token={token} 
            setView={setView} 
            setCourseId={setCourseId} 
          />
        ) : <LandingPage onOpenLogin={handleOpenLogin} />;
      case 'course-details':
        return user ? (
          <CourseDetails 
            user={user} 
            token={token} 
            courseId={courseId} 
            setView={setView} 
          />
        ) : <LandingPage onOpenLogin={handleOpenLogin} />;
      case 'admin':
        return user && user.role === 'admin' ? (
          <AdminPanel token={token} />
        ) : <div className="container" style={{ padding: '4rem 0', color: 'var(--danger)' }}>Access Denied: Administrative roles required.</div>;
      case 'profile':
        return user ? <Profile user={user} /> : <LandingPage onOpenLogin={handleOpenLogin} />;
      case 'documentation':
        return <DocPortal />;
      default:
        return <LandingPage onOpenLogin={handleOpenLogin} />;
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header Navbar */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        activeView={view} 
        setView={setView} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenLogin={() => handleOpenLogin()} 
      />

      {/* Main Grid Viewport */}
      <main className="main-content" style={{ padding: view === 'landing' ? 0 : '3rem 0' }}>
        <div className={view === 'landing' ? '' : 'container'}>
          {renderActivePage()}
        </div>
      </main>

      {/* Footer copyright */}
      <Footer />

      {/* Secure Login Modal Overlay */}
      {isLoginOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ color: 'var(--text-primary)' }}>
            <button className="modal-close" onClick={() => setIsLoginOpen(false)}>×</button>
            
            <h3 className="academic-title" style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Institutional Login Portal
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
              Access Course Repository & Student Resources
            </p>

            {loginError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Principal</label>
                <input 
                  type="email" 
                  placeholder="name@apex.edu" 
                  className="form-input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="form-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
