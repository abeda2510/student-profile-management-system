import React, { useEffect, useState } from 'react';
import api from '../api';

const DOC_TYPES = ['MARK_MEMO','AADHAAR','PAN','VOTER_ID','APAAR_ABC','OTHER'];
const CATEGORIES = ['VSAT', 'EAMCET', 'JEE', 'INTER_MERIT', 'MANAGEMENT', 'OTHER'];

const SectionCard = ({ icon, title, bg = '#eff6ff', children }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: '24px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf3', marginBottom: 20, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 14, borderBottom: '2px solid #f1f5f9' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '', span = 1 }) => (
  <div style={{ gridColumn: `span ${span}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a', transition: 'border-color 0.15s' }}
      onFocus={e => e.target.style.borderColor = '#3b82f6'}
      onBlur={e => e.target.style.borderColor = '#d1d5db'} />
  </div>
);

const SelectF = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</label>
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}>
      <option value="">Select...</option>
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
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])}
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
  const inputRef = React.useRef();

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
    <div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
        onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
      {!file ? (
        <button type="button" onClick={() => inputRef.current.click()}
          style={{ width: '100%', padding: '7px 0', background: '#eff6ff', border: '1.5px dashed #93c5fd', borderRadius: 7, color: '#1e40af', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          📎 Choose File
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 10, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '4px 0' }}>{file.name}</span>
          <button type="button" onClick={upload} disabled={uploading}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {uploading ? '...' : '↑ Upload'}
          </button>
          <button type="button" onClick={() => setFile(null)}
            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>✕</button>
        </div>
      )}
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
    const nums = ['cgpa','admissionYear','currentYear','currentSemester','tenthYear','tenthPercent','interYear','interPercent','leetCodeSolved','leetCodeEasy','leetCodeMedium','leetCodeHard','codeChefRating','codeChefStars','codeChefRank'];
    nums.forEach(k => { if (updates[k]) updates[k] = parseFloat(updates[k]); });
    for (let i = 1; i <= 8; i++) {
      if (updates[`sem${i}Cgpa`]) updates[`sem${i}Cgpa`] = parseFloat(updates[`sem${i}Cgpa`]);
      if (updates[`sem${i}Sgpa`]) updates[`sem${i}Sgpa`] = parseFloat(updates[`sem${i}Sgpa`]);
    }
    await api.put('/students/me', updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const overallCgpa = (() => {
    const vals = [1,2,3,4,5,6,7,8].map(i => parseFloat(form[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : form.cgpa || null;
  })();

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px 24px' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>My Profile</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Keep your information up to date</p>
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
          <button type="button" onClick={async () => {
            const token = localStorage.getItem('token');
            const regNumber = form.regNumber;
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${baseUrl}/students/profile-pdf/${regNumber}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { alert('PDF generation failed'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${regNumber}_profile.pdf`; a.click();
            URL.revokeObjectURL(url);
          }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e40af', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            📄 Download PDF
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Admission Category</label>
              <select value={form.admissionCategory || ''} onChange={e => set('admissionCategory', e.target.value)}
                style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}>
                <option value="">Select...</option>
                {CATEGORIES.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
              {form.admissionCategory === 'OTHER' && (
                <input placeholder="Specify category..." value={form.admissionCategoryOther || ''}
                  onChange={e => set('admissionCategoryOther', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', marginTop: 6 }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Admission Year</label>
              <select value={form.admissionYear || ''} onChange={e => set('admissionYear', e.target.value)}
                style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}>
                <option value="">Select...</option>
                {Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => {
                  const y = 2019 + i;
                  return <option key={y} value={`${y}-${String(y+1).slice(2)}`}>{y}-{String(y+1).slice(2)}</option>;
                })}
              </select>
            </div>
            <Field label="Branch / Department" value={form.branch} onChange={v => set('branch', v)} />
            <Field label="Section" value={form.section} onChange={v => set('section', v)} />
            <Field label="Current Year" value={form.currentYear} onChange={v => set('currentYear', v)} type="number" />
            <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} type="number" />
          </div>

          {/* Semester CGPA & SGPA inline */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semester-wise CGPA & SGPA</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[1,2,3,4,5,6,7,8].map(sem => {
                const completedSems = (parseInt(form.currentYear) || 0) * 2;
                const isCompleted = sem <= completedSems;
                return (
                  <div key={sem} style={{ background: isCompleted ? '#f8fafc' : '#f1f5f9', borderRadius: 10, padding: '10px 12px', border: `1px solid ${isCompleted ? '#e2e8f0' : '#e8edf3'}`, opacity: isCompleted ? 1 : 0.45 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>Sem {sem}</div>
                    {isCompleted ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>CGPA</label>
                          <input type="number" step="0.01" min="0" max="10" value={form[`sem${sem}Cgpa`] || ''} onChange={e => set(`sem${sem}Cgpa`, e.target.value)} placeholder="0.00"
                            style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none', marginTop: 2 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>SGPA</label>
                          <input type="number" step="0.01" min="0" max="10" value={form[`sem${sem}Sgpa`] || ''} onChange={e => set(`sem${sem}Sgpa`, e.target.value)} placeholder="0.00"
                            style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none', marginTop: 2 }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>Not yet</div>
                    )}
                  </div>
                );
              })}
            </div>
            {overallCgpa && (
              <div style={{ marginTop: 12, background: 'linear-gradient(135deg,#1e40af,#0369a1)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Overall CGPA</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{overallCgpa}</div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* 10th Details */}
        <SectionCard icon="📚" title="10th / SSC Details" bg="#fff7ed">
          <div style={grid2}>
            <Field label="School Name" value={form.tenthSchool} onChange={v => set('tenthSchool', v)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Board</label>
              <select value={['SSC','CBSE','ICSE','OTHER'].includes(form.tenthBoard) ? form.tenthBoard : (form.tenthBoard ? 'OTHER' : '')}
                onChange={e => set('tenthBoard', e.target.value)}
                style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}>
                <option value="">Select...</option>
                <option value="SSC">SSC</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="OTHER">Other</option>
              </select>
              {(form.tenthBoard === 'OTHER' || (form.tenthBoard && !['SSC','CBSE','ICSE','OTHER',''].includes(form.tenthBoard))) && (
                <input placeholder="Enter board name" value={form.tenthBoard === 'OTHER' ? '' : form.tenthBoard}
                  onChange={e => set('tenthBoard', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
              )}
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Board</label>
              <select value={['TSBIE','APBIE','CBSE','ICSE','OTHER'].includes(form.interBoard) ? form.interBoard : (form.interBoard ? 'OTHER' : '')}
                onChange={e => set('interBoard', e.target.value)}
                style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#0f172a' }}>
                <option value="">Select...</option>
                <option value="TSBIE">TSBIE</option>
                <option value="APBIE">APBIE</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="OTHER">Other</option>
              </select>
              {(form.interBoard === 'OTHER' || (form.interBoard && !['TSBIE','APBIE','CBSE','ICSE','OTHER',''].includes(form.interBoard))) && (
                <input placeholder="Enter board name" value={form.interBoard === 'OTHER' ? '' : form.interBoard}
                  onChange={e => set('interBoard', e.target.value)}
                  style={{ padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
              )}
            </div>
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

        {/* ID Details + Documents */}
        <SectionCard icon="🪪" title="ID Details & Documents" bg="#fdf4ff">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* APAAR / ABC ID */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>🎓 APAAR / ABC ID</div>
              <div style={grid2}>
                <Field label="APAAR / ABC ID Number" value={form.apaarId} onChange={v => { set('apaarId', v); set('abcId', v); }} placeholder="Enter ID number" />
              </div>
              <div style={{ marginTop: 12 }}>
                <InlineUpload docType="APAAR_ABC" label="Upload APAAR / ABC ID Document"
                  docs={docs.filter(d => d.docType === 'APAAR_ABC')} onUploaded={loadDocs} onDelete={deleteDoc} />
              </div>
            </div>

            {/* Aadhaar */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>🪪 Aadhaar Card</div>
              <Field label="Aadhaar Number" value={form.aadhaarNumber} onChange={v => set('aadhaarNumber', v)} placeholder="XXXX XXXX XXXX" />
              <div style={{ marginTop: 12 }}>
                <InlineUpload docType="AADHAAR" label="Upload Aadhaar Card"
                  docs={docs.filter(d => d.docType === 'AADHAAR')} onUploaded={loadDocs} onDelete={deleteDoc} />
              </div>
            </div>

            {/* PAN */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>💳 PAN Card</div>
              <InlineUpload docType="PAN" label="Upload PAN Card"
                docs={docs.filter(d => d.docType === 'PAN')} onUploaded={loadDocs} onDelete={deleteDoc} />
            </div>

            {/* Other */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>📁 Other Documents</div>
              <InlineUpload docType="OTHER" label="Upload Other Documents"
                docs={docs.filter(d => d.docType === 'OTHER')} onUploaded={loadDocs} onDelete={deleteDoc} />
            </div>
          </div>
        </SectionCard>

        {/* Coding Profiles */}
        <SectionCard icon="💻" title="Coding & Social Profiles" bg="#f0fdf4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'LinkedIn', key: 'linkedIn', placeholder: 'https://linkedin.com/in/username', img: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', color: '#0a66c2' },
              { label: 'LeetCode Username', key: 'leetCode', placeholder: 'Enter username', img: 'https://cdn.iconscout.com/icon/free/png-512/free-leetcode-3521542-2944960.png', color: '#ffa116' },
              { label: 'CodeChef Username', key: 'codeChef', placeholder: 'Enter username', img: 'https://cdn.iconscout.com/icon/free/png-512/free-codechef-3521498-2944921.png', color: '#5b4638' },
            ].map(({ label, key, placeholder, img, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                  <img src={img} alt={label} style={{ width: 26, height: 26, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>
                  <input value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                    style={{ padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = color}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              </div>
            ))}
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
