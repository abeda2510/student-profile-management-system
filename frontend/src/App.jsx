import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import Achievements from './pages/Achievements';
import Documents from './pages/Documents';
import FacultyDashboard from './pages/FacultyDashboard';
import SectionReport from './pages/SectionReport';
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
            <Navbar />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
              <Routes>
                <Route path="/" element={<RoleHome />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/section-report" element={<SectionReport />} />
              </Routes>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
