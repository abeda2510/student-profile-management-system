import { useEffect, useState } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

const CATEGORIES = [
  {
    key: 'TECHNICAL', label: 'Technical', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    img: '🖥️', desc: 'Hackathons, Competitions, Workshops, Projects',
    btnColor: '#1e40af',
    types: ['HACKATHON', 'IDEATHON', 'TECHNICAL_COMPETITION', 'INTERNSHIP', 'WORKSHOP', 'SEMINAR', 'PROJECT']
  },
  {
    key: 'NON_TECHNICAL', label: 'Non-Technical', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    img: '🎭', desc: 'Cultural, Sports, Social Activities',
    btnColor: '#d97706',
    types: ['SPORTS', 'CULTURAL', 'DANCE', 'MUSIC', 'ART', 'VOLUNTEERING', 'NSS', 'NCC']
  },
  {
    key: 'CERTIFICATIONS', label: 'Certifications', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    img: '📜', desc: 'Professional Certifications & Courses',
    btnColor: '#059669',
    types: ['NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE', 'AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING']
  },
];

const SUB_TYPES = {
  HACKATHON: ['WINNER', 'RUNNER', 'PARTICIPATION'],
  TECHNICAL_COMPETITION: ['WINNER', 'RUNNER', 'PARTICIPATION'],
  SPORTS: ['WINNER', 'PARTICIPATION'],
};

const STATUS_COLORS = {
  APPROVED: { bg: '#d1fae5', color: '#065f46' },
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
};

const empty = { title: '', activityType: '', subType: '', academicYear: '', description: '', position: '', issuingOrg: '', date: '', certificate: null, mainCategory: '' };

