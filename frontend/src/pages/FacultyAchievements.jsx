import { useState } from 'react';
import api, { viewUrl } from '../api';

const CATEGORIES = [
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

const YEARS = Array.from({length:8},(_,i)=>{ const y=2020+i; return `${y}-${y+1}`; });
const BRANCHES = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIML','CSBS'];

export default function FacultyAchievements() {
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

  const toggleType = (type) => setSelectedTypes(s => s.includes(type) ? s.filter(x => x !== type) : [...s, type]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (academicYear) params.academicYear = academicYear;
      if (branch) params.branch = branch;
      if (currentYear) params.currentYear = currentYear;
      const typesToFetch = selectedTypes.length > 0 ? [...selectedTypes] : [...(selectedCat?.types || [])];
      if (showOther && customType.trim()) typesToFetch.push(customType.trim());
      if (typesToFetch.length > 0) params.activityTypes = typesToFetch.join(',');
      const { data } = await api.get('/achievements/faculty-report', { params });
      setAchievements(data);
      setFetched(true);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (branch) params.append('branch', branch);
    if (currentYear) params.append('currentYear', currentYear);
    const typesToFetch = selectedTypes.length > 0 ? [...selectedTypes] : [...(selectedCat?.types || [])];
    if (showOther && customType.trim()) typesToFetch.push(customType.trim());
    typesToFetch.forEach(t => params.append('activityTypes', t));
    return params;
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
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
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseUrl}/achievements/faculty-report/zip?${buildParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(err.message || 'Server error');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `certificates_${selectedCat?.key || 'all'}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('ZIP failed: ' + e.message); }
    setZipLoading(false);
  };

  const reset = () => { setSelectedCat(null); setSelectedTypes([]); setCustomType(''); setShowOther(false); setAchievements([]); setFetched(false); };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Achievement Reports</h2>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Fetch and download student achievements by category</p>

      {/* 4 Category Cards */}
      {!selectedCat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.key}
              style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
              <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{cat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: cat.color, marginBottom: 8 }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 18, minHeight: 36 }}>{cat.desc}</div>
              <button onClick={() => setSelectedCat(cat)}
                style={{ background: cat.color, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Fetch {cat.label}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Category */}
      {selectedCat && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{selectedCat.icon}</span>
              <div style={{ fontWeight: 700, fontSize: 15, color: selectedCat.color }}>{selectedCat.label}</div>
            </div>
            <button onClick={reset} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>← Back</button>
          </div>

          {/* Sub-type chips */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select specific types (leave all unchecked to fetch all):
              </div>
              <button onClick={() => {
                const allSelected = selectedCat.types.every(t => selectedTypes.includes(t));
                setSelectedTypes(allSelected ? [] : [...selectedCat.types]);
              }} style={{ fontSize: 12, color: selectedCat.color, background: 'none', border: `1px solid ${selectedCat.color}`, padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: 700 }}>
                {selectedCat.types.every(t => selectedTypes.includes(t)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedCat.types.map(type => (
                <span key={type} onClick={() => toggleType(type)}
                  style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${selectedTypes.includes(type) ? selectedCat.color : '#e2e8f0'}`, background: selectedTypes.includes(type) ? selectedCat.bg : '#fff', color: selectedTypes.includes(type) ? selectedCat.color : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{selectedCat.typeIcons?.[type] || ''}</span>
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
              <span onClick={() => setShowOther(!showOther)}
                style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${showOther ? '#374151' : '#e2e8f0'}`, background: showOther ? '#f1f5f9' : '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Other
              </span>
            </div>
            {showOther && (
              <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter custom activity type..."
                style={{ marginTop: 10, padding: '9px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 280 }} />
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Academic Year</label>
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                <option value="">All Years</option>
                {Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => {
                  const y = 2019 + i;
                  const label = `${y}-${String(y+1).slice(2)}`;
                  return <option key={label} value={label}>{label}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Year of Study</label>
              <select value={currentYear} onChange={e => setCurrentYear(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                <option value="">All</option>
                {['1','2','3','4'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Branch</label>
              <select value={branch} onChange={e => setBranch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <button onClick={fetchAchievements} disabled={loading}
            style={{ background: loading ? '#94a3b8' : selectedCat.color, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {loading ? 'Fetching...' : 'Fetch Achievements'}
          </button>
        </div>
      )}

      {/* Results */}
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
                        {(a.certificateUrl || a.certificatePath) ? (
                          <a href={viewUrl(a.certificateUrl || a.certificatePath)} target="_blank" rel="noreferrer"
                            style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>View</a>
                        ) : <span style={{ color: '#94a3b8' }}>-</span>}
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
