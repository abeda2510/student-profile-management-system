import React, { useEffect, useState } from 'react';
import api from '../api';

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 },
  input: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 260 },
  btn: { background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginLeft: 10 },
  tag: { display: 'inline-block', background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginRight: 6 },
  achTag: { display: 'inline-block', background: '#dbeafe', color: '#1e40af', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginRight: 6 },
  tabBtn: (active) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: active ? '#059669' : '#e2e8f0', color: active ? '#fff' : '#374151', marginRight: 8
  }),
  section: { fontWeight: 700, fontSize: 13, color: '#059669', margin: '14px 0 6px', borderBottom: '1px solid #d1fae5', paddingBottom: 4 }
};

export default function FacultyDashboard() {
  const [profile, setProfile] = useState(null);
  const [regNumber, setRegNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [docs, setDocs] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [studentTab, setStudentTab] = useState('profile');
  const [error, setError] = useState('');
  const name = localStorage.getItem('name');

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data));
  }, []);

  const search = async (e) => {
    e.preventDefault();
    setError('');
    setStudent(null);
    try {
      const [p, d, a] = await Promise.all([
        api.get(`/faculty/student/${regNumber}`),
        api.get(`/faculty/student/${regNumber}/documents`),
        api.get(`/faculty/student/${regNumber}/achievements`)
      ]);
      setStudent(p.data);
      setDocs(d.data);
      setAchievements(a.data);
      setStudentTab('profile');
    } catch {
      setError('Student not found');
    }
  };

  return (
    <div>
      <h2 style={{ color: '#059669', marginBottom: 4 }}>Faculty Dashboard</h2>
      <p style={{ color: '#374151', marginBottom: 20, fontSize: 14 }}>Welcome, {name}</p>

      {profile && (
        <div style={{ ...s.card, borderTop: '4px solid #059669', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍🏫</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{profile.name}</div>
              <div style={{ color: '#374151', fontSize: 14 }}>{profile.designation} — {profile.department}</div>
              <div style={{ color: '#374151', fontSize: 13 }}>{profile.email}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={search} style={{ marginBottom: 20 }}>
        <input style={s.input} placeholder="Enter Student Registration Number"
          value={regNumber} onChange={e => setRegNumber(e.target.value)} required />
        <button style={s.btn} type="submit">Search</button>
      </form>
      {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}

      {student && (
        <>
          <div style={{ marginBottom: 14 }}>
            <button style={s.tabBtn(studentTab === 'profile')} onClick={() => setStudentTab('profile')}>Profile</button>
            <button style={s.tabBtn(studentTab === 'docs')} onClick={() => setStudentTab('docs')}>Documents ({docs.length})</button>
            <button style={s.tabBtn(studentTab === 'achievements')} onClick={() => setStudentTab('achievements')}>Achievements ({achievements.length})</button>
          </div>

          {studentTab === 'profile' && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{student.name}</div>
      <div style={{ color: '#374151', marginBottom: 14, fontSize: 14 }}>{student.regNumber} | {student.branch} | {student.admissionCategory}</div>
              <div style={s.section}>Personal</div>
              <Row label="DOB" value={student.dob} />
              <Row label="Gender" value={student.gender} />
              <Row label="Blood Group" value={student.bloodGroup} />
              <Row label="Nationality" value={student.nationality} />
              <Row label="Religion" value={student.religion} />
              <Row label="Caste" value={student.caste} />
              <div style={s.section}>Contact</div>
              <Row label="Email" value={student.email} />
              <Row label="Phone" value={student.phone} />
              <Row label="Address" value={student.address} />
              <Row label="Parent / Guardian" value={student.parentName} />
              <Row label="Parent Phone" value={student.parentPhone} />
              <div style={s.section}>Academic</div>
              <Row label="Admission Year" value={student.admissionYear} />
              <Row label="Admission Category" value={student.admissionCategory} />
              <Row label="Branch" value={student.branch} />
              <Row label="Section" value={student.section} />
              <Row label="Current Year" value={student.currentYear} />
              <Row label="Current Semester" value={student.currentSemester} />
              <Row label="ABC ID" value={student.abcId} />
              <Row label="CGPA" value={student.cgpa} />
            </div>
          )}

          {studentTab === 'docs' && (
            <div>
              {docs.length === 0 && <div style={{ color: '#374151', fontWeight: 600 }}>No documents uploaded.</div>}
              {docs.map(d => (
                <div key={d._id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={s.tag}>{d.docType?.replace('_', ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{d.label || d.filename}</span>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginTop: 4 }}>{new Date(d.uploadedAt).toLocaleDateString()}</div>
                    </div>
                    <a href={`/uploads/documents/${student.regNumber}/${d.filename}`} target="_blank" rel="noreferrer"
                      style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 6, fontSize: 12 }}>View</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {studentTab === 'achievements' && (
            <div>
              {achievements.length === 0 && <div style={{ color: '#374151', fontWeight: 600 }}>No achievements found.</div>}
              {achievements.map(a => (
                <div key={a._id} style={s.card}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  <span style={s.achTag}>{a.activityType?.replace(/_/g, ' ')}</span>
                  {a.academicYear && <span style={{ ...s.achTag, background: '#dcfce7', color: '#166534' }}>{a.academicYear}</span>}
                  {a.semester && <span style={{ ...s.achTag, background: '#fef3c7', color: '#92400e' }}>Sem {a.semester}</span>}
                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, marginTop: 6 }}>
                    {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                    {a.position && <span>Position: {a.position}</span>}
                  </div>
                  {a.certificateFile && (
                    <a href={`/uploads/achievements/${student.regNumber}/${a.certificateFile}`}
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
      <span style={{ color: '#374151', minWidth: 130, fontWeight: 600 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: '#111827' }}>{value || '—'}</span>
    </div>
  );
}


