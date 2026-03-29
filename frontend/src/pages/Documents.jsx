import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_TYPES = ['MARK_MEMO','AADHAAR','PAN','VOTER_ID','APAAR_ABC','OTHER'];
const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, marginBottom: 12, color: '#0f172a', background: '#fff' };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Documents</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Upload and manage your important documents</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          {showForm ? '✕ Cancel' : '+ Upload Document'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Upload New Document</div>
          <form onSubmit={submit}>
            <select style={inp} value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} required>
              <option value="">Select Document Type *</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <input style={inp} placeholder="Label (e.g. Semester 1 Mark Memo)"
              value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <input style={inp} type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} required />
            <button className="btn-success" type="submit">Upload Document</button>
          </form>
        </div>
      )}

      {docs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>No documents uploaded yet</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Click "+ Upload Document" to add your first document</div>
        </div>
      )}

      {docs.map(d => (
        <div key={d._id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '10px 12px', fontSize: 22 }}>📄</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{d.label || d.filename}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center' }}>
                  <span style={{ background: '#ecfdf5', color: '#065f46', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {d.docType?.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Uploaded {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={d.fileUrl || d.filepath}
                target="_blank" rel="noreferrer"
                style={{ background: '#eff6ff', color: '#1e40af', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                View
              </a>
              <button onClick={() => del(d._id)}
                style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
