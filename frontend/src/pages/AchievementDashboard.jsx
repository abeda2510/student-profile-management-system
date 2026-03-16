import { useEffect, useState } from 'react';
import api from '../api';

const DEPTS = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','CSBS'];
const SECTIONS = ['A','B','C','D','E','F','G'];
const th = { padding: '11px 14px', background: '#1e40af', color: '#fff', fontWeight: 700, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' };
const td = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const Bdg = ({ bg, color, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{children}</span>
);
const sel = { padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', color: '#0f172a', fontFamily: 'inherit' };
const medalColor = r => r === 1 ? '#f59e0b' : r === 2 ? '#94a3b8' : r === 3 ? '#b45309' : '#64748b';

export default function AchievementDashboard() {
  const [tab, setTab] = useState('pending');
  const [leaderboard, setLeaderboard] = useState([]);
  const [sectionRank, setSectionRank] = useState([]);
  const [deptRank, setDeptRank] = useState([]);
  const [pending, setPending] = useState([]);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [reviewNote, setReviewNote] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  const loadAll = () => {
    api.get('/achievements/pending').then(r => setPending(r.data));
    api.get('/achievements/ranking/section').then(r => setSectionRank(r.data));
    api.get('/achievements/ranking/department').then(r => setDeptRank(r.data));
  };

  const loadLeaderboard = () => {
    const params = {};
    if (filterBranch) params.branch = filterBranch;
    if (filterSection) params.section = filterSection;
    api.get('/achievements/leaderboard', { params }).then(r => setLeaderboard(r.data));
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadLeaderboard(); }, [filterBranch, filterSection]);

  const review = async (id, status) => {
    setLoading(true);
    try {
      await api.put(`/achievements/${id}/review`, { status, reviewNote: reviewNote[id] || '' });
      setMsg({ text: status === 'APPROVED' ? '✅ Approved successfully.' : '❌ Rejected successfully.', ok: status === 'APPROVED' });
      loadAll(); loadLeaderboard();
      setTimeout(() => setMsg({ text: '', ok: true }), 3000);
    } catch { setMsg({ text: 'Action failed.', ok: false }); }
    setLoading(false);
  };

  const totalPoints = deptRank.reduce((s, d) => s + d.totalPoints, 0);
  const totalStudents = deptRank.reduce((s, d) => s + d.studentCount, 0);

  const tabs = [
    { key: 'pending', label: 'Pending Review', icon: '⏳' },
    { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { key: 'section', label: 'Section Ranking', icon: '📊' },
    { key: 'dept', label: 'Dept Ranking', icon: '🏛️' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Achievement Dashboard</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>Review, approve and track student achievements</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Pending Review', value: pending.length, color: '#d97706', bg: '#fffbeb', icon: '⏳' },
          { label: 'Departments Active', value: deptRank.length, color: '#1e40af', bg: '#eff6ff', icon: '🏛️' },
          { label: 'Total Points Awarded', value: totalPoints, color: '#059669', bg: '#ecfdf5', icon: '⭐' },
          { label: 'Students with Points', value: totalStudents, color: '#7c3aed', bg: '#f5f3ff', icon: '👨‍🎓' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}`, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {msg.text && (
        <div style={{ padding: '12px 16px', borderRadius: 9, marginBottom: 16, fontWeight: 600, fontSize: 14, background: msg.ok ? '#ecfdf5' : '#fef2f2', color: msg.ok ? '#065f46' : '#991b1b', border: `1px solid ${msg.ok ? '#a7f3d0' : '#fecaca'}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f1f5f9', padding: 5, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1e40af' : '#64748b', boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.09)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.icon} {t.label}
            {t.key === 'pending' && pending.length > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>
            Pending Achievements
            {pending.length > 0 && <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 13 }}>{pending.length} awaiting</span>}
          </div>
          {pending.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 56 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>All caught up!</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>No pending achievements to review.</div>
            </div>
          ) : pending.map(a => (
            <div key={a._id} className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{a.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <span style={{ background: '#f1f5f9', color: '#1e293b', borderRadius: 7, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>👤 {a.studentName || a.regNumber}</span>
                    {a.branch && <Bdg bg="#eff6ff" color="#1e40af">{a.branch}{a.section ? `-${a.section}` : ''}</Bdg>}
                    <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>{a.regNumber}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <Bdg bg="#eff6ff" color="#1e40af">{a.activityType?.replace(/_/g, ' ')}</Bdg>
                    {a.subType && a.subType !== 'NA' && <Bdg bg="#ede9fe" color="#5b21b6">{a.subType}</Bdg>}
                    <Bdg bg="#fffbeb" color="#92400e">~{a.points} pts</Bdg>
                    {a.academicYear && <Bdg bg="#ecfdf5" color="#065f46">{a.academicYear}</Bdg>}
                    {a.semester && <Bdg bg="#f0f9ff" color="#0369a1">Sem {a.semester}</Bdg>}
                  </div>
                  {a.description && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, lineHeight: 1.6, background: '#f8fafc', padding: '8px 12px', borderRadius: 7 }}>{a.description}</div>}
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                    {a.issuingOrg && <span>🏢 {a.issuingOrg}</span>}
                    {a.position && <span>🏅 {a.position}</span>}
                    {a.date && <span>📅 {a.date}</span>}
                    <span>🕐 Submitted: {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {a.certificateFile && (
                    <a href={`/uploads/achievements/${a.regNumber}/${a.certificateFile}`} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1e40af', marginTop: 10, fontWeight: 600, background: '#eff6ff', padding: '5px 12px', borderRadius: 7 }}>
                      📎 View Certificate
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
                  <input style={{ ...sel, width: '100%' }} placeholder="Review note (optional)"
                    value={reviewNote[a._id] || ''}
                    onChange={e => setReviewNote(n => ({ ...n, [a._id]: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={loading} onClick={() => review(a._id, 'APPROVED')}
                      style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '10px 0', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                      ✓ Approve
                    </button>
                    <button disabled={loading} onClick={() => review(a._id, 'REJECTED')}
                      style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px 0', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>🏆 Top Students by Points</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select style={sel} value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setFilterSection(''); }}>
                <option value="">All Departments</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select style={sel} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="">All Sections</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
              {(filterBranch || filterSection) && (
                <button onClick={() => { setFilterBranch(''); setFilterSection(''); }}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#374151', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Clear
                </button>
              )}
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
              <div style={{ fontWeight: 600 }}>No approved achievements yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Rank','Reg No','Name','Dept','Section','Points','Achievements'].map((h, i) => (
                    <th key={h} style={{ ...th, borderRadius: i === 0 ? '8px 0 0 0' : i === 6 ? '0 8px 0 0' : 0 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={row.regNumber} style={{ background: row.rank <= 3 ? '#fefce8' : '#fff' }}>
                      <td style={td}>
                        <span style={{ fontWeight: 800, color: medalColor(row.rank), fontSize: 16 }}>
                          {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}
                        </span>
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: '#1e40af' }}>{row.regNumber}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{row.name}</td>
                      <td style={td}>{row.branch ? <Bdg bg="#eff6ff" color="#1e40af">{row.branch}</Bdg> : '—'}</td>
                      <td style={td}>{row.section || '—'}</td>
                      <td style={td}><Bdg bg="#ecfdf5" color="#065f46">{row.totalPoints} pts</Bdg></td>
                      <td style={td}><Bdg bg="#f5f3ff" color="#5b21b6">{row.achievements}</Bdg></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'section' && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>📊 Section-wise Ranking</div>
          {sectionRank.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>No data available.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Rank','Department','Section','Total Points','Avg Points','Students'].map((h, i) => (
                  <th key={h} style={{ ...th, borderRadius: i === 0 ? '8px 0 0 0' : i === 5 ? '0 8px 0 0' : 0 }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {sectionRank.map((row, i) => (
                    <tr key={`${row.branch}-${row.section}`} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={td}><span style={{ fontWeight: 800, color: medalColor(i + 1) }}>{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}</span></td>
                      <td style={td}><Bdg bg="#eff6ff" color="#1e40af">{row.branch}</Bdg></td>
                      <td style={{ ...td, fontWeight: 600 }}>Section {row.section}</td>
                      <td style={td}><Bdg bg="#ecfdf5" color="#065f46">{row.totalPoints} pts</Bdg></td>
                      <td style={td}><span style={{ color: '#475569', fontWeight: 600 }}>{row.avgPoints} pts</span></td>
                      <td style={td}><span style={{ fontWeight: 600 }}>{row.studentCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'dept' && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>🏛️ Department-wise Ranking</div>
          {deptRank.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>No data available.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Rank','Department','Total Points','Avg Points','Students'].map((h, i) => (
                  <th key={h} style={{ ...th, borderRadius: i === 0 ? '8px 0 0 0' : i === 4 ? '0 8px 0 0' : 0 }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {deptRank.map((row, i) => (
                    <tr key={row.branch} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={td}><span style={{ fontWeight: 800, color: medalColor(i + 1) }}>{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}</span></td>
                      <td style={td}><Bdg bg="#eff6ff" color="#1e40af">{row.branch}</Bdg></td>
                      <td style={td}><Bdg bg="#ecfdf5" color="#065f46">{row.totalPoints} pts</Bdg></td>
                      <td style={td}><span style={{ fontWeight: 600, color: '#475569' }}>{row.avgPoints} pts</span></td>
                      <td style={td}><span style={{ fontWeight: 600 }}>{row.studentCount}</span></td>
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
