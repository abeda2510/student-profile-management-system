import React, { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

// Reusable SVG Donut Chart Component
function DonutChart({ male, female, size = 180, strokeWidth = 16 }) {
  const total = male + female;
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.82

  const malePct = total > 0 ? (male / total) * 100 : 0;
  const femalePct = total > 0 ? (female / total) * 100 : 0;

  const items = [];
  if (male > 0) items.push({ label: 'Male', value: male, color: '#3b82f6', pct: malePct });
  if (female > 0) items.push({ label: 'Female', value: female, color: '#ec4899', pct: femalePct });

  let accumulatedPercent = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        {/* Background track circle */}
        <circle cx={100} cy={100} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        
        {total === 0 ? (
          <circle cx={100} cy={100} r={radius} fill="none" stroke="#cbd5e1" strokeWidth={strokeWidth} />
        ) : (
          items.map((item, index) => {
            const strokeLength = (item.pct / 100) * circumference;
            // Draw segment from accumulated offset
            const strokeOffset = circumference - strokeLength - (accumulatedPercent / 100) * circumference;
            accumulatedPercent += item.pct;

            return (
              <circle
                key={index}
                cx={100}
                cy={100}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap={items.length > 1 ? "round" : "butt"}
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            );
          })
        )}
      </svg>
      {/* Central absolute overlay text */}
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
          {total.toLocaleString()}
        </span>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
          Students
        </span>
      </div>
    </div>
  );
}

