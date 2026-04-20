import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import Achievements from './pages/Achievements';
import Documents from './pages/Documents';
import FacultyDashboard from './pages/FacultyDashboard';
import SectionReport from './pages/SectionReport';
import AchievementDashboard from './pages/AchievementDashboard';
import AdminSearch from './pages/AdminSearch';
import ForgotPassword from './pages/ForgotPassword';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

const PrivateRoute = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />;

const RoleHome = () => {
  const loginType = localStorage.getItem('loginType');
  if (loginType === 'faculty') return <FacultyDashboard />;
  return <Dashboard />;
};

function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const loginType = localStorage.getItem('loginType');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const logout = () => { localStorage.clear(); navigate('/login'); };

  const studentLinks = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/profile', icon: '👤', label: 'Profile' },
    { to: '/achievements', icon: '🏆', label: 'Achievements' },
  ];
  const facultyLinks = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/section-report', icon: '📊', label: 'Reports' },
    { to: '/achievement-report', icon: '🏆', label: 'Achievements' },
    ...(role === 'admin' ? [{ to: '/admin', icon: '⚙️', label: 'Admin' }] : []),
  ];
  const links = loginType === 'faculty' ? facultyLinks : studentLinks;
  const isFaculty = loginType === 'faculty';
  const accent = isFaculty ? '#059669' : '#1e40af';

  return (
    <div style={{
      width: 220, flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={LOGO} alt="Vignan" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Student</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Management System</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(l => {
          const active = pathname === l.to;
          return (
            <button key={l.to} onClick={() => navigate(l.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10, border: 'none',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                background: active ? (isFaculty ? '#f0fdf4' : '#eff6ff') : 'transparent',
                color: active ? accent : '#64748b',
                fontWeight: active ? 700 : 500, fontSize: 14,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{l.icon}</span>
              {l.label}
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 20, background: accent, borderRadius: 99 }} />}
            </button>
          );
        })}
      </div>

      {/* User + Logout */}
      <div style={{ padding: '14px 14px 20px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${accent},${accent}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: accent, fontWeight: 600, textTransform: 'uppercase' }}>
              {role === 'admin' ? 'Admin' : isFaculty ? 'Faculty' : 'Student'}
            </div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
              <Sidebar />
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
                  <Routes>
                    <Route path="/" element={<RoleHome />} />
                    <Route path="/profile" element={<StudentProfile />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/section-report" element={<SectionReport />} />
                    <Route path="/achievement-report" element={<AchievementDashboard />} />
                    <Route path="/admin" element={<AdminSearch />} />
                  </Routes>
                </div>
              </div>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
