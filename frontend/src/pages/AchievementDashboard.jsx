import { useEffect, useState } from 'react';
import api from '../api';

const DEPTS = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','CSBS'];
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
const th = { padding: '11px 14px', background: '#1e40af', color: '#fff', fontWeight: 700, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' };
const td = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const Bdg = ({ bg, color, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{children}</span>
);
const sel = { padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', color: '#0f172a', fontFamily: 'inherit' };
const medalColor = r => r === 1 ? '#f59e0b' : r === 2 ? '#94a3b8' : r === 3 ? '#b45309' : '#64748b';
const DEPT_COLORS = { CSE:'#1e40af',ECE:'#7c3aed',EEE:'#d97706',MECH:'#dc2626',CIVIL:'#059669',IT:'#0891b2',AIML:'#db2777',CSBS:'#65a30d' };

export default function AchievementDashboard() {
  const [tab, setTab] = useState('leaderboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [sectionRank, setSectionRank] = useState([]);
  const [selDepts, setSelDepts] = useState([]);
  const [selSections, setSelSections] = useState({});
  const [minPoints, setMinPoints] = useState('');
  const [fetched, setFetched] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    api.get('/achievements/ranking/section').then(r => setSectionRank(r.data));
  }, []);

  const toggleDept = dept => {
    if (selDepts.includes(dept)) {
      setSelDepts(d => d.filter(x => x !== dept));
      setSelSections(s => { const n = {...s}; delete n[dept]; return n; });
    } else {
      setSelDepts(d => [...d, dept]);
      setSelSections(s => ({ ...s, [dept]: [...DEPT_SECTIONS[dept]] }));
    }
    setFetched(false);
  };

  const toggleSection = (dept, sec) => {
    const cur = selSections[dept] || [];
    const next = cur.includes(sec) ? cur.filter(x => x !== sec) : [...cur, sec];
    setSelSections(s => ({ ...s, [dept]: next }));
    setFetched(false);
  };

  const toggleAllDepts = () => {
    if (selDepts.length === DEPTS.length) { setSelDepts([]); setSelSections({}); }
    else {
      setSelDepts([...DEPTS]);
      const all = {};
      DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; });
      setSelSections(all);
    }
    setFetched(false);
  };

  const fetchLeaderboard = () => {
    const params = new URLSearchParams({ limit: 500 });
    selDepts.forEach(d => params.append('branch', d));
    selDepts.forEach(d => {
      const allSecs = DEPT_SECTIONS[d];
      const chosen = selSections[d] || [];
      if (chosen.length > 0 && chosen.length < allSecs.length) chosen.forEach(s => params.append('section', s));
    });
    if (minPoints !== '') params.set('minPoints', minPoints);
    api.get('/achievements/leaderboard/multi?' + params).then(r => {
      setLeaderboard(r.data);
      setFetched(true);
    });
  };

  const downloadExcel = async () => {
    setExcelLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 500 });
      selDepts.forEach(d => params.append('branch', d));
      selDepts.forEach(d => {
        const allSecs = DEPT_SECTIONS[d];
        const chosen = selSections[d] || [];
        if (chosen.length > 0 && chosen.length < allSecs.length) chosen.forEach(s => params.append('section', s));
      });
      if (minPoints !== '') params.set('minPoints', minPoints);
      const res = await window.fetch((import.meta.env.VITE_API_URL || '/api') + '/achievements/leaderboard/excel?' + params, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'leaderboard.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to download Excel'); }
    finally { setExcelLoading(false); }
  };

  const tabs = [
    { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { key: 'section', label: 'Section Ranking', icon: '📊' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Achievement Dashboard</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>Track student achievements and rankings</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f1f5f9', padding: 5, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1e40af' : '#64748b', boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.09)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Select Departments & Sections</div>
              <button type="button" onClick={toggleAllDepts}
                style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
                {selDepts.length === DEPTS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {DEPTS.map(dept => {
                const selected = selDepts.includes(dept);
                const color = DEPT_COLORS[dept] || '#1e40af';
                return (
                  <div key={dept} style={{ border: `2px solid ${selected ? color : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', background: selected ? '#fff' : '#fafafa' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: selected ? color + '10' : 'transparent' }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleDept(dept)} style={{ accentColor: color, width: 15, height: 15 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: selected ? color : '#374151' }}>{dept}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 2 }}>({DEPT_SECTIONS[dept].length} sec)</span>
                      {selected && <span style={{ marginLeft: 'auto', background: color, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{(selSections[dept]||[]).length}/{DEPT_SECTIONS[dept].length}</span>}
                    </label>
                    {selected && (
                      <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${color}22`, background: '#fff', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {DEPT_SECTIONS[dept].map(sec => {
                          const secSel = (selSections[dept] || []).includes(sec);
                          return (
                            <label key={sec} style={{ cursor: 'pointer' }}>
                              <input type="checkbox" checked={secSel} onChange={() => toggleSection(dept, sec)} style={{ display: 'none' }} />
                              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: `1.5px solid ${secSel ? color : '#e2e8f0'}`, background: secSel ? color : '#fff', color: secSel ? '#fff' : '#64748b' }}>
                                {sec}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Min Points</div>
                <input style={{ ...sel, width: 130 }} type="number" min="0" placeholder="e.g. 10"
                  value={minPoints} onChange={e => { setMinPoints(e.target.value); setFetched(false); }} />
              </div>
              <button onClick={fetchLeaderboard} disabled={selDepts.length === 0}
                style={{ background: selDepts.length === 0 ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: selDepts.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                🔍 Fetch Report
              </button>
              {fetched && leaderboard.length > 0 && (
                <button onClick={downloadExcel} disabled={excelLoading}
                  style={{ background: excelLoading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: excelLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {excelLoading ? 'Generating...' : '📊 Download Excel'}
                </button>
              )}
              {(selDepts.length > 0 || minPoints) && (
                <button onClick={() => { setSelDepts([]); setSelSections({}); setMinPoints(''); setFetched(false); setLeaderboard([]); }}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#374151', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>🏆 Top Students by Points</div>
            {!fetched ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <div style={{ fontWeight: 600 }}>Select departments and click Fetch Report</div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
                <div style={{ fontWeight: 600 }}>No students match the filters.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{leaderboard.length} students found</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Rank','Reg No','Name','Dept','Section','Points','Achievements'].map((h, i) => (
                      <th key={h} style={{ ...th, borderRadius: i === 0 ? '8px 0 0 0' : i === 6 ? '0 8px 0 0' : 0 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, i) => (
                      <tr key={row.regNumber} style={{ background: i < 3 ? '#fefce8' : '#fff' }}>
                        <td style={td}><span style={{ fontWeight: 800, color: medalColor(i+1), fontSize: 16 }}>{i < 3 ? ['🥇','🥈','🥉'][i] : '#'+(i+1)}</span></td>
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
                    <tr key={row.branch+'-'+row.section} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={td}><span style={{ fontWeight: 800, color: medalColor(i+1) }}>{i < 3 ? ['🥇','🥈','🥉'][i] : '#'+(i+1)}</span></td>
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
    </div>
  );
}