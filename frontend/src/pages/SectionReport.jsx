import { useState, useEffect } from 'react';
import api from '../api';

const DOC_GROUPS = [
  { key: 'coding', label: 'Coding Profiles', color: '#1e40af', bg: '#eff6ff',
    items: [
      { value: 'LEETCODE', label: 'LeetCode Username' },
      { value: 'LEETCODE_SOLVED', label: 'LeetCode Total Solved' },
      { value: 'LEETCODE_EASY', label: 'LeetCode Easy' },
      { value: 'LEETCODE_MEDIUM', label: 'LeetCode Medium' },
      { value: 'LEETCODE_HARD', label: 'LeetCode Hard' },
      { value: 'CODECHEF', label: 'CodeChef Username' },
      { value: 'CODECHEF_RATING', label: 'CodeChef Rating' },
      { value: 'CODECHEF_STARS', label: 'CodeChef Stars' },
      { value: 'CODECHEF_RANK', label: 'CodeChef Global Rank' },
      { value: 'LINKEDIN', label: 'LinkedIn Profile' },
    ]
  },
  { key: 'ids', label: 'IDs', color: '#7c3aed', bg: '#f5f3ff',
    items: [{ value: 'ABC_ID', label: 'ABC ID' }, { value: 'APAAR_ID', label: 'APAAR ID' }]
  },
  { key: 'contact', label: 'Contact', color: '#0891b2', bg: '#ecfeff',
    items: [
      { value: 'EMAIL', label: 'Email' }, { value: 'PHONE', label: 'Phone' },
      { value: 'PARENT_NAME', label: 'Parent Name' }, { value: 'PARENT_PHONE', label: 'Parent Phone' },
      { value: 'ADDRESS', label: 'Address' },
    ]
  },
  { key: 'academic', label: 'Academic', color: '#d97706', bg: '#fffbeb',
    items: [
      { value: 'CGPA', label: 'CGPA' }, { value: 'ADMISSION_CATEGORY', label: 'Admission Category' },
      { value: 'CURRENT_YEAR', label: 'Current Year' }, { value: 'CURRENT_SEMESTER', label: 'Current Semester' },
    ]
  },
  { key: 'personal', label: 'Personal', color: '#dc2626', bg: '#fef2f2',
    items: [
      { value: 'DOB', label: 'Date of Birth' }, { value: 'GENDER', label: 'Gender' },
      { value: 'BLOOD_GROUP', label: 'Blood Group' },
    ]
  },
  { key: 'achievements', label: 'Achievements', color: '#059669', bg: '#f0fdf4',
    items: [
      { value: 'INTERNSHIP', label: 'Internship Certificates' },
      { value: 'HACKATHON', label: 'Hackathon Certificates' },
      { value: 'MARK_MEMO', label: 'Mark Memos' },
    ]
  },
];

const DEPT_SECTIONS = {
  CSE: Array.from({length:19},(_,i)=>String(i+1)),
  ECE: Array.from({length:8},(_,i)=>String(i+1)),
  EEE: Array.from({length:4},(_,i)=>String(i+1)),
  MECH: Array.from({length:5},(_,i)=>String(i+1)),
  CIVIL: Array.from({length:3},(_,i)=>String(i+1)),
  IT: Array.from({length:6},(_,i)=>String(i+1)),
  AIML: Array.from({length:6},(_,i)=>String(i+1)),
  CSBS: Array.from({length:3},(_,i)=>String(i+1)),
};
const DEPTS = Object.keys(DEPT_SECTIONS);

const chip = (sel, color, bg) => ({
  padding: '4px 12px', borderRadius: 99, border: `1px solid ${sel ? color : '#e2e8f0'}`,
  background: sel ? bg : '#fff', color: sel ? color : '#374151',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-block', transition: 'all 0.12s',
});

