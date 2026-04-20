import { useEffect, useState } from 'react';
import api from '../api';

const CATEGORIES = [
  {
    key: 'TECHNICAL', label: 'Technical', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    icon: '💻', desc: 'Hackathons, Competitions, Workshops, Research',
    types: ['HACKATHON','IDEATHON','TECHNICAL_COMPETITION','RESEARCH_PUBLICATION','INTERNSHIP','WORKSHOP','SEMINAR','PROJECT']
  },
  {
    key: 'NON_TECHNICAL', label: 'Non-Technical', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    icon: '🎭', desc: 'Cultural, Sports, Social Activities',
    types: ['SPORTS','CULTURAL','DANCE','MUSIC','ART','VOLUNTEERING']
  },
  {
    key: 'NPTEL', label: 'NPTEL', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    icon: '🎓', desc: 'NPTEL Course Certifications',
    types: ['NPTEL_ELITE','NPTEL_SILVER','NPTEL_GOLD','NPTEL_COURSE']
  },
  {
    key: 'CERTIFICATIONS', label: 'Certifications', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    icon: '📜', desc: 'Professional Certifications & Courses',
    types: ['AWS','GOOGLE','MICROSOFT','CISCO','COURSERA','UDEMY','LINKEDIN_LEARNING']
  },
];

const SUB_TYPES = {
  HACKATHON: ['WINNER','RUNNER','PARTICIPATION'],
  TECHNICAL_COMPETITION: ['WINNER','RUNNER','PARTICIPATION'],
  SPORTS: ['WINNER','PARTICIPATION'],
};

const STATUS_COLORS = {
  APPROVED: { bg: '#d1fae5', color: '#065f46' },
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
};

const empty = { title: '', activityType: '', subType: '', academicYear: '', semester: '', description: '', position: '', issuingOrg: '', date: '', certificate: null, mainCategory: '' };

