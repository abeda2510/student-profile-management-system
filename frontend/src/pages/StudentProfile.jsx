import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_TYPES = ['MARK_MEMO','AADHAAR','PAN','VOTER_ID','APAAR_ABC','OTHER'];
const CATEGORIES = ['VSAT', 'EAMCET', 'JEE', 'MANAGEMENT', 'NRI', 'OTHER'];

const SectionCard = ({ icon, title, color = '#1e40af', bg = '#eff6ff', children }) => (
  <div className="card" style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '', span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }} className="field-group">
    <label className="field-label">{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || label} />
  </div>
);

const SelectF = ({ label, value, onChange, options }) => (
  <div className="field-group">
    <label className="field-label">{label}</label>
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">Select {label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

function InlineUpload({ docType, label, docs, onUploaded, onDelete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const existing = docs.filter(d => d.docType === docType);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('docType', docType);
    fd.append('label', label);
    fd.append('file', file);
    await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setFile(null); setUploading(false); onUploaded();
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        📎 {label}
      </div>
      {existing.map(d => (
        <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, color: '#059669', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {d.label || d.filename}</span>
          {(d.fileUrl || d.filepath) && (
            <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer"
              style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>View</a>
          )}
          <button type="button" onClick={() => onDelete(d._id)}
            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div className="upload-box" style={{ padding: 12 }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])}
          style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, boxShadow: 'none' }} />
        {file && (
          <button type="button" onClick={upload} disabled={uploading}
            style={{ marginTop: 8, background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            {uploading ? 'Uploading...' : '📤 Upload'}
          </button>
        )}
      </div>
    </div>
  );
}

function SemUpload({ sem, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('docType', 'MARK_MEMO');
    fd.append('label', `Sem ${sem} Mark Memo`);
    fd.append('file', file);
    await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setFile(null); setUploading(false); onUploaded();
  };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])}
        style={{ fontSize: 11, flex: 1, minWidth: 0, padding: '5px 8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 7 }} />
      <button type="button" onClick={upload} disabled={!file || uploading}
        style={{ background: file ? 'linear-gradient(135deg,#059669,#10b981)' : '#e2e8f0', color: file ? '#fff' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 11, cursor: file ? 'pointer' : 'default', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {uploading ? '...' : '↑'}
      </button>
    </div>
  );
}

export default function StudentProfile() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [docs, setDocs] = useState([]);

  const loadDocs = () => api.get('/documents/me').then(r => setDocs(r.data)).catch(() => {});

  useEffect(() => {
    api.get('/students/me').then(r => setForm(r.data)).catch(() => {});
    loadDocs();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    loadDocs();
  };

  const save = async (e) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...updates } = form;
    const nums = ['cgpa','admissionYear','currentYear','currentSemester','tenthYear','tenthPercent','interYear','interPercent'];
    nums.forEach(k => { if (updates[k]) updates[k] = parseFloat(updates[k]); });
    for (let i = 1; i <= 8; i++) { if (updates[`sem${i}Cgpa`]) updates[`sem${i}Cgpa`] = parseFloat(updates[`sem${i}Cgpa`]); }
    await api.put('/students/me', updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const overallCgpa = (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(form[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : form.cgpa || null;
  })();

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Profile</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Manage your personal, academic and document information</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && (
            <span style={{ background: '#d1fae5', color: '#065f46', padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              ✓ Saved successfully
            </span>
          )}
          <button className="btn-primary" type="button" onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            💾 Save Profile
          </button>
        </div>
      </div>

      <form onSubmit={save}>

        {/* Personal Details */}
        <SectionCard icon="👤" title="Personal Details" bg="#eff6ff">
          <div style={grid2}>
            <Field label="Full Name" value={form.name} onChange={v => set('name', v)} />
            <Field label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} type="date" />
            <SelectF label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male','Female','Other']} />
            <Field label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} placeholder="e.g. O+" />
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)} />
            <Field label="Religion" value={form.religion} onChange={v => set('religion', v)} />
            <Field label="Caste" value={form.caste} onChange={v => set('caste', v)} />
          </div>
        </SectionCard>

        {/* Contact Details */}
        <SectionCard icon="📞" title="Contact Details" bg="#f0fdf4">
          <div style={grid2}>
            <Field label="Email Address" value={form.email} onChange={v => set('email', v)} type="email" />
            <Field label="Phone Number" value={form.phone} onChange={v => set('phone', v)} />
            <Field label="Address" value={form.address} onChange={v => set('address', v)} span={2} />
            <Field label="Parent / Guardian Name" value={form.parentName} onChange={v => set('parentName', v)} />
            <Field label="Parent Phone" value={form.parentPhone} onChange={v => set('parentPhone', v)} />
          </div>
        </SectionCard>

        {/* Academic Details */}
        <SectionCard icon="🎓" title="Academic Details" bg="#faf5ff">
          <div style={grid2}>
            <SelectF label="Admission Category" value={form.admissionCategory} onChange={v => set('admissionCategory', v)} options={CATEGORIES} />
            <Field label="Admission Year" value={form.admissionYear} onChange={v => set('admissionYear', v)} type="number" placeholder="e.g. 2023" />
            <Field label="Branch / Department" value={form.branch} onChange={v => set('branch', v)} />
            <Field label="Section" value={form.section} onChange={v => set('section', v)} />
            <Field label="Current Year" value={form.currentYear} onChange={v => set('currentYear', v)} type="number" />
            <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} type="number" />
          </div>
        </SectionCard>

        {/* 10th Details */}
        <SectionCard icon="📚" title="10th / SSC Details" bg="#fff7ed">
          <div style={grid2}>
            <Field label="School Name" value={form.tenthSchool} onChange={v => set('tenthSchool', v)} />
            <Field label="Board" value={form.tenthBoard} onChange={v => set('tenthBoard', v)} placeholder="e.g. CBSE, SSC" />
            <Field label="Year of Passing" value={form.tenthYear} onChange={v => set('tenthYear', v)} type="number" placeholder="e.g. 2021" />
            <Field label="Percentage / GPA" value={form.tenthPercent} onChange={v => set('tenthPercent', v)} type="number" placeholder="e.g. 92.5" />
          </div>
          <div style={{ marginTop: 16 }}>
            <InlineUpload docType="MARK_MEMO" label="10th Mark Memo / Certificate"
              docs={docs.filter(d => d.docType === 'MARK_MEMO' && (d.label?.includes('10th') || d.label?.includes('SSC')))}
              onUploaded={loadDocs} onDelete={deleteDoc} />
          </div>
        </SectionCard>

        {/* Inter Details */}
        <SectionCard icon="🏫" title="Intermediate / 12th Details" bg="#f0fdf4">
          <div style={grid2}>
            <Field label="College Name" value={form.interCollege} onChange={v => set('interCollege', v)} />
            <Field label="Board" value={form.interBoard} onChange={v => set('interBoard', v)} placeholder="e.g. TSBIE, CBSE" />
            <Field label="Year of Passing" value={form.interYear} onChange={v => set('interYear', v)} type="number" placeholder="e.g. 2023" />
            <Field label="Percentage / GPA" value={form.interPercent} onChange={v => set('interPercent', v)} type="number" placeholder="e.g. 95.0" />
            <Field label="Group / Stream" value={form.interGroup} onChange={v => set('interGroup', v)} placeholder="e.g. MPC, BiPC" />
          </div>
          <div style={{ marginTop: 16 }}>
            <InlineUpload docType="MARK_MEMO" label="Inter Mark Memo / Certificate"
              docs={docs.filter(d => d.docType === 'MARK_MEMO' && (d.label?.includes('Inter') || d.label?.includes('12th')))}
              onUploaded={loadDocs} onDelete={deleteDoc} />
          </div>
        </SectionCard>

        {/* Semester CGPA */}
        <SectionCard icon="📊" title="Semester-wise CGPA" bg="#eff6ff">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 16px', marginBottom: 16 }}>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <div key={sem} className="field-group">
                <label className="field-label">Semester {sem}</label>
                <input type="number" step="0.01" min="0" max="10"
                  value={form[`sem${sem}Cgpa`] || ''}
                  onChange={e => set(`sem${sem}Cgpa`, e.target.value)}
                  placeholder="0.00" />
              </div>
            ))}
          </div>

          {overallCgpa && (
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #0369a1)', borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall CGPA</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{overallCgpa}</div>
              </div>
              <div style={{ fontSize: 48, opacity: 0.3 }}>⭐</div>
            </div>
          )}

          {/* Semester mark memos */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>📎 Semester Mark Memos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[1,2,3,4,5,6,7,8].map(sem => {
                const semDocs = docs.filter(d => d.docType === 'MARK_MEMO' && d.label?.toLowerCase().includes(`sem ${sem}`));
                return (
                  <div key={sem} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>Sem {sem}</div>
                    {semDocs.map(d => (
                      <div key={d._id} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                        {(d.fileUrl || d.filepath) && <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>✓ View</a>}
                        <button type="button" onClick={() => deleteDoc(d._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <SemUpload sem={sem} onUploaded={loadDocs} />
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ID Details + Documents */}
        <SectionCard icon="🪪" title="ID Details & Documents" bg="#fdf4ff">
          <div style={grid2}>
            <Field label="APAAR ID" value={form.apaarId} onChange={v => set('apaarId', v)} />
            <Field label="ABC ID" value={form.abcId} onChange={v => set('abcId', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
            <InlineUpload docType="AADHAAR" label="Aadhaar Card" docs={docs.filter(d => d.docType === 'AADHAAR')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="PAN" label="PAN Card" docs={docs.filter(d => d.docType === 'PAN')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="VOTER_ID" label="Voter ID" docs={docs.filter(d => d.docType === 'VOTER_ID')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="APAAR_ABC" label="APAAR / ABC ID" docs={docs.filter(d => d.docType === 'APAAR_ABC')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="OTHER" label="Other Documents" docs={docs.filter(d => d.docType === 'OTHER')} onUploaded={loadDocs} onDelete={deleteDoc} />
          </div>
        </SectionCard>

        {/* Coding Profiles */}
        <SectionCard icon="💻" title="Coding & Social Profiles" bg="#f0fdf4">
          <div style={grid3}>
            <Field label="LinkedIn Profile URL" value={form.linkedIn} onChange={v => set('linkedIn', v)} placeholder="https://linkedin.com/in/..." />
            <Field label="LeetCode Username" value={form.leetCode} onChange={v => set('leetCode', v)} placeholder="e.g. john_doe" />
            <Field label="CodeChef Username" value={form.codeChef} onChange={v => set('codeChef', v)} placeholder="e.g. john_doe" />
          </div>
        </SectionCard>

        {/* Save button bottom */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
          {saved && <span style={{ background: '#d1fae5', color: '#065f46', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>✓ Saved!</span>}
          <button className="btn-primary" type="submit" style={{ padding: '12px 32px', fontSize: 15 }}>💾 Save Profile</button>
        </div>
      </form>
    </div>
  );
}
