import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { ViewButton } from '../components/PreviewModal';

/* ─── constants ─────────────────────────────────────── */
const DOC_GROUPS = [
  { key: 'personal', label: 'Personal', color: '#dc2626', bg: '#fef2f2',
    items: [
      { value: 'DOB', label: 'Date of Birth' },
      { value: 'GENDER', label: 'Gender' },
      { value: 'BLOOD_GROUP', label: 'Blood Group' },
      { value: 'NATIONALITY', label: 'Nationality' },
    ]
  },
  { key: 'contact', label: 'Contact', color: '#0891b2', bg: '#ecfeff',
    items: [
      { value: 'EMAIL', label: 'Email' },
      { value: 'PHONE', label: 'Phone' },
      { value: 'ADDRESS', label: 'Address' },
      { value: 'PARENT_NAME', label: 'Parent Name' },
      { value: 'PARENT_PHONE', label: 'Parent Phone' },
    ]
  },
  { key: 'academic', label: 'Academic', color: '#d97706', bg: '#fffbeb',
    items: [
      { value: 'ADMISSION_CATEGORY', label: 'Admission Category' },
      { value: 'CURRENT_YEAR', label: 'Current Year' },
      { value: 'CURRENT_SEMESTER', label: 'Current Semester' },
      { value: 'CGPA', label: 'CGPA' },
    ]
  },
  { key: 'coding', label: 'Coding Profiles', color: '#1e40af', bg: '#eff6ff',
    items: [
      { value: 'LINKEDIN', label: 'LinkedIn' },
      { value: 'LEETCODE', label: 'LeetCode Username' },
      { value: 'LEETCODE_SOLVED', label: 'LeetCode Solved' },
      { value: 'LEETCODE_EASY', label: 'LeetCode Easy' },
      { value: 'LEETCODE_MEDIUM', label: 'LeetCode Medium' },
      { value: 'LEETCODE_HARD', label: 'LeetCode Hard' },
      { value: 'CODECHEF', label: 'CodeChef Username' },
      { value: 'CODECHEF_RATING', label: 'CodeChef Rating' },
    ]
  },
  { key: 'ids', label: 'IDs', color: '#7c3aed', bg: '#f5f3ff',
    items: [{ value: 'APAAR_ID', label: 'ABC / APAAR ID' }]
  },
  { key: 'documents', label: 'Documents', color: '#dc2626', bg: '#fef2f2',
    items: [
      { value: 'AADHAAR_DOC', label: 'Aadhaar Card' },
      { value: 'PAN_DOC', label: 'PAN Card' },
      { value: 'TENTH_MEMO', label: '10th Mark Memo' },
      { value: 'INTER_MEMO', label: 'Inter Mark Memo' },
    ]
  },
  { key: 'achievements', label: 'Achievements', color: '#d97706', bg: '#fffbeb',
    items: [
      { value: 'INTERNSHIP', label: 'Internships' },
      { value: 'HACKATHON', label: 'Hackathons' },
      { value: 'RESEARCH_PUBLICATION', label: 'Research Publications' },
      { value: 'PATENT', label: 'Patents' },
      { value: 'JOURNAL_PAPER', label: 'Journal Papers' },
      { value: 'CONFERENCE_PAPER', label: 'Conference Papers' },
      { value: 'BOOK', label: 'Books' },
      { value: 'BOOK_CHAPTER', label: 'Book Chapters' },
      { value: 'TECHNICAL_COMPETITION', label: 'Technical Competitions' },
      { value: 'WORKSHOP', label: 'Workshops' },
    ]
  },
  { key: 'certifications', label: 'Certifications', color: '#059669', bg: '#f0fdf4',
    items: [
      { value: 'NPTEL', label: 'NPTEL Certifications' },
      { value: 'CERTIFICATION', label: 'Other Certifications' },
    ]
  },
];

const DEPT_SECTIONS = {
  CSE:  Array.from({length:19},(_,i)=>String(i+1)),
  ECE:  Array.from({length:8}, (_,i)=>String(i+1)),
  EEE:  Array.from({length:4}, (_,i)=>String(i+1)),
  MECH: Array.from({length:5}, (_,i)=>String(i+1)),
  CIVIL:Array.from({length:3}, (_,i)=>String(i+1)),
  IT:   Array.from({length:6}, (_,i)=>String(i+1)),
  AIML: Array.from({length:6}, (_,i)=>String(i+1)),
  CSBS: Array.from({length:3}, (_,i)=>String(i+1)),
};
const DEPTS = Object.keys(DEPT_SECTIONS);

const chip = (sel, color) => ({
  padding: '5px 14px', borderRadius: 99,
  border: `1.5px solid ${sel ? color : '#d1d5db'}`,
  background: sel ? color : '#fff',
  color: sel ? '#fff' : '#374151',
  fontSize: 12, fontWeight: sel ? 700 : 500,
  cursor: 'pointer', display: 'inline-block',
  transition: 'all 0.15s',
  boxShadow: sel ? `0 2px 6px ${color}44` : 'none',
});

