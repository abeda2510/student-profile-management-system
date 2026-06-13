import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tab, setTab] = useState('profile');
  const [hoveredCard, setHoveredCard] = useState(null);
  const cachedName = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/me')
      .then(r => {
        setProfile(r.data);
        if (r.data && r.data.name) {
          localStorage.setItem('name', r.data.name);
        }
      })
      .catch(() => {});
    api.get('/achievements/me').then(r => setAchievements(r.data)).catch(() => {});
    api.get('/documents/me').then(r => setDocs(r.data)).catch(() => {});
  }, []);

  const achCount = achievements.length;

  const CATEGORY_TYPES = {
    TECHNICAL: ['HACKATHON', 'IDEATHON', 'TECHNICAL_COMPETITION', 'INTERNSHIP', 'WORKSHOP', 'SEMINAR', 'PROJECT'],
    NON_TECHNICAL: ['SPORTS', 'CULTURAL', 'DANCE', 'MUSIC', 'ART', 'VOLUNTEERING', 'NSS', 'NCC'],
    NPTEL: ['NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE'],
    CERTIFICATIONS: ['AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING'],
    PUBLICATIONS: ['RESEARCH_PUBLICATION', 'PATENT', 'JOURNAL_PAPER', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER']
  };

  const getCategoryKey = (a) => {
    if (a.mainCategory && ['TECHNICAL', 'NON_TECHNICAL', 'NPTEL', 'CERTIFICATIONS', 'PUBLICATIONS', 'OTHER'].includes(a.mainCategory)) return a.mainCategory;
    for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
      if (types.includes(a.activityType)) return cat;
    }
    return 'OTHER';
  };

  const publications = achievements.filter(a => getCategoryKey(a) === 'PUBLICATIONS');

  const isFieldFilled = (val) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  const checks = profile ? {
    personal:  ['name','dob','gender','bloodGroup','nationality','religion','caste'].every(f => isFieldFilled(profile[f])),
    contact:   ['email','phone','address','parentName','parentPhone'].every(f => isFieldFilled(profile[f])),
    academic:  ['branch','section','currentYear','currentSemester','admissionYear','admissionCategory','academicYear'].every(f => isFieldFilled(profile[f])),
    tenth:     ['tenthSchool','tenthBoard','tenthYear','tenthPercent'].every(f => isFieldFilled(profile[f])) && docs.some(d => d.docType === 'MARK_MEMO' && (d.label?.includes('10th') || d.label?.includes('SSC'))),
    inter:     ['interCollege','interBoard','interYear','interPercent','interGroup'].every(f => isFieldFilled(profile[f])) && docs.some(d => d.docType === 'MARK_MEMO' && (d.label?.includes('Inter') || d.label?.includes('12th'))),
    documents: ['apaarId','aadhaarNumber'].every(f => isFieldFilled(profile[f])) && docs.some(d => d.docType === 'AADHAAR' || d.docType === 'Aadhaar'),
    coding:    isFieldFilled(profile.linkedIn) || isFieldFilled(profile.leetCode) || isFieldFilled(profile.codeChef)
  } : {};

  const profileComplete = Object.values(checks).length > 0 && Object.values(checks).every(Boolean);

  const overallCgpa = profile ? (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(profile[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : profile.cgpa || null;
  })() : null;

  const cardsConfig = [
    {
      key: 'profile',
      label: 'Profile Status',
      icon: '👤',
      color: '#4f46e5',
      grad: 'linear-gradient(135deg, #818cf8, #4f46e5)',
      shadow: 'rgba(79, 70, 229, 0.25)',
      renderValue: () => {
        const total = 7;
        const passed = Object.values(checks).filter(Boolean).length;
        const pct = Math.round((passed / total) * 100);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: pct === 100 ? '#059669' : '#4f46e5', fontWeight: 800 }}>
                {pct === 100 ? '✓ 100%' : `${pct}%`} Complete
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : 'linear-gradient(90deg, #818cf8, #4f46e5)', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: '📅',
      color: '#0d9488',
      grad: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
      shadow: 'rgba(13, 148, 136, 0.25)',
      renderValue: () => profile && profile.attendance?.length > 0 ? (() => {
        const avg = (profile.attendance.reduce((s, a) => s + (a.present / (a.total || 1)) * 100, 0) / profile.attendance.length).toFixed(1);
        return `${avg}% Avg`;
      })() : '—'
    },
    {
      key: 'crt',
      label: 'CRT Performance',
      icon: '🎯',
      color: '#ea580c',
      grad: 'linear-gradient(135deg, #fb923c, #ea580c)',
      shadow: 'rgba(234, 88, 12, 0.25)',
      renderValue: () => profile && profile.crtPerformance?.length > 0 ? (() => {
        const avg = (profile.crtPerformance.reduce((s, p) => s + (p.score / (p.maxScore || 100)) * 100, 0) / profile.crtPerformance.length).toFixed(1);
        return `${avg}% Avg`;
      })() : '—'
    },
    {
      key: 'achievements',
      label: 'Achievements',
      icon: '🏆',
      color: '#7c3aed',
      grad: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
      shadow: 'rgba(124, 58, 237, 0.25)',
      renderValue: () => `${achCount} Approved`
    },
    {
      key: 'cgpa',
      label: 'Academic CGPA',
      icon: '🎓',
      color: '#059669',
      grad: 'linear-gradient(135deg, #34d399, #059669)',
      shadow: 'rgba(5, 150, 105, 0.25)',
      renderValue: () => overallCgpa ? `${overallCgpa} CGPA` : '—'
    },
    {
      key: 'publications',
      label: 'Publications',
      icon: '📄',
      color: '#0284c7',
      grad: 'linear-gradient(135deg, #38bdf8, #0284c7)',
      shadow: 'rgba(2, 132, 199, 0.25)',
      renderValue: () => `${publications.length} Published`
    }
  ];

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
          Welcome back, <span style={{ color: '#1e40af' }}>{profile?.name || cachedName || 'Student'}</span> 👋
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
        {cardsConfig.map(card => {
          const isActive = tab === card.key;
          const isHovered = hoveredCard === card.key;
          return (
            <div
              key={card.key}
              onClick={() => setTab(card.key)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '22px 20px',
                border: '2px solid',
                borderColor: isActive ? card.color : '#f1f5f9',
                boxShadow: isActive 
                  ? `0 10px 25px -5px ${card.shadow}, 0 8px 10px -6px ${card.shadow}`
                  : isHovered 
                    ? '0 12px 24px -10px rgba(0,0,0,0.08), 0 4px 12px -5px rgba(0,0,0,0.03)'
                    : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Colored Indicator Line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: card.grad,
                opacity: isActive || isHovered ? 1 : 0.15,
                transition: 'opacity 0.25s'
              }} />

              {/* Premium Gradient Icon Block */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: card.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#fff',
                boxShadow: `0 4px 12px ${card.shadow}`,
                transform: isHovered || isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.25s',
                flexShrink: 0
              }}>
                {card.icon}
              </div>

              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? card.color : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  transition: 'color 0.25s'
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {card.renderValue()}
                </div>
              </div>
            </div>
          );
        })}
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
          {tab === 'publications' && '📄 My Publications & Patents'}
        </h3>

        {/* Profile Tab */}
        {tab === 'profile' && profile && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth < 768 ? "1fr" : "1fr 1fr"', gap: '0 24px' }}>
              {[
                ['Reg. Number', profile.regNumber], ['Branch', profile.branch],
                ['Email', profile.email], ['Phone', profile.phone],
                ['Section', profile.section], ['Current Year', profile.currentYear],
                ['Academic Year', profile.academicYear], ['Admission Year', profile.admissionYear],
                ['Admission Category', profile.admissionCategory],
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

        {/* Publications Tab */}
        {tab === 'publications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Showcasing your research papers, patents, books, and journal publications.</span>
              <button 
                onClick={() => navigate('/achievements')} 
                style={{ 
                  background: '#0369a1', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#025a87'}
                onMouseLeave={e => e.currentTarget.style.background = '#0369a1'}
              >
                + Add Publication
              </button>
            </div>
            {publications.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                No publications found. Click "+ Add Publication" to register one.
              </div>
            )}
            {publications.map(p => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PENDING;
              return (
                <div key={p._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0369a1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{p.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          {p.activityType.replace(/_/g, ' ')}
                        </span>
                        {p.academicYear && <span style={{ background: '#f0fdf4', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{p.academicYear}</span>}
                        <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{p.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {p.issuingOrg && <span>🏢 {p.issuingOrg} &nbsp;</span>}
                        {p.date && <span>📅 {p.date}</span>}
                      </div>
                      {p.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 8, fontStyle: 'italic' }}>{p.description}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <ViewButton url={viewUrl(p.certificateUrl || p.certificatePath)} label="📎 View File" style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700 }} />
                      <button 
                        onClick={async () => {
                          if (!confirm('Delete this publication?')) return;
                          await api.delete(`/achievements/${p._id}`);
                          setAchievements(prev => prev.filter(x => x._id !== p._id));
                        }} 
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (() => {
          const categoriesList = [
            { key: 'TECHNICAL', label: 'Technical', color: '#1e40af', bg: '#eff6ff' },
            { key: 'NON_TECHNICAL', label: 'Non-Technical', color: '#d97706', bg: '#fffbeb' },
            { key: 'NPTEL', label: 'NPTEL', color: '#7c3aed', bg: '#f5f3ff' },
            { key: 'CERTIFICATIONS', label: 'Certifications', color: '#059669', bg: '#f0fdf4' },
            { key: 'PUBLICATIONS', label: 'Publications', color: '#0369a1', bg: '#f0f9ff' },
            { key: 'OTHER', label: 'Other', color: '#64748b', bg: '#f8fafc' },
          ];

          const categoryCounts = {
            TECHNICAL: 0,
            NON_TECHNICAL: 0,
            NPTEL: 0,
            CERTIFICATIONS: 0,
            PUBLICATIONS: 0,
            OTHER: 0,
          };
          achievements.forEach(a => {
            const key = getCategoryKey(a);
            categoryCounts[key]++;
          });

          let accumulatedPercent = 0;
          const donutSlices = categoriesList
            .map(cat => {
              const count = categoryCounts[cat.key];
              if (count === 0) return null;
              const percent = (count / achCount) * 100;
              const slice = {
                key: cat.key,
                color: cat.color,
                label: cat.label,
                count,
                percent,
                accumulatedPercent,
              };
              accumulatedPercent += percent;
              return slice;
            })
            .filter(Boolean);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Graphical View */}
              {achCount > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  background: '#f8fafc',
                  borderRadius: 14,
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  alignItems: 'center',
                }}>
                  {/* Left: Donut Chart */}
                  <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '0 auto' }}>
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                      {donutSlices.map(slice => (
                        <circle
                          key={slice.key}
                          cx="70"
                          cy="70"
                          r="50"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="12"
                          strokeDasharray={`${(slice.percent / 100) * 314.16} 314.16`}
                          strokeDashoffset={- (slice.accumulatedPercent / 100) * 314.16}
                          transform="rotate(-90 70 70)"
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke-dasharray 0.5s ease' }}
                        />
                      ))}
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{achCount}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
                    </div>
                  </div>

                  {/* Right: Legend & Progress Bars */}
                  <div style={{ flex: 1, minWidth: 260, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                    {categoriesList.map(cat => {
                      const count = categoryCounts[cat.key];
                      const percent = achCount > 0 ? Math.round((count / achCount) * 100) : 0;
                      return (
                        <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#334155' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                              {cat.label}
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{count} ({percent}%)</span>
                          </div>
                          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: cat.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Achievements List */}
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
            </div>
          );
        })()}

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
