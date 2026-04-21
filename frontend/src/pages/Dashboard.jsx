import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tab, setTab] = useState('profile');
  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/achievements/me').then(r => setAchievements(r.data)).catch(() => {});
    api.get('/documents/me').then(r => setDocs(r.data)).catch(() => {});
  }, []);

  const achCount = achievements.length;

  const checks = profile ? {
    personal:  ['name','dob','gender','bloodGroup','nationality'].every(f => profile[f]),
    contact:   ['email','phone','parentName','parentPhone'].every(f => profile[f]),
    academic:  ['branch','section','currentYear','currentSemester','admissionYear','admissionCategory'].every(f => profile[f]),
    tenth:     ['tenthSchool','tenthBoard','tenthYear','tenthPercent'].every(f => profile[f]),
    inter:     ['interCollege','interBoard','interYear','interPercent'].every(f => profile[f]),
    aadhaar:   docs.some(d => d.docType === 'AADHAAR' || d.docType === 'Aadhaar'),
  } : {};

  const profileComplete = Object.values(checks).length > 0 && Object.values(checks).every(Boolean);

  const overallCgpa = profile ? (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(profile[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : profile.cgpa || null;
  })() : null;

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{
      padding: '8px 20px', borderRadius: 99, border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: 13,
      background: tab === t ? '#059669' : '#f1f5f9',
      color: tab === t ? '#fff' : '#374151',
    }}>{label}</button>
  );

  const STATUS_COLORS = {
    APPROVED: { bg: '#d1fae5', color: '#065f46' },
    PENDING:  { bg: '#fef3c7', color: '#92400e' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b' },
  };

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

        <div onClick={() => navigate('/profile')}
          style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: `1px solid ${profileComplete ? '#bbf7d0' : '#e8edf3'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👤</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profileComplete ? <span style={{ fontSize: 28, color: '#059669', fontWeight: 800 }}>✓</span> : <span style={{ fontSize: 28, color: '#ef4444', fontWeight: 800 }}>✗</span>}
            <div style={{ fontSize: 14, color: '#64748b' }}>Profile {profileComplete ? 'Complete' : 'Incomplete'}</div>
          </div>
        </div>
      </div>

      {/* Tabbed Info Card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabBtn('profile', 'Profile')}
          {tabBtn('docs', `Docs (${docs.length})`)}
          {tabBtn('achievements', `Achievements (${achCount})`)}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && profile && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                ['Reg. Number', profile.regNumber], ['Branch', profile.branch],
                ['Email', profile.email], ['Phone', profile.phone],
                ['Section', profile.section], ['Current Year', profile.currentYear],
                ['Admission Year', profile.admissionYear], ['Admission Category', profile.admissionCategory],
                ['Date of Birth', profile.dob], ['Gender', profile.gender],
                ['Blood Group', profile.bloodGroup], ['Nationality', profile.nationality],
                ['Parent Name', profile.parentName], ['Parent Phone', profile.parentPhone],
                ['APAAR ID', profile.apaarId], ['Overall CGPA', overallCgpa],
                ['Address', profile.address], ['Counsellor', profile.counsellor],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f8fafc', gap: 12 }}>
                  <span style={{ color: '#64748b', fontSize: 13, minWidth: 150, fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 600 }}>{String(value)}</span>
                </div>
              ))}
            </div>
            {(profile.linkedIn || profile.codeChef || profile.leetCode) && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>🔗 LinkedIn</a>}
                {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>👨‍🍳 CodeChef</a>}
                {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>💻 LeetCode</a>}
              </div>
            )}
          </div>
        )}

        {/* Docs Tab */}
        {tab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No documents uploaded yet.</div>}
            {docs.map(d => (
              <div key={d._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 10 }}>{d.docType}</span>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{d.label || d.filename || '—'}</span>
                </div>
                {(d.fileUrl || d.filepath) && (
                  <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer"
                    style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View</a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {achievements.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No achievements yet.</div>}
            {achievements.map(a => {
              const sc = STATUS_COLORS[a.status] || STATUS_COLORS.PENDING;
              return (
                <div key={a._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #1e40af' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {a.activityType && <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.activityType.replace(/_/g,' ')}</span>}
                        {a.academicYear && <span style={{ background: '#f0fdf4', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                        {a.position && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                        <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                      </div>
                    </div>
                    {(a.certificateUrl || a.certificatePath) && (
                      <a href={a.certificateUrl || a.certificatePath} target="_blank" rel="noreferrer"
                        style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, marginLeft: 10 }}>📎 View</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
