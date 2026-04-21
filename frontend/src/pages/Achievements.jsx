import { useEffect, useState } from 'react';
import api from '../api';

const CATEGORIES = [
  {
    key: 'TECHNICAL', label: 'Technical', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    img: '🖥️', desc: 'Hackathons, Competitions, Workshops, Research',
    btnColor: '#1e40af',
    types: ['HACKATHON', 'IDEATHON', 'TECHNICAL_COMPETITION', 'RESEARCH_PUBLICATION', 'INTERNSHIP', 'WORKSHOP', 'SEMINAR', 'PROJECT']
  },
  {
    key: 'NON_TECHNICAL', label: 'Non-Technical', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    img: '🎭', desc: 'Cultural, Sports, Social Activities',
    btnColor: '#d97706',
    types: ['SPORTS', 'CULTURAL', 'DANCE', 'MUSIC', 'ART', 'VOLUNTEERING', 'NSS', 'NCC']
  },
  {
    key: 'NPTEL', label: 'NPTEL', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    img: '🎓', desc: 'NPTEL Course Certifications',
    btnColor: '#7c3aed',
    types: ['NPTEL_ELITE', 'NPTEL_SILVER', 'NPTEL_GOLD', 'NPTEL_COURSE']
  },
  {
    key: 'CERTIFICATIONS', label: 'Certifications', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    img: '📜', desc: 'Professional Certifications & Courses',
    btnColor: '#059669',
    types: ['AWS', 'GOOGLE', 'MICROSOFT', 'CISCO', 'COURSERA', 'UDEMY', 'LINKEDIN_LEARNING']
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

  const load = () => {
    api.get('/achievements/me').then(r => setList(r.data));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectCat = (cat) => {
    setSelectedCat(cat);
    setSelectedType('');
    setCustomType('');
    setShowForm(false);
    setForm(empty);
  };

  const selectType = (type) => {
    const autoTitle = type === 'OTHER' ? '' : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setSelectedType(type);
    setForm(f => ({ ...f, activityType: type === 'OTHER' ? customType : type, mainCategory: selectedCat.key, title: autoTitle }));
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
    setSubmitting(true);
    try {
      const actType = selectedType === 'OTHER' ? customType : selectedType;
      const fd = new FormData();
      Object.entries({ ...form, activityType: actType, mainCategory: selectedCat.key }).forEach(([k, v]) => {
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

      {/* 4 Category Cards */}
      {!selectedCat && (
        <>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>Choose a category to add achievement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.key}
                style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
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
            ))}
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
            {selectedCat.types.map(type => (
              <button key={type} onClick={() => selectType(type)}
                style={{ padding: '9px 18px', borderRadius: 99, border: `2px solid ${selectedCat.border}`, background: selectedCat.bg, color: selectedCat.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = selectedCat.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = selectedCat.bg; e.currentTarget.style.color = selectedCat.color; }}>
                {type.replace(/_/g, ' ')}
              </button>
            ))}
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
                const autoTitle = customType.trim().replace(/\b\w/g, c => c.toUpperCase());
                setForm(f => ({ ...f, activityType: customType, mainCategory: selectedCat.key, title: autoTitle })); 
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
            {selectedCat.icon} {selectedCat.label} → {(selectedType === 'OTHER' ? customType : selectedType).replace(/_/g, ' ')}
          </div>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
              <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input placeholder="Issuing Organization *" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <select value={form.position} onChange={e => set('position', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: form.position ? '#0f172a' : '#94a3b8' }}>
                <option value="">Position / Award *</option>
                {['1st Place','2nd Place','3rd Place','Participation'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Academic Year * (e.g. 2024-25)" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ gridColumn: '1 / span 2' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => set('certificate', e.target.files[0])} required
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

      {/* Achievement List */}
      {list.length === 0 && !selectedCat && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>No achievements found.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(a => {
          const cat = CATEGORIES.find(c => c.key === a.mainCategory) || CATEGORIES.find(c => c.types?.includes(a.activityType));
          const statusStyle = STATUS_COLORS[a.status] || STATUS_COLORS.PENDING;
          return (
            <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', borderLeft: `4px solid ${cat?.color || '#1e40af'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{a.title}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {a.academicYear && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                    {a.position && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {a.issuingOrg && <span>🏢 {a.issuingOrg} &nbsp;</span>}
                    {a.date && <span>📅 {a.date}</span>}
                  </div>
                  {a.reviewNote && <div style={{ fontSize: 12, marginTop: 5, color: a.status === 'REJECTED' ? '#ef4444' : '#059669', fontStyle: 'italic' }}>💬 {a.reviewNote}</div>}
                  {(a.certificateUrl || a.certificatePath) && (
                    <a href={a.certificateUrl || a.certificatePath} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', marginTop: 6, background: '#dbeafe', color: '#1e40af', padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      📎 View Certificate
                    </a>
                  )}
                </div>
                <button onClick={() => del(a._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
