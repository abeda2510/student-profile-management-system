import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_TYPES = ['MARK_MEMO','AADHAAR','PAN','VOTER_ID','APAAR_ABC','OTHER'];

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' },
  label: { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 3 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  btn: { background: '#1e40af', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  section: { fontWeight: 700, fontSize: 15, color: '#1e40af', margin: '20px 0 12px', borderBottom: '2px solid #dbeafe', paddingBottom: 6 }
};

const CATEGORIES = ['VSAT', 'EAMCET', 'JEE', 'MANAGEMENT', 'NRI', 'OTHER'];

export default function StudentProfile() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docForm, setDocForm] = useState({ docType: '', label: '', file: null });
  const [showDocForm, setShowDocForm] = useState(false);

  const loadDocs = () => api.get('/documents/me').then(r => setDocs(r.data));

  useEffect(() => {
    api.get('/students/me').then(r => setForm(r.data));
    loadDocs();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...updates } = form;
    // parse numeric fields
    if (updates.cgpa !== '' && updates.cgpa !== undefined) updates.cgpa = parseFloat(updates.cgpa);
    if (updates.admissionYear) updates.admissionYear = parseInt(updates.admissionYear);
    if (updates.currentYear) updates.currentYear = parseInt(updates.currentYear);
    if (updates.currentSemester) updates.currentSemester = parseInt(updates.currentSemester);
    if (updates.tenthYear) updates.tenthYear = parseInt(updates.tenthYear);
    if (updates.tenthPercent) updates.tenthPercent = parseFloat(updates.tenthPercent);
    if (updates.interYear) updates.interYear = parseInt(updates.interYear);
    if (updates.interPercent) updates.interPercent = parseFloat(updates.interPercent);
    for (let i = 1; i <= 8; i++) {
      if (updates[`sem${i}Cgpa`]) updates[`sem${i}Cgpa`] = parseFloat(updates[`sem${i}Cgpa`]);
    }
    await api.put('/students/me', updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20, color: '#1e40af' }}>My Profile</h2>
      <form onSubmit={save}>
        <div style={s.card}>
          <div style={s.section}>Personal Details</div>
          <div style={s.grid}>
            <Field label="Full Name" value={form.name} onChange={v => set('name', v)} />
            <Field label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} type="date" />
            <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} />
            <Field label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} />
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)} />
            <Field label="Religion" value={form.religion} onChange={v => set('religion', v)} />
            <Field label="Caste" value={form.caste} onChange={v => set('caste', v)} />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>Contact Details</div>
          <div style={s.grid}>
            <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
            <Field label="Address" value={form.address} onChange={v => set('address', v)} />
            <Field label="Parent/Guardian Name" value={form.parentName} onChange={v => set('parentName', v)} />
            <Field label="Parent Phone" value={form.parentPhone} onChange={v => set('parentPhone', v)} />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>Academic Details</div>
          <div style={s.grid}>
            <SelectField label="Admission Category" value={form.admissionCategory} onChange={v => set('admissionCategory', v)} options={CATEGORIES} />
            <Field label="Admission Year" value={form.admissionYear} onChange={v => set('admissionYear', v)} type="number" />
            <Field label="Branch" value={form.branch} onChange={v => set('branch', v)} />
            <Field label="Section" value={form.section} onChange={v => set('section', v)} />
            <Field label="Current Year" value={form.currentYear} onChange={v => set('currentYear', v)} type="number" />
            <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} type="number" />
            <Field label="CGPA" value={form.cgpa} onChange={v => set('cgpa', v)} type="number" placeholder="e.g. 8.5" />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>10th Details</div>
          <div style={s.grid}>
            <Field label="School Name" value={form.tenthSchool} onChange={v => set('tenthSchool', v)} />
            <Field label="Board" value={form.tenthBoard} onChange={v => set('tenthBoard', v)} placeholder="e.g. CBSE, SSC" />
            <Field label="Year of Passing" value={form.tenthYear} onChange={v => set('tenthYear', v)} type="number" placeholder="e.g. 2021" />
            <Field label="Percentage / GPA" value={form.tenthPercent} onChange={v => set('tenthPercent', v)} type="number" placeholder="e.g. 92.5" />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>Intermediate (12th) Details</div>
          <div style={s.grid}>
            <Field label="College Name" value={form.interCollege} onChange={v => set('interCollege', v)} />
            <Field label="Board" value={form.interBoard} onChange={v => set('interBoard', v)} placeholder="e.g. CBSE, TSBIE" />
            <Field label="Year of Passing" value={form.interYear} onChange={v => set('interYear', v)} type="number" placeholder="e.g. 2023" />
            <Field label="Percentage / GPA" value={form.interPercent} onChange={v => set('interPercent', v)} type="number" placeholder="e.g. 95.0" />
            <Field label="Group / Stream" value={form.interGroup} onChange={v => set('interGroup', v)} placeholder="e.g. MPC, BiPC" />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>Semester-wise CGPA</div>
          <div style={s.grid}>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <Field key={sem} label={`Semester ${sem} CGPA`} value={form[`sem${sem}Cgpa`]} onChange={v => set(`sem${sem}Cgpa`, v)} type="number" placeholder="e.g. 8.5" />
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Overall CGPA: </span>
            <span style={{ fontWeight: 800, color: '#1e40af', fontSize: 16 }}>
              {(() => {
                const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(form[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
                return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : form.cgpa || '—';
              })()}
            </span>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>ID Details</div>
          <div style={s.grid}>
            <Field label="APAAR ID" value={form.apaarId} onChange={v => set('apaarId', v)} />
            <Field label="ABC ID" value={form.abcId} onChange={v => set('abcId', v)} />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.section}>Coding & Social Profiles</div>
          <div style={s.grid}>
            <Field label="LinkedIn Profile URL" value={form.linkedIn} onChange={v => set('linkedIn', v)} placeholder="https://linkedin.com/in/username" />
            <Field label="CodeChef Username" value={form.codeChef} onChange={v => set('codeChef', v)} placeholder="e.g. john_doe" />
            <Field label="LeetCode Username" value={form.leetCode} onChange={v => set('leetCode', v)} placeholder="e.g. john_doe" />
          </div>
        </div>

        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={s.section}>My Documents</div>
            <button type="button" onClick={() => setShowDocForm(!showDocForm)}
              style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {showDocForm ? 'Cancel' : '+ Upload'}
            </button>
          </div>
          {showDocForm && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={s.grid}>
                <div>
                  <label style={s.label}>Document Type *</label>
                  <select style={{ ...s.input, marginBottom: 0 }} value={docForm.docType} onChange={e => setDocForm(f => ({ ...f, docType: e.target.value }))} required>
                    <option value="">Select type</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Label</label>
                  <input style={{ ...s.input, marginBottom: 0 }} placeholder="e.g. Sem 1 Mark Memo" value={docForm.label} onChange={e => setDocForm(f => ({ ...f, label: e.target.value }))} />
                </div>
              </div>
              <input style={{ ...s.input, marginTop: 10 }} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocForm(f => ({ ...f, file: e.target.files[0] }))} />
              <button type="button" onClick={async () => {
                if (!docForm.docType || !docForm.file) return alert('Select type and file');
                const fd = new FormData();
                fd.append('docType', docForm.docType);
                fd.append('label', docForm.label);
                fd.append('file', docForm.file);
                await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                setDocForm({ docType: '', label: '', file: null });
                setShowDocForm(false);
                loadDocs();
              }} style={{ ...s.btn, marginTop: 10, fontSize: 13 }}>Upload</button>
            </div>
          )}
          {docs.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>No documents uploaded yet.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(d => (
              <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.docType?.replace('_', ' ')}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label || d.filename}</span>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(d.uploadedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(d.fileUrl || d.filepath) && (
                    <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer"
                      style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View</a>
                  )}
                  <button type="button" onClick={async () => { if (!confirm('Delete?')) return; await api.delete(`/documents/${d._id}`); loadDocs(); }}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button style={s.btn} type="submit">Save Profile</button>
        {saved && <span style={{ marginLeft: 16, color: '#059669', fontWeight: 600 }}>Saved successfully</span>}
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 3 }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 3 }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
