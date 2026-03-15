import React, { useEffect, useState } from 'react';
import api from '../api';

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

  useEffect(() => {
    api.get('/students/me').then(r => setForm(r.data));
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
