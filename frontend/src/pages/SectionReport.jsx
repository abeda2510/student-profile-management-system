import { useState } from 'react';
import api from '../api';

const DOC_TYPES = [
  { value: 'LEETCODE', label: 'LeetCode Report', icon: '💻' },
  { value: 'CODECHEF', label: 'CodeChef Report', icon: '👨‍🍳' },
  { value: 'LINKEDIN', label: 'LinkedIn Profile', icon: '🔗' },
  { value: 'ABC_ID', label: 'ABC ID', icon: '🪪' },
  { value: 'APAAR_ID', label: 'APAAR ID', icon: '🪪' },
  { value: 'INTERNSHIP', label: 'Internship Certificates', icon: '💼' },
  { value: 'HACKATHON', label: 'Hackathon Certificates', icon: '🏆' },
  { value: 'MARK_MEMO', label: 'Mark Memos', icon: '📋' },
];
const YEARS = ['2021', '2022', '2023', '2024', '2025'];
const DEPT_SECTIONS = {
  CSE: ['A','B','C','D','E','F','G'], ECE: ['A','B','C','D','E'],
  EEE: ['A','B','C'], MECH: ['A','B','C','D'], CIVIL: ['A','B'],
  IT: ['A','B','C','D'], AIML: ['A','B','C','D'], CSBS: ['A','B'],
};
const ALL_DEPTS = Object.keys(DEPT_SECTIONS);

const DEPT_COLORS = {
  CSE: '#1e40af', ECE: '#7c3aed', EEE: '#d97706', MECH: '#dc2626',
  CIVIL: '#059669', IT: '#0891b2', AIML: '#db2777', CSBS: '#65a30d',
};

