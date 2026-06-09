import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

const tabStyle = (active) => ({
  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: 13,
  background: active ? '#059669' : '#e2e8f0',
  color: active ? '#fff' : '#374151',
});

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const [profile, setProfile] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(null);
  const [pendingAchs, setPendingAchs] = useState([]);
  const [deptRanking, setDeptRanking] = useState([]);
  const [adminDocTypes, setAdminDocTypes] = useState([]);
  const [recentAchs, setRecentAchs] = useState([]);
  const [searchReg, setSearchReg] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchDocs, setSearchDocs] = useState([]);
  const [searchAchs, setSearchAchs] = useState([]);
  const [searchTab, setSearchTab] = useState('profile');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
    api.get('/students/count').then(r => setTotalStudents(r.data.count)).catch(() => {});
    api.get('/achievements/pending').then(r => setPendingAchs(r.data || [])).catch(() => {});
    api.get('/achievements/ranking/department').then(r => setDeptRanking(r.data || [])).catch(() => {});
    api.get('/documents/admin-types').then(r => setAdminDocTypes(r.data || [])).catch(() => {});
    api.get('/achievements/faculty-report?activityTypes=HACKATHON&activityTypes=INTERNSHIP&activityTypes=RESEARCH_PUBLICATION')
      .then(r => setRecentAchs((r.data || []).slice(0, 6))).catch(() => {});
  }, []);

  const searchStudent = async (e) => {
    e?.preventDefault();
    setSearchError(''); setSearchResult(null);
    const reg = e?.target?.regNumber?.value || searchReg;
    if (!reg) return;
    try {
      const [p, d, a] = await Promise.all([
        api.get(`/faculty/student/${reg}`),
        api.get(`/faculty/student/${reg}/documents`),
        api.get(`/faculty/student/${reg}/achievements`),
      ]);
      setSearchReg(reg);
      setSearchResult(p.data); setSearchDocs(d.data); setSearchAchs(a.data); setSearchTab('profile');
    } catch { setSearchError('Student not found'); }
  };

  const viewCounsellee = async (st) => {
    setSearchReg(st.regNumber);
    try {
      const [p, d, a] = await Promise.all([
        api.get(`/faculty/student/${st.regNumber}`),
        api.get(`/faculty/student/${st.regNumber}/documents`),
        api.get(`/faculty/student/${st.regNumber}/achievements`),
      ]);
      setSearchResult(p.data); setSearchDocs(d.data); setSearchAchs(a.data); setSearchTab('profile');
    } catch {}
  };

  const approveAch = async (id) => {
    await api.put(`/achievements/${id}/status`, { status: 'APPROVED' }).catch(() => {});
    setPendingAchs(p => p.filter(a => a._id !== id));
  };
  const rejectAch = async (id) => {
    await api.put(`/achievements/${id}/status`, { status: 'REJECTED' }).catch(() => {});
    setPendingAchs(p => p.filter(a => a._id !== id));
  };

  const allLabels = adminDocTypes.map(t => t.label);
  const parentDocTypes = adminDocTypes.filter(t => !allLabels.some(l => l !== t.label && t.label.startsWith(l + ' - ')));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Profile Banner */}
      {profile && (
        <div style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', boxShadow: '0 4px 20px rgba(30,64,175,0.25)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.35)' }}>
            {profile.name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>{profile.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>{profile.department}</span>
              <span style={{ background: isAdmin ? '#ef4444' : 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>{isAdmin ? '🔑 Admin' : '👨‍🏫 Faculty'}</span>
              {profile.designation && <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>{profile.designation}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{profile.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'My Counsellees', value: myStudents.length, icon: '👥' },
              ...(isAdmin ? [
                { label: 'Total Students', value: totalStudents, icon: '🎓' },
                { label: 'Pending', value: pendingAchs.length, icon: '⏳' },
              ] : []),
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value ?? '—'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isAdmin ? 4 : 3}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📊', label: 'Reports', desc: 'Section-wise data & Excel export', color: '#059669', bg: '#f0fdf4', path: '/section-report' },
          { icon: '🏆', label: 'Achievements', desc: 'Student achievement reports & ZIP', color: '#1e40af', bg: '#eff6ff', path: '/achievement-report' },
          { icon: '🎪', label: 'Dept Events', desc: 'Department events tracking', color: '#7c3aed', bg: '#f5f3ff', path: '/dept-events' },
          ...(isAdmin ? [{ icon: '⚙️', label: 'Admin Panel', desc: 'Upload docs, manage users', color: '#d97706', bg: '#fffbeb', path: '/admin' }] : []),
        ].map(({ icon, label, desc, color, bg, path }) => (
          <div key={label} onClick={() => navigate(path)}
            style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1.5px solid ${color}22`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${color}22`; e.currentTarget.style.borderColor = `${color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = `${color}22`; }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Search + Counsellees Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24, alignItems: 'start' }}>

        {/* Search Student */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#0f172a' }}>🔍 Search Student</div>
          <form onSubmit={searchStudent} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input value={searchReg} onChange={e => setSearchReg(e.target.value)} placeholder="Enter Registration Number"
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} required />
            <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Search</button>
          </form>
          {searchError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{searchError}</div>}
          {searchResult && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['profile','docs','achievements'].map(t => (
                  <button key={t} onClick={() => setSearchTab(t)} style={tabStyle(searchTab === t)}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                    {t==='docs'?` (${searchDocs.length})`:t==='achievements'?` (${searchAchs.length})`:''}
                  </button>
                ))}
              </div>
              {searchTab === 'profile' && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{searchResult.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{searchResult.regNumber} | {searchResult.branch} | Sec {searchResult.section} | Yr {searchResult.currentYear}</div>
                    </div>
                    <button onClick={async () => {
                      const token = localStorage.getItem('token');
                      const baseUrl = import.meta.env.VITE_API_URL || '/api/spm';
                      const res = await fetch(`${baseUrl}/students/profile-pdf/${searchResult.regNumber}`, { headers: { Authorization: `Bearer ${token}` } });
                      if (!res.ok) return;
                      const blob = await res.blob(); const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `${searchResult.regNumber}_profile.pdf`; a.click(); URL.revokeObjectURL(url);
                    }} style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>📄 PDF</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
                    {[['Email',searchResult.email],['Phone',searchResult.phone],['DOB',searchResult.dob],['Gender',searchResult.gender],['Blood Grp',searchResult.bloodGroup],['Parent',searchResult.parentName],['Parent Ph',searchResult.parentPhone],['Adm Year',searchResult.admissionYear],['Category',searchResult.admissionCategory],['CGPA',searchResult.cgpa],['APAAR',searchResult.apaarId],['Counsellor',searchResult.counsellor],['LeetCode',searchResult.leetCode],['CodeChef',searchResult.codeChef]].filter(([,v])=>v).map(([l,v])=>(
                      <div key={l} style={{ display: 'flex', gap: 6, padding: '4px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                        <span style={{ color: '#64748b', minWidth: 80, fontWeight: 500, flexShrink: 0 }}>{l}:</span>
                        <span style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchTab === 'docs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                  {searchDocs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No documents.</div>}
                  {(() => {
                    const crtAtt = searchDocs.find(d => d.label === 'CRT Attendance');
                    const crtOv = searchDocs.find(d => d.label === 'CRT Performance - Overall %' || d.label === 'CRT Performance');
                    const crtSub = searchDocs.filter(d => d.label?.startsWith('CRT Performance - ') && d.label !== 'CRT Performance - Overall %');
                    if (!crtAtt && !crtOv && !crtSub.length) return null;
                    return (
                      <div style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 12px', border: '1px solid #fde68a' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#d97706', marginBottom: 6 }}>📊 CRT Performance</div>
                        {crtOv && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #fef3c7' }}><span style={{ color: '#92400e', fontWeight: 600 }}>Overall %</span><span style={{ fontWeight: 700 }}>{crtOv.fileUrl||crtOv.filename||'—'}</span></div>}
                        {crtSub.map(d => <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #fef3c7' }}><span style={{ color: '#64748b' }}>{d.label.replace('CRT Performance - ','')}</span><span style={{ fontWeight: 600 }}>{d.fileUrl||d.filename||'—'}</span></div>)}
                        {crtAtt && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', marginTop: 4, borderTop: '1px solid #fde68a' }}><span style={{ color: '#92400e', fontWeight: 600 }}>CRT Attendance</span><span style={{ fontWeight: 700 }}>{crtAtt.fileUrl||crtAtt.filename||'—'}</span></div>}
                      </div>
                    );
                  })()}
                  {(() => {
                    const semNums = [...new Set(searchDocs.filter(d=>d.label?.startsWith('Semester Attendance - Sem ')).map(d=>{const m=d.label.match(/Sem (\d+)/);return m?parseInt(m[1]):null}).filter(Boolean))].sort((a,b)=>a-b);
                    if (!semNums.length) return null;
                    return (
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#059669', marginBottom: 6 }}>📅 Semester Attendance</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {semNums.map(sem => {
                            const doc = searchDocs.find(d=>d.label===`Semester Attendance - Sem ${sem} - Attendance %`) || searchDocs.find(d=>d.label===`Semester Attendance - Sem ${sem}`);
                            return <div key={sem} style={{ background: '#fff', borderRadius: 6, padding: '5px 10px', border: '1px solid #d1fae5', textAlign: 'center' }}><div style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>Sem {sem}</div><div style={{ fontSize: 13, fontWeight: 800 }}>{doc ? (doc.fileUrl||doc.filename||'—') : '—'}</div></div>;
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {searchDocs.filter(d=>!d.label?.startsWith('CRT')&&!d.label?.startsWith('Semester Attendance')).map(d=>(
                    <div key={d._id} style={{ background: '#f8fafc', borderRadius: 7, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginRight: 6 }}>{d.docType}</span>{d.label||d.filename}</div>
                      {(d.fileUrl||d.filepath) && <ViewButton url={d.fileUrl||d.filepath} />}
                    </div>
                  ))}
                </div>
              )}
              {searchTab === 'achievements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                  {searchAchs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No achievements.</div>}
                  {searchAchs.map(a => (
                    <div key={a._id} style={{ background: '#f8fafc', borderRadius: 7, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{a.title}</div>
                        <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginRight: 5 }}>{a.activityType?.replace(/_/g,' ')}</span>
                        <span style={{ background: a.status==='APPROVED'?'#d1fae5':a.status==='REJECTED'?'#fee2e2':'#fef3c7', color: a.status==='APPROVED'?'#065f46':a.status==='REJECTED'?'#991b1b':'#92400e', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{a.status}</span>
                      </div>
                      <ViewButton url={viewUrl(a.certificateUrl||a.certificatePath)} label="📎" style={{ padding: '3px 8px', fontSize: 11 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Counsellees */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#0f172a' }}>👥 My Counsellees ({myStudents.length})</div>
          {myStudents.length === 0
            ? <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No students assigned yet.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {myStudents.map(st => (
                  <div key={st._id} onClick={() => viewCounsellee(st)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#bbf7d0'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {st.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{st.regNumber} · Sec {st.section} · Yr {st.currentYear}</div>
                    </div>
                    <span style={{ fontSize: 16, color: '#059669' }}>→</span>
                  </div>
                ))}
              </div>
          }
          {parentDocTypes.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Uploaded Data</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {parentDocTypes.map(t => {
                  const sub = adminDocTypes.filter(x=>x.label.startsWith(t.label+' - ')).reduce((s,x)=>s+x.count,0);
                  return <span key={t.label} style={{ background: '#fffbeb', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 10, fontWeight: 700, border: '1px solid #fde68a' }}>{t.label} ({sub||t.count})</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Rankings */}
      {deptRanking.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#0f172a' }}>🏅 Department Achievement Rankings</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {deptRanking.map((d, i) => (
              <div key={d.branch} style={{ background: i===0?'linear-gradient(135deg,#fef9c3,#fde68a)':i===1?'linear-gradient(135deg,#f1f5f9,#e2e8f0)':i===2?'linear-gradient(135deg,#fff7ed,#fed7aa)':'#f8fafc', borderRadius: 10, padding: '12px 14px', border: `1px solid ${i===0?'#fde68a':i===1?'#cbd5e1':i===2?'#fdba74':'#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{d.branch}</span>
                  <span style={{ fontSize: 18 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'🎖️'}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>{d.totalPoints}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Total Points</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{d.avgPoints} avg · {d.studentCount} students</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals — admin only */}
      {isAdmin && pendingAchs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1.5px solid #fde68a', marginBottom: 24, boxShadow: '0 2px 12px rgba(251,191,36,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
              ⏳ Pending Approvals
              <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700, marginLeft: 10 }}>{pendingAchs.length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {pendingAchs.slice(0, 15).map(a => (
              <div key={a._id} style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 16px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.regNumber} · {a.activityType?.replace(/_/g,' ')} · {a.academicYear}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {(a.certificateUrl||a.certificatePath) && <ViewButton url={viewUrl(a.certificateUrl||a.certificatePath)} label="📎" style={{ padding: '5px 10px', fontSize: 11 }} />}
                  <button onClick={() => approveAch(a._id)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
                  <button onClick={() => rejectAch(a._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notable Achievements */}
      {recentAchs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#0f172a' }}>⚡ Recent Notable Achievements</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {recentAchs.map(a => (
              <div key={a._id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.background='#eff6ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc'; }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{a.activityType?.replace(/_/g,' ')}</span>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 8, fontWeight: 600 }}>{a.studentName||a.regNumber}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{a.branch} · {a.academicYear}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
