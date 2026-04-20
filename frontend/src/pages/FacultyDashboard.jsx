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
  const [mainTab, setMainTab] = useState('search');
  const [myStudents, setMyStudents] = useState([]);
  const [myStudentsLoading, setMyStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedAchs, setSelectedAchs] = useState([]);
  const [selectedTab, setSelectedTab] = useState('profile');
  const name = localStorage.getItem('name');

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data));
  }, []);

  const loadMyStudents = async () => {
    setMyStudentsLoading(true);
    try {
      const { data } = await api.get('/faculty/my-students');
      setMyStudents(data);
    } catch {}
    setMyStudentsLoading(false);
  };

  useEffect(() => {
    if (mainTab === 'mystudents') loadMyStudents();
  }, [mainTab]);

  const viewStudent = async (st) => {
    setSelectedStudent(st);
    setSelectedTab('profile');
    try {
      const [d, a] = await Promise.all([
        api.get(`/faculty/student/${st.regNumber}/documents`),
        api.get(`/faculty/student/${st.regNumber}/achievements`),
      ]);
      setSelectedDocs(d.data);
      setSelectedAchs(a.data);
    } catch {}
  };

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
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>Welcome, {name}</p>

      {/* Faculty Profile Card */}
      {profile && (
        <div style={{ ...s.card, borderTop: '4px solid #059669', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍🏫</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{profile.name}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{profile.designation} — {profile.department}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{profile.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={s.tabBtn(mainTab === 'search')} onClick={() => setMainTab('search')}>🔍 Search Student</button>
        <button style={s.tabBtn(mainTab === 'mystudents')} onClick={() => setMainTab('mystudents')}>👥 My Students</button>
      </div>

      {/* Search tab */}
      {mainTab === 'search' && (
        <>
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
              <StudentView student={student} docs={docs} achievements={achievements} tab={studentTab} s={s} />
            </>
          )}
        </>
      )}

      {/* My Students tab */}
      {mainTab === 'mystudents' && (
        <div>
          {myStudentsLoading && <div style={{ color: '#64748b' }}>Loading...</div>}
          {!myStudentsLoading && myStudents.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', color: '#94a3b8', padding: 40 }}>
              No students assigned to you yet. Ask admin to upload counsellor assignments.
            </div>
          )}

          {/* Student list */}
          {!selectedStudent && myStudents.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#059669' }}>
                {myStudents.length} students assigned to you
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {myStudents.map(st => (
                  <div key={st._id} style={{ ...s.card, cursor: 'pointer', borderLeft: '4px solid #059669', padding: 16 }}
                    onClick={() => viewStudent(st)}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{st.regNumber}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{st.branch} | Section {st.section} | Year {st.currentYear}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#1e40af', fontWeight: 600 }}>View Profile →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected student detail */}
          {selectedStudent && (
            <div>
              <button onClick={() => setSelectedStudent(null)}
                style={{ background: '#f1f5f9', border: 'none', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                ← Back to My Students
              </button>
              <div style={{ marginBottom: 14 }}>
                <button style={s.tabBtn(selectedTab === 'profile')} onClick={() => setSelectedTab('profile')}>Profile</button>
                <button style={s.tabBtn(selectedTab === 'docs')} onClick={() => setSelectedTab('docs')}>Documents ({selectedDocs.length})</button>
                <button style={s.tabBtn(selectedTab === 'achievements')} onClick={() => setSelectedTab('achievements')}>Achievements ({selectedAchs.length})</button>
              </div>
              <StudentView student={selectedStudent} docs={selectedDocs} achievements={selectedAchs} tab={selectedTab} s={s} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentView({ student, docs, achievements, tab, s }) {
  return (
    <>
      {tab === 'profile' && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{student.name}</div>
          <div style={{ color: '#64748b', marginBottom: 14, fontSize: 13 }}>{student.regNumber} | {student.branch} | {student.admissionCategory}</div>
          {student.counsellor && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 12px', marginBottom: 10, fontSize: 12 }}>
              Counsellor: <strong>{student.counsellor}</strong>
            </div>
          )}
          <div style={s.section}>Personal</div>
          <Row label="DOB" value={student.dob} />
          <Row label="Gender" value={student.gender} />
          <Row label="Blood Group" value={student.bloodGroup} />
          <Row label="Nationality" value={student.nationality} />
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
          <Row label="CGPA" value={student.cgpa} />
          <Row label="ABC ID" value={student.abcId} />
          <Row label="APAAR ID" value={student.apaarId} />
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
                <a href={d.fileUrl || d.filepath || '#'} target="_blank" rel="noreferrer"
                  style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 6, fontSize: 12 }}>View</a>
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
              <span style={s.achTag}>{a.activityType?.replace(/_/g, ' ')}</span>
              {a.academicYear && <span style={{ ...s.achTag, background: '#dcfce7', color: '#166534' }}>{a.academicYear}</span>}
              {a.semester && <span style={{ ...s.achTag, background: '#fef3c7', color: '#92400e' }}>Sem {a.semester}</span>}
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                {a.position && <span>Position: {a.position}</span>}
              </div>
              {(a.certificateUrl || a.certificatePath) && (
                <a href={a.certificateUrl || a.certificatePath} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#1e40af', marginTop: 6, display: 'inline-block' }}>View Certificate</a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
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
      <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>Welcome, {name}</p>

      {/* Faculty Profile Card */}
      {profile && (
        <div style={{ ...s.card, borderTop: '4px solid #059669', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍🏫</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{profile.name}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{profile.designation} — {profile.department}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{profile.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Student */}
      <form onSubmit={search} style={{ marginBottom: 20 }}>
        <input style={s.input} placeholder="Enter Student Registration Number"
          value={regNumber} onChange={e => setRegNumber(e.target.value)} required />
        <button style={s.btn} type="submit">Search</button>
      </form>
      {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}

      {/* Student Result */}
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
              <div style={{ color: '#64748b', marginBottom: 14, fontSize: 13 }}>{student.regNumber} | {student.branch} | {student.admissionCategory}</div>
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
              {docs.length === 0 && <div style={{ color: '#94a3b8' }}>No documents uploaded.</div>}
              {docs.map(d => (
                <div key={d._id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={s.tag}>{d.docType?.replace('_', ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{d.label || d.filename}</span>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date(d.uploadedAt).toLocaleDateString()}</div>
                    </div>
                    <a href={d.fileUrl || d.filepath || '#'} target="_blank" rel="noreferrer"
                      style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 6, fontSize: 12 }}>View</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {studentTab === 'achievements' && (
            <div>
              {achievements.length === 0 && <div style={{ color: '#94a3b8' }}>No achievements found.</div>}
              {achievements.map(a => (
                <div key={a._id} style={s.card}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  <span style={s.achTag}>{a.activityType?.replace(/_/g, ' ')}</span>
                  {a.academicYear && <span style={{ ...s.achTag, background: '#dcfce7', color: '#166534' }}>{a.academicYear}</span>}
                  {a.semester && <span style={{ ...s.achTag, background: '#fef3c7', color: '#92400e' }}>Sem {a.semester}</span>}
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                    {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                    {a.position && <span>Position: {a.position}</span>}
                  </div>
                  {(a.certificateUrl || a.certificatePath) && (
                    <a href={a.certificateUrl || a.certificatePath}
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
