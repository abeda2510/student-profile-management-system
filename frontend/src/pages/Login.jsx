import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

const ROLES = [
  { val: 'student', label: 'Student',  icon: '👨‍🎓', desc: 'Access your profile & achievements', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  { val: 'faculty', label: 'Faculty',  icon: '👨‍🏫', desc: 'Manage & review students',           color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { val: 'admin',   label: 'Admin',    icon: '🔐', desc: 'Full system access',                  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
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

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 32px', marginBottom: 20, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <img src={LOGO} alt="Vignan" style={{ height: 80, objectFit: 'contain', marginBottom: 12 }} />
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', lineHeight: 1.3 }}>Student Achievement &amp; Profile</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e40af' }}>Management System</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Vignan's Foundation for Science, Technology &amp; Research</div>
        </div>

        {/* Role Selection */}
        {!role && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, textAlign: 'center' }}>Welcome Back 👋</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center' }}>Choose your role to continue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ROLES.map(r => (
                <div key={r.val}
                  onClick={() => { setRole(r.val === 'admin' ? 'faculty' : r.val); setIsAdmin(r.val === 'admin'); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 12, border: `2px solid ${r.border}`, background: r.bg, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${r.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.desc}</div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Login Form */}
        {role && selectedRole && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: `2px solid ${selectedRole.bg}` }}>
              <button onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ←
              </button>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: selectedRole.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {selectedRole.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{selectedRole.label} Login</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                  {role === 'student' ? 'Enter your registration number & password' : 'Enter your ID & password'}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, background: '#fef2f2', padding: '10px 14px', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ {error}
              </div>
            )}

            {role === 'student' ? (
              <form onSubmit={loginStudent}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration Number</label>
                  <input style={inputStyle} value={studentForm.regNumber}
                    onChange={e => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                    placeholder="e.g. 231FA04040" required
                    onFocus={e => e.target.style.borderColor = selectedRole.color}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingRight: 44 }} type={showPass ? 'text' : 'password'}
                      value={studentForm.password}
                      onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                      placeholder="Enter password" required
                      onFocus={e => e.target.style.borderColor = selectedRole.color}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}dd)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${selectedRole.color}44` }}>
                  {loading ? 'Signing in...' : `Sign in as ${selectedRole.label}`}
                </button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: selectedRole.color, fontWeight: 600 }}>Forgot Password?</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={loginFaculty}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isAdmin ? 'Admin ID' : 'Faculty ID'}
                  </label>
                  <input style={inputStyle} value={facultyForm.facultyId}
                    onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
                    placeholder={isAdmin ? 'Enter admin ID' : 'Enter faculty ID'} required
                    onFocus={e => e.target.style.borderColor = selectedRole.color}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingRight: 44 }} type={showPass ? 'text' : 'password'}
                      value={facultyForm.password}
                      onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                      placeholder="Enter password" required
                      onFocus={e => e.target.style.borderColor = selectedRole.color}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}dd)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${selectedRole.color}44` }}>
                  {loading ? 'Signing in...' : `Sign in as ${selectedRole.label}`}
                </button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: selectedRole.color, fontWeight: 600 }}>Forgot Password?</Link>
                </div>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
              Wrong role?{' '}
              <span onClick={() => { setRole(null); setIsAdmin(false); setError(''); }}
                style={{ color: selectedRole.color, fontWeight: 700, cursor: 'pointer' }}>
                Go back
              </span>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          © 2026 Vignan's University · All rights reserved
        </div>
      </div>
    </div>
  );
}
