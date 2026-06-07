import React, { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 },
  input: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 260 },
  btn: { background: '#1e40af', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginLeft: 10 },
  tag: { display: 'inline-block', background: '#dbeafe', color: '#1e40af', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4 },
  section: { fontWeight: 700, fontSize: 14, color: '#1e40af', margin: '16px 0 8px', borderBottom: '1px solid #dbeafe', paddingBottom: 4 },
};

function Row({ label, value }) {
  return (
    <div style={{ fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 8 }}>
      <span style={{ color: '#64748b', minWidth: 130 }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

export default function AdminSearch() {
  const [regNumber, setRegNumber] = useState('');
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');
  const [counsellorFile, setCounsellorFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showCounsellor, setShowCounsellor] = useState(false);

  // Faculty assignment state
  const [facultyList, setFacultyList] = useState([]);
  const [selFaculty, setSelFaculty] = useState('');
  const [assignRegs, setAssignRegs] = useState('');
  const [assignResult, setAssignResult] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  // Create faculty state
  const [showCreateFaculty, setShowCreateFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ facultyId: '', name: '', password: '', email: '', department: '', designation: '' });
  const [createResult, setCreateResult] = useState('');
  const [creating, setCreating] = useState(false);

  // Dept events report state
  const [deptEventYear, setDeptEventYear] = useState('');
  const [deptEventsLoading, setDeptEventsLoading] = useState(false);
  const [deptZipLoading, setDeptZipLoading] = useState(false);
  const [deptEvents, setDeptEvents] = useState(null);
  const [deptFetching, setDeptFetching] = useState(false);

  const YEARS = Array.from({ length: 8 }, (_, i) => { const y = 2020 + i; return `${y}-${y + 1}`; });

  const fetchDeptEvents = async () => {
    setDeptFetching(true);
    try {
      const params = deptEventYear ? `?year=${encodeURIComponent(deptEventYear)}` : '';
      const { data } = await api.get(`/dept-events${params}`);
      setDeptEvents(data);
    } catch (err) { alert('Failed to fetch events: ' + (err.response?.data?.message || err.message)); }
    setDeptFetching(false);
  };

  const downloadDeptExcel = async () => {
    setDeptEventsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = deptEventYear ? `?year=${encodeURIComponent(deptEventYear)}` : '';
      const res = await fetch(`${baseUrl}/dept-events/report/excel${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `dept_events${deptEventYear ? '_' + deptEventYear : ''}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Excel download failed: ' + err.message); }
    setDeptEventsLoading(false);
  };

  const downloadDeptZip = async () => {
    setDeptZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const params = deptEventYear ? `?year=${encodeURIComponent(deptEventYear)}` : '';
      const res = await fetch(`${baseUrl}/dept-events/report/zip${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `dept_events_docs${deptEventYear ? '_' + deptEventYear : ''}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('ZIP download failed: ' + err.message); }
    setDeptZipLoading(false);
  };

  const refreshFaculty = () => api.get('/faculty/all-faculty').then(r => setFacultyList(r.data)).catch(() => {});

  // Admin document upload state
  const [showAdminDocs, setShowAdminDocs] = useState(false);
  const [adminDocLabel, setAdminDocLabel] = useState('');
  const [adminDocType, setAdminDocType] = useState('ADMIN_CUSTOM');
  const [adminDocRegNumber, setAdminDocRegNumber] = useState('');
  const [adminDocFile, setAdminDocFile] = useState(null);
  const [adminDocUploading, setAdminDocUploading] = useState(false);
  const [adminDocResult, setAdminDocResult] = useState(null);
  const [adminDocTypes, setAdminDocTypes] = useState([]);
  const [adminBulkFile, setAdminBulkFile] = useState(null);
  const [adminBulkLabel, setAdminBulkLabel] = useState('');
  const [adminBulkUploading, setAdminBulkUploading] = useState(false);
  const [adminBulkResult, setAdminBulkResult] = useState(null);

  const PRESET_DOC_TYPES = [
    'CRT Attendance', 'CRT Performance', 'Semester Attendance',
    'Semester Performance', 'Lab Record', 'Project Report', 'Other'
  ];

  const loadAdminDocTypes = () => api.get('/documents/admin-types')
    .then(r => setAdminDocTypes(r.data)).catch(() => {});

  const uploadAdminDoc = async (e) => {
    e.preventDefault();
    if (!adminDocRegNumber || !adminDocLabel) return;
    setAdminDocUploading(true); setAdminDocResult(null);
    try {
      const fd = new FormData();
      fd.append('regNumber', adminDocRegNumber);
      fd.append('docType', 'ADMIN_CUSTOM');
      fd.append('label', adminDocLabel);
      if (adminDocFile) fd.append('file', adminDocFile);
      const { data } = await api.post('/documents/admin-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdminDocResult({ success: true, message: `Uploaded for ${adminDocRegNumber}` });
      setAdminDocRegNumber(''); setAdminDocFile(null); setAdminDocLabel('');
      loadAdminDocTypes();
    } catch (err) { setAdminDocResult({ success: false, message: err.response?.data?.message || 'Upload failed' }); }
    setAdminDocUploading(false);
  };

  const [bulkProgress, setBulkProgress] = useState(null);

  const uploadAdminBulk = async (e) => {
    e.preventDefault();
    const finalLabel = adminBulkLabel === '__other__' ? '' : adminBulkLabel;
    if (!adminBulkFile) return alert('Please choose an Excel file');
    if (!finalLabel) return alert('Please select a document type');
    if (finalLabel === 'Semester Attendance') return alert('Please select a semester number (Sem 1–8)');
    setAdminBulkUploading(true); setAdminBulkResult(null); setBulkProgress(null);
    try {
      const fd = new FormData();
      fd.append('file', adminBulkFile);
      fd.append('docType', 'ADMIN_CUSTOM');
      fd.append('label', finalLabel);

      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';

      // Use fetch for streaming NDJSON response
      const response = await fetch(`${baseUrl}/documents/admin-bulk-meta`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || 'Upload failed');
      }

      const contentType = response.headers.get('content-type') || '';

      // New backend: streaming NDJSON
      if (contentType.includes('x-ndjson')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.status === 'done') {
                setAdminBulkResult({ success: true, message: msg.message || 'Upload complete!' });
                setAdminBulkFile(null); setBulkProgress(null); loadAdminDocTypes();
              } else if (msg.status === 'error') {
                setAdminBulkResult({ success: false, message: msg.message || 'Upload failed' });
                setBulkProgress(null);
              } else if (msg.status === 'progress') {
                setBulkProgress({ processed: msg.processed, total: msg.total, message: msg.message });
              } else {
                setBulkProgress({ message: msg.message || 'Processing...' });
              }
            } catch {}
          }
        }
      } else {
        // Old backend: plain JSON response
        const data = await response.json();
        const msg = data.message || `Created ${data.created ?? '?'} records.`;
        const cols = data.detectedColumns ? ` (Columns: ${data.detectedColumns.join(', ')})` : '';
        setAdminBulkResult({ success: true, message: msg + cols });
        setAdminBulkFile(null); setBulkProgress(null); loadAdminDocTypes();
      }
    } catch (err) {
      setAdminBulkResult({ success: false, message: err.message || 'Upload failed' });
      setBulkProgress(null);
    }
    setAdminBulkUploading(false);
  };

  useEffect(() => { refreshFaculty(); loadAdminDocTypes(); }, []);

  const createFaculty = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateResult('');
    try {
      const { data } = await api.post('/faculty/create-faculty', newFaculty);
      setCreateResult({ success: true, message: data.message });
      setNewFaculty({ facultyId: '', name: '', password: '', email: '', department: '', designation: '' });
      refreshFaculty();
    } catch (err) {
      setCreateResult({ success: false, message: err.response?.data?.message || 'Failed' });
    }
    setCreating(false);
  };

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

  const uploadCounsellor = async () => {
    if (!counsellorFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', counsellorFile);
      const { data } = await api.post('/students/bulk-counsellor-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult({ success: true, message: data.message });
      setCounsellorFile(null);
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.message || 'Upload failed' });
    }
    setUploading(false);
  };

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
      background: tab === t ? '#1e40af' : '#e2e8f0', color: tab === t ? '#fff' : '#374151', marginRight: 8
    }}>{label}</button>
  );

  return (
    <div>
      <h2 style={{ color: '#1e40af', marginBottom: 20 }}>Admin Panel</h2>

      {/* Create Faculty */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateFaculty ? 16 : 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#059669' }}>➕ Create Faculty Account</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Add a new faculty member who can log in</div>
          </div>
          <button onClick={() => setShowCreateFaculty(v => !v)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {showCreateFaculty ? 'Hide' : 'Add Faculty'}
          </button>
        </div>
        {showCreateFaculty && (
          <form onSubmit={createFaculty}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[
                ['facultyId', 'Faculty ID *', 'e.g. FAC001'],
                ['name', 'Full Name *', 'e.g. Dr. John Smith'],
                ['password', 'Password *', 'min 6 characters'],
                ['email', 'Email', 'faculty@university.edu'],
                ['department', 'Department', 'e.g. CSE'],
                ['designation', 'Designation', 'e.g. Assistant Professor'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
                  <input
                    type={key === 'password' ? 'password' : 'text'}
                    placeholder={ph}
                    value={newFaculty[key]}
                    onChange={e => setNewFaculty(p => ({ ...p, [key]: e.target.value }))}
                    required={['facultyId','name','password'].includes(key)}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" disabled={creating} style={{ background: creating ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {creating ? 'Creating...' : 'Create Faculty'}
            </button>
            {createResult && (
              <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: createResult.success ? '#d1fae5' : '#fee2e2', color: createResult.success ? '#065f46' : '#991b1b', fontSize: 13, fontWeight: 600 }}>
                {createResult.message}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Assign Counsellees to Faculty */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAssign ? 16 : 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#7c3aed' }}>👥 Assign Counsellees to Faculty</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Select a faculty and enter student reg numbers to assign</div>
          </div>
          <button onClick={() => setShowAssign(!showAssign)}
            style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {showAssign ? 'Hide' : 'Assign'}
          </button>
        </div>
        {showAssign && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>Faculty ID</label>
                <input value={selFaculty} onChange={e => setSelFaculty(e.target.value)}
                  placeholder="Enter Faculty ID (e.g. 2)"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>Student Reg Numbers (comma separated)</label>
                <input value={assignRegs} onChange={e => setAssignRegs(e.target.value)}
                  placeholder="e.g. 231FA04001, 231FA04002, 231FA04003"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
            <button onClick={async () => {
              if (!selFaculty || !assignRegs.trim()) return setAssignResult('Select faculty and enter reg numbers');
              const regs = assignRegs.split(',').map(r => r.trim()).filter(Boolean);
              try {
                const { data } = await api.post('/faculty/assign-counsellees', { facultyId: selFaculty, regNumbers: regs });
                setAssignResult(data.message);
                setAssignRegs('');
              } catch (err) { setAssignResult('Failed: ' + (err.response?.data?.message || err.message)); }
            }} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              Assign Students
            </button>
            {assignResult && (
              <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 7, background: assignResult.includes('Failed') ? '#fee2e2' : '#d1fae5', color: assignResult.includes('Failed') ? '#991b1b' : '#065f46', fontSize: 13, fontWeight: 600 }}>
                {assignResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counsellor Assignment */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCounsellor ? 16 : 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e40af' }}>📋 Bulk Counsellor Assignment</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Upload Excel/CSV with columns: RegNumber, Counsellor</div>
          </div>
          <button onClick={() => setShowCounsellor(!showCounsellor)}
            style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {showCounsellor ? 'Hide' : 'Upload'}
          </button>
        </div>
        {showCounsellor && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: '#64748b' }}>
              <strong>File format:</strong> Excel (.xlsx) or CSV — columns: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>RegNumber</code> &nbsp;<code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>Counsellor</code>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setCounsellorFile(e.target.files[0])} style={{ fontSize: 13 }} />
              <button onClick={uploadCounsellor} disabled={!counsellorFile || uploading}
                style={{ background: uploading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                {uploading ? 'Uploading...' : '📤 Upload & Assign'}
              </button>
            </div>
            {uploadResult && (
              <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 7, background: uploadResult.success ? '#d1fae5' : '#fee2e2', color: uploadResult.success ? '#065f46' : '#991b1b', fontSize: 13, fontWeight: 600 }}>
                {uploadResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Search */}
      <form onSubmit={search} style={{ marginBottom: 24 }}>
        <input style={s.input} placeholder="Enter Registration Number" value={regNumber} onChange={e => setRegNumber(e.target.value)} required />
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
              <div style={{ color: '#64748b', marginBottom: 16 }}>{profile.regNumber} | {profile.branch} | {profile.admissionCategory}</div>
              {profile.counsellor && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13 }}>
                  Counsellor: <strong style={{ color: '#1e40af' }}>{profile.counsellor}</strong>
                </div>
              )}
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
                    <ViewButton url={d.fileUrl || d.filepath} label="View" style={{ padding: '5px 12px', fontSize: 12 }} />
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
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                    {a.issuingOrg && <span>Org: {a.issuingOrg} &nbsp;|&nbsp; </span>}
                    {a.position && <span>Position: {a.position}</span>}
                  </div>
                  <ViewButton url={viewUrl(a.certificateUrl || a.certificatePath)} label="View Certificate" style={{ marginTop: 6, fontSize: 12, padding: '3px 10px' }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Admin Document Upload Section */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginTop: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAdminDocs ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📂</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Admin Document Upload</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Upload CRT Attendance, CRT Performance, Semester Attendance etc. for students</div>
            </div>
          </div>
          <button onClick={() => setShowAdminDocs(v => !v)}
            style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {showAdminDocs ? 'Hide' : 'Upload Docs'}
          </button>
        </div>

        {showAdminDocs && (
          <div>
            {/* Existing admin doc types */}
            {adminDocTypes.length > 0 && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>ALREADY UPLOADED DOCUMENT TYPES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {adminDocTypes.map(t => (
                    <span key={t.label} style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                      {t.label} <span style={{ opacity: 0.7 }}>({t.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ maxWidth: 600 }}>

              {/* Bulk upload via Excel only */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>📊 Bulk Upload via Excel</div>
                <div style={{ fontSize: 12, color: '#64748b', background: '#fffbeb', padding: '10px 12px', borderRadius: 7, marginBottom: 14, border: '1px solid #fde68a' }}>
                  Excel format: First column = <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>Reg No</code> — remaining columns are stored as data (e.g. Aptitude, Coding, Overall %)
                </div>
                <form onSubmit={uploadAdminBulk}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Document Type *</label>
                    <select
                      value={adminBulkLabel.startsWith('Semester Attendance') ? 'Semester Attendance' : adminBulkLabel.startsWith('__other__') ? 'Other' : adminBulkLabel}
                      onChange={e => {
                        if (e.target.value === 'Other') setAdminBulkLabel('__other__');
                        else if (e.target.value === 'Semester Attendance') setAdminBulkLabel('Semester Attendance');
                        else setAdminBulkLabel(e.target.value);
                      }} required
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">-- Select Type --</option>
                      <option value="CRT Attendance">CRT Attendance</option>
                      <option value="CRT Performance">CRT Performance</option>
                      <option value="Semester Attendance">Semester Attendance</option>
                      <option value="Other">Other</option>
                    </select>

                    {/* Semester number checkboxes — shown when Semester Attendance is selected */}
                    {adminBulkLabel.startsWith('Semester Attendance') && (
                      <div style={{ marginTop: 10, padding: '12px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 8, textTransform: 'uppercase' }}>Select Semester *</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {[1,2,3,4,5,6,7,8].map(sem => {
                            const semLabel = `Semester Attendance - Sem ${sem}`;
                            const checked = adminBulkLabel === semLabel;
                            return (
                              <label key={sem} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${checked ? '#1e40af' : '#93c5fd'}`,
                                background: checked ? '#1e40af' : '#fff', color: checked ? '#fff' : '#1e40af',
                                fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}>
                                <input type="radio" name="semNum" value={semLabel}
                                  checked={checked}
                                  onChange={() => setAdminBulkLabel(semLabel)}
                                  style={{ display: 'none' }} />
                                Sem {sem}
                              </label>
                            );
                          })}
                        </div>
                        {adminBulkLabel === 'Semester Attendance' && (
                          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>Please select a semester number above</div>
                        )}
                      </div>
                    )}

                    {(adminBulkLabel === '__other__' || (adminBulkLabel && !['CRT Attendance','CRT Performance','Semester Attendance','__other__',''].includes(adminBulkLabel) && !adminBulkLabel.startsWith('Semester Attendance'))) && (
                      <input value={adminBulkLabel === '__other__' ? '' : adminBulkLabel}
                        onChange={e => setAdminBulkLabel(e.target.value)} placeholder="Enter document type name..." required
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginTop: 8 }} />
                    )}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Excel / CSV File *</label>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setAdminBulkFile(e.target.files[0])} required
                      style={{ fontSize: 12, padding: '8px', border: '1.5px solid #d1d5db', borderRadius: 8, width: '100%', boxSizing: 'border-box', background: '#fff' }} />
                  </div>
                  <button type="submit" disabled={adminBulkUploading}
                    style={{ background: adminBulkUploading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    {adminBulkUploading ? 'Processing...' : '📥 Bulk Upload'}
                  </button>
                  {/* Live progress bar */}
                  {adminBulkUploading && bulkProgress && (
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 6 }}>{bulkProgress.message}</div>
                      {bulkProgress.total > 0 && (
                        <div style={{ background: '#dbeafe', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99, background: '#1e40af',
                            width: `${Math.round((bulkProgress.processed / bulkProgress.total) * 100)}%`,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      )}
                      {bulkProgress.total > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          {bulkProgress.processed} / {bulkProgress.total} rows
                        </div>
                      )}
                    </div>
                  )}
                  {adminBulkResult && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: adminBulkResult.success ? '#d1fae5' : '#fee2e2', color: adminBulkResult.success ? '#065f46' : '#991b1b', fontSize: 12, fontWeight: 600 }}>
                      {adminBulkResult.message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dept Events Report — Admin Only */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginTop: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎪</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Department Events Report</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Download all department events by academic year</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Year</label>
            <select value={deptEventYear} onChange={e => { setDeptEventYear(e.target.value); setDeptEvents(null); }}
              style={{ padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 160 }}>
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingBottom: 2 }}>
            <button onClick={fetchDeptEvents} disabled={deptFetching}
              style={{ background: deptFetching ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {deptFetching ? 'Fetching...' : '🔍 Fetch Report'}
            </button>
            <button onClick={downloadDeptExcel} disabled={deptEventsLoading}
              style={{ background: deptEventsLoading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              📊 {deptEventsLoading ? 'Generating...' : 'Excel'}
            </button>
            <button onClick={downloadDeptZip} disabled={deptZipLoading}
              style={{ background: deptZipLoading ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              🗜️ {deptZipLoading ? 'Generating...' : 'ZIP'}
            </button>
          </div>
        </div>

        {/* Results Table */}
        {deptEvents && (
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              {deptEvents.length} event{deptEvents.length !== 1 ? 's' : ''} found{deptEventYear ? ` for ${deptEventYear}` : ''}
            </div>
            {deptEvents.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>No events found for the selected year.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    {['#', 'Event Name', 'Type', 'Coordinator', 'Dept', 'Year', 'Date', 'Budget', 'Docs'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 700, textAlign: 'left', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deptEvents.map((ev, i) => (
                    <tr key={ev._id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{i + 1}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>{ev.eventName}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {ev.eventType && <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{ev.eventType}</span>}
                      </td>
                      <td style={{ padding: '9px 12px' }}>{ev.coordinatorName}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{ev.department || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{ev.year}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#64748b', fontSize: 12 }}>{ev.date ? new Date(ev.date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '9px 12px' }}>{ev.budget ? `₹${ev.budget.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['poster','onePageReport','winnersList','sampleCertificate','budgetReport'].map(k =>
                            ev[k]?.url ? <span key={k} style={{ background: '#d1fae5', color: '#065f46', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>✓</span> : null
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
