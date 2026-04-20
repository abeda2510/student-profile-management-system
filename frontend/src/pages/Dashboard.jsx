import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [pendingDocs, setPendingDocs] = useState(0);
  const name = localStorage.getItem('name');
  const navigate = useNavigate();
  const TOTAL_DOC_TYPES = 6;

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/achievements/me').then(r => setAchCount(r.data.length)).catch(() => {});
    api.get('/documents/me').then(r => {
      const docs = r.data;
      setDocCount(docs.length);
      const uploaded = new Set(docs.map(d => d.docType)).size;
      setPendingDocs(Math.max(0, TOTAL_DOC_TYPES - uploaded));
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Achievements', value: achCount, color: '#1e40af', border: '#1e40af', icon: '🏆', onClick: () => navigate('/achievements') },
    { label: 'Documents Uploaded', value: docCount, color: '#059669', border: '#059669', icon: '📄', onClick: () => navigate('/documents') },
    { label: 'Pending Documents', value: pendingDocs, color: '#d97706', border: '#d97706', icon: '⏳', onClick: () => navigate('/documents') },
  ];

  const quickInfo = profile ? [
    { label: 'Reg. Number', value: profile.regNumber },
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Admission Category', value: profile.admissionCategory },
    { label: 'Admission Year', value: profile.admissionYear },
    { label: 'Section', value: profile.section },
  ] : [];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#1e40af' }}>{name}</span> 👋
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Here's a summary of your academic activity</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        {statCards.map(c => (
          <div key={c.label} onClick={c.onClick}
            style={{
              background: '#fff', borderRadius: 14, padding: '24px 28px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
              border: `1px solid #e8edf3`, borderTop: `3px solid ${c.border}`,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: c.color, lineHeight: 1, marginBottom: 6 }}>{c.value}</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{c.label}</div>
            </div>
            <div style={{ fontSize: 40, opacity: 0.25 }}>{c.icon}</div>
          </div>
        ))}
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
