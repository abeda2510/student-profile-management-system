import { useState, useEffect } from 'react';
import api from '../api';

const DEPTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'CSBS'];
const DEPT_SECTIONS = {
  CSE:  Array.from({length:19},(_,i)=>String(i+1)),
  ECE:  Array.from({length:8}, (_,i)=>String(i+1)),
  EEE:  Array.from({length:4}, (_,i)=>String(i+1)),
  MECH: Array.from({length:5}, (_,i)=>String(i+1)),
  CIVIL:Array.from({length:3}, (_,i)=>String(i+1)),
  IT:   Array.from({length:6}, (_,i)=>String(i+1)),
  AIML: Array.from({length:6}, (_,i)=>String(i+1)),
  CSBS: Array.from({length:3}, (_,i)=>String(i+1)),
};
const DEPT_COLORS = { 
  CSE: "#059669", ECE: "#7c3aed", EEE: "#d97706", MECH: "#dc2626", 
  CIVIL: "#0891b2", IT: "#db2777", AIML: "#2563eb", CSBS: "#65a30d" 
};

const thStyle = { 
  padding: "10px 14px", 
  textAlign: "center", 
  color: "#fff", 
  fontWeight: 700, 
  background: "#059669", 
  fontSize: 11, 
  textTransform: "uppercase",
  whiteSpace: "nowrap"
};

const tdStyle = { 
  padding: "10px 14px", 
  fontSize: 13, 
  borderBottom: "1px solid #f1f5f9", 
  color: "#334155",
  textAlign: "center"
};

const pillStyle = (color) => ({ 
  display: "inline-block", 
  background: color + "15", 
  color: color, 
  borderRadius: 6, 
  padding: "2px 8px", 
  fontWeight: 700, 
  fontSize: 11 
});

