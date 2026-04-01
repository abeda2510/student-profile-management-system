import React, { useState } from 'react';
import api from '../api';

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 },
  input: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 260 },
  btn: { background: '#1e40af', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginLeft: 10 },
  tag: { display: 'inline-block', background: '#dbeafe', color: '#1e40af', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4 },
  section: { fontWeight: 700, fontSize: 14, color: '#1e40af', margin: '16px 0 8px', borderBottom: '1px solid #dbeafe', paddingBottom: 4 },
  info: { fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f8fafc' }
};

export default function AdminSearch() {
  const [regNumber, setRegNumber] = useState('');
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  const search = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const [p, d, a] = await Promise.all([
        api.get(`/students/search/${regNumber}`),
        api.get(`/documents/${regNumber}`),
        api.get(`/achievements/${regNumber}`)
      ]);
      setProfile(p.data);
      setDocs(d.data);
      setAchievements(a.data);
      setTab('profile');
    } catch {
      setError('Student not found');
      setProfile(null);
    }
  };

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
      background: tab === t ? '#1e40af' : '#e2e8f0', color: tab === t ? '#fff' : '#374151', marginRight: 8
    }}>{label}</button>
  );

  return (
    <div>
      <h2 style={{ color: '#1e40af', marginBottom: 20 }}>Admin: Student Search</h2>
      <form onSubmit={search} style={{ marginBottom: 24 }}>
        <input style={s.input} placeholder="Enter Registration Number" value={regNumber}
          onChange={e => setRegNumber(e.target.value)} required />
        <button style={s.btn} type="submit">Search</button>
      </form>
      {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}

      {profile && (
        <>
          <div style={{ marginBottom: 16 }}>
            {tabBtn('profile', 'Profile')}
            {tabBtn('docs', `Documents (${docs.length})`)}
            {tabBtn('achievements', `Achievements (${achievements.length})`)}
          </div>

          {tab === 'profile' && (
            <div style={s.card}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{profile.name}</div>
              <div style={{ color: '#64748b', marginBottom: 16 }}>{profile.regNumber} &nbsp;|&nbsp; {profile.branch} &nbsp;|&nbsp; {profile.admissionCategory}</div>
              <div style={s.section}>Personal</div>
              <Row label="DOB" value={profile.dob} />
              <Row label="Gender" value={profile.gender} />
              <Row label="Blood Group" value={profile.bloodGroup} />
              <div style={s.section}>Contact</div>
              <Row label="Email" value={profile.email} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Address" value={profile.address} />
              <Row label="Parent" value={profile.parentName} />
              <Row label="Parent Phone" value={profile.parentPhone} />
              <div style={s.section}>Academic</div>
              <Row label="Admission Year" value={profile.admissionYear} />
              <Row label="Section" value={profile.section} />
              <Row label="Current Year" value={profile.currentYear} />
              <Row label="Current Semester" value={profile.currentSemester} />
              <Row label="APAAR ID" value={profile.apaarId} />
              <Row label="ABC ID" value={profile.abcId} />
            </div>
          )}

          {tab === 'docs' && (
            <div>
              {docs.length === 0 && <div style={{ color: '#94a3b8' }}>No documents uploaded.</div>}
              {docs.map(d => (
                <div key={d._id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={s.tag}>{d.docType?.replace('_', ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{d.label || d.filename}</span>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date(d.uploadedAt).toLocaleDateString()}</div>
                    </div>
                    <a href={`/uploads/documents/${profile.regNumber}/${d.filename}`} target="_blank" rel="noreferrer"
                      style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 6, fontSize: 12 }}>
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'achievements' && (
            <div>
              {achievements.length === 0 && <div style={{ color: '#94a3b8' }}>No achievements found.</div>}
              {achievements.map(a => (
                <div key={a._id} style={s.card}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  <span style={s.tag}>{a.activityType?.replace(/_/g, ' ')}</span>
                  {a.academicYear && <span style={{ ...s.tag, background: '#dcfce7', color: '#166534' }}>{a.academicYear}</span>}
                  {a.semester && <span style={{ ...s.tag, background: '#fef3c7', color: '#92400e' }}>Sem {a.semester}</span>}
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                    {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                    {a.position && <span>Position: {a.position} &nbsp;|&nbsp; </span>}
                    {a.date && <span>Date: {a.date}</span>}
                  </div>
                  {a.certificateFile && (
                    <a href={`/uploads/achievements/${profile.regNumber}/${a.certificateFile}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#1e40af', marginTop: 6, display: 'inline-block' }}>
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 8 }}>
      <span style={{ color: '#64748b', minWidth: 130 }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}
