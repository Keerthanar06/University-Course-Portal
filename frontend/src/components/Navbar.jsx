import React from 'react';
import { GraduationCap, LogOut, Shield, FileText, User, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, onLogout, activeView, setView, theme, toggleTheme, onOpenLogin }) {
  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--surface-border)',
      padding: '1rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setView(user ? 'dashboard' : 'landing')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'var(--primary)',
            color: 'var(--accent)',
            padding: '0.5rem',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="academic-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              APEX UNIVERSITY
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              Cloud Course Portal
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Static documentation portal link */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setView('documentation')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={16} />
            <span>Docs & VPC Guide</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} className="text-warning" /> : <Moon size={20} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* User profile button */}
              <div 
                onClick={() => setView('profile')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  transition: 'background-color 0.2s'
                }}
                className="user-profile-nav"
              >
                <User size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
                <span className={`badge badge-${user.role}`} style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </div>

              {user.role === 'admin' && (
                <button 
                  className="btn btn-accent btn-sm"
                  onClick={() => setView('admin')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Shield size={16} />
                  <span>AWS Console</span>
                </button>
              )}

              <button 
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem'
                }}
                title="Log Out Security Session"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin}>
              Portal Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
