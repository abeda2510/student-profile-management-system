import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');
  const TOTAL_DOC_TYPES = 6;

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data));
    api.get('/achievements/me').then(r => setAchCount(r.data.length));
    api.get('/documents/me').then(r => {
      const docs = r.data;
      setDocCount(docs.length);
      setPendingCount(Math.max(0, TOTAL_DOC_TYPES - new Set(docs.map(d => d.docType)).size));
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Welcome back, <span style={{ color: '#1e40af' }}>{name}</span> 👋</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Here's a summary of your academic activity</div>
      </div>

      {role === 'admin' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#92400e', fontWeight: 500 }}>
          Logged in as <strong>Admin</strong> — <Link to="/admin" style={{ color: '#1e40af', fontWeight: 700 }}>Go to Admin Search →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Achievements" value={achCount} color="#1e40af" bg="#eff6ff" icon="🏆" link="/achievements" />
        <StatCard label="Documents Uploaded" value={docCount} color="#059669" bg="#ecfdf5" icon="📄" link="/documents" />
        <StatCard label="Pending Documents" value={pendingCount} color="#d97706" bg="#fffbeb" icon="⏳" link="/documents" />
      </div>

      {profile && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>👤</span>
            Quick Profile Info
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' }}>
            <InfoRow label="Reg. Number" value={profile.regNumber} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Admission Category" value={profile.admissionCategory} />
            <InfoRow label="Admission Year" value={profile.admissionYear} />
            <InfoRow label="Section" value={profile.section} />
            {profile.cgpa && <InfoRow label="CGPA" value={profile.cgpa} />}
          </div>

          {(profile.linkedIn || profile.codeChef || profile.leetCode) && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#1e40af', margin: '20px 0 12px', paddingBottom: 8, borderBottom: '2px solid #dbeafe' }}>
                Coding &amp; Social Profiles
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile.linkedIn && <SocialBtn href={profile.linkedIn} bg="#0a66c2" label="🔗 LinkedIn" />}
                {profile.codeChef && <SocialBtn href={`https://www.codechef.com/users/${profile.codeChef}`} bg="#5b4638" label="👨‍🍳 CodeChef" />}
                {profile.leetCode && <SocialBtn href={`https://leetcode.com/${profile.leetCode}`} bg="#f59e0b" label="💻 LeetCode" />}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, icon, link }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 6, fontWeight: 500 }}>{label}</div>
          </div>
          <div style={{ background: bg, borderRadius: 10, padding: '8px 10px', fontSize: 20 }}>{icon}</div>
        </div>
      </div>
    </Link>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  );
}

function SocialBtn({ href, bg, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
      {label}
    </a>
  );
}
