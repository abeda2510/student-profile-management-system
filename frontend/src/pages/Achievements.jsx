import { useEffect, useState } from 'react';
import api from '../api';

const TYPES = [
  'HACKATHON WINNER','HACKATHON RUNNER','HACKATHON PARTICIPATION',
  'INTERNSHIP','RESEARCH_PUBLICATION',
  'TECHNICAL_COMPETITION WINNER','TECHNICAL_COMPETITION PARTICIPATION',
  'WORKSHOP','SEMINAR','CULTURAL',
  'SPORTS WINNER','SPORTS PARTICIPATION',
  'OTHER'
];
const SUB_TYPES = {};
const POINTS_GUIDE = {
  'HACKATHON WINNER': 10, 'HACKATHON RUNNER': 7, 'HACKATHON PARTICIPATION': 5,
  'INTERNSHIP': 8, 'RESEARCH_PUBLICATION': 12,
  'TECHNICAL_COMPETITION WINNER': 10, 'TECHNICAL_COMPETITION PARTICIPATION': 4,
  'WORKSHOP': 3, 'SEMINAR': 2, 'CULTURAL': 3,
  'SPORTS WINNER': 8, 'SPORTS PARTICIPATION': 3, 'OTHER': 2,
};
const STATUS_COLOR = {
  PENDING:  { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  APPROVED: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
  REJECTED: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
};
const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', color: '#0f172a', background: '#fff' };
const empty = { activityType: '', semester: '', description: '', position: '', issuingOrg: '', date: '', certificate: null };

export default function Achievements() {
  const [list, setList] = useState([]);
  const [myPoints, setMyPoints] = useState({ points: 0 });
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = () => {
    api.get('/achievements/me').then(r => setList(r.data));
    api.get('/achievements/my-points').then(r => setMyPoints(r.data));
  };

  useEffect(() => { load(); }, [filter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSubmitError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'certificate') fd.append(k, v); });
      fd.append('title', form.activityType);
      if (form.certificate) fd.append('certificate', form.certificate);
      await api.post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(empty); setShowForm(false); load();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to add achievement. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    await api.delete(`/achievements/${id}`); load();
  };

  const subTypes = [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Achievements</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Track and manage your academic achievements</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowGuide(!showGuide)}
            style={{ background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            📋 Points Guide
          </button>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {showForm ? '✕ Cancel' : '+ Add Achievement'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ borderTop: `3px solid #1e40af`, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 12px', fontSize: 22 }}>⭐</div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#1e40af', lineHeight: 1 }}>{myPoints.points}</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 4 }}>Total Points</div>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="card" style={{ background: '#f8fafc', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 12 }}>Points Table</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {Object.entries(POINTS_GUIDE).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, fontSize: 13, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#374151', fontWeight: 500 }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 800, color: '#1e40af' }}>{v} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Add New Achievement</div>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <div>
                <select style={inp} value={form.activityType} onChange={e => set('activityType', e.target.value)} required>
                  <option value="">Activity Type *</option>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <input style={inp} placeholder="Academic Year (e.g. 2023-24)" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} />
                <input style={inp} placeholder="Semester" value={form.semester} onChange={e => set('semester', e.target.value)} />
              </div>
              <div>
                <input style={inp} placeholder="Issuing Organization" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} />
                <input style={inp} placeholder="Position / Award" value={form.position} onChange={e => set('position', e.target.value)} />
                <input style={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                <input style={inp} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => set('certificate', e.target.files[0])} />
              </div>
            </div>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Description (optional)"
              value={form.description} onChange={e => set('description', e.target.value)} />
            {submitError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>{submitError}</div>}
            <button className="btn-primary" type="submit" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? 'Adding...' : 'Add Achievement'}</button>
          </form>
        </div>
      )}

      {list.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>No achievements yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Click "+ Add Achievement" to get started</div>
        </div>
      )}

      {list.map(a => {
      return (
          <div key={a._id} className="card" style={{ borderLeft: `4px solid #cbd5e1`, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{a.activityType?.replace(/_/g, ' ')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {a.subType && a.subType !== 'NA' && <Tag bg="#ede9fe" color="#5b21b6">{a.subType}</Tag>}
                  {a.semester && <Tag bg="#fffbeb" color="#92400e">Sem {a.semester}</Tag>}
                  {a.status === 'APPROVED' && <Tag bg="#1e40af" color="#fff">🏆 {a.points} pts</Tag>}
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                  {a.issuingOrg && <span><span style={{ color: '#94a3b8' }}>Org:</span> <strong style={{ color: '#1e293b' }}>{a.issuingOrg}</strong></span>}
                  {a.position && <span><span style={{ color: '#94a3b8' }}>Position:</span> <strong style={{ color: '#1e293b' }}>{a.position}</strong></span>}
                  {a.date && <span><span style={{ color: '#94a3b8' }}>Date:</span> <strong style={{ color: '#1e293b' }}>{a.date}</strong></span>}
                </div>
                {a.description && <div style={{ fontSize: 13, marginTop: 8, color: '#374151', lineHeight: 1.6, background: '#f8fafc', padding: '8px 12px', borderRadius: 7 }}>{a.description}</div>}
                {a.reviewNote && (
                  <div style={{ fontSize: 12, marginTop: 8, color: a.status === 'REJECTED' ? '#dc2626' : '#059669', fontStyle: 'italic', fontWeight: 500 }}>
                    💬 Review note: {a.reviewNote}
                  </div>
                )}
                {(a.certificatePath || a.certificateFile) && (
                  <a href={a.certificatePath || `http://localhost:5000/uploads/achievements/${localStorage.getItem('regNumber')}/${a.certificateFile}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1e40af', marginTop: 10, fontWeight: 600, background: '#eff6ff', padding: '5px 12px', borderRadius: 7 }}>
                    📎 View Certificate
                  </a>
                )}
              </div>
              <button className="btn-danger" style={{ marginLeft: 16, flexShrink: 0 }} onClick={() => del(a._id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Tag({ bg, color, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.2px' }}>
      {children}
    </span>
  );
}
