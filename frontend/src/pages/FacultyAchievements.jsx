import { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

// ── Shared ──────────────────────────────────────────────────────────────────
const REPORT_CATS = [
  { key: 'TECHNICAL', label: 'Technical', icon: '💻', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    desc: 'Hackathons, Competitions, Workshops, Research',
    types: ['HACKATHON','IDEATHON','TECHNICAL_COMPETITION','RESEARCH_PUBLICATION','INTERNSHIP','WORKSHOP','SEMINAR','PROJECT'],
    typeIcons: { HACKATHON:'⚡', IDEATHON:'💡', TECHNICAL_COMPETITION:'🏆', RESEARCH_PUBLICATION:'📄', INTERNSHIP:'💼', WORKSHOP:'🔧', SEMINAR:'🎤', PROJECT:'📁' }
  },
  { key: 'NON_TECHNICAL', label: 'Non-Technical', icon: '🎭', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    desc: 'Cultural, Sports, Social Activities',
    types: ['SPORTS','CULTURAL','DANCE','MUSIC','ART','VOLUNTEERING','NSS','NCC'],
    typeIcons: { SPORTS:'⚽', CULTURAL:'🎨', DANCE:'💃', MUSIC:'🎵', ART:'🖼️', VOLUNTEERING:'🤝', NSS:'🌿', NCC:'🎖️' }
  },
  { key: 'NPTEL', label: 'NPTEL', icon: '🎓', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    desc: 'NPTEL Course Certifications',
    types: ['NPTEL_ELITE','NPTEL_SILVER','NPTEL_GOLD','NPTEL_COURSE'],
    typeIcons: { NPTEL_ELITE:'🥇', NPTEL_SILVER:'🥈', NPTEL_GOLD:'🥉', NPTEL_COURSE:'📚' }
  },
  { key: 'CERTIFICATIONS', label: 'Certifications', icon: '📜', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    desc: 'Professional Certifications & Courses',
    types: ['AWS','GOOGLE','MICROSOFT','CISCO','COURSERA','UDEMY','LINKEDIN_LEARNING'],
    typeIcons: { AWS:'☁️', GOOGLE:'🔍', MICROSOFT:'🪟', CISCO:'🌐', COURSERA:'📖', UDEMY:'🎯', LINKEDIN_LEARNING:'💼' }
  },
];

const MY_CATS = [
  { key: 'RESEARCH', label: 'Research', icon: '📄', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    desc: 'Publications, Patents, Projects',
    types: ['RESEARCH_PUBLICATION','PATENT','FUNDED_PROJECT','BOOK'],
    typeIcons: { RESEARCH_PUBLICATION:'📰', PATENT:'💡', FUNDED_PROJECT:'📁', BOOK:'📚' },
  },
  { key: 'EVENTS', label: 'Events', icon: '🎤', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    desc: 'Conferences, Seminars, Workshops, FDP',
    types: ['CONFERENCE','SEMINAR','WORKSHOP','FDP'],
    typeIcons: { CONFERENCE:'🎤', SEMINAR:'🗣️', WORKSHOP:'🔧', FDP:'📋' },
  },
  { key: 'CERTIFICATIONS', label: 'Certifications', icon: '📜', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    desc: 'Professional Certifications & Courses',
    types: ['CERTIFICATION','ONLINE_COURSE','NPTEL'],
    typeIcons: { CERTIFICATION:'🏅', ONLINE_COURSE:'💻', NPTEL:'🎓' },
  },
  { key: 'AWARDS', label: 'Awards', icon: '🏆', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    desc: 'Awards, Recognition & Achievements',
    types: ['AWARD','RECOGNITION','OTHER'],
    typeIcons: { AWARD:'🏆', RECOGNITION:'⭐', OTHER:'📌' },
  },
];

const BRANCHES = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','CSBS'];
const YEARS = Array.from({length:8},(_,i)=>{ const y=2020+i; return `${y}-${y+1}`; });
const empty = { activityType:'', title:'', description:'', issuingOrg:'', academicYear:'', date:'', position:'' };

// ── Report Tab ───────────────────────────────────────────────────────────────
function ReportTab() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [customType, setCustomType] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [branch, setBranch] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [counselleesOnly, setCounselleesOnly] = useState(true);
  const [myStudentRegs, setMyStudentRegs] = useState([]);

  useEffect(() => {
    api.get('/faculty/my-students').then(r => setMyStudentRegs(r.data.map(s => s.regNumber))).catch(() => {});
  }, []);

  const toggleType = (type) => setSelectedTypes(s => s.includes(type) ? s.filter(x => x !== type) : [...s, type]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (branch) params.append('branch', branch);
      if (currentYear) params.append('currentYear', currentYear);
      const typesToFetch = selectedTypes.length > 0 ? [...selectedTypes] : (showOther && customType.trim() ? [] : [...(selectedCat?.types || [])]);
      if (showOther && customType.trim()) typesToFetch.push(customType.trim());
      typesToFetch.forEach(t => params.append('activityTypes', t));
      const { data } = await api.get(`/achievements/faculty-report?${params}`);
      setAchievements(counselleesOnly ? data.filter(a => myStudentRegs.includes(a.regNumber)) : data);
      setFetched(true);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (branch) params.append('branch', branch);
    if (currentYear) params.append('currentYear', currentYear);
    const typesToFetch = selectedTypes.length > 0 ? [...selectedTypes] : (showOther && customType.trim() ? [] : [...(selectedCat?.types || [])]);
    if (showOther && customType.trim()) { typesToFetch.length = 0; typesToFetch.push(customType.trim()); }
    typesToFetch.forEach(t => params.append('activityTypes', t));
    return params;
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/spm';
      const res = await fetch(`${baseUrl}/achievements/faculty-report/excel?${buildParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `achievements_${selectedCat?.key || 'all'}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    setXlLoading(false);
  };

  const downloadZip = async () => {
    setZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/spm';
      const res = await fetch(`${baseUrl}/achievements/faculty-report/zip?${buildParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({ message: 'Server error' })); throw new Error(err.message); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `certificates_${selectedCat?.key || 'all'}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('ZIP failed: ' + e.message); }
    setZipLoading(false);
  };

  const reset = () => { setSelectedCat(null); setSelectedTypes([]); setCustomType(''); setShowOther(false); setAchievements([]); setFetched(false); };

  return (
    <div>
      {!selectedCat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {REPORT_CATS.map(cat => (
            <div key={cat.key}
              style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
              <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{cat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: cat.color, marginBottom: 8 }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 18, minHeight: 36 }}>{cat.desc}</div>
              <button onClick={() => setSelectedCat(cat)}
                style={{ background: cat.color, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' }}>
                Fetch {cat.label}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCat && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{selectedCat.icon}</span>
              <div style={{ fontWeight: 700, fontSize: 15, color: selectedCat.color }}>{selectedCat.label}</div>
            </div>
            <button onClick={reset} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>← Back</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Select specific types (leave all unchecked to fetch all):</div>
              <button onClick={() => { const all = selectedCat.types.every(t => selectedTypes.includes(t)); setSelectedTypes(all ? [] : [...selectedCat.types]); }}
                style={{ fontSize: 12, color: selectedCat.color, background: 'none', border: `1px solid ${selectedCat.color}`, padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: 700 }}>
                {selectedCat.types.every(t => selectedTypes.includes(t)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedCat.types.map(type => (
                <span key={type} onClick={() => toggleType(type)}
                  style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${selectedTypes.includes(type) ? selectedCat.color : '#e2e8f0'}`, background: selectedTypes.includes(type) ? selectedCat.bg : '#fff', color: selectedTypes.includes(type) ? selectedCat.color : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {selectedCat.typeIcons?.[type]} {type.replace(/_/g, ' ')}
                </span>
              ))}
              <span onClick={() => setShowOther(!showOther)}
                style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${showOther ? '#374151' : '#e2e8f0'}`, background: showOther ? '#f1f5f9' : '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Other</span>
            </div>
            {showOther && <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter custom activity type..."
              style={{ marginTop: 10, padding: '9px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 280 }} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[['Academic Year', academicYear, setAcademicYear, Array.from({length: new Date().getFullYear()-2018},(_,i)=>{ const y=2019+i; const l=`${y}-${String(y+1).slice(2)}`; return [l,l]; }), 'All Years'],
              ['Year of Study', currentYear, setCurrentYear, ['1','2','3','4'].map(v=>[v,v]), 'All'],
              ['Branch', branch, setBranch, BRANCHES.map(b=>[b,b]), 'All Branches']
            ].map(([label, val, setter, opts, placeholder]) => (
              <div key={label}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>{label}</label>
                <select value={val} onChange={e => setter(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                  <option value="">{placeholder}</option>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={counselleesOnly} onChange={e => setCounselleesOnly(e.target.checked)} style={{ accentColor: selectedCat.color, width: 15, height: 15 }} />
              My Counsellees Only
            </label>
          </div>
          <button onClick={fetchAchievements} disabled={loading}
            style={{ background: loading ? '#94a3b8' : selectedCat.color, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {loading ? 'Fetching...' : 'Fetch Achievements'}
          </button>
        </div>
      )}

      {fetched && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{achievements.length} achievements found</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadExcel} disabled={xlLoading || !achievements.length}
                style={{ background: xlLoading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                {xlLoading ? 'Generating...' : 'Download Excel'}
              </button>
              <button onClick={downloadZip} disabled={zipLoading || !achievements.length}
                style={{ background: zipLoading ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                {zipLoading ? 'Generating...' : 'Download ZIP'}
              </button>
            </div>
          </div>
          {achievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>No achievements found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    {['#','Reg No','Name','Branch','Activity','Academic Year','Position','Certificate'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((a, i) => (
                    <tr key={a._id} style={{ background: i%2===0?'#fff':'#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 14px', color: '#94a3b8' }}>{i+1}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#1e40af' }}>{a.regNumber}</td>
                      <td style={{ padding: '9px 14px' }}>{a.studentName || '-'}</td>
                      <td style={{ padding: '9px 14px' }}>{a.branch || '-'}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.activityType?.replace(/_/g,' ')}</div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>{a.academicYear || '-'}</td>
                      <td style={{ padding: '9px 14px' }}>{a.position || '-'}</td>
                      <td style={{ padding: '9px 14px' }}>
                        {(a.certificateUrl || a.certificatePath)
                          ? <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="View" />
                          : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
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

// ── My Achievements Tab ──────────────────────────────────────────────────────
function MyAchievementsTab() {
  const [achievements, setAchievements] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/faculty-achievements/my').then(r => setAchievements(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.activityType || !form.title) return setError('Activity type and title are required');
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('certificate', file);
      await api.post('/faculty-achievements/my', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(empty); setFile(null); setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || err.message); }
    setSubmitting(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    await api.delete(`/faculty-achievements/my/${id}`);
    load();
  };

  const reset = () => { setSelectedCat(null); setShowForm(false); setForm(empty); setFile(null); setError(''); };
  const catAchievements = selectedCat ? achievements.filter(a => selectedCat.types.includes(a.activityType)) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Track and manage your professional achievements</p>
        {selectedCat && (
          <button onClick={() => setShowForm(f => !f)}
            style={{ background: showForm ? '#f1f5f9' : selectedCat.color, color: showForm ? '#374151' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {showForm ? '✕ Cancel' : '+ Add Achievement'}
          </button>
        )}
      </div>

      {!selectedCat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {MY_CATS.map(cat => {
            const count = achievements.filter(a => cat.types.includes(a.activityType)).length;
            return (
              <div key={cat.key}
                style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                {count > 0 && <div style={{ position: 'absolute', top: 12, right: 12, background: cat.color, color: '#fff', borderRadius: 99, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{count}</div>}
                <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>{cat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: cat.color, marginBottom: 8 }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 18, minHeight: 36 }}>{cat.desc}</div>
                <button onClick={() => setSelectedCat(cat)}
                  style={{ background: cat.color, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' }}>
                  View {cat.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedCat && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={reset} style={{ background: '#f1f5f9', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>← Back</button>
            <span style={{ fontSize: 24 }}>{selectedCat.icon}</span>
            <div style={{ fontWeight: 700, fontSize: 16, color: selectedCat.color }}>{selectedCat.label}</div>
            <span style={{ background: selectedCat.color, color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{catAchievements.length}</span>
          </div>

          {showForm && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: `1px solid ${selectedCat.border}`, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>New {selectedCat.label} Achievement</div>
              <form onSubmit={submit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Activity Type *</label>
                    <select value={form.activityType} onChange={e => set('activityType', e.target.value)} required
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">Select type...</option>
                      {selectedCat.types.map(t => <option key={t} value={t}>{selectedCat.typeIcons[t]} {t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Academic Year</label>
                    <select value={form.academicYear} onChange={e => set('academicYear', e.target.value)}
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">Select year...</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Title *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Best Paper Award at ICSE 2024" required
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Issuing Organization</label>
                    <input value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} placeholder="e.g. IEEE, Springer"
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Position / Award</label>
                    <input value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. First Prize"
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Date</label>
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description..."
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Certificate / Proof</label>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Max 2MB · JPG, PNG, PDF</span>
                    </div>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => { const f = e.target.files[0]; if (f && f.size > 2*1024*1024) { alert('File too large.'); e.target.value=''; return; } setFile(f); }}
                      style={{ padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#f8fafc' }} />
                  </div>
                </div>
                {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>{error}</div>}
                <button type="submit" disabled={submitting}
                  style={{ background: submitting ? '#94a3b8' : selectedCat.color, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  {submitting ? 'Saving...' : '💾 Save Achievement'}
                </button>
              </form>
            </div>
          )}

          {catAchievements.length === 0 && !showForm ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{selectedCat.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No {selectedCat.label} achievements yet</div>
              <button onClick={() => setShowForm(true)}
                style={{ background: selectedCat.color, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>+ Add Achievement</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {catAchievements.map(a => (
                <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${selectedCat.border}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: selectedCat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {selectedCat.typeIcons[a.activityType] || '🏅'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                      <span style={{ background: selectedCat.bg, color: selectedCat.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, border: `1px solid ${selectedCat.border}` }}>{a.activityType.replace(/_/g,' ')}</span>
                      {a.academicYear && <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                      {a.position && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                    </div>
                    {a.issuingOrg && <div style={{ fontSize: 12, color: '#64748b' }}>🏛 {a.issuingOrg}</div>}
                    {a.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{a.description}</div>}
                    {a.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>📅 {new Date(a.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {(a.certificateUrl || a.certificatePath) && <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }} />}
                    <button onClick={() => del(a._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Combined Page ────────────────────────────────────────────────────────────
export default function FacultyAchievements() {
  const [tab, setTab] = useState('report');
  const tabBtn = (key, label) => (
    <button onClick={() => setTab(key)} style={{
      padding: '9px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: 14,
      background: tab === key ? '#1e40af' : '#e2e8f0',
      color: tab === key ? '#fff' : '#374151',
      transition: 'all 0.15s',
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Achievements</h2>
        <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          {tabBtn('report', '📊 Achievement Reports')}
          {tabBtn('mine', '🏅 My Achievements')}
        </div>
      </div>
      {tab === 'report' ? <ReportTab /> : <MyAchievementsTab />}
    </div>
  );
}
