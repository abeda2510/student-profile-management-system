import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_GROUPS = [
  { key: 'coding', label: 'Coding Profiles', color: '#1e40af', bg: '#eff6ff',
    items: ['LeetCode Username','LeetCode Total Solved','LeetCode Easy','LeetCode Medium','LeetCode Hard','CodeChef Username','CodeChef Rating','CodeChef Stars','CodeChef Global Rank','LinkedIn Profile'] },
  { key: 'ids', label: 'IDs', color: '#7c3aed', bg: '#f5f3ff', items: ['ABC ID','APAAR ID'] },
  { key: 'contact', label: 'Contact', color: '#0891b2', bg: '#ecfeff', items: ['Email','Phone','Parent Name','Parent Phone','Address'] },
  { key: 'academic', label: 'Academic', color: '#d97706', bg: '#fffbeb', items: ['CGPA','Admission Category','Current Year','Current Semester'] },
  { key: 'personal', label: 'Personal', color: '#dc2626', bg: '#fef2f2', items: ['Date of Birth','Gender','Blood Group'] },
  { key: 'achievements', label: 'Achievements', color: '#059669', bg: '#f0fdf4', items: ['Internship Certificates','Hackathon Certificates','Mark Memos'] },
];

const chip = (sel, color, bg) => ({
  padding: '4px 12px', borderRadius: 99, border: `1px solid ${sel ? color : '#e2e8f0'}`,
  background: sel ? bg : '#fff', color: sel ? color : '#374151',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-block',
});

function StudentCard({ st, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', cursor: 'pointer', borderLeft: '4px solid #059669', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{st.name}</div>
      <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>{st.regNumber}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{st.branch} | Sec {st.section} | Yr {st.currentYear}</div>
    </div>
  );
}

