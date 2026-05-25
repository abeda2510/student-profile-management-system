import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

export default function Login() {
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentForm, setStudentForm] = useState({ regNumber: '', password: '' });
  const [facultyForm, setFacultyForm] = useState({ facultyId: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginStudent = async (e) => {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/auth/student/login', studentForm);
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', data.role);
      localStorage.setItem('regNumber', data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const loginFaculty = async (e) => {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/auth/faculty/login', facultyForm);
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', 'faculty');
      localStorage.setItem('facultyId', data.facultyId || data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#dbeafe',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Top title like reference */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: 0.2 }}>
          Student Achievement &amp; Profile Management System
        </div>
        
      </div>

      {/* Logo box — like reference */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 36px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        marginBottom: 32,
        display: 'inline-block',
      }}>
        <img src={LOGO} alt="Vignan University Logo" style={{ height: 180, display: 'flowi' }} />
      </div>

      {/* Tagline + Role Dropdown */}
      {!role && (
        <>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 10, textAlign: 'center' }}>
            Welcome Back
          </div>
          <div style={{ fontSize: 15, color: '#475569', marginBottom: 32, textAlign: 'center', maxWidth: 420 }}>
            Sign in to access your profile, achievements, and documents.
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Select your role</div>
            <select
              onChange={e => { if (e.target.value) { setRole(e.target.value); setError(''); } }}
              defaultValue=""
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 15, fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none', cursor: 'pointer', marginBottom: 0 }}>
              <option value="" disabled>-- Choose Role --</option>
              <option value="student">👨‍🎓 Student</option>
              <option value="faculty">👨‍🏫 Faculty</option>
              <option value="faculty" style={{ display: 'none' }}>🔐 Admin</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {[
                { val: 'student', label: '👨‍🎓 Student', desc: 'Access your profile & achievements' },
                { val: 'faculty', label: '👨‍🏫 Faculty', desc: 'Manage & review students' },
                { val: 'admin',   label: '🔐 Admin',   desc: 'Full system access' },
              ].map(r => (
                <div key={r.val} onClick={() => { setRole(r.val === 'admin' ? 'faculty' : r.val); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.background = '#eff6ff'; }}
                  onClick={() => { setRole(r.val === 'admin' ? 'faculty' : r.val); setIsAdmin(r.val === 'admin'); setError(''); }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                  <span style={{ fontSize: 28 }}>{r.label.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>{r.label.split(' ').slice(1).join(' ')}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.desc}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 16 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Login Form */}
      {role && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '36px 36px 32px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}>
          {/* Form header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <button onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', padding: 0 }}>
              ←
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
                {role === 'student' ? '👨‍🎓 Student Login' : isAdmin ? '🔐 Admin Login' : '👨‍🏫 Faculty Login'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {role === 'student' ? 'Enter your registration number & password' : isAdmin ? 'Enter admin ID & password' : 'Enter your faculty ID & password'}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '9px 13px', borderRadius: 7, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {role === 'student' && (
            <form onSubmit={loginStudent}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>
                Registration Number
              </label>
              <input
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                value={studentForm.regNumber}
                onChange={e => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                placeholder="Enter registration number" required
              />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>
                Password
              </label>
              <input
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
                type="password" value={studentForm.password}
                onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="Enter password" required
              />
              <button type="submit" style={{ width: '100%', padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Login as Student
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Forgot Password?</Link>
              </div>
            </form>
          )}

          {role === 'faculty' && (
            <form onSubmit={loginFaculty}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>
                Faculty ID
              </label>
              <input
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                value={facultyForm.facultyId}
                onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
                placeholder="Enter Faculty ID" required
              />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>
                Password
              </label>
              <input
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
                type="password" value={facultyForm.password}
                onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                placeholder="Enter password" required
              />
              <button type="submit" style={{ width: '100%', padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Login as Faculty
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Forgot Password?</Link>
              </div>
            </form>
          )}

          {/* Switch role link */}
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
            Wrong role?{' '}
            <span onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
              style={{ color: role === 'student' ? '#1e40af' : '#1e40af', fontWeight: 600, cursor: 'pointer' }}>
              Choose again
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 36, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Vignan's Foundation for Science, Technology &amp; Research · Deemed to be University
      </div>
    </div>
  );
}
