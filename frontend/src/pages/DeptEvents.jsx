import { useState, useEffect } from 'react';
import api from '../api';
import { ViewButton } from '../components/PreviewModal';

const YEARS = Array.from({ length: 8 }, (_, i) => { const y = 2020 + i; return `${y}-${y + 1}`; });

const DOC_FIELDS = [
  { key: 'poster',           label: '🖼️ Poster',             accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'onePageReport',    label: '📄 One Page Report',    accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'winnersList',      label: '🏆 Winners List',       accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'sampleCertificate',label: '📜 Sample Certificate', accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'budgetReport',     label: '💰 Budget Report',      accept: '.jpg,.jpeg,.png,.pdf' },
];
const empty = { employeeId: '', coordinatorName: '', eventName: '', eventType: '', year: '', date: '', venue: '', description: '', outcome: '', budget: '' };

export default function DeptEvents() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [eventTypes, setEventTypes] = useState(['Workshop', 'Seminar', 'Hackathon', 'Conference', 'Cultural', 'Sports', 'Technical Fest', 'Guest Lecture', 'Webinar', 'Other']);

  const load = () => api.get('/dept-events').then(r => {
    setEvents(r.data);
    if (r.data && Array.isArray(r.data)) {
      const loadedTypes = r.data.map(ev => ev.eventType).filter(Boolean);
      setEventTypes(prev => {
        const set = new Set([...prev]);
        set.delete('Other');
        loadedTypes.forEach(t => set.add(t));
        const updated = Array.from(set);
        updated.push('Other');
        return updated;
      });
    }
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (key, file) => {
    if (file && file.size > 2 * 1024 * 1024) {
      alert('File too large. Max 2MB.');
      return;
    }
    setFiles(f => ({ ...f, [key]: file }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.coordinatorName || !form.eventName || !form.year)
      return setError('Employee ID, Coordinator Name, Event Name and Year are required');

    const finalEventType = form.eventType;

    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) {
          fd.append(k, v);
        }
      });
      DOC_FIELDS.forEach(({ key }) => { if (files[key]) fd.append(key, files[key]); });
      await api.post('/dept-events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (finalEventType && !eventTypes.includes(finalEventType)) {
        setEventTypes(prev => {
          const updated = [...prev];
          const otherIdx = updated.indexOf('Other');
          if (otherIdx !== -1) {
            updated.splice(otherIdx, 0, finalEventType);
          } else {
            updated.push(finalEventType);
          }
          return updated;
        });
      }

      setForm(empty); setFiles({}); setShowForm(false); load();
    } catch (err) { setError(err.response?.data?.message || err.message); }
    setSubmitting(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this event?')) return;
    await api.delete(`/dept-events/${id}`);
    load();
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Department Events</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Record and manage department-conducted events with all supporting documents</p>
        </div>
        <button onClick={() => { setShowForm(f => !f); setError(''); }}
          style={{ background: showForm ? '#f1f5f9' : '#059669', color: showForm ? '#374151' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          {showForm ? '✕ Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #bbf7d0', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: '#0f172a' }}>New Department Event</div>
          <form onSubmit={submit}>

            {/* Section: Coordinator Info */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid #d1fae5' }}>
              Coordinator Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20 }}>
              {[
                { k: 'employeeId', label: 'Employee ID *', placeholder: 'e.g. VU2021001' },
                { k: 'coordinatorName', label: 'Coordinator Name *', placeholder: 'Full name' },
              ].map(({ k, label, placeholder }) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>
                  <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
                    style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#059669'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              ))}
            </div>

            {/* Section: Event Info */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid #d1fae5' }}>
              Event Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20 }}>
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Event Name *</label>
                <input value={form.eventName} onChange={e => set('eventName', e.target.value)} placeholder="e.g. National Level Hackathon 2024" required
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Event Type</label>
                <select value={form.eventType} onChange={e => {
                  const val = e.target.value;
                  if (val === 'Other') {
                    const name = prompt('Enter new event type:');
                    if (name && name.trim()) {
                      const trimmed = name.trim();
                      if (!eventTypes.includes(trimmed)) {
                        setEventTypes(prev => {
                          const updated = [...prev];
                          const otherIdx = updated.indexOf('Other');
                          if (otherIdx !== -1) {
                            updated.splice(otherIdx, 0, trimmed);
                          } else {
                            updated.push(trimmed);
                          }
                          return updated;
                        });
                      }
                      set('eventType', trimmed);
                    } else {
                      set('eventType', '');
                    }
                  } else {
                    set('eventType', val);
                  }
                }}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Select type...</option>
                  {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Academic Year *</label>
                <select value={form.year} onChange={e => set('year', e.target.value)} required
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Select year...</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Date of Event</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Venue</label>
                <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Seminar Hall, Block A"
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Budget (₹)</label>
                <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. 25000"
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of the event..."
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Outcome / Impact</label>
                <textarea value={form.outcome} onChange={e => set('outcome', e.target.value)} rows={2} placeholder="Key outcomes, number of participants, impact..."
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>

            {/* Section: Documents */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid #d1fae5' }}>
              Supporting Documents <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Max 2MB each · JPG, PNG, PDF)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 }}>
              {DOC_FIELDS.map(({ key, label, accept }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{label}</label>
                  <input type="file" accept={accept} onChange={e => handleFile(key, e.target.files[0])}
                    style={{ padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 12, background: '#f8fafc' }} />
                  {files[key] && <span style={{ fontSize: 11, color: '#059669' }}>✓ {files[key].name}</span>}
                </div>
              ))}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>{error}</div>}
            <button type="submit" disabled={submitting}
              style={{ background: submitting ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {submitting ? 'Saving...' : '💾 Save Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 && !showForm ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎪</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>No events recorded yet</div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Click "Add Event" to record your first department event</div>
          <button onClick={() => setShowForm(true)}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            + Add Event
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map(ev => (
            <div key={ev._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {/* Event Header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: expanded === ev._id ? '#f0fdf4' : '#fff' }}
                onClick={() => setExpanded(expanded === ev._id ? null : ev._id)}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎪</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{ev.eventName}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {ev.eventType && <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{ev.eventType}</span>}
                    <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{ev.year}</span>
                    {ev.date && <span style={{ color: '#64748b', fontSize: 12 }}>📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {ev.budget && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>₹{ev.budget.toLocaleString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{expanded === ev._id ? '▲' : '▼'}</span>
                  <button onClick={e => { e.stopPropagation(); del(ev._id); }}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === ev._id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px', marginTop: 16, marginBottom: 16 }}>
                    {[
                      ['Employee ID', ev.employeeId],
                      ['Coordinator', ev.coordinatorName],
                      ['Department', ev.department],
                      ['Venue', ev.venue],
                    ].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', gap: 8, fontSize: 13, paddingBottom: 6, borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ color: '#64748b', minWidth: 110, fontWeight: 500 }}>{l}:</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {ev.description && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{ev.description}</div>
                    </div>
                  )}
                  {ev.outcome && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Outcome / Impact</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{ev.outcome}</div>
                    </div>
                  )}

                  {/* Documents */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Documents</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {DOC_FIELDS.map(({ key, label }) => ev[key]?.url ? (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', borderRadius: 8, padding: '6px 12px', border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>{label}</span>
                        <ViewButton url={ev[key].url} label="View" style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700 }} />
                      </div>
                    ) : null)}
                    {!DOC_FIELDS.some(({ key }) => ev[key]?.url) && (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>No documents uploaded</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
