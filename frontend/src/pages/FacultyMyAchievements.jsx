import { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

const CATEGORIES = [
  {
    key: 'RESEARCH', label: 'Research', icon: '📄', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    desc: 'Publications, Patents, Projects',
    types: ['RESEARCH_PUBLICATION', 'PATENT', 'FUNDED_PROJECT', 'BOOK'],
    typeIcons: { RESEARCH_PUBLICATION: '📰', PATENT: '💡', FUNDED_PROJECT: '📁', BOOK: '📚' },
  },
  {
    key: 'EVENTS', label: 'Events', icon: '🎤', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    desc: 'Conferences, Seminars, Workshops, FDP',
    types: ['CONFERENCE', 'SEMINAR', 'WORKSHOP', 'FDP'],
    typeIcons: { CONFERENCE: '🎤', SEMINAR: '🗣️', WORKSHOP: '🔧', FDP: '📋' },
  },
  {
    key: 'CERTIFICATIONS', label: 'Certifications', icon: '📜', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    desc: 'Professional Certifications & Courses',
    types: ['CERTIFICATION', 'ONLINE_COURSE', 'NPTEL'],
    typeIcons: { CERTIFICATION: '🏅', ONLINE_COURSE: '💻', NPTEL: '🎓' },
  },
  {
    key: 'AWARDS', label: 'Awards', icon: '🏆', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    desc: 'Awards, Recognition & Achievements',
    types: ['AWARD', 'RECOGNITION', 'OTHER'],
    typeIcons: { AWARD: '🏆', RECOGNITION: '⭐', OTHER: '📌' },
  },
];

const YEARS = Array.from({ length: 8 }, (_, i) => { const y = 2020 + i; return `${y}-${y + 1}`; });
const empty = { activityType: '', title: '', description: '', issuingOrg: '', academicYear: '', date: '', position: '' };

export default function FacultyMyAchievements() {
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

  const catAchievements = selectedCat
    ? achievements.filter(a => selectedCat.types.includes(a.activityType))
    : [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>My Achievements</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Track and manage your professional achievements</p>
        </div>
        {selectedCat && (
          <button onClick={() => setShowForm(f => !f)}
            style={{ background: showForm ? '#f1f5f9' : selectedCat.color, color: showForm ? '#374151' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {showForm ? '✕ Cancel' : '+ Add Achievement'}
          </button>
        )}
      </div>

      {/* Category Cards */}
      {!selectedCat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {CATEGORIES.map(cat => {
            const count = achievements.filter(a => cat.types.includes(a.activityType)).length;
            return (
              <div key={cat.key}
                style={{ background: cat.bg, border: `2px solid ${cat.border}`, borderRadius: 20, padding: '28px 20px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                {count > 0 && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: cat.color, color: '#fff', borderRadius: 99, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{count}</div>
                )}
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

      {/* Selected Category View */}
      {selectedCat && (
        <>
          {/* Back + Category Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={reset} style={{ background: '#f1f5f9', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>← Back</button>
            <span style={{ fontSize: 24 }}>{selectedCat.icon}</span>
            <div style={{ fontWeight: 700, fontSize: 16, color: selectedCat.color }}>{selectedCat.label}</div>
            <span style={{ background: selectedCat.color, color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{catAchievements.length}</span>
          </div>

          {/* Add Form */}
          {showForm && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: `1px solid ${selectedCat.border}`, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: '#0f172a' }}>New {selectedCat.label} Achievement</div>
              <form onSubmit={submit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 }}>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Activity Type *</label>
                    <select value={form.activityType} onChange={e => set('activityType', e.target.value)} required
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">Select type...</option>
                      {selectedCat.types.map(t => (
                        <option key={t} value={t}>{selectedCat.typeIcons[t]} {t.replace(/_/g, ' ')}</option>
                      ))}
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
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = selectedCat.color}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Issuing Organization</label>
                    <input value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} placeholder="e.g. IEEE, Springer"
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = selectedCat.color}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Position / Award</label>
                    <input value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. First Prize, Best Paper"
                      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = selectedCat.color}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'} />
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
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                      const f = e.target.files[0];
                      if (f && f.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); e.target.value = ''; return; }
                      setFile(f);
                    }} style={{ padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#f8fafc' }} />
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

          {/* Achievements List */}
          {catAchievements.length === 0 && !showForm ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{selectedCat.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>No {selectedCat.label} achievements yet</div>
              <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Click "Add Achievement" to record your first one</div>
              <button onClick={() => setShowForm(true)}
                style={{ background: selectedCat.color, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                + Add Achievement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {catAchievements.map(a => {
                const icon = selectedCat.typeIcons[a.activityType] || '🏅';
                return (
                  <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${selectedCat.border}`, display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: selectedCat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <span style={{ background: selectedCat.bg, color: selectedCat.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, border: `1px solid ${selectedCat.border}` }}>
                          {a.activityType.replace(/_/g, ' ')}
                        </span>
                        {a.academicYear && <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                        {a.position && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                      </div>
                      {a.issuingOrg && <div style={{ fontSize: 12, color: '#64748b' }}>🏛 {a.issuingOrg}</div>}
                      {a.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{a.description}</div>}
                      {a.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>📅 {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {(a.certificateUrl || a.certificatePath) && (
                        <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="📎 View" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }} />
                      )}
                      <button onClick={() => del(a._id)}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
