import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

const ROLES = [
  { val: 'student', label: 'Student', icon: '👨‍🎓', desc: 'Access your profile & achievements', color: '#1e40af' },
  { val: 'faculty', label: 'Faculty', icon: '👨‍🏫', desc: 'Manage & review students',           color: '#059669' },
  { val: 'admin',   label: 'Admin',   icon: '🔐', desc: 'Full system access',                  color: '#7c3aed' },
];

export default function Login() {
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentForm, setStudentForm] = useState({ regNumber: '', password: '' });
  const [facultyForm, setFacultyForm] = useState({ facultyId: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selectedRole = ROLES.find(r => r.val === (isAdmin ? 'admin' : role));

  const loginStudent = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/student/login', studentForm);
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', data.role);
      localStorage.setItem('regNumber', data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    setLoading(false);
  };

  const loginFaculty = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/faculty/login', facultyForm);
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', 'faculty');
      localStorage.setItem('facultyId', data.facultyId || data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#dbeafe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Logo Card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 28, textAlign: 'center' }}>
        <img src={LOGO} alt="Vignan" style={{ height: 120, objectFit: 'contain' }} />
      </div>

      {/* Role Selection */}
      {!role && (
        <>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 6, textAlign: 'center' }}>Welcome Back</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28, textAlign: 'center' }}>
            Sign in to access your profile, achievements, and documents.
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Select your role</div>

            {/* Dropdown */}
            <select defaultValue="" onChange={e => { if (e.target.value) { const v = e.target.value; setRole(v === 'admin' ? 'faculty' : v); setIsAdmin(v === 'admin'); setError(''); } }}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#374151', background: '#fff', outline: 'none', marginBottom: 14, cursor: 'pointer' }}>
              <option value="" disabled>-- Choose Role --</option>
              <option value="student">👨‍🎓 Student</option>
              <option value="faculty">👨‍🏫 Faculty</option>
              <option value="admin">🔐 Admin</option>
            </select>

            {/* Role Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map(r => (
                <div key={r.val}
                  onClick={() => { setRole(r.val === 'admin' ? 'faculty' : r.val); setIsAdmin(r.val === 'admin'); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.desc}</div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 14 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Login Form */}
      {role && selectedRole && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px', width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <button onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <div style={{ fontSize: 20 }}>{selectedRole.icon}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{selectedRole.label} Login</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {role === 'student' ? 'Enter your registration number & password' : 'Enter your ID & password'}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '9px 12px', borderRadius: 7, border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          {role === 'student' ? (
            <form onSubmit={loginStudent}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Registration Number</label>
              <input value={studentForm.regNumber} onChange={e => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                placeholder="e.g. 231FA04040" required
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = selectedRole.color}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Password</label>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input type={showPass ? 'text' : 'password'} value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="Enter password" required
                  style={{ width: '100%', padding: '11px 40px 11px 13px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = selectedRole.color}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#94a3b8' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: 12, background: loading ? '#94a3b8' : selectedRole.color, color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Signing in...' : 'Login as Student'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: selectedRole.color, fontWeight: 600 }}>Forgot Password?</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={loginFaculty}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{isAdmin ? 'Admin ID' : 'Faculty ID'}</label>
              <input value={facultyForm.facultyId} onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
                placeholder={isAdmin ? 'Enter admin ID' : 'Enter faculty ID'} required
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = selectedRole.color}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Password</label>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input type={showPass ? 'text' : 'password'} value={facultyForm.password}
                  onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                  placeholder="Enter password" required
                  style={{ width: '100%', padding: '11px 40px 11px 13px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = selectedRole.color}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#94a3b8' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: 12, background: loading ? '#94a3b8' : selectedRole.color, color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Signing in...' : `Login as ${selectedRole.label}`}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: selectedRole.color, fontWeight: 600 }}>Forgot Password?</Link>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            Wrong role?{' '}
            <span onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
              style={{ color: selectedRole.color, fontWeight: 600, cursor: 'pointer' }}>Choose again</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Vignan's Foundation for Science, Technology &amp; Research · Deemed to be University
      </div>
    </div>
  );
}
