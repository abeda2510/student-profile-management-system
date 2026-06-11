import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

import LOGO from '../assets/logo.png';

const ROLES_CONFIG = {
  student: { label: 'Student', icon: '👨‍🎓', desc: 'Access your profile & achievements', color: '#1e40af', bg: '#dbeafe' },
  faculty: { label: 'Faculty', icon: '👨‍🏫', desc: 'Manage & review students',           color: '#059669', bg: '#d1fae5' },
  admin:   { label: 'Admin',   icon: '🔐', desc: 'Full system access',                  color: '#7c3aed', bg: '#f3e8ff' },
};

export default function Login({ adminOnly = false, facultyOnly = false }) {
  const mode = adminOnly ? 'admin' : (facultyOnly ? 'faculty' : 'student');
  const config = ROLES_CONFIG[mode];

  const [studentForm, setStudentForm] = useState({ regNumber: '' });
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter registration number, 2 = Enter OTP
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [facultyForm, setFacultyForm] = useState({ facultyId: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Reset local state if route/props change
  useEffect(() => {
    setError('');
    setOtp('');
    setOtpStep(1);
    setStudentForm({ regNumber: '' });
    setFacultyForm({ facultyId: '', password: '' });
  }, [adminOnly, facultyOnly]);

  const sendStudentOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/student/send-otp', { regNumber: studentForm.regNumber.trim().toUpperCase() });
      setMaskedEmail(data.maskedEmail);
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your Registration Number.');
    } finally {
      setLoading(false);
    }
  };

  const verifyStudentOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/student/verify-otp', { 
        regNumber: studentForm.regNumber.trim().toUpperCase(), 
        otp: otp.trim() 
      });
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', data.role);
      localStorage.setItem('regNumber', data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendStudentOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/student/send-otp', { regNumber: studentForm.regNumber.trim().toUpperCase() });
      setMaskedEmail(data.maskedEmail);
      setError('');
      alert('OTP has been resent successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const loginFaculty = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/faculty/login', {
        facultyId: facultyForm.facultyId.trim(),
        password: facultyForm.password
      });
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('loginType', 'faculty');
      localStorage.setItem('facultyId', data.facultyId || data.regNumber);
      localStorage.setItem('name', data.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: config.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Segoe UI', sans-serif", transition: 'background 0.3s ease' }}>
      
      {/* Logo Card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 28, textAlign: 'center', border: '1px solid rgba(255,255,255,0.8)' }}>
        <img src={LOGO} alt="Vignan logo" style={{ height: 110, objectFit: 'contain' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 32px', width: '100%', maxWidth: 410, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {config.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{config.label} Login</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {mode === 'student' ? 'Access with your registration ID' : `Enter your ${mode} credentials`}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 18, background: '#fef2f2', padding: '10px 14px', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Forms Render */}
        {mode === 'student' ? (
          <div>
            {otpStep === 1 ? (
              <form onSubmit={sendStudentOtp}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Registration Number</label>
                <input 
                  value={studentForm.regNumber} 
                  onChange={e => setStudentForm({ regNumber: e.target.value })}
                  placeholder="e.g. 231FA04017" 
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = config.color}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'} 
                />
                
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', padding: 12, background: loading ? '#94a3b8' : config.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.2)', transition: 'background 0.2s' }}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyStudentOtp}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, marginBottom: 18, border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>OTP sent to registered email:</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{maskedEmail}</div>
                </div>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Enter 6-Digit OTP</label>
                <input 
                  type="text"
                  maxLength={6}
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------" 
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 20, letterSpacing: 8, textAlign: 'center', marginBottom: 20, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = config.color}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'} 
                />

                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  style={{ width: '100%', padding: 12, background: (loading || otp.length < 6) ? '#94a3b8' : config.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
                  <button 
                    type="button" 
                    onClick={() => { setOtpStep(1); setOtp(''); setError(''); }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← Back
                  </button>
                  <button 
                    type="button" 
                    onClick={resendStudentOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: config.color, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={loginFaculty}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
              {mode === 'admin' ? 'Admin ID' : 'Faculty ID'}
            </label>
            <input 
              value={facultyForm.facultyId} 
              onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
              placeholder={mode === 'admin' ? 'Enter admin ID' : 'Enter faculty ID'} 
              required
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = config.color}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'} 
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Password</label>
            <div style={{ position: 'relative', marginBottom: 22 }}>
              <input 
                type={showPass ? 'text' : 'password'} 
                value={facultyForm.password}
                onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                placeholder="Enter password" 
                required
                style={{ width: '100%', padding: '12px 40px 12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = config.color}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'} 
              />
              <button 
                type="button" 
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: 12, background: loading ? '#94a3b8' : config.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? 'Logging in...' : `Login as ${config.label}`}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: config.color, fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
          </form>
        )}

        {/* Dynamic Nav links to switch portal roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, pt: 16, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Other Portals</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13 }}>
            {mode !== 'student' && (
              <Link to="/login" style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'none' }}>👨‍🎓 Student Login</Link>
            )}
            {mode !== 'faculty' && (
              <>
                {mode !== 'student' && <span style={{ color: '#cbd5e1' }}>|</span>}
                <Link to="/faculty" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>👨‍🏫 Faculty Login</Link>
              </>
            )}
            {mode !== 'admin' && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <Link to="/admin" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>🔐 Admin Login</Link>
              </>
            )}
          </div>
        </div>

      </div>

      <div style={{ marginTop: 28, fontSize: 12, color: '#94a3b8', textAlign: 'center', maxWidth: 400, lineHeight: 1.4 }}>
        Vignan's Foundation for Science, Technology &amp; Research · Deemed to be University
      </div>
    </div>
  );
}
