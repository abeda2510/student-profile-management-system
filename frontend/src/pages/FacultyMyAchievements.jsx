import { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';

const ACTIVITY_TYPES = [
  { value: 'RESEARCH_PUBLICATION', label: '📄 Research Publication' },
  { value: 'CONFERENCE', label: '🎤 Conference / Seminar' },
  { value: 'WORKSHOP', label: '🔧 Workshop / FDP' },
  { value: 'CERTIFICATION', label: '📜 Certification' },
  { value: 'AWARD', label: '🏆 Award / Recognition' },
  { value: 'PATENT', label: '💡 Patent' },
  { value: 'PROJECT', label: '📁 Funded Project' },
  { value: 'BOOK', label: '📚 Book / Book Chapter' },
  { value: 'OTHER', label: '📌 Other' },
];

const YEARS = Array.from({ length: 8 }, (_, i) => { const y = 2020 + i; return `${y}-${y + 1}`; });

const empty = { activityType: '', title: '', description: '', issuingOrg: '', academicYear: '', date: '', position: '' };

export default function FacultyMyAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

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

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Preview Modal */}
      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 800, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Certificate Preview</span>
              <button onClick={() => setPreviewUrl(null)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 300 }}>
              {previewUrl.toLowerCase().includes('.pdf') || previewUrl.includes('/raw/')
                ? <iframe src={previewUrl} style={{ width: '100%', height: '75vh', border: 'none' }} title="Certificate" />
                : <img src={previewUrl} alt="Certificate" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
              }
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>My Achievements</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Track your research, certifications, awards and more</p>
        </div>
        <button onClick={() => { setShowForm(f => !f); setError(''); }}
          style={{ background: showForm ? '#f1f5f9' : '#059669', color: showForm ? '#374151' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          {showForm ? '✕ Cancel' : '+ Add Achievement'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: '#0f172a' }}>New Achievement</div>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 }}>

              {/* Activity Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Activity Type *</label>
                <select value={form.activityType} onChange={e => set('activityType', e.target.value)} required
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Select type...</option>
                  {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Academic Year */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Academic Year</label>
                <select value={form.academicYear} onChange={e => set('academicYear', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Select year...</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Title */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Best Paper Award at ICSE 2024" required
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              {/* Issuing Org */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Issuing Organization</label>
                <input value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} placeholder="e.g. IEEE, Springer, NPTEL"
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              {/* Position */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Position / Award</label>
                <input value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. First Prize, Best Paper"
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief description..."
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              {/* Certificate Upload */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Certificate / Proof (JPG, PNG, PDF)</label>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Max 2MB</span>
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
                  const f = e.target.files[0];
                  if (f && f.size > 2 * 1024 * 1024) { alert('File too large. Maximum allowed size is 2MB.'); e.target.value = ''; return; }
                  setFile(f);
                }}
                  style={{ padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#f8fafc' }} />
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>{error}</div>}

            <button type="submit" disabled={submitting}
              style={{ background: submitting ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {submitting ? 'Saving...' : '💾 Save Achievement'}
            </button>
          </form>
        </div>
      )}

      {/* Achievements List */}
      {achievements.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>No achievements yet</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Click "Add Achievement" to record your first one</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {achievements.map((a, i) => {
            const typeInfo = ACTIVITY_TYPES.find(t => t.value === a.activityType);
            return (
              <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {typeInfo?.label.split(' ')[0] || '🏅'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                    <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {typeInfo?.label.replace(/^[^ ]+ /, '') || a.activityType.replace(/_/g, ' ')}
                    </span>
                    {a.academicYear && <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.academicYear}</span>}
                    {a.position && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{a.position}</span>}
                  </div>
                  {a.issuingOrg && <div style={{ fontSize: 12, color: '#64748b' }}>🏛 {a.issuingOrg}</div>}
                  {a.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{a.description}</div>}
                  {a.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>📅 {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {(a.certificateUrl || a.certificatePath) && (
                    <button onClick={() => setPreviewUrl(viewUrl(a.certificateUrl || a.certificatePath))}
                      style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      📎 View
                    </button>
                  )}
                  <button onClick={() => del(a._id)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
