import React, { useEffect, useState } from 'react';
import api from '../api';

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

const DOC_GROUPS = [
  { key: 'coding', label: 'Coding Profiles', color: '#1e40af', bg: '#eff6ff',
    items: ['LeetCode Username','LeetCode Total Solved','LeetCode Easy','LeetCode Medium','LeetCode Hard','CodeChef Username','CodeChef Rating','CodeChef Stars','CodeChef Global Rank','LinkedIn Profile'] },
  { key: 'ids', label: 'IDs', color: '#7c3aed', bg: '#f5f3ff',
    items: ['ABC ID','APAAR ID'] },
  { key: 'contact', label: 'Contact', color: '#0891b2', bg: '#ecfeff',
    items: ['Email','Phone','Parent Name','Parent Phone','Address'] },
  { key: 'academic', label: 'Academic', color: '#d97706', bg: '#fffbeb',
    items: ['CGPA','Admission Category','Current Year','Current Semester'] },
  { key: 'personal', label: 'Personal', color: '#dc2626', bg: '#fef2f2',
    items: ['Date of Birth','Gender','Blood Group'] },
  { key: 'achievements', label: 'Achievements', color: '#059669', bg: '#f0fdf4',
    items: ['Internship Certificates','Hackathon Certificates','Mark Memos'] },
];

const s = {
  tabBtn: (active) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: active ? '#059669' : 'transparent', color: active ? '#fff' : '#64748b',
    borderBottom: active ? 'none' : '2px solid transparent', transition: 'all 0.15s',
  }),
  chip: (sel, color, bg) => ({
    padding: '4px 12px', borderRadius: 99, border: `1px solid ${sel ? color : '#e2e8f0'}`,
    background: sel ? bg : '#fff', color: sel ? color : '#374151',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
  }),
};