export default function FacultyDashboard() {
  const [profile, setProfile] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [searchReg, setSearchReg] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchDocs, setSearchDocs] = useState([]);
  const [searchAchs, setSearchAchs] = useState([]);
  const [searchTab, setSearchTab] = useState('profile');
  const [searchError, setSearchError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocs, setStudentDocs] = useState([]);
  const [studentAchs, setStudentAchs] = useState([]);
  const [studentTab, setStudentTab] = useState('profile');
  const [selItems, setSelItems] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
  }, []);

  const toggleItem = (item) => setSelItems(s => s.includes(item) ? s.filter(x => x !== item) : [...s, item]);
  const toggleGroupAll = (group) => {
    const all = group.items.every(i => selItems.includes(i));
    setSelItems(s => all ? s.filter(x => !group.items.includes(x)) : [...new Set([...s, ...group.items])]);
  };
  const toggleAllItems = () => {
    const all = DOC_GROUPS.flatMap(g => g.items);
    setSelItems(prev => all.every(i => prev.includes(i)) ? [] : all);
  };

  const searchStudent = async (e) => {
    e.preventDefault();
    setSearchError(''); setSearchResult(null);
    try {
      const [p, d, a] = await Promise.all([
        api.get(`/faculty/student/${searchReg}`),
        api.get(`/faculty/student/${searchReg}/documents`),
        api.get(`/faculty/student/${searchReg}/achievements`),
      ]);
      setSearchResult(p.data); setSearchDocs(d.data); setSearchAchs(a.data); setSearchTab('profile');
    } catch { setSearchError('Student not found'); }
  };

  const viewStudent = async (st) => {
    setSelectedStudent(st); setStudentTab('profile');
    const [d, a] = await Promise.all([
      api.get(`/faculty/student/${st.regNumber}/documents`),
      api.get(`/faculty/student/${st.regNumber}/achievements`),
    ]);
    setStudentDocs(d.data); setStudentAchs(a.data);
  };

  const fetchReport = async () => {
    if (myStudents.length === 0) return alert('No counsellee students assigned');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      myStudents.forEach(st => params.append('regNumber', st.regNumber));
      selItems.forEach(d => params.append('docType', d));
      const { data } = await api.get(`/faculty/section-report?${params}`);
      setResults(data);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      myStudents.forEach(st => params.append('regNumber', st.regNumber));
      selItems.forEach(d => params.append('docType', d));
      const res = await fetch(`${baseUrl}/faculty/section-report/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'counsellee_report.xlsx'; a.click();
    } catch { alert('Download failed'); }
    setXlLoading(false);
  };

  const downloadZip = async () => {
    setZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      myStudents.forEach(st => params.append('regNumber', st.regNumber));
      const res = await fetch(`${baseUrl}/achievements/faculty-report/zip?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Server error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'counsellee_certificates.zip'; a.click();
    } catch (e) { alert('ZIP failed: ' + e.message); }
    setZipLoading(false);
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
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>{myStudents.length}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>My Counsellees</div>
          </div>
        </div>
      )}

      {/* Search Student */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0f172a' }}>🔍 Search Student</div>
        <form onSubmit={searchStudent} style={{ display: 'flex', gap: 10 }}>
          <input value={searchReg} onChange={e => setSearchReg(e.target.value)} placeholder="Enter Registration Number"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} required />
          <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Search</button>
        </form>
        {searchError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{searchError}</div>}
        {searchResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['profile','docs','achievements'].map(t => (
                <button key={t} onClick={() => setSearchTab(t)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: searchTab===t?'#059669':'#e2e8f0', color: searchTab===t?'#fff':'#374151' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)} {t==='docs'?`(${searchDocs.length})`:t==='achievements'?`(${searchAchs.length})`:''}
                </button>
              ))}
            </div>
            {searchTab === 'profile' && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{searchResult.name}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>{searchResult.regNumber} | {searchResult.branch} | Sec {searchResult.section}</div>
                {[['Email',searchResult.email],['Phone',searchResult.phone],['CGPA',searchResult.cgpa],['Admission Year',searchResult.admissionYear],['Counsellor',searchResult.counsellor]].map(([l,v]) => v ? (
                  <div key={l} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#64748b', minWidth: 130 }}>{l}:</span><span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ) : null)}
              </div>
            )}
            {searchTab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No documents.</div>}
                {searchDocs.map(d => (
                  <div key={d._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label||d.filename}</div>
                    {(d.fileUrl||d.filepath) && <a href={d.fileUrl||d.filepath} target="_blank" rel="noreferrer" style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>View</a>}
                  </div>
                ))}
              </div>
            )}
            {searchTab === 'achievements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchAchs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No achievements.</div>}
                {searchAchs.map(a => (
                  <div key={a._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{a.activityType?.replace(/_/g,' ')} | {a.academicYear} | <span style={{ background: a.status==='APPROVED'?'#d1fae5':'#fef3c7', color: a.status==='APPROVED'?'#065f46':'#92400e', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{a.status}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Counsellees + Report */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>👥 My Counsellees ({myStudents.length})</div>

        {myStudents.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No counsellee students assigned yet.</div>
        ) : (
          <>
            {/* Student grid */}
            {!selectedStudent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
                {myStudents.map(st => <StudentCard key={st._id} st={st} onClick={() => viewStudent(st)} />)}
              </div>
            )}

            {/* Selected student detail */}
            {selectedStudent && (
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setSelectedStudent(null)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>← Back</button>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['profile','docs','achievements'].map(t => (
                    <button key={t} onClick={() => setStudentTab(t)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: studentTab===t?'#059669':'#e2e8f0', color: studentTab===t?'#fff':'#374151' }}>
                      {t.charAt(0).toUpperCase()+t.slice(1)} {t==='docs'?`(${studentDocs.length})`:t==='achievements'?`(${studentAchs.length})`:''}
                    </button>
                  ))}
                </div>
                {studentTab === 'profile' && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{selectedStudent.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>{selectedStudent.regNumber} | {selectedStudent.branch} | Sec {selectedStudent.section}</div>
                    {[['Email',selectedStudent.email],['Phone',selectedStudent.phone],['CGPA',selectedStudent.cgpa],['Admission Year',selectedStudent.admissionYear],['Parent',selectedStudent.parentName],['Parent Phone',selectedStudent.parentPhone]].map(([l,v]) => v ? (
                      <div key={l} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                        <span style={{ color: '#64748b', minWidth: 130 }}>{l}:</span><span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ) : null)}
                  </div>
                )}
                {studentTab === 'docs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No documents.</div>}
                    {studentDocs.map(d => (
                      <div key={d._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label||d.filename}</div>
                        {(d.fileUrl||d.filepath) && <a href={d.fileUrl||d.filepath} target="_blank" rel="nort: 600 }}>View</a>}
                      </div>
                    ))}
                  </div>
                )}
                {studentTab === 'achievements' && (
                  <div style={ gap: 8 }}>
                    {studentA.</div>}
                    {st(a => (
                      <d4px' }}>
                      Weight: 700, fontSize: 14 }}>{a.title}</div>
                 iv>
                      </div>
     ))}
                  </div>
                )}
              </div>
            )}

            {/* Docume
            <div style={{ borderTop: '1px solid #f1dingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'ce marginBottom: 14 }}>
                <div style=es</div>
                <button onClick={toggleAllItems} style={{ foutton>
              </div>
              {DOC_GROUPS.map(group => (
                <div key={g${group.color}22` }}>
                  <div stylent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span stan>
                    <buttonWeight: 700 }}>Select All</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.items.map(item => (
                      <span key={item} onClick={() => toggleItem(item)} style={chip(selItems.includes(item), group.color, group.bg)}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div s, gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={fetchReport} disabled={loading}
                }>
                  {loading ? 'Fetching...' : '↓ Fetch Report'}
                </button>
                {results && (
                  <>
                    <button onClick={downloadExcel} disabled={xlLoading}
                      style={{ background: xlLoading?'#94a3b8':'#1e40af', color: '#fff', b cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      {xlLoading ? 'Generating...' : '📊 Download Excel'}
                    </button>
                    <button onClick={downloadZip} disabled={zipLoading}
                      sze: 14 }}>
                      {zipLoading ? 'Generating...' : '🗜 Download ZIP'}
                    </button>
                  </>
                )}
              </div>

              {results && (
verflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: '#0f172a', borderBottom: '1px solid #e' }}>
                    {uniqueStudents.length} students · {results.length} records
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    3 }}>
                      <thead>
                        <tr style={{ background: '#059669' }}>
                          {['#','Reg No','Name','Dept','Section','Document','Data','Status'].map(h => (
                            <th key={h} style={{ padding: '10p' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tom: '1px solid #f1f5f9' }}>
                            < }}>{i+1}</td>
                            <td style={{ padding: '9px 14px', fontWeight: 700, color: '#1e40af' }}>{r.regNumber/td>
                            <td style={{ padding: '9px 14px' }}>{r.name}</td>
                            <td style={{ padding: '9px 14px' }}>{r.branch}</td>
                            <td st>
                            <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 12 }}>{r.docType}</td>
                            <td style={{ padding: '9px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.data && r.data !== '—' ? r.data : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                            <td styx' }}>
                              <span
                             '✗'}
                              </span>
                            </td>
                      
                        ))}
                      </tbody>
                    </table>
                  iv>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
