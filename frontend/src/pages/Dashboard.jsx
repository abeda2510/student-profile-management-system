import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/achievements/me').then(r => {
      setAchCount(r.data.length);
      setApprovedCount(r.data.filter(a => a.status === 'APPROVED').length);
      setPendingCount(r.data.filter(a => a.status === 'PENDING').length);
    }).catch(() => {});
    api.get('/documents/me').then(r => setDocCount(r.data.length)).catch(() => {});
  }, []);

  // Profile completeness
  const profileFields = ['name','email','phone','branch','section','dob','gender','bloodGroup','parentName','parentPhone'];
  const filled = profile ? profileFields.filter(f => profile[f]).length : 0;
  const completeness = profile ? Math.round((filled / profileFields.length) * 100) : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        boxShadow: '0 8px 32px rgba(30,58,138,0.2)',
        display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -50, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>
          {name ? name.charAt(0).toUpperCase() : '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Welcome, {name || '—'} 👋</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Comprehensive Student Achievement & Profile Management System</div>
          {profile && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[profile.regNumber, profile.branch, profile.section && `Section ${profile.section}`, profile.currentYear && `Year ${profile.currentYear}`].filter(Boolean).map((item, i) => (
                <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{item}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Achievements', value: achCount, icon: '🏆', color: '#1e40af', bg: 'linear-gradient(135deg,#1e40af,#2563eb)', onClick: () => navigate('/achievements') },
          { label: 'Approved', value: approvedCount, icon: '✅', color: '#059669', bg: 'linear-gradient(135deg,#059669,#10b981)', onClick: () => navigate('/achievements') },
          { label: 'Pending Review', value: pendingCount, icon: '⏳', color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#f59e0b)', onClick: () => navigate('/achievements') },
        ].map(c => (
          <div key={c.label} onClick={c.onClick}
            style={{ background: c.bg, borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ fontSize: 30 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Completeness + Quick Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
        {/* Profile card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 24, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{profile?.branch} | Section {profile?.section}</div>
          {/* Progress bar */}
          <div style={{ width: '100%', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              <span>Profile Complete</span><span style={{ fontWeight: 700, color: completeness >= 80 ? '#059669' : '#d97706' }}>{completeness}%</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#d97706,#f59e0b)', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, marginTop: 8 }}>View Profile →</div>
        </div>

        {/* Quick Info */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Quick Info
          </div>
          {profile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              {[
                ['Reg. Number', profile.regNumber],
                ['Email', profile.email],
                ['Phone', profile.phone],
                ['Branch', profile.branch],
                ['Section', profile.section],
                ['Admission Year', profile.admissionYear],
                ['CGPA', profile.cgpa],
                ['Admission Category', profile.admissionCategory],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          )}
          {profile && (profile.linkedIn || profile.codeChef || profile.leetCode) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>🔗 LinkedIn</a>}
              {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>👨‍🍳 CodeChef</a>}
              {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>💻 LeetCode</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
