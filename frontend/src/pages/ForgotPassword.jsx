import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

const s = {
  page: { minHeight: '100vh', background: '#dbeafe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', borderRadius: 16, padding: '36px 36px 32px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '11px 13px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 12, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  err: { color: '#ef4444', fontSize: 13, marginBottom: 14, background: '#fef2f2', padding: '9px 13px', borderRadius: 7, border: '1px solid #fecaca' },
  ok: { color: '#059669', fontSize: 13, marginBottom: 14, background: '#f0fdf4', padding: '9px 13px', borderRadius: 7, border: '1px solid #bbf7d0' },
  back: { background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 14, display: 'block', textAlign: 'center', width: '100%' },
};

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=enter id, 2=enter otp, 3=new password
  const [userType, setUserType] = useState('student');
  const [id, setId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { id, userType });
      setMaskedEmail(data.maskedEmail);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { id, userType, otp });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <img src={LOGO} alt="Vignan" style={{ height: 90, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', marginBottom: 28 }} />

      <div style={s.card}>
        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['Enter ID', 'Verify OTP', 'New Password'].map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > i ? '#1e40af' : step === i + 1 ? '#1e40af' : '#e2e8f0', color: step >= i + 1 ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>{i + 1}</div>
              <div style={{ fontSize: 10, color: step === i + 1 ? '#1e40af' : '#94a3b8', fontWeight: step === i + 1 ? 700 : 400 }}>{label}</div>
            </div>
          ))}
        </div>

        {error && <div style={s.err}>{error}</div>}
        {success && <div style={s.ok}>{success}</div>}

        {/* Step 1 — Enter ID */}
        {step === 1 && (
          <form onSubmit={requestOTP}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', marginBottom: 6 }}>Forgot Password</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Enter your ID and we'll send an OTP to your registered email.</div>

            <label style={s.label}>Role</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {['student', 'faculty'].map(r => (
                <button key={r} type="button"
                  onClick={() => setUserType(r)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: `2px solid ${userType === r ? '#1e40af' : '#e2e8f0'}`, background: userType === r ? '#eff6ff' : '#fff', color: userType === r ? '#1e40af' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
                  {r === 'student' ? '👨‍🎓 Student' : '👨‍🏫 Faculty'}
                </button>
              ))}
            </div>

            <label style={s.label}>{userType === 'student' ? 'Registration Number' : 'Faculty ID'}</label>
            <input style={s.input} value={id} onChange={e => setId(e.target.value)}
              placeholder={userType === 'student' ? 'e.g. 231FA04017' : 'e.g. FAC001'} required />
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
          </form>
        )}

        {/* Step 2 — Enter OTP */}
        {step === 2 && (
          <form onSubmit={verifyOTP}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', marginBottom: 6 }}>Enter OTP</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              A 6-digit OTP was sent to <strong>{maskedEmail}</strong>. Valid for 10 minutes.
            </div>
            <label style={s.label}>OTP</label>
            <input style={{ ...s.input, fontSize: 24, letterSpacing: 10, textAlign: 'center' }}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="------" maxLength={6} required />
            <button style={s.btn} type="submit" disabled={loading || otp.length < 6}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <button type="button" style={s.back} onClick={() => { setStep(1); setError(''); setOtp(''); }}>← Back</button>
            <button type="button" style={{ ...s.back, color: '#64748b', marginTop: 6 }}
              onClick={() => { setStep(1); setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 100); }}>
              Resend OTP
            </button>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form onSubmit={resetPassword}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', marginBottom: 6 }}>Set New Password</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Choose a strong password (min 6 characters).</div>
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" required />
            <label style={s.label}>Confirm Password</label>
            <input style={s.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}

        <button style={s.back} onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    </div>
  );
}