export default function SectionReport() {
  const [selItems, setSelItems] = useState([]);
  const [selDepts, setSelDepts] = useState({});
  const [academicYear, setAcademicYear] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [myStudents, setMyStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students').then(r => setTotalStudents(r.data.length)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
  }, []);

  const toggleItem = (val) => setSelItems(s => s.includes(val) ? s.filter(x => x !== val) : [...s, val]);
  const toggleGroupAll = (group) => {
    const vals = group.items.map(i => i.value);
    const allSel = vals.every(v => selItems.includes(v));
    setSelItems(s => allSel ? s.filter(x => !vals.includes(x)) : [...new Set([...s, ...vals])]);
  };
  const toggleAllItems = () => {
    const all = DOC_GROUPS.flatMap(g => g.items.map(i => i.value));
    setSelItems(prev => all.every(v => prev.includes(v)) ? [] : all);
  };

  const toggleDept = (dept) => {
    setSelDepts(d => { const n = {...d}; if (n[dept]) delete n[dept]; else n[dept] = [...DEPT_SECTIONS[dept]]; return n; });
  };
  const toggleSection = (dept, sec) => {
    setSelDepts(d => { const cur = d[dept]||[]; return {...d, [dept]: cur.includes(sec) ? cur.filter(x=>x!==sec) : [...cur,sec]}; });
  };
  const toggleAllDepts = () => {
    if (Object.keys(selDepts).length === DEPTS.length) { setSelDepts({}); }
    else { const all = {}; DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; }); setSelDepts(all); }
  };

  const fetchReport = async () => {
    if (Object.keys(selDepts).length === 0) return setError('Select at least one department');
    if (selItems.length === 0) return setError('Select at least one document type');
    setError(''); setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('docType', d));
      if (academicYear) params.append('admissionYear', academicYear);
      if (yearOfStudy) params.append('currentYear', yearOfStudy);
      const { data } = await api.get(`/faculty/section-report?${params}`);
      setResults(data);
    } catch (e) { setError('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('docType', d));
      const res = await fetch(`${baseUrl}/faculty/section-report/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'section_report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Download failed'); }
    setXlLoading(false);
  };

  const downloadZip = async () => {
    setZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('activityTypes', d));
      const res = await fetch(`${baseUrl}/achievements/faculty-report/zip?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Server error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'certificates.zip'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError('ZIP failed: ' + e.message); }
    setZipLoading(false);
  };

  const uniqueStudents = results ? [...new Map(results.map(r => [r.regNumber, r])).values()] : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Left: Document Types */}
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Document Types</div>
              <button onClick={toggleAllItems} style={{ fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
            </div>
            {DOC_GROUPS.map(group => (
              <div key={group.key} style={{ marginBottom: 14, padding: '12px 16px', background: group.bg, borderRadius: 10, border: `1px solid ${group.color}22` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: group.color }}>{group.label}</span>
                  <button onClick={() => toggleGroupAll(group)} style={{ fontSize: 11, color: group.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {group.items.map(item => (
                    <span key={item.value} onClick={() => toggleItem(item.value)} style={chip(selItems.includes(item.value), group.color, group.bg)}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Results Table */}
          {results && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                {uniqueStudents.length} students fetched &nbsp;·&nbsp; {results.length} records
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#059669' }}>
                      {['#','Reg No','Name','Dept','Section','Document','Data','Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={`${r.regNumber}-${r.docType}-${i}`} style={{ background: i%2===0?'#fff':'#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '9px 14px', color: '#94a3b8' }}>{i+1}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#1e40af' }}>{r.regNumber}</td>
                        <td style={{ padding: '9px 14px' }}>{r.name}</td>
                        <td style={{ padding: '9px 14px' }}>{r.branch}</td>
                        <td style={{ padding: '9px 14px' }}>{r.section}</td>
                        <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 12 }}>{r.docType}</td>
                        <td style={{ padding: '9px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.data && r.data !== '-' ? r.data : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ background: r.data && r.data !== '-' ? '#d1fae5' : '#fee2e2', color: r.data && r.data !== '-' ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                            {r.data && r.data !== '-' ? 'Available' : 'Missing'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ position: 'sticky', top: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>{totalStudents}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Students</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{myStudents.length}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>My Counsellees</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Academic Year</div>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 12, outline: 'none', fontFamily: 'inherit' }}>
              <option value="">All Years</option>
              {['2021','2022','2023','2024','2025'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Year of Study</div>
            <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              <option value="">All</option>
              {['1','2','3','4'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Departments */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 14, maxHeight: 380, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Departments & Sections</div>
              <button onClick={toggleAllDepts} style={{ fontSize: 11, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
            </div>
            {DEPTS.map(dept => {
              const sel = !!selDepts[dept];
              return (
                <div key={dept} style={{ marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleDept(dept)} style={{ accentColor: '#059669' }} />
                    {dept}
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({DEPT_SECTIONS[dept].length} sections)</span>
                    {sel && <button type="button" onClick={e => { e.stopPropagation(); setSelDepts(d => { const n={...d}; delete n[dept]; return n; }); }} style={{ marginLeft: 'auto', fontSize: 10, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Deselect All</button>}
                  </label>
                  {sel && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, marginLeft: 22 }}>
                      {DEPT_SECTIONS[dept].map(sec => {
                        const secSel = (selDepts[dept]||[]).includes(sec);
                        return (
                          <span key={sec} onClick={() => toggleSection(dept, sec)}
                            style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${secSel?'#059669':'#e2e8f0'}`, background: secSel?'#d1fae5':'#fff', color: secSel?'#065f46':'#64748b' }}>
                            {sec}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>{error}</div>}

          <button onClick={fetchReport} disabled={loading}
            style={{ width: '100%', background: loading?'#94a3b8':'#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            {loading ? 'Fetching...' : 'Fetch Report'}
          </button>
          {results && (
            <button onClick={downloadExcel} disabled={xlLoading}
              style={{ width: '100%', background: xlLoading?'#94a3b8':'#1e40af', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              {xlLoading ? 'Generating...' : 'Download Excel'}
            </button>
          )}
          {results && (
            <button onClick={downloadZip} disabled={zipLoading}
              style={{ width: '100%', background: zipLoading?'#94a3b8':'#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {zipLoading ? 'Generating...' : 'Download ZIP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
