import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data));
    api.get('/achievements/me').then(r => setAchCount(r.data.length));
    api.get('/documents/me').then(r => {
      const docs = r.data;
      setDocCount(docs.length);
      const uploadedTypes = new Set(docs.map(d => d.docType)).size;
      setPendingCount(Math.max(0, 6 - uploadedTypes));
    });
  }, []);

  const cards = [
    {
      label: 'My Profile',
      desc: 'Personal, academic & contact details',
      value: '👤',
      color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
      img: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png',
      link: '/profile',
    },
    {
      label: 'Achievements',
      desc: 'Hackathons, internships, certifications',
      value: achCount,
      color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
      img: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
      link: '/achievements',
    },
    {
      label: 'Documents',
      desc: 'Aadhaar, PAN, mark memos & more',
      value: docCount,
      color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
      img: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
      link: '/documents',
    },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #059669 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, color: '#fff' }}>
        <img src={LOGO} alt="Vignan" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome, {name || '—'} 👋</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Comprehensive Student Achievement & Profile Management System</div>
          {profile && (
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              {profile.regNumber} &nbsp;|&nbsp; {profile.branch} &nbsp;|&nbsp; Section {profile.section} &nbsp;|&nbsp; Year {profile.currentYear}
            </div>
          )}
        </div>
        {role === 'admin' && (
          <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('/admin')}>
            ⚙️ Admin Panel
          </div>
        )}
      </div>

      {/* 2 cards - Profile and Achievements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        {[cards[0], cards[1]].map(c => (
          <Link key={c.link} to={c.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1.5px solid ${c.border}`, cursor: 'pointer', transition: 'transform 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, minHeight: 200 }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <img src={c.img} alt={c.label} style={{ width: 38, height: 38, objectFit: 'contain' }} />
              </div>
              {typeof c.value === 'number' && (
                <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{c.desc}</div>
              <div style={{ marginTop: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 8, padding: '5px 16px', fontSize: 12, fontWeight: 700 }}>View →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick profile info */}
      {profile && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8edf3' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e40af', marginBottom: 16, borderBottom: '2px solid #dbeafe', paddingBottom: 8 }}>Quick Info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Name', profile.name],
              ['Registration Number', profile.regNumber],
              ['Email', profile.email],
              ['Phone', profile.phone],
              ['Branch', profile.branch],
              ['Section', profile.section],
              ['Admission Category', profile.admissionCategory],
              ['Admission Year', profile.admissionYear],
              ['CGPA', profile.cgpa],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>
          {(profile.linkedIn || profile.codeChef || profile.leetCode) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>🔗 LinkedIn</a>}
              {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>👨‍🍳 CodeChef</a>}
              {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>💻 LeetCode</a>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
