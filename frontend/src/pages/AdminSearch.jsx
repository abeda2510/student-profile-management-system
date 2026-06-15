import React, { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

// --- CUSTOM CRISP SVG ICONS ---
const GroupIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BookIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CertificateIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const CalendarIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M12 14l1 2h3l-2 1.5.5 3-2.5-2-2.5 2 .5-3-2-1.5h3z" />
  </svg>
);

const TrophyIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a7.7 7.7 0 0 1 7.54 8H4.46A7.7 7.7 0 0 1 12 2z" />
  </svg>
);

const TargetIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const BarChartIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const FileTextIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// --- PREMIUM SVG PIE CHART (MALE vs FEMALE) WITH HOVER EFFECT ---
function PieChart({ maleCount, femaleCount }) {
  const total = maleCount + femaleCount;
  const malePercent = total > 0 ? (maleCount / total) * 100 : 50;
  const femalePercent = total > 0 ? (femaleCount / total) * 100 : 50;

  const radius = 25;
  const circumference = 2 * Math.PI * radius; // ~157.08
  const strokeWidth = 50;

  const maleStroke = (malePercent / 100) * circumference;
  const femaleStroke = (femalePercent / 100) * circumference;

  const femaleAngle = (femalePercent / 100) * 2 * Math.PI;
  const maleAngle = (malePercent / 100) * 2 * Math.PI;

  const fMid = -Math.PI / 2 + femaleAngle / 2;
  const mMid = -Math.PI / 2 + femaleAngle + maleAngle / 2;

  // label radius is 12.5 (middle of the 25px radius slice)
  const labelRadius = 12.5;
  const fx = 50 + labelRadius * Math.cos(fMid);
  const fy = 50 + labelRadius * Math.sin(fMid);
  const mx = 50 + labelRadius * Math.cos(mMid);
  const my = 50 + labelRadius * Math.sin(mMid);

  // Hover states
  const [hoveredSlice, setHoveredSlice] = useState(null); // 'Male' | 'Female'
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div style={{ position: 'relative', width: 150, height: 150, margin: '20px auto 16px' }}>
      <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
        {/* Female Slice - Pink */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#f43f5e"
          strokeWidth={strokeWidth}
          strokeDasharray={`${femaleStroke} ${circumference}`}
          strokeDashoffset={0}
          style={{
            cursor: 'pointer',
            transition: 'stroke-width 0.2s',
            strokeWidth: hoveredSlice === 'Female' ? strokeWidth + 4 : strokeWidth
          }}
          onMouseEnter={(e) => {
            setHoveredSlice('Female');
            setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
          }}
          onMouseMove={(e) => {
            setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
          }}
          onMouseLeave={() => setHoveredSlice(null)}
        />
        {/* Male Slice - Blue */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={`${maleStroke} ${circumference}`}
          strokeDashoffset={-femaleStroke}
          style={{
            cursor: 'pointer',
            transition: 'stroke-width 0.2s',
            strokeWidth: hoveredSlice === 'Male' ? strokeWidth + 4 : strokeWidth
          }}
          onMouseEnter={(e) => {
            setHoveredSlice('Male');
            setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
          }}
          onMouseMove={(e) => {
            setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
          }}
          onMouseLeave={() => setHoveredSlice(null)}
        />
      </svg>

      {/* Female Percentage Label overlay */}
      {femalePercent > 8 && (
        <div style={{
          position: 'absolute',
          left: `${fx * 1.5}px`,
          top: `${fy * 1.5}px`,
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          {femalePercent.toFixed(1)}%
        </div>
      )}

      {/* Male Percentage Label overlay */}
      {malePercent > 8 && (
        <div style={{
          position: 'absolute',
          left: `${mx * 1.5}px`,
          top: `${my * 1.5}px`,
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          {malePercent.toFixed(1)}%
        </div>
      )}

      {/* Floating Tooltip */}
      {hoveredSlice && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '11.5px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          transition: 'all 0.08s ease'
        }}>
          {hoveredSlice}: <span style={{ fontWeight: 800 }}>
            {hoveredSlice === 'Male' ? maleCount.toLocaleString() : femaleCount.toLocaleString()}
          </span> ({hoveredSlice === 'Male' ? malePercent.toFixed(1) : femalePercent.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

// --- PREMIUM SVG DONUT CHART (CERTIFICATIONS, PUBLICATIONS, DEPT EVENTS) WITH HOVER EFFECT ---
function DonutChart({ data, centerIcon }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isZero = total === 0;

  const slices = isZero
    ? data.map(item => ({ ...item, percentage: 1 / data.length, displayPercent: '0%', val: 0 }))
    : data.map(item => ({
        ...item,
        percentage: item.value / total,
        displayPercent: `${((item.value / total) * 100).toFixed(1)}%`,
        val: item.value
      })).filter(s => s.percentage > 0);

  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74
  const strokeWidth = 24;

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

  // Hover states
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div style={{ position: 'relative', width: 170, height: 170, margin: '20px auto 16px' }}>
      <svg width="170" height="170" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
        {sliceData.map((d, idx) => (
          <circle
            key={idx}
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={d.slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${d.strokeLength} ${circumference}`}
            strokeDashoffset={d.strokeOffset}
            style={{
              transition: 'stroke-dashoffset 0.4s ease, stroke-width 0.2s',
              cursor: 'pointer',
              strokeWidth: hoveredSlice?.label === d.slice.label ? strokeWidth + 3 : strokeWidth
            }}
            onMouseEnter={(e) => {
              setHoveredSlice(d.slice);
              setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
            }}
            onMouseMove={(e) => {
              setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 28 });
            }}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        ))}
      </svg>

      {/* Central Icon Circle */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b'
      }}>
        {centerIcon}
      </div>

      {/* Overlay Text Percentages */}
      {sliceData.map((d, idx) => {
        const textRadiusPx = 45 * (170 / 120); // 63.75px (exactly in the middle of the stroke)
        const x = 85 + textRadiusPx * Math.cos(d.midAngle);
        const y = 85 + textRadiusPx * Math.sin(d.midAngle);

        if (d.slice.percentage < 0.05 && !isZero) return null; // hide text on extremely narrow slices

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              textShadow: '0px 1px 2px rgba(0,0,0,0.7)',
              pointerEvents: 'none'
            }}
          >
            {d.slice.displayPercent}
          </div>
        );
      })}

      {/* Floating Tooltip */}
      {hoveredSlice && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '11.5px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          transition: 'all 0.08s ease'
        }}>
          {hoveredSlice.label}: <span style={{ fontWeight: 800 }}>{hoveredSlice.value}</span> ({hoveredSlice.displayPercent})
        </div>
      )}
    </div>
  );
}

// --- MAIN ADMIN SEARCH COMPONENT ---
export default function AdminSearch() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');

  // Modal states for details lists
  const [modalType, setModalType] = useState(null); // 'certifications' | 'publications' | 'events'
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalDept, setModalDept] = useState('');
  const [modalYear, setModalYear] = useState('');
  const [modalAcademicYear, setModalAcademicYear] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, achievementsRes, eventsRes] = await Promise.all([
        api.get('/students/dashboard-stats'),
        api.get('/achievements/faculty-report?status=APPROVED'),
        api.get('/dept-events')
      ]);
      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics. Please verify you are logged in as admin.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = async () => {
    await fetchAllData();
  };

  const handleCardClick = async (type) => {
    setModalType(type);
    setModalLoading(true);
    setModalSearch('');
    // pre-populate modalDept filter with current dashboard selection
    setModalDept(selectedDept);
    setModalYear('');
    setModalAcademicYear('');
    try {
      if (type === 'events') {
        const { data } = await api.get('/dept-events');
        setModalData(data);
      } else if (type === 'attendance' || type === 'crt') {
        const { data } = await api.get('/students');
        setModalData(data);
      } else {
        const { data } = await api.get('/achievements/faculty-report?status=APPROVED');
        setModalData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setModalLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontWeight: 600, fontSize: 15 }}>Analyzing university database...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #fee2e2', textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: '#991b1b', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Access Refused</h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>{error}</p>
        <button onClick={fetchAllData} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // --- FILTER BY DEPARTMENT DYNAMICALLY ---
  const currentDeptObj = selectedDept ? stats.departments.find(d => d.branch.toUpperCase() === selectedDept.toUpperCase()) : null;

  // Core counters
  const totalCount = currentDeptObj ? currentDeptObj.total : stats.totalStudents;
  const maleCount = currentDeptObj ? currentDeptObj.male : stats.male;
  const femaleCount = currentDeptObj ? currentDeptObj.female : stats.female;
  const sectionsCount = currentDeptObj
    ? currentDeptObj.sectionsCount
    : stats.departments.reduce((sum, d) => sum + d.sectionsCount, 0);

  // Department filter options
  const departmentsList = stats.departments.map(d => d.branch);

  // Filtered achievements list
  const filteredAchievements = achievements.filter(item => {
    if (!selectedDept) return true;
    return String(item.branch || '').toUpperCase() === selectedDept.toUpperCase();
  });

  // Filtered events list
  const filteredEvents = events.filter(item => {
    if (!selectedDept) return true;
    return String(item.department || '').toUpperCase() === selectedDept.toUpperCase();
  });

  // --- CERTIFICATIONS vs ACHIEVEMENTS vs PUBLICATIONS DONE BREAKDOWN ---
  const isPublication = (item) => ['RESEARCH_PUBLICATION', 'PATENT', 'JOURNAL_PAPER', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER'].includes(item.activityType);
  const isCert = (item) => ['AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING', 'NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE'].includes(item.activityType) || item.mainCategory === 'CERTIFICATIONS' || item.mainCategory === 'NPTEL';

  const certs = filteredAchievements.filter(isCert);
  const pubs = filteredAchievements.filter(isPublication);
  const achs = filteredAchievements.filter(item => !isPublication(item) && !isCert(item));
  
  let nptel = 0, coursera = 0, aws = 0, cisco = 0;
  certs.forEach(c => {
    const title = (c.title || '').toLowerCase();
    const org = (c.issuingOrg || '').toLowerCase();
    const type = (c.activityType || '').toLowerCase();
    if (title.includes('nptel') || org.includes('nptel') || type.includes('nptel')) {
      nptel++;
    } else if (title.includes('aws') || org.includes('aws') || title.includes('amazon') || org.includes('amazon') || type.includes('aws')) {
      aws++;
    } else if (title.includes('cisco') || org.includes('cisco') || type.includes('cisco')) {
      cisco++;
    } else {
      coursera++;
    }
  });

  const totalCerts = nptel + coursera + aws + cisco;
  const certsData = [
    { label: 'NPTEL', value: nptel, color: '#3b82f6' },
    { label: 'Coursera', value: coursera, color: '#a855f7' },
    { label: 'AWS', value: aws, color: '#f59e0b' },
    { label: 'Cisco', value: cisco, color: '#06b6d4' }
  ];

  let techCount = 0, nonTechCount = 0, otherCount = 0;
  achs.forEach(a => {
    const type = (a.activityType || '').toUpperCase();
    const cat = (a.mainCategory || '').toUpperCase();
    if (cat === 'TECHNICAL' || ['HACKATHON', 'IDEATHON', 'TECHNICAL_COMPETITION', 'INTERNSHIP', 'WORKSHOP', 'SEMINAR', 'PROJECT'].includes(type)) {
      techCount++;
    } else if (cat === 'NON_TECHNICAL' || ['SPORTS', 'CULTURAL', 'DANCE', 'MUSIC', 'ART', 'VOLUNTEERING', 'NSS', 'NCC'].includes(type)) {
      nonTechCount++;
    } else {
      otherCount++;
    }
  });
  const totalAchs = techCount + nonTechCount + otherCount;
  const achsData = [
    { label: 'Technical', value: techCount, color: '#3b82f6' },
    { label: 'Non-Technical', value: nonTechCount, color: '#f59e0b' },
    { label: 'Other', value: otherCount, color: '#64748b' }
  ];

  // --- PUBLICATIONS DONE BREAKDOWN ---
  let journals = 0, conferences = 0, bookChapters = 0, patents = 0;
  pubs.forEach(p => {
    const type = p.activityType;
    if (type === 'JOURNAL_PAPER' || type === 'RESEARCH_PUBLICATION') journals++;
    else if (type === 'CONFERENCE_PAPER') conferences++;
    else if (type === 'BOOK_CHAPTER' || type === 'BOOK') bookChapters++;
    else if (type === 'PATENT') patents++;
    else journals++;
  });

  const totalPubs = journals + conferences + bookChapters + patents;
  const pubsData = [
    { label: 'Journals', value: journals, color: '#3b82f6' },
    { label: 'Conferences', value: conferences, color: '#22c55e' },
    { label: 'Book Chapters', value: bookChapters, color: '#f59e0b' },
    { label: 'Patents', value: patents, color: '#a855f7' }
  ];

  // --- CRT & ATTENDANCE DONE BREAKDOWN ---
  const crtStatsSource = selectedDept
    ? (stats.crtStats?.byBranch?.[selectedDept.toUpperCase()] || { excellent: 0, good: 0, poor: 0 })
    : (stats.crtStats?.overall || { excellent: 0, good: 0, poor: 0 });
  const totalCrtStudents = crtStatsSource.excellent + crtStatsSource.good + crtStatsSource.poor;
  const crtChartData = [
    { label: 'Excellent (>=75%)', value: crtStatsSource.excellent, color: '#10b981' },
    { label: 'Good (50-75%)', value: crtStatsSource.good, color: '#3b82f6' },
    { label: 'Poor (<50%)', value: crtStatsSource.poor, color: '#ef4444' }
  ];

  const attStatsSource = selectedDept
    ? (stats.attendanceStats?.byBranch?.[selectedDept.toUpperCase()] || { eligible: 0, condonation: 0, detained: 0 })
    : (stats.attendanceStats?.overall || { eligible: 0, condonation: 0, detained: 0 });
  const totalAttStudents = attStatsSource.eligible + attStatsSource.condonation + attStatsSource.detained;
  const attChartData = [
    { label: 'Eligible (>=75%)', value: attStatsSource.eligible, color: '#10b981' },
    { label: 'Condonation (60-75%)', value: attStatsSource.condonation, color: '#f59e0b' },
    { label: 'Detained (<60%)', value: attStatsSource.detained, color: '#ef4444' }
  ];

  // --- DEPT EVENTS BREAKDOWN ---
  let workshops = 0, fdps = 0, guestLectures = 0, hackathons = 0;
  filteredEvents.forEach(ev => {
    const type = (ev.eventType || '').toLowerCase();
    const name = (ev.eventName || '').toLowerCase();
    if (type.includes('workshop') || name.includes('workshop')) workshops++;
    else if (type.includes('fdp') || name.includes('fdp') || type.includes('faculty development') || name.includes('faculty development')) fdps++;
    else if (type.includes('guest') || name.includes('guest') || type.includes('lecture') || name.includes('lecture') || type.includes('talk') || name.includes('talk')) guestLectures++;
    else if (type.includes('hackathon') || name.includes('hackathon') || type.includes('ideathon') || name.includes('ideathon')) hackathons++;
    else workshops++;
  });

  const totalEvents = workshops + fdps + guestLectures + hackathons;
  const eventsData = [
    { label: 'Workshops', value: workshops, color: '#3b82f6' },
    { label: 'FDPs', value: fdps, color: '#ec4899' },
    { label: 'Guest Lectures', value: guestLectures, color: '#f59e0b' },
    { label: 'Hackathons', value: hackathons, color: '#06b6d4' }
  ];

  // Helper percentages for legends
  const formatPercent = (val, tot) => {
    if (tot === 0) return '0%';
    return `${((val / tot) * 100).toFixed(1)}%`;
  };

  // Unique Academic Years from modalData to populate filters dynamically
  const uniqueAcademicYears = [...new Set(modalData.map(item => item.academicYear).filter(Boolean))].sort().reverse();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <style>{`
        .dash-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px 20px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
          border: 1px solid #f1f5f9;
          transition: all 0.25s ease;
          position: relative;
        }
        .dash-card:hover {
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .custom-select {
          padding: 9px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
          background-color: #fff;
          cursor: pointer;
          outline: none;
          min-width: 220px;
          transition: all 0.2s ease;
        }
        .custom-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid #f8fafc;
        }
        .legend-row:last-child {
          border-bottom: none;
        }
        .table-row {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
        }
        .table-row:hover {
          background-color: #f8fafc;
        }
      `}</style>

      {/* --- DASHBOARD HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>University Analytics Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0', fontWeight: 500 }}>Live academic and demographic registration monitoring system</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filter Department:</span>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="custom-select"
          >
            <option value="">All Departments (University)</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button onClick={handleRefresh} title="Refresh Live Data" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            🔄
          </button>
        </div>
      </div>

      {/* --- DEMOGRAPHICS TOP ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Card 1.1: Total Strength */}
        <div className="dash-card" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#fff',
          padding: '24px 28px',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.9 }}>Total Strength</span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8, letterSpacing: '-0.5px' }}>{totalCount.toLocaleString()}</div>
            <div style={{ fontSize: 12, marginTop: 12, opacity: 0.85, fontWeight: 500 }}>
              {selectedDept ? `Active in ${selectedDept}` : 'University overall enrollment'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.18)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GroupIcon size={28} color="#fff" />
          </div>
        </div>

        {/* Card 1.2: Total Sections */}
        <div className="dash-card" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          color: '#fff',
          padding: '24px 28px',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.9 }}>Total Sections</span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8, letterSpacing: '-0.5px' }}>{sectionsCount}</div>
            <div style={{ fontSize: 12, marginTop: 12, opacity: 0.85, fontWeight: 500 }}>
              {selectedDept ? `Active sections in ${selectedDept}` : 'Active sections across all depts'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.18)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookIcon size={28} color="#fff" />
          </div>
        </div>

        {/* Card 1.3: Male vs Female split */}
        <div className="dash-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Demographics</span>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '4px 0 10px 0' }}>Male vs Female</h4>
            <div style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>M: {maleCount.toLocaleString()} ({formatPercent(maleCount, maleCount + femaleCount)})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>F: {femaleCount.toLocaleString()} ({formatPercent(femaleCount, maleCount + femaleCount)})</span>
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart maleCount={maleCount} femaleCount={femaleCount} />
          </div>
        </div>
      </div>

      {/* --- 6 ANALYTICS CHARTS GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
        
        {/* --- Card 1: Achievements Done --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#10b981', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('achievements')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Achievements Registered</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalAchs}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Approved in ${selectedDept}` : 'University overall achievements'}
              </span>
            </div>
            <DonutChart data={achsData} centerIcon={<TrophyIcon size={20} color="#10b981" />} />
            <div style={{ marginTop: 12 }}>
              {achsData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalAchs)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '10px 16px', borderTop: '1px solid #bbf7d0', color: '#10b981', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrophyIcon size={12} color="#10b981" />
            <span>Achievements list overview</span>
          </div>
        </div>

        {/* --- Card 2: Certifications Done --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#a855f7', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('certifications')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Certifications Done</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalCerts}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Approved in ${selectedDept}` : 'University overall certifications'}
              </span>
            </div>
            <DonutChart data={certsData} centerIcon={<CertificateIcon size={20} color="#a855f7" />} />
            <div style={{ marginTop: 12 }}>
              {certsData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalCerts)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fcfaff', padding: '10px 16px', borderTop: '1px solid #f3e8ff', color: '#a855f7', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CertificateIcon size={12} color="#a855f7" />
            <span>Certifications list overview</span>
          </div>
        </div>

        {/* --- Card 3: CRT Performance --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#ea580c', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('crt')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>CRT Performance</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalCrtStudents}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Students evaluated in ${selectedDept}` : 'University overall evaluations'}
              </span>
            </div>
            <DonutChart data={crtChartData} centerIcon={<TargetIcon size={20} color="#ea580c" />} />
            <div style={{ marginTop: 12 }}>
              {crtChartData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalCrtStudents)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff7ed', padding: '10px 16px', borderTop: '1px solid #ffedd5', color: '#ea580c', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TargetIcon size={12} color="#ea580c" />
            <span>CRT performance analysis</span>
          </div>
        </div>

        {/* --- Card 4: Attendance Overview --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#0d9488', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('attendance')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Attendance Status</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalAttStudents}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Students evaluated in ${selectedDept}` : 'University overall attendance'}
              </span>
            </div>
            <DonutChart data={attChartData} centerIcon={<CalendarIcon size={20} color="#0d9488" />} />
            <div style={{ marginTop: 12 }}>
              {attChartData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalAttStudents)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#f0fdfa', padding: '10px 16px', borderTop: '1px solid #ccfbf1', color: '#0d9488', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon size={12} color="#0d9488" />
            <span>Attendance eligibility ratios</span>
          </div>
        </div>

        {/* --- Card 5: Publications Done --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#3b82f6', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('publications')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Publications Done</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalPubs}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Approved in ${selectedDept}` : 'University overall publications'}
              </span>
            </div>
            <DonutChart data={pubsData} centerIcon={<FileTextIcon size={20} color="#3b82f6" />} />
            <div style={{ marginTop: 12 }}>
              {pubsData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalPubs)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px 16px', borderTop: '1px solid #bfdbfe', color: '#3b82f6', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileTextIcon size={12} color="#3b82f6" />
            <span>Publications list overview</span>
          </div>
        </div>

        {/* --- Card 6: Dept Events --- */}
        <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ height: 6, background: '#f43f5e', borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: '20px 24px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => handleCardClick('events')}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Dept Events</span>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>{totalEvents}</div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {selectedDept ? `Registered in ${selectedDept}` : 'University overall events'}
              </span>
            </div>
            <DonutChart data={eventsData} centerIcon={<CalendarIcon size={20} color="#f43f5e" />} />
            <div style={{ marginTop: 12 }}>
              {eventsData.map((slice, idx) => (
                <div key={idx} className="legend-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{slice.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{slice.value} ({formatPercent(slice.value, totalEvents)})</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff5f5', padding: '10px 16px', borderTop: '1px solid #ffe4e6', color: '#f43f5e', fontSize: '11px', fontWeight: 700, borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GroupIcon size={12} color="#f43f5e" />
            <span>Events registered by departments</span>
          </div>
        </div>
      </div>

      {/* --- PREMIUM INTERACTIVE MODALS FOR DETAILED VIEW WITH EXTRA FILTERS --- */}
      {modalType && (() => {
        let title = '';
        let filteredRecords = [];

        const isPublication = (item) => ['RESEARCH_PUBLICATION', 'PATENT', 'JOURNAL_PAPER', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER'].includes(item.activityType);
        const isCert = (item) => ['AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING', 'NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE'].includes(item.activityType) || item.mainCategory === 'CERTIFICATIONS' || item.mainCategory === 'NPTEL';

        if (modalType === 'events') {
          title = `Registered Department Events`;
          filteredRecords = modalData.filter(item => {
            if (modalDept && String(item.department || '').toUpperCase() !== modalDept.toUpperCase()) return false;
            if (modalAcademicYear && String(item.year) !== String(modalAcademicYear)) return false;
            if (!modalSearch) return true;
            const query = modalSearch.toLowerCase();
            return (
              (item.eventName && item.eventName.toLowerCase().includes(query)) ||
              (item.coordinatorName && item.coordinatorName.toLowerCase().includes(query)) ||
              (item.eventType && item.eventType.toLowerCase().includes(query)) ||
              (item.venue && item.venue.toLowerCase().includes(query))
            );
          });
        } else if (modalType === 'attendance' || modalType === 'crt') {
          title = modalType === 'attendance' ? 'Attendance Overview' : 'CRT Performance Overview';
          filteredRecords = modalData.filter(item => {
            if (modalDept && String(item.branch || '').toUpperCase() !== modalDept.toUpperCase()) return false;
            if (modalYear && String(item.currentYear) !== String(modalYear)) return false;
            if (modalAcademicYear && String(item.academicYear) !== String(modalAcademicYear)) return false;
            if (!modalSearch) return true;
            const query = modalSearch.toLowerCase();
            return (
              (item.regNumber && item.regNumber.toLowerCase().includes(query)) ||
              (item.name && item.name.toLowerCase().includes(query))
            );
          });
        } else {
          title = modalType === 'publications' ? 'Approved Publications' : modalType === 'certifications' ? 'Approved Certifications' : 'Approved Achievements';
          
          filteredRecords = modalData.filter(item => {
            // Filter by type
            if (modalType === 'publications' && !isPublication(item)) return false;
            if (modalType === 'certifications' && !isCert(item)) return false;
            if (modalType === 'achievements' && (isPublication(item) || isCert(item))) return false;

            // Filter by department
            if (modalDept && String(item.branch || '').toUpperCase() !== modalDept.toUpperCase()) return false;
            // Filter by student year (1st, 2nd, 3rd, 4th Year)
            if (modalYear && String(item.currentYear) !== String(modalYear)) return false;
            // Filter by academic year
            if (modalAcademicYear && String(item.academicYear) !== String(modalAcademicYear)) return false;
            
            // Filter by search string
            if (!modalSearch) return true;
            const query = modalSearch.toLowerCase();
            return (
              (item.regNumber && item.regNumber.toLowerCase().includes(query)) ||
              (item.studentName && item.studentName.toLowerCase().includes(query)) ||
              (item.title && item.title.toLowerCase().includes(query)) ||
              (item.issuingOrg && item.issuingOrg.toLowerCase().includes(query)) ||
              (item.activityType && item.activityType.toLowerCase().includes(query))
            );
          });
        }

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, width: '90%', maxWidth: 1000,
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#f8fafc'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {title}
                    {modalDept ? ` — ${modalDept}` : ' (All Departments)'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    Showing {filteredRecords.length} records
                  </p>
                </div>
                <button
                  onClick={() => { setModalType(null); setModalSearch(''); }}
                  style={{
                    background: '#f1f5f9', border: 'none', color: '#64748b',
                    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 'bold', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Filter Controls Bar */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                background: '#fafbfc',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search field */}
                <div style={{ flex: '2', minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Search Keyword</label>
                  <input
                    type="text"
                    placeholder={modalType === 'events' ? "Search event name, coordinator..." : "Search name, registration no..."}
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #cbd5e1',
                      borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                </div>

                {/* Department filter */}
                <div style={{ flex: '1', minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Department</label>
                  <select
                    value={modalDept}
                    onChange={e => setModalDept(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #cbd5e1',
                      borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer'
                    }}
                  >
                    <option value="">All Departments</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Year filter (Only for student achievements / profiles) */}
                {modalType !== 'events' && (
                  <div style={{ flex: '1', minWidth: 120 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Student Year</label>
                    <select
                      value={modalYear}
                      onChange={e => setModalYear(e.target.value)}
                      style={{
                        padding: '8px 12px', border: '1.5px solid #cbd5e1',
                        borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer'
                      }}
                    >
                      <option value="">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {/* Academic Year filter */}
                <div style={{ flex: '1', minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Academic Year</label>
                  <select
                    value={modalAcademicYear}
                    onChange={e => setModalAcademicYear(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #cbd5e1',
                      borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer'
                    }}
                  >
                    <option value="">All Academic Years</option>
                    {modalType === 'events'
                      ? [...new Set(modalData.map(item => item.year).filter(Boolean))].sort().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))
                      : uniqueAcademicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))
                    }
                  </select>
                </div>
              </div>

              {/* Modal Table Content */}
              <div style={{ padding: 24, overflowY: 'auto', flex: 1, minHeight: '30vh' }}>
                {modalLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
                    <div className="spinner" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Loading records...</span>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>No Records Found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Try changing your filter criteria or search keyword</div>
                  </div>
                ) : modalType === 'events' ? (
                  // Event list table
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Event Name</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Coordinator</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Dept</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Type</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Academic Year</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Date</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Venue</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Budget</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Documents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((item, idx) => (
                        <tr key={item._id} className="table-row">
                          <td style={{ padding: '12px 8px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.eventName}</td>
                          <td style={{ padding: '12px 8px', color: '#334155' }}>{item.coordinatorName} ({item.employeeId})</td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>
                            <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {item.department}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 500 }}>
                            {item.eventType}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>{item.year}</td>
                          <td style={{ padding: '12px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.date || '—'}</td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>{item.venue || '—'}</td>
                          <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 600 }}>
                            {item.budget ? `₹${item.budget.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {item.poster?.url && <ViewButton url={viewUrl(item.poster.url)} label="Poster" style={{ fontSize: 11, padding: '3px 8px' }} />}
                            {item.onePageReport?.url && <ViewButton url={viewUrl(item.onePageReport.url)} label="Report" style={{ fontSize: 11, padding: '3px 8px' }} />}
                            {item.winnersList?.url && <ViewButton url={viewUrl(item.winnersList.url)} label="Winners" style={{ fontSize: 11, padding: '3px 8px' }} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : modalType === 'attendance' ? (
                  // Attendance list table
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Reg No</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Dept/Sec</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Overall Attendance</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Subject Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((item, idx) => {
                        const avgPct = item.attendance && item.attendance.length > 0 
                          ? (item.attendance.reduce((s, a) => s + (a.present / (a.total || 1)) * 100, 0) / item.attendance.length).toFixed(1) + '%'
                          : '—';
                        return (
                          <tr key={item._id} className="table-row">
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.regNumber}</td>
                            <td style={{ padding: '12px 8px', color: '#334155', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '12px 8px', color: '#475569' }}>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {item.branch} - {item.section}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0d9488' }}>{avgPct}</td>
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>
                              {item.attendance && item.attendance.map((a, i) => (
                                <span key={i} style={{ fontSize: 11, background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: 4, marginRight: 4, display: 'inline-block', marginBottom: 2 }}>
                                  {a.subject}: {Math.round((a.present / (a.total || 1)) * 100)}%
                                </span>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : modalType === 'crt' ? (
                  // CRT list table
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Reg No</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Dept/Sec</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Overall Score</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Module Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((item, idx) => {
                        const avgPct = item.crtPerformance && item.crtPerformance.length > 0 
                          ? (item.crtPerformance.reduce((s, p) => s + (p.score / (p.maxScore || 100)) * 100, 0) / item.crtPerformance.length).toFixed(1) + '%'
                          : '—';
                        return (
                          <tr key={item._id} className="table-row">
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.regNumber}</td>
                            <td style={{ padding: '12px 8px', color: '#334155', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '12px 8px', color: '#475569' }}>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {item.branch} - {item.section}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 700, color: '#ea580c' }}>{avgPct}</td>
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>
                              {item.crtPerformance && item.crtPerformance.map((p, i) => (
                                <span key={i} style={{ fontSize: 11, background: '#fff7ed', color: '#ea580c', padding: '2px 6px', borderRadius: 4, marginRight: 4, display: 'inline-block', marginBottom: 2 }}>
                                  {p.module}: {p.score}/{p.maxScore}
                                </span>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  // Achievements, Certifications, Publications table
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Reg No</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Dept/Sec</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Type</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Title</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Issuing Org / Publisher</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Date</th>
                        <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((item, idx) => (
                        <tr key={item._id} className="table-row">
                          <td style={{ padding: '12px 8px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.regNumber}</td>
                          <td style={{ padding: '12px 8px', color: '#334155', fontWeight: 500 }}>{item.studentName}</td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {item.branch} - {item.section}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 500 }}>
                            {item.activityType}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 500 }} title={item.title}>
                            {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>{item.issuingOrg || '—'}</td>
                          <td style={{ padding: '12px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.date || '—'}</td>
                          <td style={{ padding: '12px 8px' }}>
                            {(item.certificateUrl || item.certificatePath) ? (
                              <ViewButton
                                url={viewUrl(item.certificateUrl || item.certificatePath)}
                                label="View"
                                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}
                              />
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', background: '#f8fafc'
              }}>
                <button
                  onClick={() => { setModalType(null); setModalSearch(''); }}
                  style={{
                    background: '#64748b', color: '#fff', border: 'none',
                    padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.background = '#64748b'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
  </div>
);
}
