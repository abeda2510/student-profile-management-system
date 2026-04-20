import React, { useEffect, useState } from 'react';
import api from '../api';

const LOGO = 'https://vumoodle.in/pluginfile.php/2/course/section/122/LOGO.jpg';

const icons = {
  name: '👤', reg: '🎫', email: '📧', phone: '📱', branch: '🏛️', section: '📌', cgpa: '⭐', year: '📅', category: '🎓'
};

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achCount, setAchCount] = useState(0);
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/achievements/me').then(r => setAchCount(r.data.length)).catch(() => {});
  }, []);

  const quickInfo = profile ? [
    { icon: icons.name, label: 'Full Name', value: profile.name },
    { icon: icons.reg, label: 'Registration No.', value: profile.regNumber },
    { icon: icons.email, label: 'Email', value: profile.email },
    { icon: icons.phone, label: 'Phone', value: profile.phone },
    { icon: icons.branch, label: 'Branch', value: profile.branch },
    { icon: icons.section, label: 'Section', value: profile.section },
    { icon: icons.category, label: 'Admission Category', value: profile.admissionCategory },
    { icon: icons.year, label: 'Admission Year', value: profile.admissionYear },
    { icon: icons.cgpa, label: 'CGPA', value: profile.cgpa },
  ].filter(i => i.value) : [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 28,
        boxShadow: '0 8px 32px rgba(30,58,138,0.25)',
        display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
          border: '3px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, backdropFilter: 'blur(10px)'
        }}>
          {name ? name.charAt(0).toUpperCase() : '👤'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            Welcome, {name || '—'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
            Comprehensive Student Achievement & Profile Management System
          </div>
          {profile && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[profile.regNumber, profile.branch, profile.section && `Section ${profile.section}`, profile.currentYear && `Year ${profile.currentYear}`].filter(Boolean).map((item, i) => (
                <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.12)', padding: '3px 12px', borderRadius: 99, fontWeight: 600 }}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Achievement badge */}
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '14px 20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{achCount}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Achievements</div>
        </div>
      </div>

      {/* Quick Info Card */}
      {profile && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Quick Info</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Your key details at a glance</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {quickInfo.map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 }}>{icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {(profile.linkedIn || profile.codeChef || profile.leetCode) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>🔗 LinkedIn</a>}
              {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}>👨‍🍳 CodeChef</a>}
              {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}>💻 LeetCode</a>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
