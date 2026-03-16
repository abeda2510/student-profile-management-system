import React, { useEffect, useState } from 'react';
import api from '../api';

const CATEGORIES = ['VSAT', 'EAMCET', 'JEE', 'MANAGEMENT', 'NRI', 'OTHER'];
const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#0f172a', background: '#fff', fontWeight: 500, outline: 'none' };

export default function StudentProfile() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get('/students/me').then(r => setForm(r.data)); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...updates } = form;
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Profile</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Keep your information up to date</div>
      </div>

      <form onSubmit={save}>
        <Section title="Personal Details" icon="👤">
          <Grid>
            <Field label="Full Name" value={form.name} onChange={v => set('name', v)} />
            <Field label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} type="date" />
            <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} />
            <Field label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} />
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)} />
            <Field label="Religion" value={form.religion} onChange={v => set('religion', v)} />
            <Field label="Caste" value={form.caste} onChange={v => set('caste', v)} />
          </Grid>
        </Section>

        <Section title="Contact Details" icon="📞">
          <Grid>
            <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
            <Field label="Address" value={form.address} onChange={v => set('address', v)} />
            <Field label="Parent / Guardian Name" value={form.parentName} onChange={v => set('parentName', v)} />
            <Field label="Parent Phone" value={form.parentPhone} onChange={v => set('parentPhone', v)} />
          </Grid>
        </Section>

        <Section title="Academic Details" icon="🎓">
          <Grid>
            <SelectField label="Admission Category" value={form.admissionCategory} onChange={v => set('admissionCategory', v)} options={CATEGORIES} />
            <Field label="Admission Year" value={form.admissionYear} onChange={v => set('admissionYear', v)} type="number" />
            <Field label="Branch" value={form.branch} onChange={v => set('branch', v)} />
            <Field label="Section" value={form.section} onChange={v => set('section', v)} />
            <Field label="Current Year" value={form.currentYear} onChange={v => set('currentYear', v)} type="number" />
            <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} type="number" />
            <Field label="CGPA" value={form.cgpa} onChange={v => set('cgpa', v)} type="number" placeholder="e.g. 8.5" />
          </Grid>
        </Section>

        <Section title="ID Details" icon="🪪">
          <Grid>
            <Field label="APAAR ID" value={form.apaarId} onChange={v => set('apaarId', v)} />
            <Field label="ABC ID" value={form.abcId} onChange={v => set('abcId', v)} />
          </Grid>
        </Section>

        <Section title="Coding & Social Profiles" icon="💻">
          <Grid>
            <Field label="LinkedIn Profile URL" value={form.linkedIn} onChange={v => set('linkedIn', v)} placeholder="https://linkedin.com/in/username" />
            <Field label="CodeChef Username" value={form.codeChef} onChange={v => set('codeChef', v)} placeholder="e.g. john_doe" />
            <Field label="LeetCode Username" value={form.leetCode} onChange={v => set('leetCode', v)} placeholder="e.g. john_doe" />
          </Grid>
        </Section>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button className="btn-primary" type="submit" style={{ padding: '12px 32px', fontSize: 15 }}>Save Profile</button>
          {saved && (
            <span style={{ color: '#059669', fontWeight: 600, fontSize: 14, background: '#ecfdf5', padding: '8px 16px', borderRadius: 8, border: '1px solid #6ee7b7' }}>
              ✓ Saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>
        <span style={{ background: '#eff6ff', borderRadius: 8, padding: '6px 8px', fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e40af' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inp} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={inp}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
