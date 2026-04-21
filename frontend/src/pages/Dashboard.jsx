import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [docs, setDocs] = useState([]);
  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/achievements/me').then(r => setAchCount(r.data.length)).catch(() => {});
    api.get('/documents/me').then(r => setDocs(r.data)).catch(() => {});
  }, []);

  const checks = profile ? {
    personal:  ['name','dob','gender','bloodGroup','nationality'].every(f => profile[f]),
    contact:   ['email','phone','parentName','parentPhone'].every(f => profile[f]),
    academic:  ['branch','section','currentYear','currentSemester','admissionYear','admissionCategory'].every(f => profile[f]),
    tenth:     ['tenthSchool','tenthBoard','tenthYear','tenthPercent'].every(f => profile[f]),
    inter:     ['interCollege','interBoard','interYear','interPercent'].every(f => profile[f]),
    aadhaar:   docs.some(d => d.docType === 'AADHAAR' || d.docType === 'Aadhaar'),
  } : {};

  const profileComplete = Object.values(checks).length > 0 && Object.values(checks).every(Boolean);

  const quickInfo = profile ? [
    { label: 'Reg. Number', value: profile.regNumber },
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Admission Category', value: profile.admissionCategory },
    { label: 'Admission Year', value: profile.admissionYear },
    { label: 'Section', value: profile.section },
    { label: 'Address', value: profile.address },
    { label: 'Overall CGPA', value: (() => { const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(profile[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0); return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : profile.cgpa || null; })() },
  ] : [];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#1e40af' }}>{name}</span> 👋
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Here's a summary of your academic profile.</p>
      </div>

      {/* 2 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Achievements card */}
        <div onClick={() => navigate('/achievements')}
          style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏆</div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{achCount}</div>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>Achievements</div>
          </div>
        </div>

        {/* Profile Complete card */}
        <div onClick={() => navigate('/profile')}
          style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: `1px solid ${profileComplete ? '#bbf7d0' : '#e8edf3'}`, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Profile Status</div>
              <div style={{ fontSize: 12, color: profileComplete ? '#059669' : '#ef4444', fontWeight: 600 }}>
                {profileComplete ? '✓ Complete' : '✗ Incomplete'}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {[
              { label: 'Personal', key: 'personal' },
              { label: 'Contact', key: 'contact' },
              { label: 'Academic', key: 'academic' },
              { label: '10th Details', key: 'tenth' },
              { label: 'Intermediate', key: 'inter' },
              { label: 'Aadhaar', key: 'aadhaar' },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ fontSize: 14, color: checks[key] ? '#059669' : '#d1d5db', fontWeight: 800 }}>
                  {checks[key] ? '✓' : '○'}
                </span>
                <span style={{ color: checks[key] ? '#0f172a' : '#94a3b8', fontWeight: checks[key] ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Profile Info */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Quick Profile Info</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {quickInfo.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f8fafc', gap: 16 }}>
              <span style={{ color: '#64748b', fontSize: 14, minWidth: 160, fontWeight: 500 }}>{label}</span>
              <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
            </div>
          ))}
        </div>
        {profile && (profile.linkedIn || profile.codeChef || profile.leetCode) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>🔗 LinkedIn</a>}
            {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>👨‍🍳 CodeChef</a>}
            {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>💻 LeetCode</a>}
          </div>
        )}
      </div>
    </div>
  );
}
