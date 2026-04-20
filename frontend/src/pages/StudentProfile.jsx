import React, { useEffect, useState } from 'react';
import api from '../api';

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' },
  label: { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 3 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  btn: { background: '#1e40af', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  section: { fontWeight: 700, fontSize: 15, color: '#1e40af', margin: '0 0 12px', borderBottom: '2px solid #dbeafe', paddingBottom: 6 },
  uploadBtn: { background: '#059669', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
};

const CATEGORIES = ['VSAT', 'EAMCET', 'JEE', 'MANAGEMENT', 'NRI', 'OTHER'];

// Inline upload widget for a specific docType
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
    setFile(null);
    setUploading(false);
    onUploaded();
  };

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📎 {label}</div>
      {existing.map(d => (
        <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{d.label || d.filename}</span>
          {(d.fileUrl || d.filepath) && (
            <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer"
              style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>View</a>
          )}
          <button type="button" onClick={() => onDelete(d._id)}
            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '3px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])}
          style={{ fontSize: 12, flex: 1 }} />
        <button type="button" onClick={upload} disabled={!file || uploading} style={{ ...s.uploadBtn, opacity: !file ? 0.5 : 1 }}>
          {uploading ? '...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [docs, setDocs] = useState([]);

  const loadDocs = () => api.get('/documents/me').then(r => setDocs(r.data));

  useEffect(() => {
    api.get('/students/me').then(r => setForm(r.data));
    loadDocs();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const deleteDoc = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/documents/${id}`);
    loadDocs();
  };

  const save = async (e) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...updates } = form;
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

  const overallCgpa = (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(form[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : form.cgpa || '—';
  })();

  return (
    <div>
      <h2 style={{ marginBottom: 20, color: '#1e40af' }}>My Profile</h2>
      <form onSubmit={save}>

        {/* Personal */}
        <div style={s.card}>
          <div style={s.section}>Personal Details</div>
          <div style={s.grid}>
            <Field label="Full Name" value={form.name} onChange={v => set('name', v)} />
            <Field label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} type="date" />
            <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male','Female','Other']} />
            <Field label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} />
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)} />
            <Field label="Religion" value={form.religion} onChange={v => set('religion', v)} />
            <Field label="Caste" value={form.caste} onChange={v => set('caste', v)} />
          </div>
        </div>

        {/* Contact */}
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

        {/* Academic */}
        <div style={s.card}>
          <div style={s.section}>Academic Details</div>
          <div style={s.grid}>
            <SelectField label="Admission Category" value={form.admissionCategory} onChange={v => set('admissionCategory', v)} options={CATEGORIES} />
            <Field label="Admission Year" value={form.admissionYear} onChange={v => set('admissionYear', v)} type="number" />
            <Field label="Branch" value={form.branch} onChange={v => set('branch', v)} />
            <Field label="Section" value={form.section} onChange={v => set('section', v)} />
            <Field label="Current Year" value={form.currentYear} onChange={v => set('currentYear', v)} type="number" />
            <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} type="number" />
          </div>
        </div>

        {/* 10th */}
        <div style={s.card}>
          <div style={s.section}>10th Details</div>
          <div style={s.grid}>
            <Field label="School Name" value={form.tenthSchool} onChange={v => set('tenthSchool', v)} />
            <Field label="Board" value={form.tenthBoard} onChange={v => set('tenthBoard', v)} placeholder="e.g. CBSE, SSC" />
            <Field label="Year of Passing" value={form.tenthYear} onChange={v => set('tenthYear', v)} type="number" />
            <Field label="Percentage" value={form.tenthPercent} onChange={v => set('tenthPercent', v)} type="number" placeholder="e.g. 92.5" />
          </div>
          <InlineUpload docType="MARK_MEMO" label="10th Mark Memo" docs={docs.filter(d => d.label?.includes('10th') || d.label?.includes('SSC'))} onUploaded={loadDocs} onDelete={deleteDoc} />
        </div>

        {/* Inter */}
        <div style={s.card}>
          <div style={s.section}>Intermediate (12th) Details</div>
          <div style={s.grid}>
            <Field label="College Name" value={form.interCollege} onChange={v => set('interCollege', v)} />
            <Field label="Board" value={form.interBoard} onChange={v => set('interBoard', v)} placeholder="e.g. TSBIE, CBSE" />
            <Field label="Year of Passing" value={form.interYear} onChange={v => set('interYear', v)} type="number" />
            <Field label="Percentage" value={form.interPercent} onChange={v => set('interPercent', v)} type="number" placeholder="e.g. 95.0" />
            <Field label="Group / Stream" value={form.interGroup} onChange={v => set('interGroup', v)} placeholder="e.g. MPC, BiPC" />
          </div>
          <InlineUpload docType="MARK_MEMO" label="Inter Mark Memo" docs={docs.filter(d => d.label?.includes('Inter') || d.label?.includes('12th'))} onUploaded={loadDocs} onDelete={deleteDoc} />
        </div>

        {/* Semester CGPA */}
        <div style={s.card}>
          <div style={s.section}>Semester-wise CGPA</div>
          <div style={s.grid}>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <Field key={sem} label={`Semester ${sem} CGPA`} value={form[`sem${sem}Cgpa`]} onChange={v => set(`sem${sem}Cgpa`, v)} type="number" placeholder="e.g. 8.5" />
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#64748b' }}>Overall CGPA:</span>
            <span style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>{overallCgpa}</span>
          </div>
          {/* Semester mark memos */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📎 Semester Mark Memos</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[1,2,3,4,5,6,7,8].map(sem => {
                const semDocs = docs.filter(d => d.docType === 'MARK_MEMO' && d.label?.toLowerCase().includes(`sem ${sem}`));
                return (
                  <div key={sem} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Sem {sem}</div>
                    {semDocs.map(d => (
                      <div key={d._id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                        {(d.fileUrl || d.filepath) && <a href={d.fileUrl || d.filepath} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1e40af', fontWeight: 600 }}>View</a>}
                        <button type="button" onClick={() => deleteDoc(d._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <SemUpload sem={sem} onUploaded={loadDocs} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* IDs */}
        <div style={s.card}>
          <div style={s.section}>ID Details</div>
          <div style={s.grid}>
            <Field label="APAAR ID" value={form.apaarId} onChange={v => set('apaarId', v)} />
            <Field label="ABC ID" value={form.abcId} onChange={v => set('abcId', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <InlineUpload docType="AADHAAR" label="Aadhaar Card" docs={docs.filter(d => d.docType === 'AADHAAR')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="PAN" label="PAN Card" docs={docs.filter(d => d.docType === 'PAN')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="VOTER_ID" label="Voter ID" docs={docs.filter(d => d.docType === 'VOTER_ID')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="APAAR_ABC" label="APAAR / ABC ID" docs={docs.filter(d => d.docType === 'APAAR_ABC')} onUploaded={loadDocs} onDelete={deleteDoc} />
            <InlineUpload docType="OTHER" label="Other Documents" docs={docs.filter(d => d.docType === 'OTHER')} onUploaded={loadDocs} onDelete={deleteDoc} />
          </div>
        </div>

        {/* Coding */}
        <div style={s.card}>
          <div style={s.section}>Coding & Social Profiles</div>
          <div style={s.grid}>
            <Field label="LinkedIn Profile URL" value={form.linkedIn} onChange={v => set('linkedIn', v)} placeholder="https://linkedin.com/in/username" />
            <Field label="CodeChef Username" value={form.codeChef} onChange={v => set('codeChef', v)} />
            <Field label="LeetCode Username" value={form.leetCode} onChange={v => set('leetCode', v)} />
          </div>
        </div>

        <button style={s.btn} type="submit">Save Profile</button>
        {saved && <span style={{ marginLeft: 16, color: '#059669', fontWeight: 600 }}>✓ Saved successfully</span>}
      </form>
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
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 10, flex: 1, minWidth: 0 }} />
      <button type="button" onClick={upload} disabled={!file || uploading}
        style={{ background: '#059669', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        {uploading ? '...' : 'Upload'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 3 }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
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
