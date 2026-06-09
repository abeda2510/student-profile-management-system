import React, { useEffect, useState } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

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

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
  }, []);

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

      {/* Search Student — full width */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
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
                    const baseUrl = import.meta.env.VITE_API_URL || '/spm';
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

                {/* CRT Performance Card */}
                {(() => {
                  const crtAttendance = searchDocs.find(d => d.label === 'CRT Attendance');
                  const crtOverall = searchDocs.find(d => d.label === 'CRT Performance - Overall %' || d.label === 'CRT Performance');
                  const crtSubDocs = searchDocs.filter(d => d.label?.startsWith('CRT Performance - ') && d.label !== 'CRT Performance - Overall %');
                  if (!crtAttendance && !crtOverall && crtSubDocs.length === 0) return null;
                  return (
                    <div style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 14px', border: '1px solid #fde68a' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#d97706', marginBottom: 10 }}>📊 CRT Performance</div>
                      {crtOverall && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fde68a', fontSize: 13 }}>
                          <span style={{ color: '#92400e', fontWeight: 600 }}>Overall %</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{crtOverall.fileUrl || crtOverall.filename || '—'}</span>
                        </div>
                      )}
                      {crtSubDocs.map(d => (
                        <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #fef3c7', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>{d.label.replace('CRT Performance - ', '')}</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{d.fileUrl || d.filename || '—'}</span>
                        </div>
                      ))}
                      {crtAttendance && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #fde68a', marginTop: 6, fontSize: 13 }}>
                          <span style={{ color: '#92400e', fontWeight: 600 }}>CRT Attendance</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{crtAttendance.fileUrl || crtAttendance.filename || '—'}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Semester-wise Attendance Card — shows only Attendance % per sem */}
                {(() => {
                  // Collect all sems that have any Semester Attendance data
                  const semNums = [...new Set(
                    searchDocs
                      .filter(d => d.label?.startsWith('Semester Attendance - Sem '))
                      .map(d => {
                        const m = d.label.match(/Semester Attendance - Sem (\d+)/);
                        return m ? parseInt(m[1]) : null;
                      })
                      .filter(Boolean)
                  )].sort((a, b) => a - b);

                  if (semNums.length === 0) return null;

                  return (
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#059669', marginBottom: 10 }}>📅 Semester-wise Attendance</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                        {semNums.map(sem => {
                          // Prefer "Attendance %" sub-column, fallback to combined value
                          const pctDoc = searchDocs.find(d => d.label === `Semester Attendance - Sem ${sem} - Attendance %`);
                          const combinedDoc = searchDocs.find(d => d.label === `Semester Attendance - Sem ${sem}`);
                          const val = pctDoc
                            ? (pctDoc.fileUrl || pctDoc.filename)
                            : combinedDoc
                              ? (combinedDoc.fileUrl || combinedDoc.filename)
                              : null;
                          // Extract just the percentage number if combined value
                          let display = val || '—';
                          if (!pctDoc && val) {
                            const m = val.match(/Attendance\s*%[:\s]+([0-9.]+)/i);
                            if (m) display = m[1] + '%';
                          }
                          return (
                            <div key={sem} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Sem {sem}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{display}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Other docs — hide all CRT and Semester Attendance entries (already shown above) */}
                {searchDocs
                  .filter(d => !d.label?.startsWith('CRT') && !d.label?.startsWith('Semester Attendance'))
                  .map(d => (
                    <div key={d._id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType}</span>{d.label || d.filename}</div>
                      {(d.fileUrl || d.filepath) && <ViewButton url={d.fileUrl || d.filepath} />}
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
                    <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View" style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 10 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
