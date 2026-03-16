import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

export default function Login() {
  const [role, setRole] = useState(null);
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
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: 0.2 }}>
          Student Achievement &amp; Profile Management System
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 36px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        marginBottom: 32,
        display: 'inline-block',
      }}>
        <img src={LOGO} alt="Vignan University Logo" style={{ height: 180, display: 'block' }} />
      </div>

      {!role && (
        <>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 10, textAlign: 'center' }}>
            Welcome Back
          </div>
          <div style={{ fontSize: 15, color: '#475569', marginBottom: 36, textAlign: 'center', maxWidth: 420 }}>
            Sign in to access your profile, achievements, and documents. Choose your role to continue.
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div onClick={() => { setRole('student'); setError(''); }}
              style={{ background: '#fff', border: '2px solid #bfdbfe', borderRadius: 16, padding: '32px 28px', width: 200, textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 18px rgba(30,64,175,0.10)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,64,175,0.22)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(30,64,175,0.10)'}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>👨‍🎓</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#1e40af', marginBottom: 6 }}>Student</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 18 }}>Access your profile &amp; achievements</div>
              <div style={{ background: '#1e40af', color: '#fff', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 13 }}>Student Login →</div>
            </div>

            <div onClick={() => { setRole('faculty'); setError(''); }}
              style={{ background: '#fff', border: '2px solid #bfdbfe', borderRadius: 16, padding: '32px 28px', width: 200, textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 18px rgba(30,64,175,0.10)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,64,175,0.22)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(30,64,175,0.10)'}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>👨‍🏫</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#1e40af', marginBottom: 6 }}>Faculty</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 18 }}>Manage &amp; review students</div>
              <div style={{ background: '#1e40af', color: '#fff', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 13 }}>Faculty Login →</div>
            </div>
          </div>
        </>
      )}

      {role && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '36px 36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <button onClick={() => { setRole(null); setError(''); }}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', padding: 0 }}>
              ←
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
                {role === 'student' ? '👨‍🎓 Student Login' : '👨‍🏫 Faculty Login'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {role === 'student' ? 'Enter your registration number & password' : 'Enter your faculty ID & password'}
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Registration Number</label>
              <input style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                value={studentForm.regNumber} onChange={e => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                placeholder="Enter registration number" required />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Password</label>
              <input style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
                type="password" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="Enter password" required />
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Faculty ID</label>
              <input style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
                value={facultyForm.facultyId} onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
                placeholder="Enter Faculty ID" required />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Password</label>
              <input style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }}
                type="password" value={facultyForm.password} onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                placeholder="Enter password" required />
              <button type="submit" style={{ width: '100%', padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Login as Faculty
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Forgot Password?</Link>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
            Wrong role?{' '}
            <span onClick={() => { setRole(null); setError(''); }} style={{ color: '#1e40af', fontWeight: 600, cursor: 'pointer' }}>
              Choose again
            </span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 36, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Vignan's Foundation for Science, Technology &amp; Research · Deemed to be University
      </div>
    </div>
  );
}