// Reusable SVG Bar Chart Component (Horizontal layout for better department/section fit)
function HorizontalBarChart({ data, width = 500, height = 300 }) {
  const paddingLeft = 90;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 20;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const maxVal = Math.max(...data.map(d => d.value), 5);
  const roundedMax = Math.ceil(maxVal / 10) * 10 || 10;
  
  const barHeight = Math.min(30, (chartHeight / data.length) * 0.6);
  const spacing = (chartHeight - barHeight * data.length) / (data.length + 1 || 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      {/* Grid Lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const val = Math.round(roundedMax * ratio);
        const x = paddingLeft + (chartWidth * ratio);
        return (
          <g key={i}>
            <text x={x} y={height - paddingBottom + 14} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}>
              {val}
            </text>
            {ratio > 0 && (
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={height - paddingBottom}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
          </g>
        );
      })}

      {/* Bars */}
      {data.map((item, idx) => {
        const y = paddingTop + spacing + idx * (barHeight + spacing);
        const barWidth = (item.value / roundedMax) * chartWidth;
        const displayWidth = Math.max(barWidth, 2); // Ensure visible minimum width

        // SVG custom path for rounded right corners
        const drawHorizontalBar = (bx, by, bw, bh, r) => {
          if (bw <= 0) return '';
          if (r > bw) r = bw;
          if (r > bh / 2) r = bh / 2;
          return `
            M ${bx},${by}
            L ${bx + bw - r},${by}
            Q ${bx + bw},${by} ${bx + bw},${by + r}
            L ${bx + bw},${by + bh - r}
            Q ${bx + bw},${by + bh} ${bx + bw - r},${by + bh}
            L ${bx},${by + bh}
            Z
          `;
        };

        return (
          <g key={idx} style={{ cursor: 'pointer' }} className="bar-group">
            {/* Label */}
            <text
              x={paddingLeft - 12}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
            >
              {item.label}
            </text>
            
            {/* Bar Path */}
            <path
              d={drawHorizontalBar(paddingLeft, y, displayWidth, barHeight, 6)}
              fill={item.color || '#4f46e5'}
              style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />

            {/* Value Label */}
            <text
              x={paddingLeft + displayWidth + 8}
              y={y + barHeight / 2 + 4}
              textAnchor="start"
              style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
            >
              {item.value.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Axis Base Line */}
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={height - paddingBottom}
        stroke="#cbd5e1"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export default function AdminSearch() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [achLoading, setAchLoading] = useState(false);

  // Fetch aggregated statistics
  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/students/dashboard-stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics. Please verify you are logged in as admin.');
    }
    setLoading(false);
  };

  // Fetch achievements/certifications
  const fetchAchievements = async (dept) => {
    setAchLoading(true);
    try {
      const params = new URLSearchParams();
      if (dept) params.append('branch', dept);
      params.append('status', 'APPROVED');
      const { data } = await api.get(`/achievements/faculty-report?${params}`);
      setAchievements(data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    }
    setAchLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAchievements(selectedDept);
  }, [selectedDept]);

  const handleRefresh = async () => {
    await fetchStats();
    await fetchAchievements(selectedDept);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 1s linear infinite' }} />
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
        <button onClick={fetchStats} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Active statistics extraction based on selected dropdown filter
  const currentDeptObj = selectedDept ? stats.departments.find(d => d.branch === selectedDept) : null;

  const totalCount = currentDeptObj ? currentDeptObj.total : stats.totalStudents;
  const maleCount = currentDeptObj ? currentDeptObj.male : stats.male;
  const femaleCount = currentDeptObj ? currentDeptObj.female : stats.female;
  const totalCerts = selectedDept
    ? (stats.certificationsByBranch?.[selectedDept] || 0)
    : (stats.totalCertifications || 0);

  const malePercent = totalCount > 0 ? ((maleCount / totalCount) * 100).toFixed(1) : '0.0';
  const femalePercent = totalCount > 0 ? ((femaleCount / totalCount) * 100).toFixed(1) : '0.0';

  // Total sections
  const sectionsCount = currentDeptObj 
    ? currentDeptObj.sectionsCount 
    : stats.departments.reduce((sum, d) => sum + d.sectionsCount, 0);

  // Department choices list
  const departmentsList = stats.departments.map(d => d.branch);

  // Bar Chart data preparation
  // If no department is selected -> Show departments total
  // If a department is selected -> Show sections breakdown within it
  const barChartData = currentDeptObj
    ? currentDeptObj.sections.map(s => ({
        label: `Sec ${s.section}`,
        value: s.total,
        color: '#10b981'
      }))
    : stats.departments.map((d, index) => {
        const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        return {
          label: d.branch,
          value: d.total,
          color: colors[index % colors.length]
        };
      });

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Styles & Animations */}
      <style>{`
        .kpi-card {
          border-radius: 16px;
          padding: 24px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        }
        .dashboard-container {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .grid-block {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s ease;
        }
        .grid-block:hover {
          border-color: #cbd5e1;
        }
        .custom-select {
          padding: 10px 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          background-color: #fff;
          cursor: pointer;
          outline: none;
          min-width: 220px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .custom-select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        .table-row {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
        }
        .table-row:hover {
          background-color: #f8fafc;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>University Analytics Dashboard</h2>
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
            <button onClick={handleRefresh} title="Refresh Live Data" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
              🔄
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* Card 1: Total Students */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Total Students</span>
              <span style={{ fontSize: 20 }}>👥</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{totalCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Active in ${selectedDept}` : 'University overall enrollment'}
            </div>
          </div>

          {/* Card 2: Male Count */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Male Students</span>
              <span style={{ fontSize: 20 }}>👨</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{maleCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              Representing <strong style={{ textDecoration: 'underline' }}>{malePercent}%</strong> of demographic
            </div>
          </div>

          {/* Card 3: Female Count */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Female Students</span>
              <span style={{ fontSize: 20 }}>👩</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{femaleCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              Representing <strong style={{ textDecoration: 'underline' }}>{femalePercent}%</strong> of demographic
            </div>
          </div>

          {/* Card 4: Total Sections */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Academic Sections</span>
              <span style={{ fontSize: 20 }}>🗂️</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{sectionsCount}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Active sections in ${selectedDept}` : 'Active sections across all depts'}
            </div>
          </div>

          {/* Card 5: Certifications */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Certifications Done</span>
              <span style={{ fontSize: 20 }}>📜</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{totalCerts.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Approved in ${selectedDept}` : 'University overall certifications'}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Card Left: Gender Split */}
          <div className="grid-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>Gender Distribution</h3>
              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0 0', fontWeight: 500 }}>
                {selectedDept ? `${selectedDept} split details` : 'University gender breakdown'}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, flexWrap: 'wrap', width: '100%', padding: '10px 0' }}>
              <DonutChart male={maleCount} female={femaleCount} />
              
              {/* Legends list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Male Students</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {maleCount.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>({malePercent}%)</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#ec4899' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Female Students</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {femaleCount.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>({femalePercent}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Right: Department or Section Distribution */}
          <div className="grid-block">
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>
                {selectedDept ? `Section Enrollment - ${selectedDept}` : 'Student Distribution by Department'}
              </h3>
              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0 0', fontWeight: 500 }}>
                {selectedDept ? 'Student counts across sections' : 'Student counts by department branch'}
              </p>
            </div>
            
            <div style={{ padding: '0 8px' }}>
              <HorizontalBarChart data={barChartData} height={Math.max(240, barChartData.length * 36 + 40)} />
            </div>
          </div>
        </div>

        {/* Approved Certifications Card */}
        <div className="grid-block" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>
                {selectedDept ? `Approved Certifications - ${selectedDept}` : 'Approved Certifications - University Overall'}
              </h3>
              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0 0', fontWeight: 500 }}>
                List of student certificates and approved professional achievements
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: 99, border: '1.5px solid #bbf7d0' }}>
              {achievements.length} Certifications
            </div>
          </div>

          {achLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
              <span className="spinner" style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 1s linear infinite', marginRight: 12, verticalAlign: 'middle' }} />
              Loading certifications data...
            </div>
          ) : achievements.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No approved certifications found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>#</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Reg No</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Department</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Certification Title</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Academic Year</th>
                    <th style={{ padding: '14px 24px', fontWeight: 700 }}>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((ach, idx) => (
                    <tr key={ach._id} className="table-row">
                      <td style={{ padding: '14px 24px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '14px 24px', fontWeight: 700, color: '#4f46e5' }}>{ach.regNumber}</td>
                      <td style={{ padding: '14px 24px', fontWeight: 600, color: '#334155' }}>{ach.studentName || '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#475569' }}>{ach.branch || '—'}</td>
                      <td style={{ padding: '14px 24px', fontWeight: 600, color: '#0f172a' }}>{ach.title}</td>
                      <td style={{ padding: '14px 24px', color: '#64748b' }}>{ach.activityType ? ach.activityType.replace(/_/g, ' ') : '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#64748b' }}>{ach.academicYear || '—'}</td>
                      <td style={{ padding: '14px 24px' }}>
                        {ach.certificateUrl || ach.certificatePath ? (
                          <ViewButton url={viewUrl(ach.certificateUrl || ach.certificatePath)} label="View" />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