export default function FacultyDashboard() {
  const [profile, setProfile] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [mainTab, setMainTab] = useState('dashboard');
  const [selItems, setSelItems] = useState([]);
  const [selDepts, setSelDepts] = useState({});
  const [academicYear, setAcademicYear] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMyCounsellees, setShowMyCounsellees] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocs, setStudentDocs] = useState([]);
  const [studentAchs, setStudentAchs] = useState([]);
  const [studentTab, setStudentTab] = useState('profile');
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
    api.get('/students').then(r => setTotalStudents(r.data.length)).catch(() => {});
  }, []);

  const toggleItem = (item) => setSelItems(s => s.includes(item) ? s.filter(x => x !== item) : [...s, item]);
  const toggleGroupAll = (group) => {
    const all = group.items.every(i => selItems.includes(i));
    setSelItems(s => all ? s.filter(x => !group.items.includes(x)) : [...new Set([...s, ...group.items])]);
  };
  const toggleAllItems = () => {
    const all = DOC_GROUPS.flatMap(g => g.items);
    const allSel = all.every(i => selItems.includes(i));
    setSelItems(allSel ? [] : all);
  };

  const toggleDept = (dept) => {
    setSelDepts(d => {
      const n = { ...d };
      if (n[dept]) delete n[dept];
      else n[dept] = [...DEPT_SECTIONS[dept]];
      return n;
    });
  };
  const toggleSection = (dept, sec) => {
    setSelDepts(d => {
      const cur = d[dept] || [];
      const next = cur.includes(sec) ? cur.filter(x => x !== sec) : [...cur, sec];
      return { ...d, [dept]: next };
    });
  };
  const toggleAllDepts = () => {
    if (Object.keys(selDepts).length === DEPTS.length) { setSelDepts({}); }
    else { const all = {}; DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; }); setSelDepts(all); }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('docType', d));
      if (academicYear) params.append('admissionYear', academicYear);
      if (yearOfStudy) params.append('currentYear', yearOfStudy);
      const { data } = await api.get(`/faculty/section-report?${params}`);
      setResults(data);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const downloadExcel = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
    selItems.forEach(d => params.append('docType', d));
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${baseUrl}/faculty/section-report/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'report.xlsx'; a.click();
  };

  const viewStudent = async (st) => {
    setSelectedStudent(st); setStudentTab('profile');
    const [d, a] = await Promise.all([api.get(`/faculty/student/${st.regNumber}/documents`), api.get(`/faculty/student/${st.regNumber}/achievements`)]);
    setStudentDocs(d.data); setStudentAchs(a.data);
  };

  const uniqueStudents = results ? [...new Map(results.map(r => [r.regNumber, r])).values()] : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Faculty Profile Card */}
      {profile && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {profile.name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{profile.name}</div>
            <span style={{ background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>{profile.department} Faculty</span>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{profile.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }} onClick={() => setShowMyCounsellees(!showMyCounsellees)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{myStudents.length}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>My Counsellees</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>{totalStudents}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Students</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {[['dashboard','Dashboard'],['reports','Reports'],['achievements','Achievements']].map(([key,label]) => (
          <button key={key} style={s.tabBtn(mainTab===key)} onClick={() => setMainTab(key)}>{label}</button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {mainTab === 'dashboard' && (
        <div>
          {showMyCounsellees && !selectedStudent && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#059669' }}>My Counsellees ({myStudents.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {myStudents.map(st => (
                  <div key={st._id} onClick={() => viewStudent(st)}
                    style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', cursor: 'pointer', borderLeft: '4px solid #059669' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{st.regNumber}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{st.branch} | Sec {st.section} | Yr {st.currentYear}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedStudent && (
            <div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: '#f1f5f9', border: 'none', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>← Back</button>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {['profile','docs','achievements'].map(t => (
                  <button key={t} onClick={() => setStudentTab(t)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: studentTab===t ? '#059669' : '#e2e8f0', color: studentTab===t ? '#fff' : '#374151' }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)} {t==='docs'?`(${studentDocs.length})`:t==='achievements'?`(${studentAchs.length})`:''}
                  </button>
                ))}
              </div>
              {studentTab === 'profile' && (
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{selectedStudent.name}</div>
                  <div style={{ color: '#64748b', marginBottom: 14 }}>{selectedStudent.regNumber} | {selectedStudent.branch} | Sec {selectedStudent.section}</div>
                  {[['Email',selectedStudent.email],['Phone',selectedStudent.phone],['Branch',selectedStudent.branch],['CGPA',selectedStudent.cgpa],['Admission Year',selectedStudent.admissionYear]].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                      <span style={{ color: '#64748b', minWidth: 140 }}>{l}:</span><span style={{ fontWeight: 600 }}>{v||'—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {studentTab === 'docs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {studentDocs.length === 0 && <div style={{ color: '#94a3b8' }}>No documents.</div>}
                  {studentDocs.map(d => (
                    <div key={d._id} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label||d.filename}</div>
                      {(d.fileUrl||d.filepath) && <a href={d.fileUrl||d.filepath} target="_blank" rel="noreferrer" style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>View</a>}
                    </div>
                  ))}
                </div>
              )}
              {studentTab === 'achievements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {studentAchs.length === 0 && <div style={{ color: '#94a3b8' }}>No achievements.</div>}
                  {studentAchs.map(a => (
                    <div key={a._id} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{a.activityType} | {a.academicYear}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!showMyCounsellees && !selectedStudent && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 600 }}>Click "My Counsellees" to view your assigned students</div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {mainTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          {/* Left: Document Types */}
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Document Types</div>
                <button onClick={toggleAllItems} style={{ fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
              </div>
              {DOC_GROUPS.map(group => (
                <div key={group.key} style={{ marginBottom: 16, padding: '12px 16px', background: group.bg, borderRadius: 10, border: `1px solid ${group.color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: group.color }}>{group.label}</span>
                    <button onClick={() => toggleGroupAll(group)} style={{ fontSize: 11, color: group.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.items.map(item => (
                      <span key={item} onClick={() => toggleItem(item)} style={s.chip(selItems.includes(item), group.color, group.bg + 'cc')}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Results */}
            {results && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#0f172a' }}>
                  {uniqueStudents.length} students fetched
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#059669' }}>
                        {['#','Reg No','Name','Dept'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueStudents.map((r, i) => (
                        <tr key={r.regNumber} style={{ background: i%2===0?'#fff':'#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{i+1}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e40af' }}>{r.regNumber}</td>
                          <td style={{ padding: '10px 14px' }}>{r.name}</td>
                          <td style={{ padding: '10px 14px' }}>{r.branch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Filters */}
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Academic Year</div>
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 12, outline: 'none' }}>
                <option value="">All Years</option>
                {['2021','2022','2023','2024','2025'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Year of Study</div>
              <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                <option value="">All</option>
                {['1','2','3','4'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Departments & Sections</div>
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
                      {sel && <button onClick={() => setSelDepts(d => { const n={...d}; delete n[dept]; return n; })} style={{ marginLeft: 'auto', fontSize: 10, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Deselect All</button>}
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

            <button onClick={fetchReport} disabled={loading || Object.keys(selDepts).length === 0}
              style={{ width: '100%', background: loading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              {loading ? 'Fetching...' : '↓ Fetch Report'}
            </button>
            {results && (
              <button onClick={downloadExcel}
                style={{ width: '100%', background: '#1e40af', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                📊 Download Excel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {mainTab === 'achievements' && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Achievement reports coming soon</div>
        </div>
      )}
    </div>
  );
}
