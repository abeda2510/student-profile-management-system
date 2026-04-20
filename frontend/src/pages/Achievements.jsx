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
        <div style={{ background: '#fff', borderRadius: 14, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Add Achievement</h3>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
              <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input placeholder="Issuing Organization" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <select value={form.activityType} onChange={e => set('activityType', e.target.value)} required
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: form.activityType ? '#0f172a' : '#94a3b8', background: '#fff' }}>
                <option value="">Activity Type *</option>
                {catTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={form.position} onChange={e => set('position', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: form.position ? '#0f172a' : '#94a3b8', background: '#fff' }}>
                <option value="">Position / Award</option>
                {['1st Place','2nd Place','3rd Place','Winner','Runner Up','Participation','Completed','Other'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Academic Year (e.g. 2023-24)" value={form.academicYear} onChange={e => set('academicYear', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              {subTypes.length > 0 && (
                <select value={form.subType} onChange={e => set('subType', e.target.value)}
                  style={{ padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Participation Level</option>
                  {subTypes.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              )}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => set('certificate', e.target.files[0])}
                style={{ padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
            </div>
            <textarea rows={3} placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              ℹ️ Achievement will be reviewed by faculty before points are awarded.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button type="button" onClick={closeForm}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '11px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
