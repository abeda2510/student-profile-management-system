import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginType = localStorage.getItem('loginType');
  const name = localStorage.getItem('name');

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const navBg = loginType === 'faculty' ? '#064e3b' : '#1e3a8a';
  const activeStyle = { color: '#fff', fontWeight: 700, borderBottom: '2px solid #60a5fa', paddingBottom: 2 };
  const linkStyle = { color: '#bfdbfe', fontSize: 14, fontWeight: 500, paddingBottom: 2, borderBottom: '2px solid transparent', transition: 'color 0.15s' };

  const isActive = (path) => location.pathname === path;

  const studentLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
    { to: '/achievements', label: 'Achievements' },
    { to: '/documents', label: 'Documents' },
  ];

  const facultyLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/section-report', label: '📄 Section Report' },
    { to: '/achievement-dashboard', label: '🏆 Achievements' },
    { to: '/leetcode-report', label: '💻 LeetCode' },
  ];

  const links = loginType === 'faculty' ? facultyLinks : studentLinks;

  return (
    <nav style={{ background: navBg, color: '#fff', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg" alt="Vignan" style={{ height: 36, borderRadius: 6, background: '#fff', padding: 2 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: 0.2 }}>Student Management System</div>
          {loginType === 'faculty' && <div style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Faculty Portal</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={isActive(l.to) ? { ...linkStyle, ...activeStyle } : linkStyle}>
            {l.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: loginType === 'faculty' ? '#059669' : '#1e40af', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            {loginType === 'faculty' ? '👨‍🏫' : '👨‍🎓'}
          </div>
          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{name}</span>
        </div>
        <button onClick={logout}
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
