import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

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

      {/* 6 Interactive Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {/* Card 1: Profile */}
        <div onClick={() => setTab('profile')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'profile' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'profile' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'profile' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'profile') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'profile') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile Status</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {profileComplete ? <span style={{ color: '#059669' }}>✓ Complete</span> : <span style={{ color: '#ef4444' }}>✗ Incomplete</span>}
            </div>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div onClick={() => setTab('attendance')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'attendance' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'attendance' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'attendance' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'attendance') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'attendance') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📅</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {profile && profile.attendance?.length > 0 ? (() => {
                const avg = (profile.attendance.reduce((s, a) => s + (a.present / (a.total || 1)) * 100, 0) / profile.attendance.length).toFixed(1);
                return `${avg}% Avg`;
              })() : '—'}
            </div>
          </div>
        </div>

        {/* Card 3: CRT Performance */}
        <div onClick={() => setTab('crt')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'crt' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'crt' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'crt' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'crt') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'crt') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎯</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRT Performance</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {profile && profile.crtPerformance?.length > 0 ? (() => {
                const avg = (profile.crtPerformance.reduce((s, p) => s + (p.score / (p.maxScore || 100)) * 100, 0) / profile.crtPerformance.length).toFixed(1);
                return `${avg}% Avg`;
              })() : '—'}
            </div>
          </div>
        </div>

        {/* Card 4: Achievements */}
        <div onClick={() => setTab('achievements')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'achievements' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'achievements' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'achievements' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'achievements') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'achievements') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏆</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Achievements</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {achCount} Approved
            </div>
          </div>
        </div>

        {/* Card 5: CGPA */}
        <div onClick={() => setTab('cgpa')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'cgpa' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'cgpa' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'cgpa' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'cgpa') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'cgpa') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎓</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic CGPA</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {overallCgpa ? `${overallCgpa} CGPA` : '—'}
            </div>
          </div>
        </div>

        {/* Card 6: Docs */}
        <div onClick={() => setTab('docs')}
          style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            border: '1.5px solid',
            borderColor: tab === 'docs' ? '#1e40af' : '#e8edf3',
            boxShadow: tab === 'docs' ? '0 0 0 2px #1e40af, 0 8px 20px rgba(30, 64, 175, 0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
            transform: tab === 'docs' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={e => { if (tab !== 'docs') e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { if (tab !== 'docs') e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📂</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Documents</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {docs.length} Uploaded
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3' }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20,
          borderBottom: '1px solid #f1f5f9', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {tab === 'profile' && '👤 My Personal & Academic Profile'}
          {tab === 'attendance' && '📅 Academic Attendance Overview'}
          {tab === 'crt' && '🎯 CRT Performance Details'}
          {tab === 'achievements' && '🏆 Approved Achievements'}
          {tab === 'cgpa' && '🎓 Semester-wise Grade Breakdown'}
          {tab === 'docs' && '📂 My Uploaded Documents'}
        </h3>

        {/* Profile Tab */}
        {tab === 'profile' && profile && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth < 768 ? "1fr" : "1fr 1fr"', gap: '0 24px' }}>
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
                {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>🔗 LinkedIn</a>}
                {profile.codeChef && <a href={`https://www.codechef.com/users/${profile.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>👨‍🍳 CodeChef</a>}
                {profile.leetCode && <a href={`https://leetcode.com/${profile.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>💻 LeetCode</a>}
              </div>
            )}
          </div>
        )}

        {/* Docs Tab */}
        {tab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No documents uploaded yet.</div>}
            {docs.map(d => {
              const fileUrl = d.fileUrl || d.filepath || '';
              return (
                <div key={d._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 10 }}>{d.docType}</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{d.label || d.filename || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {fileUrl && <ViewButton url={fileUrl} label="View" style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700 }} />}
                    {fileUrl && (
                      <button onClick={async () => {
                        try {
                          const res = await fetch(fileUrl);
                          const blob = await res.blob();
                          const ext = fileUrl.split('?')[0].split('.').pop() || 'pdf';
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${d.docType || 'document'}_${d.label || d.filename || 'file'}.${ext}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch { alert('Download failed'); }
                      }} style={{ background: '#f0fdf4', color: '#059669', border: 'none', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⬇ Download</button>
                    )}
                    <button onClick={async () => {
                      if (!confirm('Delete this document?')) return;
                      await api.delete(`/documents/${d._id}`);
                      setDocs(prev => prev.filter(x => x._id !== d._id));
                    }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              );
            })}
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
                    <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View" style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 10 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attendance Tab */}
        {tab === 'attendance' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(!profile.attendance || profile.attendance.length === 0) && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No attendance records found.</div>
            )}
            {profile.attendance && profile.attendance.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                {profile.attendance.map((a, i) => {
                  const pct = Math.round((a.present / (a.total || 1)) * 100);
                  const color = pct >= 75 ? '#059669' : pct >= 60 ? '#d97706' : '#ef4444';
                  return (
                    <div key={i} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{a.subject}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{a.present}/{a.total} classes ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CRT Tab */}
        {tab === 'crt' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(!profile.crtPerformance || profile.crtPerformance.length === 0) && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No CRT performance records found.</div>
            )}
            {profile.crtPerformance && profile.crtPerformance.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                {profile.crtPerformance.map((p, i) => {
                  const pct = Math.round((p.score / (p.maxScore || 100)) * 100);
                  const color = pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#ef4444';
                  return (
                    <div key={i} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{p.module}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{p.score}/{p.maxScore || 100} score ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CGPA Tab */}
        {tab === 'cgpa' && profile && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              {/* Overall Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                borderRadius: 12, padding: 20, color: '#fff', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 14px rgba(30, 64, 175, 0.2)'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px' }}>Cumulative Grade Point Average (CGPA)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{overallCgpa || '—'} / 10.00</div>
                </div>
                <div style={{ fontSize: 32 }}>🎓</div>
              </div>

              {/* Semester Grid */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Semester breakdown values</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                    const sgpa = parseFloat(profile[`sem${sem}Sgpa`]);
                    const cgpa = parseFloat(profile[`sem${sem}Cgpa`]);
                    const hasData = (!isNaN(sgpa) && sgpa > 0) || (!isNaN(cgpa) && cgpa > 0);
                    
                    return (
                      <div key={sem} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6,
                        opacity: hasData ? 1 : 0.6
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>Semester {sem}</div>
                        {hasData ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: '#64748b' }}>SGPA:</span>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{sgpa ? sgpa.toFixed(2) : '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: '#64748b' }}>CGPA:</span>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{cgpa ? cgpa.toFixed(2) : '—'}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>No grades registered</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
