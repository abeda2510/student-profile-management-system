import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_TYPES = ['MARK_MEMO','AADHAAR','PAN','VOTER_ID','APAAR_ABC','OTHER'];

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 14 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginBottom: 10 },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginBottom: 10 },
  btn: { background: '#059669', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  del: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  tag: { display: 'inline-block', background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }
};

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ docType: '', label: '', file: null });
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/documents/me').then(r => setDocs(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('docType', form.docType);
    fd.append('label', form.label);
    fd.append('file', form.file);
    await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setForm({ docType: '', label: '', file: null });
    setShowForm(false);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#059669' }}>My Documents</h2>
        <button style={s.btn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Upload Document'}</button>
      </div>

      {showForm && (
        <div style={s.card}>
          <h3 style={{ marginBottom: 14, color: '#374151' }}>Upload Document</h3>
          <form onSubmit={submit}>
            <select style={s.select} value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} required>
              <option value="">Document Type *</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input style={s.input} placeholder="Label (e.g. Semester 1 Mark Memo)"
              value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>⚠️ Only JPG, JPEG, PNG files are allowed</div>
              <input style={s.input} type="file" accept=".jpg,.jpeg,.png"
                onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} required />
            </div>
            <button style={s.btn} type="submit">Upload</button>
          </form>
        </div>
      )}

      {docs.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>No documents uploaded yet.</div>}
      {docs.map(d => (
        <div key={d._id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={s.tag}>{d.docType?.replace('_', ' ')}</span>
              <span style={{ marginLeft: 10, fontWeight: 600 }}>{d.label || d.filename}</span>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Uploaded: {new Date(d.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={d.fileUrl || d.filepath}
                target="_blank" rel="noreferrer"
                style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                View
              </a>
              <button style={s.del} onClick={() => del(d._id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