export default function CRTReport() {
  const [selDepts, setSelDepts] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDept = (dept) => {
    if (selDepts.includes(dept)) {
      setSelDepts(d => d.filter(x => x !== dept));
    } else {
      setSelDepts(d => [...d, dept]);
    }
  };

  const toggleAllDepts = () => {
    if (selDepts.length === DEPTS.length) {
      setSelDepts([]);
    } else {
      setSelDepts([...DEPTS]);
    }
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    selDepts.forEach(d => params.append('branch', d));
    if (academicYear && academicYear !== 'all') params.append('admissionYear', academicYear);
    if (yearOfStudy && yearOfStudy !== 'all') params.append('currentYear', yearOfStudy);
    return params;
  };

  const fetchReport = async () => {
    if (selDepts.length === 0) return setError('Select at least one department');
    setLoading(true); setError(''); setResults(null);
    try {
      const { data } = await api.get(`/faculty/crt-report?${buildParams()}`);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch CRT report data');
    }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setExcelLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/spm';
      const res = await fetch(`${baseUrl}/faculty/crt-report/excel?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crt_report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate Excel report');
    }
    setExcelLoading(false);
  };

  const getAttendancePill = (val) => {
    if (val === '—') return <span style={{ color: '#94a3b8' }}>—</span>;
    const num = parseFloat(val);
    if (isNaN(num)) return <span style={{ fontWeight: 600 }}>{val}</span>;
    const color = num >= 75 ? '#059669' : num >= 65 ? '#d97706' : '#ef4444';
    return <span style={pillStyle(color)}>{num}%</span>;
  };

  const getPerformancePill = (val) => {
    if (val === '—') return <span style={{ color: '#94a3b8' }}>—</span>;
    const num = parseFloat(val);
    if (isNaN(num)) return <span style={{ fontWeight: 600 }}>{val}</span>;
    const color = num >= 80 ? '#059669' : num >= 50 ? '#d97706' : '#ef4444';
    return <span style={{ fontWeight: 700, color }}>{num}</span>;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>CRT & Attendance Reports</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Monitor student CRT progress and attendance status</p>
      </div>

      {/* Control Card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #e2e8f0', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>1. Select Departments</div>
          <button type="button" onClick={toggleAllDepts}
            style={{ fontSize: 12, color: '#059669', fontWeight: 700, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
            {selDepts.length === DEPTS.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Dept Checkboxes wrapping grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {DEPTS.map(dept => {
            const selected = selDepts.includes(dept);
            const color = DEPT_COLORS[dept];
            return (
              <span key={dept} onClick={() => toggleDept(dept)}
                style={{ padding: '8px 16px', borderRadius: 10, border: `2.5px solid ${selected ? color : '#e2e8f0'}`, background: selected ? color + '0a' : '#fff', color: selected ? color : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={selected} readOnly style={{ accentColor: color, width: 14, height: 14, cursor: 'pointer' }} />
                <span>{dept}</span>
              </span>
            );
          })}
        </div>

        {/* Filters and Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Academic Year</div>
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#334155', background: '#fff', outline: 'none', cursor: 'pointer' }}>
                <option value="">All Academic Years</option>
                {Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}-{String(y+1).slice(2)}</option>;
                })}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Year of Study</div>
              <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#334155', background: '#fff', outline: 'none', cursor: 'pointer' }}>
                <option value="">All Years of Study</option>
                {['1', '2', '3', '4'].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchReport} disabled={loading || selDepts.length === 0}
              style={{ background: loading || selDepts.length === 0 ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 9, cursor: loading || selDepts.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 2px 6px rgba(5,150,105,0.15)' }}>
              {loading ? 'Fetching...' : 'Fetch Report'}
            </button>
            {results && results.length > 0 && (
              <button onClick={downloadExcel} disabled={excelLoading}
                style={{ background: excelLoading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 9, cursor: excelLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 2px 6px rgba(30,64,175,0.15)' }}>
                {excelLoading ? 'Generating...' : '📊 Download Excel'}
              </button>
            )}
            {(selDepts.length > 0 || academicYear || yearOfStudy) && (
              <button onClick={() => { setSelDepts([]); setAcademicYear(''); setYearOfStudy(''); setResults(null); setError(''); }}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

      {/* Results View */}
      {results && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', animation: 'fadeInUp 0.3s ease-out' }}>
          <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #e2e8f0', color: '#0f172a', background: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
            <span>{results.length} students fetched</span>
            <span style={{ color: '#64748b' }}>CRT Performance & Attendance</span>
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>No students found matching the filters.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#059669' }}>
                    <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 20 }}>#</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Reg No</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
                    <th style={{ ...thStyle }}>Dept</th>
                    <th style={{ ...thStyle }}>Sec</th>
                    <th style={{ ...thStyle }}>CRT Att (%)</th>
                    <th style={{ ...thStyle }}>Aptitude</th>
                    <th style={{ ...thStyle }}>Coding</th>
                    <th style={{ ...thStyle }}>Comm.</th>
                    <th style={{ ...thStyle }}>Mock Int.</th>
                    <th style={{ ...thStyle, paddingRight: 20 }}>Overall %</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.regNumber} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8fafc'}>
                      <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 20, color: '#94a3b8' }}>{i + 1}</td>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, color: '#1e40af' }}>{r.regNumber}</td>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{r.name}</td>
                      <td style={tdStyle}>{r.branch}</td>
                      <td style={tdStyle}>{r.section}</td>
                      <td style={tdStyle}>{getAttendancePill(r.crtAttendance)}</td>
                      <td style={tdStyle}>{getPerformancePill(r.aptitude)}</td>
                      <td style={tdStyle}>{getPerformancePill(r.coding)}</td>
                      <td style={tdStyle}>{getPerformancePill(r.communication)}</td>
                      <td style={tdStyle}>{getPerformancePill(r.mockInterview)}</td>
                      <td style={{ ...tdStyle, paddingRight: 20 }}>{getAttendancePill(r.overallPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