export default function Achievements() {
  const [list, setList] = useState([]);
  const [myPoints, setMyPoints] = useState({ points: 0, approved: 0 });
  const [form, setForm] = useState(empty);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ status: '', activityType: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.activityType) params.activityType = filter.activityType;
    api.get('/achievements/me', { params }).then(r => setList(r.data));
    api.get('/achievements/my-points').then(r => setMyPoints(r.data));
  };

  useEffect(() => { load(); }, [filter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openForm = (cat) => {
    setSelectedCat(cat);
    setForm({ ...empty, mainCategory: cat.key });
    setShowForm(true);
    setTimeout(() => document.getElementById('ach-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const closeForm = () => { setShowForm(false); setSelectedCat(null); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'certificate') fd.append(k, v); });
      if (form.certificate) fd.append('certificate', form.certificate);
      await api.post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeForm(); load();
    } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
    setSubmitting(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    await api.delete(`/achievements/${id}`); load();
  };

  const subTypes = SUB_TYPES[form.activityType] || [];
  const catTypes = selectedCat?.types || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Achievements</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Track and showcase your academic and extracurricular achievements</p>
        </div>
        {!showForm && (
          <button onClick={() => openForm(CATEGORIES[0])}
            style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(30,64,175,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            + Add Achievement
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Points', value: myPoints.points, color: '#1e40af', bg: 'linear-gradient(135deg,#1e40af,#2563eb)', icon: '🏆' },
          { label: 'Approved', value: myPoints.approved, color: '#059669', bg: 'linear-gradient(135deg,#059669,#10b981)', icon: '✅' },
          { label: 'Pending Review', value: list.filter(a => a.status === 'PENDING').length, color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#f59e0b)', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 32 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Cards */}
      {!showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>Choose a category to add achievement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} onClick={() => openForm(cat)}
                style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{cat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: cat.color, marginBottom: 6 }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14, lineHeight: 1.4 }}>{cat.desc}</div>
                <button style={{ background: cat.color, color: '#fff', border: 'none', padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, width: '100%' }}>
                  + Add {cat.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && selectedCat && (
        <div id="ach-form" className="card" style={{ marginBottom: 24, border: `2px solid ${selectedCat.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: selectedCat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `2px solid ${selectedCat.border}` }}>{selectedCat.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: selectedCat.color }}>Add {selectedCat.label} Achievement</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selectedCat.desc}</div>
              </div>
            </div>
            <button onClick={closeForm} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 14 }}>
              <div className="field-group">
                <label className="field-label">Title *</label>
                <input placeholder="Achievement title" value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div className="field-group">
                <label className="field-label">Issuing Organization</label>
                <input placeholder="e.g. Google, NPTEL, College" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Activity Type *</label>
                <select value={form.activityType} onChange={e => set('activityType', e.target.value)} required>
                  <option value="">Select type</option>
                  {catTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Position / Award</label>
                <select value={form.position} onChange={e => set('position', e.target.value)}>
                  <option value="">Select position</option>
                  {['1st Place','2nd Place','3rd Place','Winner','Runner Up','Participation','Completed','Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {subTypes.length > 0 && (
                <div className="field-group">
                  <label className="field-label">Participation Level</label>
                  <select value={form.subType} onChange={e => set('subType', e.target.value)}>
                    <option value="">Select level</option>
                    {subTypes.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              )}
              <div className="field-group">
                <label className="field-label">Academic Year</label>
                <input placeholder="e.g. 2024-25" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Certificate / Document</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => set('certificate', e.target.files[0])} style={{ padding: '8px 12px' }} />
              </div>
            </div>
            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Description</label>
              <textarea rows={3} placeholder="Brief description of the achievement..." value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: `linear-gradient(135deg,${selectedCat.color},${selectedCat.color}dd)`, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : '✓ Submit for Review'}
              </button>
              <button type="button" onClick={closeForm}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '11px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filter:</span>
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
          <button key={st} onClick={() => setFilter(f => ({ ...f, status: st }))}
            style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${filter.status === st ? '#1e40af' : '#e2e8f0'}`, background: filter.status === st ? '#eff6ff' : '#fff', color: filter.status === st ? '#1e40af' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            {st || 'All'}
          </button>
        ))}
      </div>

      {/* Achievement List */}
      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No achievements yet</div>
          <div style={{ fontSize: 13 }}>Add your first achievement using the category cards above</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(a => {
          const cat = CATEGORIES.find(c => c.key === a.mainCategory) || CATEGORIES.find(c => c.types.includes(a.activityType));
          const statusStyle = STATUS_COLORS[a.status] || STATUS_COLORS.PENDING;
          return (
            <div key={a._id} className="card" style={{ padding: 20, borderLeft: `4px solid ${cat?.color || '#1e40af'}`, marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>{cat?.icon || '🏅'}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{a.title}</span>
                    <span style={{ ...statusStyle, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                    {a.status === 'APPROVED' && (
                      <span style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>🏆 {a.points} pts</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {a.activityType && <span style={{ background: cat?.bg || '#eff6ff', color: cat?.color || '#1e40af', border: `1px solid ${cat?.border || '#bfdbfe'}`, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.activityType.replace(/_/g, ' ')}</span>}
                    {a.subType && a.subType !== 'NA' && <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.subType}</span>}
                    {a.academicYear && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                    {a.position && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {a.issuingOrg && <span>🏢 {a.issuingOrg}</span>}
                    {a.date && <span>📅 {a.date}</span>}
                  </div>
                  {a.reviewNote && <div style={{ fontSize: 12, marginTop: 6, color: a.status === 'REJECTED' ? '#ef4444' : '#059669', fontStyle: 'italic' }}>💬 {a.reviewNote}</div>}
                  {(a.certificateUrl || a.certificatePath) && (
                    <a href={a.certificateUrl || a.certificatePath} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>
                      📎 View Certificate
                    </a>
                  )}
                </div>
                {a.status === 'PENDING' && (
                  <button onClick={() => del(a._id)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