export default function Achievements() {
  const [list, setList] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [listTab, setListTab] = useState('TECHNICAL');
  const [dynamicTypes, setDynamicTypes] = useState([]);

  const load = () => {
    api.get('/achievements/me').then(r => setList(r.data));
    api.get('/achievements/activity-types').then(r => setDynamicTypes(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectCat = (cat) => {
    setSelectedCat(cat);
    setSelectedType('');
    setCustomType('');
    setForm({ ...empty, mainCategory: cat.key });
    
    if (cat.key === 'CERTIFICATIONS' || cat.key === 'NON_TECHNICAL') {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  };

  const getOptionsForCategory = (catKey) => {
    const cat = CATEGORIES.find(c => c.key === catKey);
    const defaults = cat ? [...cat.types] : [];
    const custom = dynamicTypes
      .filter(t => t.mainCategory === catKey && !defaults.includes(t.activityType))
      .map(t => t.activityType);
    return [...defaults, ...custom];
  };

  const selectType = (type) => {
    setSelectedType(type);
    setForm(f => ({ ...f, activityType: type === 'OTHER' ? customType : type, mainCategory: selectedCat.key, title: '' }));
    setShowForm(true);
  };

  const closeAll = () => {
    setSelectedCat(null);
    setSelectedType('');
    setCustomType('');
    setShowForm(false);
    setForm(empty);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.activityType) return alert('Please select activity type');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, mainCategory: selectedCat.key }).forEach(([k, v]) => {
        if (v && k !== 'certificate') fd.append(k, v);
      });
      if (form.certificate) fd.append('certificate', form.certificate);
      await api.post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeAll(); load();
    } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
    setSubmitting(false);
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/achievements/${id}`); load();
  };

  const subTypes = SUB_TYPES[form.activityType] || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>My Achievements</h2>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Track and showcase your academic and extracurricular achievements</p>

      {/* 5 Category Cards */}
      {!selectedCat && (
        <>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>Choose a category to add achievement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 20, marginBottom: 32 }}>
            {CATEGORIES.map(cat => {
              const count = list.filter(a => {
                const aCat = CATEGORIES.find(c => c.key === a.mainCategory) || CATEGORIES.find(c => c.types?.includes(a.activityType));
                return aCat?.key === cat.key;
              }).length;
              return (
                <div key={cat.key}
                  style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                  {count > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: cat.color,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 99,
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 6px ${cat.color}44`
                    }}>{count}</span>
                  )}
                  <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{cat.img}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: cat.color, marginBottom: 8 }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 18, minHeight: 36 }}>{cat.desc}</div>
                  <button onClick={() => selectCat(cat)}
                    style={{ background: cat.btnColor, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    + Add {cat.label}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sub-type selection */}
      {selectedCat && !showForm && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{selectedCat.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: selectedCat.color }}>{selectedCat.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Select activity type</div>
              </div>
            </div>
            <button onClick={closeAll} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600 }}>← Back</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {selectedCat.types.map(type => {
              const count = list.filter(a => a.activityType === type).length;
              return (
                <button key={type} onClick={() => selectType(type)}
                  style={{ padding: '9px 18px', borderRadius: 99, border: `2px solid ${selectedCat.border}`, background: selectedCat.bg, color: selectedCat.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.background = selectedCat.color; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedCat.bg; e.currentTarget.style.color = selectedCat.color; }}>
                  {type.replace(/_/g, ' ')}
                  {count > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 800,
                      borderRadius: '50%',
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
            {/* Other option */}
            <button onClick={() => setSelectedType('OTHER')}
              style={{ padding: '9px 18px', borderRadius: 99, border: `2px solid ${selectedType === 'OTHER' ? selectedCat.color : '#d1d5db'}`, background: selectedType === 'OTHER' ? selectedCat.bg : '#fff', color: selectedType === 'OTHER' ? selectedCat.color : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Other
            </button>
          </div>
          {selectedType === 'OTHER' && (
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter activity type..."
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={() => { if (customType.trim()) { 
                setForm(f => ({ ...f, activityType: customType, mainCategory: selectedCat.key, title: '' })); 
                setShowForm(true); 
              } }}
                style={{ background: selectedCat.color, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Continue →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showForm && selectedCat && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Add Achievement</h3>
            <button onClick={closeAll} style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600 }}>← Back</button>
          </div>
          <div style={{ background: selectedCat.bg, border: `1px solid ${selectedCat.border}`, borderRadius: 8, padding: '8px 14px', marginBottom: 18, fontSize: 13, color: selectedCat.color, fontWeight: 600 }}>
            {selectedCat.icon} {selectedCat.label}
            {form.activityType ? ` → ${form.activityType.replace(/_/g, ' ')}` : ''}
          </div>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
              {(selectedCat.key === 'CERTIFICATIONS' || selectedCat.key === 'NON_TECHNICAL') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
                  <select value={form.activityType || ''} onChange={e => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      const custom = prompt('Enter custom type:');
                      if (custom && custom.trim()) {
                        const trimmed = custom.trim();
                        const key = trimmed.toUpperCase().replace(/\s+/g, '_');
                        if (!dynamicTypes.some(t => t.activityType === key && t.mainCategory === selectedCat.key)) {
                          setDynamicTypes(prev => [...prev, { activityType: key, mainCategory: selectedCat.key }]);
                        }
                        set('activityType', key);
                      } else {
                        set('activityType', '');
                      }
                    } else {
                      set('activityType', val);
                    }
                  }} required
                    style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                    <option value="">Select Activity Type *</option>
                    {getOptionsForCategory(selectedCat.key).map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
              <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input placeholder="Issuing Organization *" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <select value={form.position} onChange={e => set('position', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: form.position ? '#0f172a' : '#94a3b8' }}>
                <option value="">Position / Award *</option>
                {['1st Place','2nd Place','3rd Place','Participation'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required
                  style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: form.academicYear ? '#0f172a' : '#94a3b8' }}>
                  <option value="">Academic Year *</option>
                  {Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => {
                    const y = 2019 + i;
                    const label = `${y}-${String(y+1).slice(2)}`;
                    return <option key={label} value={label}>{label}</option>;
                  })}
                </select>
              </div>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ gridColumn: '1 / span 2' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Upload Certificate (JPG, JPEG, PNG, PDF)</span>
                  <span style={{ color: '#94a3b8' }}>Max 2MB</span>
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                  const f = e.target.files[0];
                  if (f && f.size > 2 * 1024 * 1024) { alert('File too large. Maximum allowed size is 2MB.'); e.target.value = ''; return; }
                  set('certificate', f);
                }} required
                  style={{ padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <textarea rows={3} placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />
            <button type="submit" disabled={submitting}
              style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {/* Achievement List — grouped by category with tabs */}
      {!selectedCat && list.length > 0 && (() => {
        const tabs = [
          { key: 'TECHNICAL', label: 'Technical', color: '#1e40af' },
          { key: 'NON_TECHNICAL', label: 'Non-Technical', color: '#d97706' },
          { key: 'CERTIFICATIONS', label: 'Certifications', color: '#059669' },
          { key: 'OTHER', label: 'Other', color: '#64748b' },
        ];
        const grouped = {};
        list.forEach(a => {
          const cat = CATEGORIES.find(c => c.key === a.mainCategory) || CATEGORIES.find(c => c.types?.includes(a.activityType));
          const key = cat?.key || 'OTHER';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(a);
        });
        const activeTabs = tabs.filter(t => grouped[t.key]?.length > 0);
        const currentTab = activeTabs.find(t => t.key === listTab) ? listTab : activeTabs[0]?.key;
        const currentColor = tabs.find(t => t.key === currentTab)?.color || '#1e40af';

        return (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {activeTabs.map(t => (
                <button key={t.key} onClick={() => setListTab(t.key)}
                  style={{ padding: '7px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: currentTab === t.key ? t.color : '#f1f5f9',
                    color: currentTab === t.key ? '#fff' : '#374151' }}>
                  {t.label} ({grouped[t.key]?.length || 0})
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(grouped[currentTab] || []).map(a => (
                <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', borderLeft: `4px solid ${currentColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>{a.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        {a.academicYear && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                        {a.position && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {a.issuingOrg && <span>🏢 {a.issuingOrg} &nbsp;</span>}
                        {a.date && <span>📅 {a.date}</span>}
                      </div>
                      <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View Certificate" style={{ marginTop: 6, padding: '3px 12px', fontSize: 12, fontWeight: 600 }} />
                    </div>
                    <button onClick={() => del(a._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {list.length === 0 && !selectedCat && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>No achievements found.</div>
        </div>
      )}
    </div>
  );
}
