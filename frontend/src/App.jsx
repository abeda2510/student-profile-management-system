import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />;

const RoleHome = () => {
  const loginType = localStorage.getItem('loginType');
  if (loginType === 'faculty') return <FacultyDashboard />;
  return <Dashboard />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <div style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '28px 20px' }}>
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
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
