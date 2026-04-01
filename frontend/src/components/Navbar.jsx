import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const s = {
  nav: { background: '#1e40af', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  brand: { fontWeight: 700, fontSize: 17 },
  links: { display: 'flex', gap: 20, fontSize: 14, alignItems: 'center' },
  link: { color: '#bfdbfe', cursor: 'pointer' },
  logout: { background: '#ef4444', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  badge: (color) => ({ background: color, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 8, fontWeight: 700 })
};

export default function Navbar() {
  const navigate = useNavigate();
  const loginType = localStorage.getItem('loginType');
  const name = localStorage.getItem('name');

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const navBg = loginType === 'faculty' ? '#065f46' : '#1e40af';

  return (
    <nav style={{ ...s.nav, background: navBg }}>
      <span style={{ ...s.brand, display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg" alt="Vignan" style={{ height: 38, borderRadius: 4 }} />
        Student Management System
        {loginType === 'faculty' && <span style={s.badge('#059669')}>FACULTY</span>}
      </span>
      <div style={s.links}>
        {/* Student links */}
        {loginType === 'student' && (
          <>
            <Link to="/" style={s.link}>Dashboard</Link>
            <Link to="/profile" style={s.link}>Profile</Link>
            <Link to="/achievements" style={s.link}>Achievements</Link>
            <Link to="/documents" style={s.link}>Documents</Link>
          </>
        )}
        {/* Faculty links — faculty tab always shows faculty dashboard */}
        {loginType === 'faculty' && (
          <>
            <Link to="/" style={s.link}>Faculty Dashboard</Link>
            <Link to="/section-report" style={s.link}>📄 Section Report</Link>
          </>
        )}
        <span style={{ color: '#bfdbfe', fontSize: 13 }}>👤 {name}</span>
        <button style={s.logout} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
