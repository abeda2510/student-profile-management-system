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
import FacultyAchievements from './pages/FacultyAchievements';
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

function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const loginType = localStorage.getItem('loginType');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const logout = () => { localStorage.clear(); navigate('/login'); };
  const isFaculty = loginType === 'faculty';

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
  const links = isFaculty ? facultyLinks : studentLinks;
  const accent = isFaculty ? '#059669' : '#1e40af';

  return (
    <nav style={{
      background: '#1e40af', height: 60,
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 0,
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 36, flexShrink: 0 }}>
        <img src={LOGO} alt="Vignan" style={{ height: 36, width: 36, borderRadius: 6, objectFit: 'cover' }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>Student Management System</span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', gap: 0, flex: 1 }}>
        {links.map(l => {
          const active = pathname === l.to;
          return (
            <button key={l.to} onClick={() => navigate(l.to)} style={{
              padding: '0 18px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? '#fff' : 'rgba(255,255,255,0.7)',
              borderBottom: active ? '3px solid #fff' : '3px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{name}</span>
        </div>
        <button onClick={logout} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          Logout
        </button>
      </div>
    </nav>
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
            <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
              <Topbar />
              <div style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
                <Routes>
                  <Route path="/" element={<RoleHome />} />
                  <Route path="/profile" element={<StudentProfile />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/section-report" element={<SectionReport />} />
                  <Route path="/achievement-report" element={<FacultyAchievements />} />
                  <Route path="/admin" element={<AdminSearch />} />
                </Routes>
              </div>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
