import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loginType = localStorage.getItem('loginType');
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');
  const logout = () => { localStorage.clear(); navigate('/login'); };

  const studentLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
    { to: '/achievements', label: 'Achievements' },
  ];
  const facultyLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/section-report', label: 'Reports' },
    { to: '/achievement-report', label: 'Achievements' },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];
  const links = loginType === 'faculty' ? facultyLinks : studentLinks;
  const isFaculty = loginType === 'faculty';

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      gap: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32, paddingRight: 32, borderRight: '1px solid #f1f5f9', flexShrink: 0 }}>
        <img src={LOGO} alt="Vignan" style={{ height: 36, width: 36, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Student Management</div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>System</div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', gap: 2, flex: 1 }}>
        {links.map(l => {
          const active = pathname === l.to;
          return (
            <Link key={l.to} to={l.to} style={{
              padding: '0 18px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? (isFaculty ? '#059669' : '#1e40af') : '#64748b',
              borderBottom: active ? `2.5px solid ${isFaculty ? '#059669' : '#1e40af'}` : '2.5px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#64748b'; }}>
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: isFaculty ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#1e40af,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: isFaculty ? '#059669' : '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {role === 'admin' ? 'Admin' : isFaculty ? 'Faculty' : 'Student'}
            </div>
          </div>
        </div>
        <button onClick={logout} style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '7px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
