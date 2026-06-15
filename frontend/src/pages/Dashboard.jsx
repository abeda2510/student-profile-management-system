import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

function DashboardDonutChart({ data, totalText, centerLabel, onClick }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isZero = total === 0;

  const slices = isZero
    ? data.map(item => ({ ...item, percentage: 1 / data.length, displayPercent: '0%', val: 0 }))
    : data.map(item => ({
        ...item,
        percentage: item.value / total,
        displayPercent: `${((item.value / total) * 100).toFixed(0)}%`,
        val: item.value
      })).filter(s => s.percentage > 0);

  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeWidth = 10;

  let accumulatedOffset = 0;
  let currentAngle = -Math.PI / 2;

  const sliceData = slices.map(slice => {
    const strokeLength = slice.percentage * circumference;
    const strokeOffset = -accumulatedOffset;
    accumulatedOffset += strokeLength;

    const angleSpan = slice.percentage * 2 * Math.PI;
    const midAngle = currentAngle + angleSpan / 2;
    currentAngle += angleSpan;

    return {
      slice,
      strokeLength,
      strokeOffset,
      midAngle
    };
  });

  return (
    <div 
      onClick={onClick}
      style={{ position: 'relative', width: 90, height: 90, cursor: 'pointer', transition: 'transform 0.2s', flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
        {sliceData.map((d, idx) => (
          <circle
            key={idx}
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={d.slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${d.strokeLength} ${circumference}`}
            strokeDashoffset={d.strokeOffset}
            style={{
              transition: 'stroke-dashoffset 0.4s ease'
            }}
          />
        ))}
        {isZero && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
        )}
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{totalText}</span>
        <span style={{ fontSize: 8, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1 }}>{centerLabel}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tab, setTab] = useState('profile');
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

  const CATEGORY_TYPES = {
    TECHNICAL: ['HACKATHON', 'IDEATHON', 'TECHNICAL_COMPETITION', 'INTERNSHIP', 'WORKSHOP', 'SEMINAR', 'PROJECT'],
    NON_TECHNICAL: ['SPORTS', 'CULTURAL', 'DANCE', 'MUSIC', 'ART', 'VOLUNTEERING', 'NSS', 'NCC'],
    NPTEL: ['NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE'],
    CERTIFICATIONS: ['AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING']
  };

  const getCategoryKey = (a) => {
    if (a.mainCategory && ['TECHNICAL', 'NON_TECHNICAL', 'NPTEL', 'CERTIFICATIONS', 'OTHER'].includes(a.mainCategory)) return a.mainCategory;
    for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
      if (types.includes(a.activityType)) return cat;
    }
    return 'OTHER';
  };

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

  const totalChecks = 7;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const pctComplete = Math.round((passedChecks / totalChecks) * 100);

  const overallCgpa = profile ? (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(profile[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : profile.cgpa || null;
  })() : null;

  const avgAttendance = profile && profile.attendance?.length > 0 ? (() => {
    return (profile.attendance.reduce((s, a) => s + (a.present / (a.total || 1)) * 100, 0) / profile.attendance.length).toFixed(1);
  })() : '—';

  // CRT Data & stats
  const crtData = (profile?.crtPerformance || []).map((p, idx) => {
    const colors = ['#ea580c', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'];
    return {
      label: p.module,
      value: p.score,
      color: colors[idx % colors.length]
    };
  });
  const crtTotal = profile?.crtPerformance?.length 
    ? Math.round(profile.crtPerformance.reduce((s, p) => s + (p.score / (p.maxScore || 100)) * 100, 0) / profile.crtPerformance.length)
    : 0;

  // Certifications data & stats
  const certsList = achievements.filter(a => ['CERTIFICATIONS', 'NPTEL'].includes(getCategoryKey(a)));
  let nptel = 0, coursera = 0, aws = 0, otherCert = 0;
  certsList.forEach(c => {
    const title = (c.title || '').toLowerCase();
    const org = (c.issuingOrg || '').toLowerCase();
    const type = (c.activityType || '').toLowerCase();
    if (title.includes('nptel') || org.includes('nptel') || type.includes('nptel')) {
      nptel++;
    } else if (title.includes('aws') || org.includes('aws') || title.includes('amazon') || org.includes('amazon') || type.includes('aws')) {
      aws++;
    } else if (title.includes('coursera') || org.includes('coursera') || type.includes('coursera')) {
      coursera++;
    } else {
      otherCert++;
    }
  });
  const certsData = [
    { label: 'NPTEL', value: nptel, color: '#7c3aed' },
    { label: 'Coursera', value: coursera, color: '#3b82f6' },
    { label: 'AWS', value: aws, color: '#f59e0b' },
    { label: 'Other', value: otherCert, color: '#059669' }
  ].filter(item => item.value > 0);

  // Achievements data & stats
  const achsList = achievements.filter(a => ['TECHNICAL', 'NON_TECHNICAL', 'OTHER'].includes(getCategoryKey(a)));
  let tech = 0, nonTech = 0, other = 0;
  achsList.forEach(a => {
    const cat = getCategoryKey(a);
    if (cat === 'TECHNICAL') tech++;
    else if (cat === 'NON_TECHNICAL') nonTech++;
    else other++;
  });
  const achsData = [
    { label: 'Technical', value: tech, color: '#1e40af' },
    { label: 'Non-Technical', value: nonTech, color: '#d97706' },
    { label: 'Other', value: other, color: '#64748b' }
  ].filter(item => item.value > 0);

  const STATUS_COLORS = {
    APPROVED: { bg: '#d1fae5', color: '#065f46' },
    PENDING:  { bg: '#fef3c7', color: '#92400e' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b' },
  };

  return (
    <div>
      {/* Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Welcome back, <span style={{ color: '#1e40af' }}>{profile?.name || cachedName || 'Student'}</span> 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Here's a summary of your academic profile.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setTab('cgpa')}
            style={{ 
              background: tab === 'cgpa' ? '#059669' : '#fff', 
              color: tab === 'cgpa' ? '#fff' : '#059669', 
              border: '1.5px solid #059669', 
              padding: '8px 16px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            🎓 Semester CGPA Breakdown
          </button>
        </div>
      </div>

      {/* Row 1: Profile Box & Attendance Box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 20
      }}>
        {/* Profile Box */}
        <div 
          onClick={() => setTab('profile')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 28px',
            border: '2px solid',
            borderColor: tab === 'profile' ? '#4f46e5' : '#f1f5f9',
            boxShadow: tab === 'profile' ? '0 10px 25px rgba(79, 70, 229, 0.12)' : '0 4px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { if (tab !== 'profile') e.currentTarget.style.borderColor = '#c7d2fe'; }}
          onMouseLeave={e => { if (tab !== 'profile') e.currentTarget.style.borderColor = '#f1f5f9'; }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(135deg, #818cf8, #4f46e5)'
          }} />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Student Profile</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>{profile?.name || 'Loading...'}</h3>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Reg No: {profile?.regNumber}</span>
              </div>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                {profile?.branch} - {profile?.section}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569', marginBottom: 14 }}>
              <span><strong>Year:</strong> {profile?.currentYear || '—'}</span>
              <span><strong>Semester:</strong> {profile?.currentSemester || '—'}</span>
              <span><strong>Academic Year:</strong> {profile?.academicYear || '—'}</span>
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Profile Verification Status</span>
              <span style={{ fontWeight: 800, color: pctComplete === 100 ? '#059669' : '#4f46e5' }}>{pctComplete}% Complete</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pctComplete}%`, height: '100%', background: pctComplete === 100 ? '#059669' : 'linear-gradient(90deg, #818cf8, #4f46e5)', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Attendance Box */}
        <div 
          onClick={() => setTab('attendance')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 28px',
            border: '2px solid',
            borderColor: tab === 'attendance' ? '#0d9488' : '#f1f5f9',
            boxShadow: tab === 'attendance' ? '0 10px 25px rgba(13, 148, 136, 0.12)' : '0 4px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 180,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { if (tab !== 'attendance') e.currentTarget.style.borderColor = '#99f6e4'; }}
          onMouseLeave={e => { if (tab !== 'attendance') e.currentTarget.style.borderColor = '#f1f5f9'; }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(135deg, #2dd4bf, #0d9488)'
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Attendance Overview</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '8px 0 4px 0' }}>{avgAttendance !== '—' ? `${avgAttendance}%` : '—'}</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>Average attendance across all registered courses</p>
            </div>
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: '#0d9488', fontWeight: 700 }}>
                ➔ View Course-wise Attendance
              </span>
            </div>
          </div>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.1)', flexShrink: 0
          }}>
            📅
          </div>
        </div>
      </div>

      {/* Row 2: CRT, Certifications, Achievements Pie Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {/* CRT Performance Pie Chart */}
        <div 
          onClick={() => setTab('crt')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 24px',
            border: '2px solid',
            borderColor: tab === 'crt' ? '#ea580c' : '#f1f5f9',
            boxShadow: tab === 'crt' ? '0 10px 25px rgba(234, 88, 12, 0.12)' : '0 4px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { if (tab !== 'crt') e.currentTarget.style.borderColor = '#fed7aa'; }}
          onMouseLeave={e => { if (tab !== 'crt') e.currentTarget.style.borderColor = '#f1f5f9'; }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(135deg, #fb923c, #ea580c)'
          }} />
          <DashboardDonutChart 
            data={crtData} 
            totalText={crtTotal > 0 ? `${crtTotal}%` : '—'} 
            centerLabel="Score" 
            onClick={() => setTab('crt')} 
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>CRT Performance</span>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>Training Modules</h4>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              {profile?.crtPerformance?.length || 0} Modules Eval.
            </p>
          </div>
        </div>

        {/* Certifications Pie Chart */}
        <div 
          onClick={() => setTab('certifications')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 24px',
            border: '2px solid',
            borderColor: tab === 'certifications' ? '#7c3aed' : '#f1f5f9',
            boxShadow: tab === 'certifications' ? '0 10px 25px rgba(124, 58, 237, 0.12)' : '0 4px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { if (tab !== 'certifications') e.currentTarget.style.borderColor = '#ddd6fe'; }}
          onMouseLeave={e => { if (tab !== 'certifications') e.currentTarget.style.borderColor = '#f1f5f9'; }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)'
          }} />
          <DashboardDonutChart 
            data={certsData} 
            totalText={`${certsList.length}`} 
            centerLabel="Approved" 
            onClick={() => setTab('certifications')} 
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Certifications</span>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>Courses Done</h4>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              AWS, Cisco, Coursera, NPTEL
            </p>
          </div>
        </div>

        {/* Achievements Pie Chart */}
        <div 
          onClick={() => setTab('achievements')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 24px',
            border: '2px solid',
            borderColor: tab === 'achievements' ? '#059669' : '#f1f5f9',
            boxShadow: tab === 'achievements' ? '0 10px 25px rgba(5, 150, 105, 0.12)' : '0 4px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { if (tab !== 'achievements') e.currentTarget.style.borderColor = '#a7f3d0'; }}
          onMouseLeave={e => { if (tab !== 'achievements') e.currentTarget.style.borderColor = '#f1f5f9'; }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(135deg, #34d399, #059669)'
          }} />
          <DashboardDonutChart 
            data={achsData} 
            totalText={`${achsList.length}`} 
            centerLabel="Approved" 
            onClick={() => setTab('achievements')} 
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Achievements</span>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>Extracurriculars</h4>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              Technical, Sports, NSS/NCC
            </p>
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
          {tab === 'achievements' && '🏆 Extracurricular Achievements'}
          {tab === 'certifications' && '📜 Professional Certifications'}
          {tab === 'cgpa' && '🎓 Semester-wise Grade Breakdown'}
        </h3>

        {/* Profile Tab */}
        {tab === 'profile' && profile && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr", gap: '0 24px' }}>
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

        {/* Certifications Tab */}
        {tab === 'certifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Showcasing your course completions, NPTEL results, and industry certifications.</span>
              <button 
                onClick={() => navigate('/achievements')} 
                style={{ 
                  background: '#7c3aed', 
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
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                + Register Certification
              </button>
            </div>
            {certsList.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                No certifications found. Click "+ Register Certification" to add.
              </div>
            )}
            {certsList.map(c => {
              const sc = STATUS_COLORS[c.status] || STATUS_COLORS.PENDING;
              return (
                <div key={c._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', borderLeft: '4px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{c.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        <span style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          {c.activityType.replace(/_/g, ' ')}
                        </span>
                        {c.academicYear && <span style={{ background: '#f0fdf4', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{c.academicYear}</span>}
                        <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{c.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {c.issuingOrg && <span>🏢 {c.issuingOrg} &nbsp;</span>}
                        {c.date && <span>📅 {c.date}</span>}
                      </div>
                      {c.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 8, fontStyle: 'italic' }}>{c.description}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <ViewButton url={viewUrl(c.certificateUrl || c.certificatePath)} label="📎 View File" style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700 }} />
                      <button 
                        onClick={async () => {
                          if (!confirm('Delete this certification?')) return;
                          await api.delete(`/achievements/${c._id}`);
                          setAchievements(prev => prev.filter(x => x._id !== c._id));
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
        {tab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Showcasing your extracurricular, sports, technical, and non-technical achievements.</span>
              <button 
                onClick={() => navigate('/achievements')} 
                style={{ 
                  background: '#059669', 
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
                onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                onMouseLeave={e => e.currentTarget.style.background = '#059669'}
              >
                + Register Achievement
              </button>
            </div>
            {achsList.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                No extracurricular achievements registered yet. Click "+ Register Achievement".
              </div>
            )}
            {achsList.map(a => {
              const sc = STATUS_COLORS[a.status] || STATUS_COLORS.PENDING;
              return (
                <div key={a._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', borderLeft: '4px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          {a.activityType.replace(/_/g, ' ')}
                        </span>
                        {a.academicYear && <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                        {a.position && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                        <span style={{ ...sc, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {a.issuingOrg && <span>🏢 {a.issuingOrg} &nbsp;</span>}
                        {a.date && <span>📅 {a.date}</span>}
                      </div>
                      {a.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 8, fontStyle: 'italic' }}>{a.description}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View File" style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700 }} />
                      <button 
                        onClick={async () => {
                          if (!confirm('Delete this achievement?')) return;
                          await api.delete(`/achievements/${a._id}`);
                          setAchievements(prev => prev.filter(x => x._id !== a._id));
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