/* ─── Individual Student Report Component ────────────── */
function IndividualReport({ onBack }) {
  const [searchReg, setSearchReg] = useState('');
  const [student, setStudent] = useState(null);
  const [docs, setDocs] = useState([]);
  const [achs, setAchs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef();

  const handleSearch = async () => {
    const reg = searchReg.trim().toUpperCase();
    if (!reg) return setError('Enter a registration number');
    setError(''); setLoading(true); setStudent(null); setDocs([]); setAchs([]);
    try {
      const [stRes, docRes, achRes] = await Promise.all([
        api.get(`/faculty/student/${reg}`),
        api.get(`/faculty/student/${reg}/documents`),
        api.get(`/faculty/student/${reg}/achievements`),
      ]);
      setStudent(stRes.data);
      setDocs(docRes.data || []);
      setAchs(achRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Student not found');
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const InfoRow = ({ label, value }) => value ? (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: 130, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, flex: 1, wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null;

  const SectionCard = ({ title, icon, color = '#059669', children }) => (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, padding: '12px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: color }}>{title}</span>
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #individual-report-print, #individual-report-print * { visibility: visible !important; }
          #individual-report-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "'Segoe UI', Roboto, sans-serif", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={onBack} className="no-print"
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
              ← Back
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Individual Student Report</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Search by Registration Number</div>
            </div>
          </div>
          {student && (
            <button onClick={handlePrint} className="no-print"
              style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Print Report
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={searchReg}
              onChange={e => setSearchReg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Registration Number (e.g. 231FA04016)"
              style={{
                flex: 1, padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: '#334155', outline: 'none',
                transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#059669'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button onClick={handleSearch} disabled={loading}
              style={{ background: loading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              {loading ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </div>
          {error && <div style={{ marginTop: 10, color: '#ef4444', fontSize: 13, fontWeight: 600, background: '#fef2f2', padding: '8px 12px', borderRadius: 7 }}>⚠ {error}</div>}
        </div>

        {/* Student Profile */}
        {student && (
          <div id="individual-report-print" style={{ animation: 'fadeInUp 0.4s ease-out' }}>

            {/* Hero Header Card */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0891b2 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {(student.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px' }}>{student.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>🎓 {student.regNumber}</span>
                  {student.branch && <span>🏛 {student.branch} — Sec {student.section}</span>}
                  {student.currentYear && <span>📅 Year {student.currentYear} · Sem {student.currentSemester}</span>}
                  {student.cgpa && <span>⭐ CGPA {student.cgpa}</span>}
                </div>
              </div>
              {student.admissionYear && (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 20px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{student.admissionYear}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>ADMISSION YEAR</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Personal Info */}
              <SectionCard title="Personal Information" icon="👤" color="#7c3aed">
                <InfoRow label="Date of Birth" value={student.dob} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Blood Group" value={student.bloodGroup} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Caste" value={student.caste} />
              </SectionCard>

              {/* Contact Info */}
              <SectionCard title="Contact Information" icon="📞" color="#0891b2">
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Phone" value={student.phone} />
                <InfoRow label="Address" value={student.address} />
                <InfoRow label="Parent Name" value={student.parentName} />
                <InfoRow label="Parent Phone" value={student.parentPhone} />
              </SectionCard>

              {/* Academic */}
              <SectionCard title="Academic Details" icon="🎓" color="#d97706">
                <InfoRow label="Admission Category" value={student.admissionCategory} />
                <InfoRow label="ABC / APAAR ID" value={student.apaarId} />
                <InfoRow label="Aadhaar Number" value={student.aadhaarNumber} />
                <InfoRow label="Counsellor" value={student.counsellor} />
              </SectionCard>

              {/* Coding Profiles */}
              <SectionCard title="Coding Profiles" icon="💻" color="#1e40af">
                {student.leetCode && <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>LeetCode</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[['Total', student.leetCodeSolved], ['Easy', student.leetCodeEasy], ['Medium', student.leetCodeMedium], ['Hard', student.leetCodeHard]].map(([l, v]) =>
                        v != null ? (
                          <div key={l} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontWeight: 900, fontSize: 16, color: '#1e40af' }}>{v}</div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{l}</div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </>}
                {student.codeChef && <>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>CodeChef</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[['Rating', student.codeChefRating], ['Stars', student.codeChefStars], ['Rank', student.codeChefRank]].map(([l, v]) =>
                        v != null ? (
                          <div key={l} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontWeight: 900, fontSize: 16, color: '#c2410c' }}>{v}</div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{l}</div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </>}
                {student.linkedIn && <InfoRow label="LinkedIn" value={student.linkedIn} />}
                {!student.leetCode && !student.codeChef && !student.linkedIn && <span style={{ color: '#94a3b8', fontSize: 13 }}>No coding profiles linked</span>}
              </SectionCard>
            </div>

            {/* Prior Education */}
            {(student.tenthSchool || student.interCollege) && (
              <SectionCard title="Prior Education" icon="🏫" color="#059669">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {student.tenthSchool && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 8 }}>10th Standard</div>
                      <InfoRow label="School" value={student.tenthSchool} />
                      <InfoRow label="Board" value={student.tenthBoard} />
                      <InfoRow label="Year" value={student.tenthYear} />
                      <InfoRow label="Percentage" value={student.tenthPercent ? `${student.tenthPercent}%` : null} />
                    </div>
                  )}
                  {student.interCollege && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 8 }}>Intermediate (12th)</div>
                      <InfoRow label="College" value={student.interCollege} />
                      <InfoRow label="Board" value={student.interBoard} />
                      <InfoRow label="Year" value={student.interYear} />
                      <InfoRow label="Percentage" value={student.interPercent ? `${student.interPercent}%` : null} />
                      <InfoRow label="Group" value={student.interGroup} />
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* CRT Performance */}
            {student.crtPerformance && student.crtPerformance.length > 0 && (
              <SectionCard title={`CRT Performance (${student.crtPerformance.length} modules)`} icon="🎯" color="#059669">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Module bars */}
                  {student.crtPerformance.map((p, i) => {
                    const pct = Math.round((p.score / (p.maxScore || 100)) * 100);
                    const color = pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#ef4444';
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.module}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color }}>{p.score}/{p.maxScore || 100} &nbsp;({pct}%)</span>
                        </div>
                        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 6, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  {/* Summary avg */}
                  {(() => {
                    const avg = (student.crtPerformance.reduce((s, p) => s + (p.score/(p.maxScore||100))*100, 0) / student.crtPerformance.length).toFixed(1);
                    const color = avg >= 75 ? '#059669' : avg >= 50 ? '#d97706' : '#ef4444';
                    return (
                      <div style={{ marginTop: 8, background: `${color}12`, borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Overall CRT Average</span>
                        <span style={{ fontSize: 22, fontWeight: 900, color }}>{avg}%</span>
                      </div>
                    );
                  })()}
                </div>
              </SectionCard>
            )}

            {/* Attendance */}
            {student.attendance && student.attendance.length > 0 && (
              <SectionCard title={`Attendance (${student.attendance.length} subjects)`} icon="📅" color="#0891b2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {student.attendance.map((a, i) => {
                    const pct = Math.round((a.present / (a.total || 1)) * 100);
                    const color = pct >= 75 ? '#059669' : pct >= 60 ? '#d97706' : '#ef4444';
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{a.subject}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color }}>{a.present}/{a.total} &nbsp;<span style={{ fontSize: 11 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 6, transition: 'width 0.5s ease' }} />
                        </div>
                        {pct < 75 && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, marginTop: 3 }}>⚠ Below 75% threshold</div>}
                      </div>
                    );
                  })}
                  {/* Summary */}
                  {(() => {
                    const avg = (student.attendance.reduce((s, a) => s + (a.present/(a.total||1))*100, 0) / student.attendance.length).toFixed(1);
                    const low = student.attendance.filter(a => Math.round((a.present/(a.total||1))*100) < 75).length;
                    const color = avg >= 75 ? '#059669' : avg >= 60 ? '#d97706' : '#ef4444';
                    return (
                      <div style={{ marginTop: 8, background: `${color}12`, borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Overall Attendance</span>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color }}>{avg}%</span>
                          {low > 0 && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{low} subject{low > 1 ? 's' : ''} below 75%</span>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </SectionCard>
            )}


            {/* Semester Performance */}
            {[1,2,3,4,5,6,7,8].some(i => student[`sem${i}Sgpa`] != null) && (
              <SectionCard title="Semester-wise Performance" icon="📊" color="#7c3aed">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[1,2,3,4,5,6,7,8].map(i => {
                    const sgpa = student[`sem${i}Sgpa`];
                    const cgpa = student[`sem${i}Cgpa`];
                    if (sgpa == null && cgpa == null) return null;
                    const color = sgpa >= 9 ? '#059669' : sgpa >= 7 ? '#0891b2' : sgpa >= 6 ? '#d97706' : '#dc2626';
                    return (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', border: `2px solid ${color}22`, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Sem {i}</div>
                        {sgpa != null && <div style={{ fontWeight: 900, fontSize: 20, color }}>{sgpa}</div>}
                        {sgpa != null && <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>SGPA</div>}
                        {cgpa != null && <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginTop: 4 }}>{cgpa} CGPA</div>}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <SectionCard title={`Documents (${docs.length})`} icon="📁" color="#dc2626">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {docs.map((d, i) => {
                    const url = d.fileUrl || d.filepath;
                    return (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {d.label || d.docType}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{d.filename || 'Uploaded'}</div>
                        {url && (url.startsWith('http') || url.startsWith('/') || url.includes('/uploads/')) ? (
                          <ViewButton url={url} label="View Document" />
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>No preview available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Achievements */}
            {achs.length > 0 && (
              <SectionCard title={`Achievements (${achs.length})`} icon="🏆" color="#d97706">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {achs.map((a, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {a.activityType === 'INTERNSHIP' ? '💼' : a.activityType === 'HACKATHON' ? '⚡' : ['RESEARCH_PUBLICATION', 'PATENT', 'JOURNAL_PAPER', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER'].includes(a.activityType) ? '📄' : '🏅'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          {a.activityType?.replace(/_/g, ' ')}
                          {a.organization && ` · ${a.organization}`}
                          {a.year && ` · ${a.year}`}
                        </div>
                        {a.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{a.description}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        {a.points != null && (
                          <span style={{ background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                            +{a.points} pts
                          </span>
                        )}
                        {a.status && (
                          <span style={{ background: a.status === 'APPROVED' ? '#dbeafe' : '#fef9c3', color: a.status === 'APPROVED' ? '#1e40af' : '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>
                            {a.status}
                          </span>
                        )}
                        {(a.certificateUrl || a.fileUrl) && (
                          <ViewButton url={a.certificateUrl || a.fileUrl} label="Certificate" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {docs.length === 0 && achs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                No documents or achievements uploaded yet
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Main SectionReport Component ───────────────────── */
const MiniBarChart = ({ chartData, color = '#059669', unit = '' }) => {
  if (!chartData || !chartData.length) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 160 }}>
      {chartData.map((item, i) => {
        const pct = Math.round((item.value / (item.max || 100)) * 100);
        const barColor = pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#ef4444';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, color: '#64748b', width: 68, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>{item.label}</span>
            <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 9, color: '#374151', fontWeight: 700, width: 28, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
};

export default function SectionReport() {
  const [mode, setMode] = useState('selection'); // 'selection' | 'bulk' | 'individual'

  // Bulk report states
  const [selItems, setSelItems] = useState([]);
  const [selDepts, setSelDepts] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [myStudents, setMyStudents] = useState([]);
  const [error, setError] = useState('');
  const [adminDocTypes, setAdminDocTypes] = useState([]);
  const [achCounts, setAchCounts] = useState({});

  // Advanced filters
  const [cgpaMin, setCgpaMin] = useState('');
  const [cgpaMax, setCgpaMax] = useState('');
  const [lcSolvedMin, setLcSolvedMin] = useState('');
  const [lcSolvedMax, setLcSolvedMax] = useState('');
  const [lcEasyMin,   setLcEasyMin]   = useState('');
  const [lcMedMin,    setLcMedMin]    = useState('');
  const [lcHardMin,   setLcHardMin]   = useState('');
  const [ccRatingMin, setCcRatingMin] = useState('');
  const [ccRatingMax, setCcRatingMax] = useState('');

  useEffect(() => {
    api.get('/students/count').then(r => setTotalStudents(r.data.count)).catch(() => {});
    api.get('/faculty/my-students').then(r => setMyStudents(r.data)).catch(() => {});
    api.get('/documents/admin-types').then(r => {
      const filtered = (r.data || []).filter(t => 
        !t.label.toUpperCase().includes('CRT') && 
        !t.label.toUpperCase().includes('ATTENDANCE') && 
        !t.label.toUpperCase().includes('PERFORMANCE')
      );
      setAdminDocTypes(filtered);
    }).catch(() => {});
    api.get('/achievements/counts-by-type').then(r => setAchCounts(r.data || {})).catch(() => {});
  }, []);

  const toggleItem = (val) => setSelItems(s => s.includes(val) ? s.filter(x => x !== val) : [...s, val]);
  const toggleGroupAll = (group) => {
    const vals = group.items.map(i => i.value);
    const allSel = vals.every(v => selItems.includes(v));
    setSelItems(s => allSel ? s.filter(x => !vals.includes(x)) : [...new Set([...s, ...vals])]);
  };
  const toggleAllItems = () => {
    const all = DOC_GROUPS.flatMap(g => g.items.map(i => i.value));
    setSelItems(prev => all.every(v => prev.includes(v)) ? [] : all);
  };
  const toggleDept = (dept) => {
    setSelDepts(d => { const n = {...d}; if (n[dept]) delete n[dept]; else n[dept] = [...DEPT_SECTIONS[dept]]; return n; });
  };
  const toggleSection = (dept, sec) => {
    setSelDepts(d => { const cur = d[dept]||[]; return {...d, [dept]: cur.includes(sec) ? cur.filter(x=>x!==sec) : [...cur,sec]}; });
  };
  const toggleAllDepts = () => {
    if (Object.keys(selDepts).length === DEPTS.length) { setSelDepts({}); }
    else { const all = {}; DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; }); setSelDepts(all); }
  };
  const handleResetContext = () => {
    setAcademicYear(''); setYearOfStudy(''); setSelDepts({}); setSelItems([]); setResults(null);
    setCgpaMin(''); setCgpaMax('');
    setLcSolvedMin(''); setLcSolvedMax(''); setLcEasyMin(''); setLcMedMin(''); setLcHardMin('');
    setCcRatingMin(''); setCcRatingMax('');
    setActiveTab('');
  };

  // Build the shared advanced-filter URLSearchParams entries
  const appendAdvancedFilters = (params) => {
    if (cgpaMin !== '')    params.append('cgpaMin', cgpaMin);
    if (cgpaMax !== '')    params.append('cgpaMax', cgpaMax);
    if (lcSolvedMin !== '') params.append('lcSolvedMin', lcSolvedMin);
    if (lcSolvedMax !== '') params.append('lcSolvedMax', lcSolvedMax);
    if (lcEasyMin !== '')  params.append('lcEasyMin', lcEasyMin);
    if (lcMedMin !== '')   params.append('lcMedMin', lcMedMin);
    if (lcHardMin !== '')  params.append('lcHardMin', lcHardMin);
    if (ccRatingMin !== '') params.append('ccRatingMin', ccRatingMin);
    if (ccRatingMax !== '') params.append('ccRatingMax', ccRatingMax);
  };

  const fetchReport = async () => {
    if (Object.keys(selDepts).length === 0) return setError('Select at least one department');
    if (selItems.length === 0) return setError('Select at least one document type');
    setError(''); setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('docType', d));
      if (academicYear && academicYear !== 'all') params.append('admissionYear', academicYear);
      if (yearOfStudy && yearOfStudy !== 'all') params.append('currentYear', yearOfStudy);
      appendAdvancedFilters(params);
      const { data } = await api.get(`/faculty/section-report?${params}`);
      setResults(data);
    } catch (e) { setError('Failed: ' + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const downloadExcel = async () => {
    setXlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/spm';
      const params = new URLSearchParams();
      Object.entries(selDepts).forEach(([dept, secs]) => secs.forEach(sec => { params.append('branch', dept); params.append('section', sec); }));
      selItems.forEach(d => params.append('docType', d));
      if (academicYear && academicYear !== 'all') params.append('admissionYear', academicYear);
      if (yearOfStudy && yearOfStudy !== 'all') params.append('currentYear', yearOfStudy);
      appendAdvancedFilters(params);
      const res = await fetch(`${baseUrl}/faculty/section-report/excel?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'section_report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Download failed'); }
    setXlLoading(false);
  };

  const uniqueStudents = results ? [...new Map(results.map(r => [r.regNumber, r])).values()] : [];
  const actualCols = results ? [...new Set(results.map(r => r.docType))] : selItems;
  const hasSelectedDept = Object.keys(selDepts).length > 0;

  /* ── Mode Selection Screen ── */
  if (mode === 'selection') {
    return (
      <div style={{ maxWidth: 680, margin: '60px auto', fontFamily: "'Segoe UI', Roboto, sans-serif", padding: '0 16px' }}>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .mode-card {
            background: #fff;
            border-radius: 18px;
            padding: 32px 28px;
            border: 2px solid #e2e8f0;
            cursor: pointer;
            transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
            flex: 1;
            text-align: left;
            animation: fadeInUp 0.4s ease-out both;
          }
          .mode-card:hover {
            border-color: #059669;
            box-shadow: 0 12px 32px rgba(5,150,105,0.12);
            transform: translateY(-3px);
          }
        `}</style>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #059669, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}>📊</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>Student Reports</h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0, fontWeight: 500 }}>
            Choose the report mode you want to generate.<br />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{totalStudents.toLocaleString()} students in the system</span>
          </p>
        </div>

        {/* Mode Cards */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* Bulk Report */}
          <button className="mode-card" onClick={() => setMode('bulk')} style={{ animationDelay: '0.05s' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18, boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}>📋</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>Section-wise / Bulk Report</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
              Filter by Department, Year, Sections and choose which data columns to export. Download results as Excel.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Departments', 'Sections', 'Document Columns', 'Excel Export'].map(t => (
                <span key={t} style={{ background: '#ecfdf5', color: '#065f46', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{t}</span>
              ))}
            </div>
          </button>

          {/* Individual Report */}
          <button className="mode-card" onClick={() => setMode('individual')} style={{ animationDelay: '0.12s' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18, boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>👤</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>Individual Student Report</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
              Search by Registration Number and view the student's complete profile — personal info, academics, documents, achievements, and coding stats.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Full Profile', 'Documents', 'Achievements', 'Print Ready'].map(t => (
                <span key={t} style={{ background: '#f5f3ff', color: '#6d28d9', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{t}</span>
              ))}
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ── Individual Report Mode ── */
  if (mode === 'individual') {
    return (
      <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
        <IndividualReport onBack={() => setMode('selection')} />
      </div>
    );
  }

  /* ── Bulk Report Mode ── (existing flow below) ── */

  // Context selection — Step 1
  if (!academicYear || !yearOfStudy) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .wizard-card { background:#fff; border-radius:16px; padding:36px 32px; border:1px solid #e2e8f0; box-shadow:0 10px 25px rgba(0,0,0,0.04); text-align:center; animation:slideUp 0.4s cubic-bezier(0.16,1,0.3,1); }
          @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .wizard-select { width:100%; padding:11px 14px; border:1.5px solid #d1d5db; border-radius:10px; font-size:14px; font-weight:600; color:#334155; background-color:#fff; outline:none; cursor:pointer; transition:all 0.2s ease; }
          .wizard-select:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,0.15); }
        `}</style>

        {/* Back to modes */}
        <button onClick={() => setMode('selection')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Report Types
        </button>

        <div className="wizard-card">
          <div style={{ width:64, height:64, borderRadius:16, background:'#ecfdf5', color:'#059669', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 20px', boxShadow:'0 4px 12px rgba(5,150,105,0.12)' }}>📊</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:'0 0 6px 0' }}>Section-wise Report</h2>
          <p style={{ color:'#64748b', fontSize:13, margin:'0 0 28px 0', lineHeight:1.5, fontWeight:500 }}>Select the Academic Year and Year of Study context to begin.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:20, textAlign:'left' }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Academic Year</label>
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="wizard-select">
                <option value="" disabled>-- Select Academic Year --</option>
                <option value="all">All Academic Years</option>
                {Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}-{String(y+1).slice(2)}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Year of Study</label>
              <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="wizard-select">
                <option value="" disabled>-- Select Year of Study --</option>
                <option value="all">All Years of Study</option>
                {['1','2','3','4'].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dept Selection — Step 2
  if (!hasSelectedDept) {
    return (
      <div style={{ maxWidth:540, margin:'40px auto', fontFamily:"'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .animate-fade { animation:fadeIn 0.4s ease-out; }
          @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          .wizard-card { background:#fff; border-radius:16px; padding:28px 32px; border:1px solid #e2e8f0; box-shadow:0 10px 25px rgba(0,0,0,0.04); }
          .wizard-select { width:100%; padding:11px 14px; border:1.5px solid #d1d5db; border-radius:10px; font-size:14px; font-weight:600; color:#334155; background-color:#fff; outline:none; cursor:pointer; transition:all 0.2s ease; }
          .wizard-select:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,0.15); }
        `}</style>

        {/* Context Header */}
        <div style={{ background:'#fff', borderRadius:14, padding:'12px 20px', border:'1px solid #e2e8f0', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:20 }}>🎯</div>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Active Filter Context</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginTop:2 }}>
                Year: <span style={{ color:'#059669' }}>{academicYear === 'all' ? 'All' : academicYear}</span>
                &nbsp;·&nbsp;
                Study Year: <span style={{ color:'#059669' }}>{yearOfStudy === 'all' ? 'All' : `Year ${yearOfStudy}`}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMode('selection')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>← Modes</button>
            <button onClick={handleResetContext} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Change Context</button>
          </div>
        </div>

        {/* My Counsellees */}
        {myStudents.length > 0 && (
          <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius:12, padding:'12px 16px', border:'1px solid #bbf7d0', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#065f46' }}>👥 My Counsellees</div>
              <div style={{ fontSize:11, color:'#059669', marginTop:2 }}>{myStudents.length} students assigned to you</div>
            </div>
            <button onClick={() => {
              const depts = {};
              myStudents.forEach(s => { if (!depts[s.branch]) depts[s.branch] = new Set(); depts[s.branch].add(String(s.section)); });
              const sel = {};
              Object.entries(depts).forEach(([d, secs]) => { sel[d] = [...secs]; });
              setSelDepts(sel);
            }} style={{ background:'#059669', color:'#fff', border:'none', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:12 }}>
              Select Mine
            </button>
          </div>
        )}

        <div className="wizard-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, borderBottom:'1px solid #f1f5f9', paddingBottom:8 }}>
            <div>
              <h3 style={{ fontWeight:800, fontSize:16, color:'#0f172a', margin:0 }}>1. Select Departments</h3>
              <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0 0', fontWeight:500 }}>Select branches / departments</p>
            </div>
            <button type="button" onClick={toggleAllDepts} style={{ fontSize:11, color:'#059669', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
              {Object.keys(selDepts).length === DEPTS.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          <div style={{ marginBottom:16, textAlign:'left' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Department</label>
            <select value={activeTab || ''} onChange={e => {
              const dept = e.target.value;
              if (dept === 'ALL') {
                toggleAllDepts();
                setActiveTab('CSE');
              } else if (dept) { 
                if (!selDepts[dept]) toggleDept(dept); 
                setActiveTab(dept); 
              }
            }} className="wizard-select">
              <option value="" disabled>-- Select Department --</option>
              <option value="ALL">{`All Departments ${Object.keys(selDepts).length === DEPTS.length ? '\u2713' : ''}`}</option>
              {DEPTS.map(dept => <option key={dept} value={dept}>{`${dept} ${selDepts[dept] ? '\u2713' : ''}`}</option>)}
            </select>
          </div>

          {Object.keys(selDepts).length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
              {Object.keys(selDepts).map(dept => (
                <span key={dept}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, background: activeTab===dept ? '#d1fae5' : '#f1f5f9', border:`1.5px solid ${activeTab===dept ? '#059669' : '#cbd5e1'}`, color: activeTab===dept ? '#065f46' : '#475569', padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                  <span>{dept}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); toggleDept(dept); if (activeTab===dept) { const r=Object.keys(selDepts).filter(x=>x!==dept); setActiveTab(r.length>0?r[0]:'CSE'); } }}
                    style={{ background:'none', border:'none', color:'#ef4444', fontWeight:900, cursor:'pointer', fontSize:13, padding:0 }}>✕</button>
                </span>
              ))}
            </div>
          )}


        </div>
      </div>
    );
  }

  // Step 3: Full Report Builder
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', fontFamily:"'Segoe UI', Roboto, sans-serif" }}>
      {/* Context Header */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', border:'1px solid #e2e8f0', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:20 }}>🎯</div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Active Report Filter Context</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginTop:2 }}>
              Academic Year: <span style={{ color:'#059669' }}>{academicYear === 'all' ? 'All Years' : academicYear}</span>
              &nbsp;·&nbsp;
              Year of Study: <span style={{ color:'#059669' }}>{yearOfStudy === 'all' ? 'All Study Years' : `Year ${yearOfStudy}`}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMode('selection')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>← Modes</button>
          <button onClick={handleResetContext} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Change Context</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        {/* Left: Document Types + Results */}
        <div>
          <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', border:'1px solid #e2e8f0', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>Document Types</div>
              <button onClick={toggleAllItems} style={{ fontSize:12, color:'#059669', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Select All</button>
            </div>
            {DOC_GROUPS.map(group => (
              <div key={group.key} style={{ marginBottom:14, padding:'12px 16px', background:group.bg, borderRadius:10, border:`1px solid ${group.color}22` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:group.color }}>{group.label}</span>
                  <button onClick={() => toggleGroupAll(group)} style={{ fontSize:11, color:group.color, background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Select All</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {group.items.map(item => {
                    const count = (group.key === 'achievements' || group.key === 'certifications') ? (achCounts[item.value.toUpperCase()] || 0) : null;
                    return (
                      <span key={item.value} onClick={() => toggleItem(item.value)} style={chip(selItems.includes(item.value), group.color)}>
                        {item.label} {count !== null && <span style={{ opacity: 0.6, fontSize: 10 }}>({count})</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Admin Documents */}
            {adminDocTypes.length > 0 && (() => {
              const allLabels = adminDocTypes.map(t => t.label);
              const parentTypes = adminDocTypes.filter(t => !allLabels.some(l => l !== t.label && t.label.startsWith(l + ' - ')));
              const parentWithCount = parentTypes.map(t => {
                const subCount = adminDocTypes.filter(x => x.label.startsWith(t.label + ' - ')).reduce((a, x) => a + x.count, 0);
                return { ...t, totalCount: subCount > 0 ? subCount : t.count };
              });
              return (
                <div style={{ marginBottom:14, padding:'12px 16px', background:'#fffbeb', borderRadius:10, border:'1px solid #fde68a22' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#d97706' }}>📂 Admin Documents</span>
                    <button onClick={() => {
                      const vals = parentWithCount.map(t => t.label);
                      const allSel = vals.every(v => selItems.includes(v));
                      setSelItems(s => allSel ? s.filter(x => !vals.includes(x)) : [...new Set([...s, ...vals])]);
                    }} style={{ fontSize:11, color:'#d97706', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Select All</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {parentWithCount.map(t => (
                      <span key={t.label} onClick={() => toggleItem(t.label)} style={chip(selItems.includes(t.label), '#d97706')}>
                        {t.label} <span style={{ opacity:0.6, fontSize:10 }}>({t.totalCount})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Results Table */}
          {results && (() => {
            const docMapByReg = {};
            results.forEach(x => {
              if (!docMapByReg[x.regNumber]) docMapByReg[x.regNumber] = {};
              docMapByReg[x.regNumber][x.docType] = x;
            });
            return (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:16 }}>
                <div style={{ padding:'14px 20px', fontWeight:700, fontSize:13, borderBottom:'1px solid #e2e8f0', color:'#0f172a' }}>
                  {uniqueStudents.length} students fetched &nbsp;·&nbsp; {actualCols.length} columns
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#059669' }}>
                        {['#','Reg No','Name','Dept','Section',...actualCols].map(h => (
                          <th key={h} style={{ padding:'10px 14px', color:'#fff', fontWeight:700, textAlign:'left', fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueStudents.map((r, i) => {
                        const docMap = docMapByReg[r.regNumber] || {};
                        return (
                          <tr key={r.regNumber} style={{ background:i%2===0?'#fff':'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'9px 14px', color:'#94a3b8' }}>{i+1}</td>
                            <td style={{ padding:'9px 14px', fontWeight:700, color:'#1e40af' }}>{r.regNumber}</td>
                            <td style={{ padding:'9px 14px' }}>{r.name}</td>
                            <td style={{ padding:'9px 14px' }}>{r.branch}</td>
                            <td style={{ padding:'9px 14px' }}>{r.section}</td>
                            {actualCols.map(dt => {
                              const val = docMap[dt];
                              const isChart = typeof val === 'object' && val && val.chartData;
                              if (isChart) {
                                return (
                                  <td key={dt} style={{ padding: '9px 14px', verticalAlign: 'top' }}>
                                    {val.chartData.length > 0
                                      ? <MiniBarChart chartData={val.chartData} />
                                      : <span style={{ color: '#94a3b8' }}>—</span>}
                                  </td>
                                );
                              }
                              const strVal = val && val.data !== '—' && val.data !== '-' ? val.data : null;
                              const ok = !!strVal;
                              const isUrl = ok && typeof strVal === 'string' && (
                                strVal.startsWith('http') ||
                                strVal.startsWith('/') ||
                                strVal.includes('/uploads/')
                              );
                              return (
                                <td key={dt} style={{ padding: '9px 14px' }}>
                                  {isUrl ? <ViewButton url={strVal} label="View PDF" /> : ok ? <span style={{ fontWeight: 600, color: '#0f172a' }}>{strVal}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Sidebar */}
        <div style={{ position:'sticky', top:20 }}>
          {/* Dept selector */}
          <div style={{ background:'#fff', borderRadius:14, padding:16, border:'1px solid #e2e8f0', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>Departments</div>
              <button type="button" onClick={toggleAllDepts} style={{ fontSize:11, color:'#059669', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
                {Object.keys(selDepts).length === DEPTS.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div style={{ marginBottom:12 }}>
              <select value={activeTab || ''} onChange={e => {
                const d=e.target.value;
                if (d === 'ALL') {
                  toggleAllDepts();
                  setActiveTab('CSE');
                } else if (d) {
                  if(!selDepts[d]) toggleDept(d);
                  setActiveTab(d);
                }
              }}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:13, fontWeight:600, color:'#334155', background:'#fff', outline:'none', cursor:'pointer' }}>
                <option value="" disabled>-- Select Department --</option>
                <option value="ALL">{`All Departments ${Object.keys(selDepts).length === DEPTS.length ? '\u2713' : ''}`}</option>
                {DEPTS.map(dept => <option key={dept} value={dept}>{`${dept} ${selDepts[dept] ? '\u2713' : ''}`}</option>)}
              </select>
            </div>
            {Object.keys(selDepts).length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Object.keys(selDepts).map(dept => (
                  <span key={dept}
                    style={{ display:'inline-flex', alignItems:'center', gap:4, background:activeTab===dept?'#d1fae5':'#f1f5f9', border:`1.5px solid ${activeTab===dept?'#059669':'#cbd5e1'}`, color:activeTab===dept?'#065f46':'#475569', padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                    <span>{dept}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); toggleDept(dept); if(activeTab===dept){const r=Object.keys(selDepts).filter(x=>x!==dept);setActiveTab(r.length>0?r[0]:'CSE');} }}
                      style={{ background:'none', border:'none', color:'#ef4444', fontWeight:900, cursor:'pointer', fontSize:11, padding:0 }}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <div style={{ color:'#ef4444', fontSize:12, marginBottom:10, background:'#fef2f2', padding:'8px 12px', borderRadius:7 }}>{error}</div>}

          {/* ── Advanced Filters ── */}
          {(selItems.includes('CGPA') ||
            selItems.some(x => ['LEETCODE_SOLVED','LEETCODE_EASY','LEETCODE_MEDIUM','LEETCODE_HARD'].includes(x)) ||
            selItems.some(x => ['CODECHEF_RATING'].includes(x))) && (() => {
            const filterInput = (value, setter, placeholder, min, max) => (
              <input
                type="number" value={value} min={min} max={max}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                style={{ flex:1, padding:'7px 10px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:12,
                  fontWeight:600, color:'#334155', outline:'none', minWidth:0,
                  transition:'border 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#059669'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            );
            const filterRow = (label, minVal, setMin, maxVal, setMax, minPh, maxPh, minN, maxN) => (
              <div key={label} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                  {label}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {filterInput(minVal, setMin, minPh, minN, maxN)}
                  <span style={{ color:'#94a3b8', fontWeight:700, fontSize:12, flexShrink:0 }}>–</span>
                  {filterInput(maxVal, setMax, maxPh, minN, maxN)}
                  {(minVal !== '' || maxVal !== '') && (
                    <button onClick={() => { setMin(''); setMax(''); }} title="Clear"
                      style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#ef4444', borderRadius:6, width:24, height:24, cursor:'pointer', fontWeight:900, fontSize:13, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>×</button>
                  )}
                </div>
              </div>
            );
            const filterRowMin = (label, minVal, setMin, minPh, minN) => (
              <div key={label} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                  {label} <span style={{ fontWeight:500, color:'#94a3b8' }}>(min)</span>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {filterInput(minVal, setMin, minPh, minN, 99999)}
                  {minVal !== '' && (
                    <button onClick={() => setMin('')} title="Clear"
                      style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#ef4444', borderRadius:6, width:24, height:24, cursor:'pointer', fontWeight:900, fontSize:13, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>×</button>
                  )}
                </div>
              </div>
            );
            return (
              <div style={{ background:'#fff', borderRadius:12, padding:'14px 16px', border:'1px solid #e2e8f0', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, borderBottom:'1px solid #f1f5f9', paddingBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:13, color:'#0f172a' }}>⚙ Advanced Filters</div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>Range filters — only matching students fetched</div>
                  </div>
                  <button onClick={() => {
                    setCgpaMin(''); setCgpaMax('');
                    setLcSolvedMin(''); setLcSolvedMax(''); setLcEasyMin(''); setLcMedMin(''); setLcHardMin('');
                    setCcRatingMin(''); setCcRatingMax('');
                  }} style={{ fontSize:10, color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Clear All</button>
                </div>

                {/* CGPA */}
                {selItems.includes('CGPA') && filterRow('CGPA Range', cgpaMin, setCgpaMin, cgpaMax, setCgpaMax, 'Min (0)', 'Max (10)', 0, 10)}

                {/* LeetCode */}
                {selItems.includes('LEETCODE_SOLVED') && filterRow('LC Total Solved', lcSolvedMin, setLcSolvedMin, lcSolvedMax, setLcSolvedMax, 'Min', 'Max', 0, 9999)}
                {selItems.includes('LEETCODE_EASY')   && filterRowMin('LC Easy Solved',   lcEasyMin, setLcEasyMin,   'Min Easy',   0)}
                {selItems.includes('LEETCODE_MEDIUM') && filterRowMin('LC Medium Solved',  lcMedMin,  setLcMedMin,   'Min Medium', 0)}
                {selItems.includes('LEETCODE_HARD')   && filterRowMin('LC Hard Solved',    lcHardMin, setLcHardMin,  'Min Hard',   0)}

                {/* CodeChef */}
                {selItems.includes('CODECHEF_RATING') && filterRow('CodeChef Rating', ccRatingMin, setCcRatingMin, ccRatingMax, setCcRatingMax, 'Min (0)', 'Max (3000)', 0, 3000)}
              </div>
            );
          })()}

          <button onClick={fetchReport} disabled={loading}
            style={{ width:'100%', background:loading?'#94a3b8':'#059669', color:'#fff', border:'none', padding:12, borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:14, marginBottom:8, boxShadow:'0 2px 6px rgba(5,150,105,0.15)' }}>
            {loading ? 'Fetching...' : 'Fetch Report'}
          </button>
          {results && (
            <button onClick={downloadExcel} disabled={xlLoading}
              style={{ width:'100%', background:xlLoading?'#94a3b8':'#1e40af', color:'#fff', border:'none', padding:12, borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:14, marginBottom:8, boxShadow:'0 2px 6px rgba(30,64,175,0.15)' }}>
              {xlLoading ? 'Generating...' : 'Download Excel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
