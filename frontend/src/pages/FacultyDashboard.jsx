import React, { useEffect, useState } from 'react';
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

const chipStyle = (sel, color, bg) => ({
  padding: '4px 12px', borderRadius: 99,
  border: `1px solid ${sel ? color : '#e2e8f0'}`,
  background: sel ? bg : '#fff', color: sel ? color : '#374151',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-block',
});

const tabBtn = (active) => ({
  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: 13,
  background: active ? '#059669' : '#e2e8f0',
  color: active ? '#fff' : '#374151',
});

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
    const allSel = group.items.every(i => selItems.includes(i.value));
    setSelItems(s => allSel ? s.filter(x => !group.items.map(i=>i.value).includes(x)) : [...new Set([...s, ...group.items.map(i=>i.value)])]);
  };
  const toggleAllItems = () => {
    const all = DOC_GROUPS.flatMap(g => g.items.map(i => i.value));
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
      myStudents.forEach(st => { params.append('branch', st.branch); params.append('section', st.section); });
      selItems.forEach(d => params.append('docType', d));
      const { data } = await api.get(`/faculty/section-report?${params}`);
      const myRegs = new Set(myStudents.map(s => s.regNumber));
      setResults(data.filter(r => myRegs.has(r.regNumber)));
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      myStudents.forEach(st => { params.append('branch', st.branch); params.append('section', st.section); });
      selItems.forEach(d => params.append('docType', d));
      const res = await fetch(`${baseUrl}/faculty/section-report/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'counsellee_report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    setXlLoading(false);
  };

  const downloadZip = async () => {
    setZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      myStudents.forEach(st => { params.append('branch', st.branch); params.append('section', st.section); });
      const certTypes = selItems.filter(i => ['INTERNSHIP','HACKATHON','MARK_MEMO'].includes(i));
      if (certTypes.length === 0) { alert('ZIP only works for Internship, Hackathon, or Mark Memo. Select those items first.'); setZipLoading(false); return; }
      certTypes.forEach(d => params.append('activityTypes', d));
      const res = await fetch(`${baseUrl}/achievements/faculty-report/zip?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'counsellee_certificates.zip'; a.click();
      URL.revokeObjectURL(url);
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

      {/* Search Student + My Counsellees side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }}>

      {/* Search Student */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Search Student</div>
        <form onSubmit={searchStudent} style={{ display: 'flex', gap: 10 }}>
          <input value={searchReg} onChange={e => setSearchReg(e.target.value)} placeholder="Enter Registration Number"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} required />
          <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Search</button>
        </form>
        {searchError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{searchError}</div>}
        {searchResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['profile','docs','achievements'].map(t => (
                <button key={t} onClick={() => setSearchTab(t)} style={tabBtn(searchTab === t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}{t === 'docs' ? ` (${searchDocs.length})` : t === 'achievements' ? ` (${searchAchs.length})` : ''}
                </button>
              ))}
            </div>
            {searchTab === 'profile' && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{searchResult.name}</div>
                  <button onClick={async () => {
                    const token = localStorage.getItem('token');
                    const baseUrl = import.meta.env.VITE_API_URL || '/api';
                    const res = await fetch(`${baseUrl}/students/profile-pdf/${searchResult.regNumber}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) { alert('PDF failed'); return; }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${searchResult.regNumber}_profile.pdf`; a.click();
                    URL.revokeObjectURL(url);
                  }} style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    📄 Download PDF
                  </button>
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>{searchResult.regNumber} | {searchResult.branch} | Sec {searchResult.section}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                  {[
                    ['Email', searchResult.email], ['Phone', searchResult.phone],
                    ['Date of Birth', searchResult.dob], ['Gender', searchResult.gender],
                    ['Blood Group', searchResult.bloodGroup], ['Nationality', searchResult.nationality],
                    ['Address', searchResult.address], ['Parent Name', searchResult.parentName],
                    ['Parent Phone', searchResult.parentPhone], ['Admission Year', searchResult.admissionYear],
                    ['Admission Category', searchResult.admissionCategory], ['Current Year', searchResult.currentYear],
                    ['Current Semester', searchResult.currentSemester], ['CGPA', searchResult.cgpa],
                    ['APAAR ID', searchResult.apaarId], ['ABC ID', searchResult.abcId],
                    ['Counsellor', searchResult.counsellor], ['LinkedIn', searchResult.linkedIn],
                    ['LeetCode', searchResult.leetCode], ['CodeChef', searchResult.codeChef],
                  ].filter(([, v]) => v).map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span style={{ color: '#64748b', minWidth: 130, fontWeight: 500 }}>{l}:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
                {(searchResult.linkedIn || searchResult.codeChef || searchResult.leetCode) && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                    {searchResult.linkedIn && <a href={searchResult.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>🔗 LinkedIn</a>}
                    {searchResult.codeChef && <a href={`https://www.codechef.com/users/${searchResult.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>👨‍🍳 CodeChef</a>}
                    {searchResult.leetCode && <a href={`https://leetcode.com/${searchResult.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>💻 LeetCode</a>}
                  </div>
                )}
              </div>
            )}
            {searchTab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No documents.</div>}
                {searchDocs.map(d => (
                  <div key={d._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label || d.filename}</div>
                    {(d.fileUrl || d.filepath) && <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer" style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>View</a>}
                  </div>
                ))}
              </div>
            )}
            {searchTab === 'achievements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchAchs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No achievements.</div>}
                {searchAchs.map(a => (
                  <div key={a._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700, marginRight: 6 }}>{a.activityType?.replace(/_/g, ' ')}</span>
                        {a.academicYear && <span style={{ marginRight: 6 }}>{a.academicYear}</span>}
                        {a.position && <span style={{ marginRight: 6 }}>| {a.position}</span>}
                        <span style={{ background: a.status === 'APPROVED' ? '#d1fae5' : '#fef3c7', color: a.status === 'APPROVED' ? '#065f46' : '#92400e', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                      </div>
                    </div>
                    {(a.certificateUrl || a.certificatePath) && (
                      <a href={a.certificateUrl || a.certificatePath} target="_blank" rel="noreferrer"
                        style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 10, textDecoration: 'none' }}>
                        📎 View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Counsellees */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>My Counsellees ({myStudents.length})</div>
        {myStudents.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No counsellee students assigned yet.</div>
        ) : (
          <>
            {!selectedStudent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
                {myStudents.map(st => (
                  <div key={st._id}
                    style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #059669' }}>
                    <div onClick={() => viewStudent(st)} style={{ cursor: 'pointer', marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{st.name}</div>
                      <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>{st.regNumber}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{st.branch} | Sec {st.section} | Yr {st.currentYear}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => viewStudent(st)}
                        style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '6px 0', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        View Profile
                      </button>
                      <button onClick={async () => {
                        setLoading(true);
                        try {
                          const params = new URLSearchParams();
                          params.append('branch', st.branch); params.append('section', st.section);
                          selItems.forEach(d => params.append('docType', d));
                          const { data } = await api.get(`/faculty/section-report?${params}`);
                          setResults(data.filter(r => r.regNumber === st.regNumber));
                        } catch { alert('Failed to fetch report'); }
                        setLoading(false);
                      }}
                        style={{ flex: 1, background: '#1e40af', color: '#fff', border: 'none', padding: '6px 0', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        Fetch Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedStudent && (
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setSelectedStudent(null)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Back</button>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['profile', 'docs', 'achievements'].map(t => (
                    <button key={t} onClick={() => setStudentTab(t)} style={tabBtn(studentTab === t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}{t === 'docs' ? ` (${studentDocs.length})` : t === 'achievements' ? ` (${studentAchs.length})` : ''}
                    </button>
                  ))}
                </div>
                {studentTab === 'profile' && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedStudent.name}</div>
                      <button onClick={async () => {
                        const token = localStorage.getItem('token');
                        const baseUrl = import.meta.env.VITE_API_URL || '/api';
                        const res = await fetch(`${baseUrl}/students/profile-pdf/${selectedStudent.regNumber}`, { headers: { Authorization: `Bearer ${token}` } });
                        if (!res.ok) { alert('PDF failed'); return; }
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `${selectedStudent.regNumber}_profile.pdf`; a.click();
                        URL.revokeObjectURL(url);
                      }} style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                        📄 Download PDF
                      </button>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>{selectedStudent.regNumber} | {selectedStudent.branch}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                      {[
                        ['Email', selectedStudent.email], ['Phone', selectedStudent.phone],
                        ['Date of Birth', selectedStudent.dob], ['Gender', selectedStudent.gender],
                        ['Blood Group', selectedStudent.bloodGroup], ['Address', selectedStudent.address],
                        ['Parent Name', selectedStudent.parentName], ['Parent Phone', selectedStudent.parentPhone],
                        ['Admission Year', selectedStudent.admissionYear], ['Admission Category', selectedStudent.admissionCategory],
                        ['Branch', selectedStudent.branch], ['Section', selectedStudent.section],
                        ['Current Year', selectedStudent.currentYear], ['Current Semester', selectedStudent.currentSemester],
                        ['CGPA', selectedStudent.cgpa], ['APAAR ID', selectedStudent.apaarId],
                        ['ABC ID', selectedStudent.abcId], ['LinkedIn', selectedStudent.linkedIn],
                        ['LeetCode', selectedStudent.leetCode], ['CodeChef', selectedStudent.codeChef],
                      ].filter(([, v]) => v).map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                          <span style={{ color: '#64748b', minWidth: 130, fontWeight: 500 }}>{l}:</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    {(selectedStudent.linkedIn || selectedStudent.codeChef || selectedStudent.leetCode) && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        {selectedStudent.linkedIn && <a href={selectedStudent.linkedIn} target="_blank" rel="noreferrer" style={{ background: '#0a66c2', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>🔗 LinkedIn</a>}
                        {selectedStudent.codeChef && <a href={`https://www.codechef.com/users/${selectedStudent.codeChef}`} target="_blank" rel="noreferrer" style={{ background: '#5b4638', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>👨‍🍳 CodeChef</a>}
                        {selectedStudent.leetCode && <a href={`https://leetcode.com/${selectedStudent.leetCode}`} target="_blank" rel="noreferrer" style={{ background: '#ffa116', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>💻 LeetCode</a>}
                      </div>
                    )}
                  </div>
                )}
                {studentTab === 'docs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No documents.</div>}
                    {studentDocs.map(d => (
                      <div key={d._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label || d.filename}</div>
                        {(d.fileUrl || d.filepath) && <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer" style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>View</a>}
                      </div>
                    ))}
                  </div>
                )}
                {studentTab === 'achievements' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentAchs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No achievements.</div>}
                    {studentAchs.map(a => (
                      <div key={a._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{a.activityType?.replace(/_/g, ' ')} | {a.academicYear}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Report Section */}
            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Fetch Report for My Counsellees</div>
                <button onClick={toggleAllItems} style={{ fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
              </div>
              {DOC_GROUPS.map(group => (
                <div key={group.key} style={{ marginBottom: 12, padding: '12px 16px', background: group.bg, borderRadius: 10, border: `1px solid ${group.color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: group.color }}>{group.label}</span>
                    <button onClick={() => toggleGroupAll(group)} style={{ fontSize: 11, color: group.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.items.map(item => (
                      <span key={item.value} onClick={() => toggleItem(item.value)} style={chipStyle(selItems.includes(item.value), group.color, group.bg)}>{item.label}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={fetchReport} disabled={loading}
                  style={{ background: loading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  {loading ? 'Fetching...' : 'Fetch Report'}
                </button>
                {results && (
                  <>
                    <button onClick={downloadExcel} disabled={xlLoading}
                      style={{ background: xlLoading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      {xlLoading ? 'Generating...' : 'Download Excel'}
                    </button>
                    <button onClick={downloadZip} disabled={zipLoading}
                      style={{ background: zipLoading ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                      {zipLoading ? 'Generating...' : 'Download ZIP'}
                    </button>
                  </>
                )}
              </div>
              {results && (
                <div style={{ marginTop: 16, background: '#f8fafc', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                    {uniqueStudents.length} students found
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#059669' }}>
                          {['#', 'Reg No', 'Name', 'Dept', 'Section', 'Document', 'Data', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={`${r.regNumber}-${r.docType}-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '9px 14px', color: '#94a3b8' }}>{i + 1}</td>
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
          </>
        )}
      </div>

      </div>{/* end grid */}

    </div>
  );
}