export default function SectionReport() {
  const [admissionYear, setAdmissionYear] = useState('');
  const [selDepts, setSelDepts] = useState([]);
  const [selSections, setSelSections] = useState({});
  const [selDocTypes, setSelDocTypes] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDept = dept => {
    if (selDepts.includes(dept)) {
      setSelDepts(d => d.filter(x => x !== dept));
      setSelSections(s => { const n = { ...s }; delete n[dept]; return n; });
    } else {
      setSelDepts(d => [...d, dept]);
      setSelSections(s => ({ ...s, [dept]: [...DEPT_SECTIONS[dept]] }));
    }
  };

  const toggleAllDepts = () => {
    if (selDepts.length === ALL_DEPTS.length) { setSelDepts([]); setSelSections({}); }
    else {
      setSelDepts([...ALL_DEPTS]);
      const all = {};
      ALL_DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; });
      setSelSections(all);
    }
  };

  const toggleDocType = val => setSelDocTypes(s => s.includes(val) ? s.filter(x => x !== val) : [...s, val]);
  const toggleAllDocs = () => setSelDocTypes(s => s.length === DOC_TYPES.length ? [] : DOC_TYPES.map(d => d.value));

  const buildParams = () => {
    const combos = [];
    selDepts.forEach(dept => (selSections[dept] || []).forEach(sec => combos.push({ branch: dept, section: sec })));
    return { combos, docTypes: selDocTypes, admissionYear };
  };

  const fetchReport = async e => {
    e.preventDefault();
    if (selDepts.length === 0) return setError('Select at least one department');
    if (selDocTypes.length === 0) return setError('Select at least one document type');
    setError(''); setLoading(true); setResults(null);
    try {
      const { combos, docTypes, admissionYear: yr } = buildParams();
      const params = new URLSearchParams();
      combos.forEach(c => { params.append('branch', c.branch); params.append('section', c.section); });
      docTypes.forEach(d => params.append('docType', d));
      if (yr) params.append('admissionYear', yr);
      const { data } = await api.get(`/faculty/section-report?${params.toString()}`);
      setResults(data);
    } catch { setError('Failed to fetch report'); }
    finally { setLoading(false); }
  };

  const download = async (type) => {
    const setLoad = type === 'excel' ? setExcelLoading : setPdfLoading;
    setLoad(true);
    try {
      const { combos, docTypes, admissionYear: yr } = buildParams();
      const params = new URLSearchParams();
      combos.forEach(c => { params.append('branch', c.branch); params.append('section', c.section); });
      docTypes.forEach(d => params.append('docType', d));
      if (yr) params.append('admissionYear', yr);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      const url = type === 'excel'
        ? `${baseUrl}/api/faculty/section-report/excel?${params}`
        : `${baseUrl}/api/faculty/section-report/pdf?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `section_report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
    } catch (err) { setError(`Failed to generate ${type === 'excel' ? 'Excel' : 'PDF'}: ${err.message}`); }
    finally { setLoad(false); }
  };

  const hasData = results ? results.filter(r => r.data && r.data !== '—').length : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Section-wise Report Generator</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Select departments, sections and document types to generate reports</div>
      </div>

      <form onSubmit={fetchReport}>
        {/* Academic Year */}
        <div className="card">
          <CardHeader title="Academic Year" subtitle="optional" />
          <select value={admissionYear} onChange={e => setAdmissionYear(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: 9, fontSize: 14, minWidth: 220, background: '#fff', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Departments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CardHeader title="Departments & Sections" />
            <button type="button" onClick={toggleAllDepts}
              style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
              {selDepts.length === ALL_DEPTS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {ALL_DEPTS.map(dept => {
              const selected = selDepts.includes(dept);
              const color = DEPT_COLORS[dept] || '#1e40af';
              return (
                <div key={dept} style={{ border: `2px solid ${selected ? color : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.15s', background: selected ? '#fff' : '#fafafa' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', background: selected ? color + '10' : 'transparent' }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleDept(dept)}
                      style={{ accentColor: color, width: 16, height: 16, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: selected ? color : '#374151' }}>{dept}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({DEPT_SECTIONS[dept].length} sections)</span>
                    </div>
                    {selected && (
                      <span style={{ background: color, color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {(selSections[dept] || []).length}/{DEPT_SECTIONS[dept].length}
                      </span>
                    )}
                  </label>
                  {selected && (
                    <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${color}22`, background: '#fff' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {DEPT_SECTIONS[dept].map(sec => {
                          const secSel = (selSections[dept] || []).includes(sec);
                          return (
                            <label key={sec} style={{ cursor: 'pointer' }}>
                              <input type="checkbox" checked={secSel}
                                onChange={() => {
                                  const cur = selSections[dept] || [];
                                  setSelSections(s => ({ ...s, [dept]: secSel ? cur.filter(x => x !== sec) : [...cur, sec] }));
                                }}
                                style={{ display: 'none' }} />
                              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: `1.5px solid ${secSel ? color : '#e2e8f0'}`, background: secSel ? color : '#fff', color: secSel ? '#fff' : '#64748b', transition: 'all 0.1s' }}>
                                {sec}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Types */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CardHeader title="Document Types" />
            <button type="button" onClick={toggleAllDocs}
              style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
              {selDocTypes.length === DOC_TYPES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {DOC_TYPES.map(dt => {
              const sel = selDocTypes.includes(dt.value);
              return (
                <label key={dt.value} style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleDocType(dt.value)} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sel ? '#1e40af' : '#e2e8f0'}`, background: sel ? '#eff6ff' : '#fafafa', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18 }}>{dt.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? '#1e40af' : '#374151' }}>{dt.label}</span>
                    {sel && <span style={{ marginLeft: 'auto', color: '#1e40af', fontSize: 14 }}>✓</span>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ color: '#991b1b', fontSize: 13, marginBottom: 16, background: '#fef2f2', padding: '12px 16px', borderRadius: 9, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading}
            style={{ background: loading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
            {loading ? '⏳ Fetching...' : '🔍 Fetch Report'}
          </button>
          {results && (
            <>
              <button type="button" disabled={excelLoading} onClick={() => download('excel')}
                style={{ background: excelLoading ? '#94a3b8' : '#059669', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 9, cursor: excelLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
                {excelLoading ? 'Generating...' : '📊 Download Excel'}
              </button>
              <button type="button" disabled={pdfLoading} onClick={() => download('pdf')}
                style={{ background: pdfLoading ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 9, cursor: pdfLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
                {pdfLoading ? 'Generating...' : '📄 Download PDF'}
              </button>
            </>
          )}
        </div>
      </form>

      {results && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{results.length} students found</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ background: '#ecfdf5', color: '#065f46', borderRadius: 99, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>✅ {hasData} filled</span>
              <span style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 99, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>❌ {results.length - hasData} missing</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Reg No', 'Name', 'Dept', 'Sec', 'Document Type', 'Data', 'Status'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', background: '#1e40af', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: i === 0 ? '8px 0 0 0' : i === 7 ? '0 8px 0 0' : 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const ok = r.data && r.data !== '—';
                  return (
                    <tr key={`${r.regNumber}-${r.docType}-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '11px 14px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1e40af', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>{r.regNumber}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>{r.name}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                        <span style={{ background: (DEPT_COLORS[r.branch] || '#1e40af') + '18', color: DEPT_COLORS[r.branch] || '#1e40af', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{r.branch}</span>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600 }}>{r.section}</td>
                      <td style={{ padding: '11px 14px', color: '#475569', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>{DOC_TYPES.find(d => d.value === r.docType)?.label || r.docType}</td>
                      <td style={{ padding: '11px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: ok ? '#0f172a' : '#94a3b8' }}>
                        {ok ? r.data : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: ok ? '#ecfdf5' : '#fef2f2', color: ok ? '#065f46' : '#991b1b' }}>
                          {ok ? '✓ Available' : '✗ Missing'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CardHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>({subtitle})</span>}
    </div>
  );
}
