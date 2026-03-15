import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' };

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  const TOTAL_DOC_TYPES = 6; // MARK_MEMO, AADHAAR, PAN, VOTER_ID, APAAR_ABC, OTHER

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data));
    api.get('/achievements/me').then(r => setAchCount(r.data.length));
    api.get('/documents/me').then(r => {
      const docs = r.data;
      setDocCount(docs.length);
      // count unique doc types uploaded
      const uploadedTypes = new Set(docs.map(d => d.docType)).size;
      setPendingCount(Math.max(0, TOTAL_DOC_TYPES - uploadedTypes));
    });
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: '#1e40af' }}>Welcome, {name}</h2>
      {role === 'admin' && (
        <div style={{ ...card, background: '#fef3c7', marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
          You are logged in as <strong>Admin</strong>. Use <Link to="/admin" style={{ color: '#1e40af' }}>Admin Search</Link> to look up any student.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <StatCard label="Achievements Uploaded" value={achCount} color="#1e40af" link="/achievements" />
        <StatCard label="Documents Uploaded" value={docCount} color="#059669" link="/documents" />
        <StatCard label="Pending Documents" value={pendingCount} color="#f59e0b" link="/documents" />
      </div>
      {profile && (
        <div style={{ ...card, marginTop: 24 }}>
          <h3 style={{ marginBottom: 16, color: '#374151' }}>Quick Profile Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 14 }}>
            <Info label="Reg. Number" value={profile.regNumber} />
            <Info label="Email" value={profile.email} />
            <Info label="Phone" value={profile.phone} />
            <Info label="Admission Category" value={profile.admissionCategory} />
            <Info label="Admission Year" value={profile.admissionYear} />
            <Info label="Section" value={profile.section} />
            {profile.cgpa && <Info label="CGPA" value={profile.cgpa} />}
          </div>

          {(profile.linkedIn || profile.codeChef || profile.leetCode) && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', margin: '18px 0 10px', borderBottom: '2px solid #dbeafe', paddingBottom: 5 }}>
                Coding &amp; Social Profiles
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {profile.linkedIn && (
                  <a href={profile.linkedIn} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0a66c2', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    🔗 LinkedIn
                  </a>
                )}
                {profile.codeChef && (
                  <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5b4638', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    👨‍🍳 CodeChef
                  </a>
                )}
                {profile.leetCode && (
                  <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffa116', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    💻 LeetCode
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, link }) {
  return (
    <Link to={link}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `4px solid ${color}`, cursor: 'pointer' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#64748b', fontSize: 12 }}>{label}: </span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}
