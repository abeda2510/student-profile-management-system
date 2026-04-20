import { useEffect, useState } from 'react';
import api from '../api';

const TYPES = ['HACKATHON','INTERNSHIP','RESEARCH_PUBLICATION','TECHNICAL_COMPETITION','CULTURAL','SPORTS','WORKSHOP','SEMINAR','OTHER'];
const SUB_TYPES = { HACKATHON: ['WINNER','RUNNER','PARTICIPATION'], TECHNICAL_COMPETITION: ['WINNER','RUNNER','PARTICIPATION'], SPORTS: ['WINNER','PARTICIPATION'] };

const POINTS_GUIDE = {
  'HACKATHON WINNER': 10, 'HACKATHON RUNNER': 7, 'HACKATHON PARTICIPATION': 5,
  'INTERNSHIP': 8, 'RESEARCH_PUBLICATION': 12,
  'TECHNICAL_COMPETITION WINNER': 10, 'TECHNICAL_COMPETITION PARTICIPATION': 4,
  'WORKSHOP': 3, 'SEMINAR': 2, 'CULTURAL': 3,
  'SPORTS WINNER': 8, 'SPORTS PARTICIPATION': 3, 'OTHER': 2,
};

const STATUS_STYLE = {
  PENDING:  { background: '#fef3c7', color: '#92400e' },
  APPROVED: { background: '#d1fae5', color: '#065f46' },
  REJECTED: { background: '#fee2e2', color: '#991b1b' },
};

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  btn: (c='#1e40af') => ({ background: c, color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }),
  tag: (bg='#dbeafe', color='#1e40af') => ({ display: 'inline-block', background: bg, color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginRight: 6 }),
};

const empty = { title: '', activityType: '', subType: '', academicYear: '', semester: '', description: '', position: '', issuingOrg: '', date: '', certificate: null };

export default function Achievements() {
  const [list, setList] = useState([]);
  const [myPoints, setMyPoints] = useState({ points: 0, approved: 0 });
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState({ academicYear: '', activityType: '', status: '' });
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const load = () => {
    const params = {};
    if (filter.academicYear) params.academicYear = filter.academicYear;
    if (filter.activityType) params.activityType = filter.activityType;
    if (filter.status) params.status = filter.status;
    api.get('/achievements/me', { params }).then(r => setList(r.data));
    api.get('/achievements/my-points').then(r => setMyPoints(r.data));
  };

  useEffect(() => { load(); }, [filter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v && k !== 'certificate') fd.append(k, v); });
    if (form.certificate) fd.append('certificate', form.certificate);
    await api.post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setForm(empty); setShowForm(false); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    await api.delete(`/achievements/${id}`); load();
  };

  const subTypes = SUB_TYPES[form.activityType] || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#1e40af' }}>My Achievements</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btn('#64748b')} onClick={() => setShowGuide(!showGuide)}>📋 Points Guide</button>
          <button style={s.btn()} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Achievement'}</button>
        </div>
      </div>

      {/* Points summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#1e40af', color: '#fff', borderRadius: 12, padding: '16px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{myPoints.points}</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Total Points</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 28px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{myPoints.approved}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Approved</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 28px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{list.filter(a => a.status === 'PENDING').length}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Pending Review</div>
        </div>
      </div>

      {/* Points guide */}
      {showGuide && (
        <div style={{ ...s.card, background: '#f8fafc', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: '#1e40af' }}>Points Table</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {Object.entries(POINTS_GUIDE).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fff', borderRadius: 6, fontSize: 13 }}>
                <span>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 700, color: '#1e40af' }}>{v} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...s.input, marginBottom: 0, width: 160 }} placeholder="Academic Year e.g. 2023-24"
          value={filter.academicYear} onChange={e => setFilter(f => ({ ...f, academicYear: e.target.value }))} />
        <select style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
          value={filter.activityType} onChange={e => setFilter(f => ({ ...f, activityType: e.target.value }))}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
          value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#374151', fontSize: 16, fontWeight: 700 }}>Add Achievement — TECHNICAL</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>✕ Close</button>
          </div>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <input style={s.input} placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} required />
              <input style={s.input} placeholder="Issuing Organization" value={form.issuingOrg} onChange={e => set('issuingOrg', e.target.value)} />
              <select style={s.input} value={form.activityType} onChange={e => set('activityType', e.target.value)} required>
                <option value="">Activity Type *</option>
                {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select style={s.input} value={form.position} onChange={e => set('position', e.target.value)}>
                <option value="">🏆 Position / Award</option>
                <option value="1st Place">1st Place</option>
                <option value="2nd Place">2nd Place</option>
                <option value="3rd Place">3rd Place</option>
                <option value="Winner">Winner</option>
                <option value="Runner Up">Runner Up</option>
                <option value="Participation">Participation</option>
                <option value="Completed">Completed</option>
                <option value="Other">Other</option>
              </select>
              <input style={s.input} placeholder="Academic Year (e.g. 2023-24)" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} />
              <input style={s.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              {subTypes.length > 0 && (
                <select style={s.input} value={form.subType} onChange={e => set('subType', e.target.value)}>
                  <option value="">Participation Level</option>
                  {subTypes.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              )}
              <input style={{ ...s.input, gridColumn: subTypes.length > 0 ? '2' : '1 / span 2' }} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => set('certificate', e.target.files[0])} />
            </div>
            <textarea style={{ ...s.input, height: 80, resize: 'vertical', marginTop: 4 }} placeholder="Description"
              value={form.description} onChange={e => set('description', e.target.value)} />
            <button style={{ ...s.btn(), marginTop: 4 }} type="submit">Submit</button>
          </form>
        </div>
      )}

      {/* List */}
      {list.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>No achievements found.</div>}
      {list.map(a => (
        <div key={a._id} style={{ ...s.card, borderLeft: `4px solid ${a.status === 'APPROVED' ? '#059669' : a.status === 'REJECTED' ? '#ef4444' : '#f59e0b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{a.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                <span style={s.tag()}>{a.activityType?.replace(/_/g, ' ')}</span>
                {a.subType && a.subType !== 'NA' && <span style={s.tag('#ede9fe', '#5b21b6')}>{a.subType}</span>}
                {a.academicYear && <span style={s.tag('#dcfce7', '#166534')}>{a.academicYear}</span>}
                {a.semester && <span style={s.tag('#fef3c7', '#92400e')}>Sem {a.semester}</span>}
                <span style={{ ...s.tag(), ...STATUS_STYLE[a.status] }}>{a.status}</span>
                {a.status === 'APPROVED' && (
                  <span style={s.tag('#1e40af', '#fff')}>🏆 {a.points} pts</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                {a.position && <span>Position: {a.position} &nbsp;|&nbsp; </span>}
                {a.date && <span>Date: {a.date}</span>}
              </div>
              {a.description && <div style={{ fontSize: 13, marginTop: 6, color: '#374151' }}>{a.description}</div>}
              {a.reviewNote && (
                <div style={{ fontSize: 12, marginTop: 6, color: a.status === 'REJECTED' ? '#ef4444' : '#059669', fontStyle: 'italic' }}>
                  Review note: {a.reviewNote}
                </div>
              )}
              {(a.certificateUrl || a.certificatePath) && (
                <a href={a.certificateUrl || a.certificatePath}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#1e40af', marginTop: 6, display: 'inline-block' }}>
                  📎 View Certificate
                </a>
              )}
            </div>
            {a.status === 'PENDING' && (
              <button style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                onClick={() => del(a._id)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
