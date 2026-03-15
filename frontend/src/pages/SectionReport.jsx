import { useState } from 'react';
import api from '../api';

const DOC_TYPES = [
  { value: 'LEETCODE', label: 'LeetCode Report' },
  { value: 'CODECHEF', label: 'CodeChef Report' },
  { value: 'LINKEDIN', label: 'LinkedIn Profile' },
  { value: 'ABC_ID', label: 'ABC ID' },
  { value: 'APAAR_ID', label: 'APAAR ID' },
  { value: 'INTERNSHIP', label: 'Internship Certificates' },
  { value: 'HACKATHON', label: 'Hackathon Certificates' },
  { value: 'MARK_MEMO', label: 'Mark Memos' },
];

const YEARS = ['2021', '2022', '2023', '2024', '2025'];

// 19 departments with their sections
const DEPT_SECTIONS = {
  'CSE':   ['A','B','C','D','E','F','G'],
  'ECE':   ['A','B','C','D','E'],
  'EEE':   ['A','B','C'],
  'MECH':  ['A','B','C','D'],
  'CIVIL': ['A','B'],
  'IT':    ['A','B','C','D'],
  'AIML':  ['A','B','C','D'],
  'CSBS':  ['A','B'],
};

const ALL_DEPTS = Object.keys(DEPT_SECTIONS);

const s = {
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 },
  sectionHead: { fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { display: 'flex', flexWrap: 'wrap', gap: '8px 16px' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' },
  selectAll: { fontSize: 11, color: '#1e40af', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0 },
  btn: (color, disabled) => ({
    background: disabled ? '#94a3b8' : color, color: '#fff', border: 'none',
    padding: '11px 24px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: 14,
  }),
  tag: (hasData) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
    background: hasData ? '#d1fae5' : '#fee2e2', color: hasData ? '#065f46' : '#991b1b',
  }),
  deptBox: (selected) => ({
    border: `2px solid ${selected ? '#1e40af' : '#e2e8f0'}`,
    borderRadius: 10, padding: '10px 14px', marginBottom: 8,
    background: selected ? '#eff6ff' : '#fafafa',
    transition: 'all 0.15s',
  }),
};

function CheckGroup({ label, items, selected, onChange, renderLabel }) {
  const allSelected = items.every(i => selected.includes(i));
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);
  const toggleAll = () => onChange(allSelected ? [] : [...items]);
  return (
    <div>
      <div style={s.sectionHead}>
        <span>{label}</span>
        <button type="button" style={s.selectAll} onClick={toggleAll}>
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div style={s.checkRow}>
        {items.map(item => (
          <label key={item} style={s.checkLabel}>
            <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)}
              style={{ accentColor: '#1e40af', width: 15, height: 15 }} />
            {renderLabel ? renderLabel(item) : item}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SectionReport() {
  const [admissionYear, setAdmissionYear] = useState('');
  const [selDepts, setSelDepts] = useState([]);
  const [selSections, setSelSections] = useState({});   // { DEPT: ['A','B',...] }
  const [selDocTypes, setSelDocTypes] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  // When dept checkbox changes, init/remove its sections
  const toggleDept = (dept) => {
    if (selDepts.includes(dept)) {
      setSelDepts(d => d.filter(x => x !== dept));
      setSelSections(s => { const n = { ...s }; delete n[dept]; return n; });
    } else {
      setSelDepts(d => [...d, dept]);
      setSelSections(s => ({ ...s, [dept]: [...DEPT_SECTIONS[dept]] })); // default all sections selected
    }
  };

  const toggleAllDepts = () => {
    if (selDepts.length === ALL_DEPTS.length) {
      setSelDepts([]); setSelSections({});
    } else {
      setSelDepts([...ALL_DEPTS]);
      const all = {};
      ALL_DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; });
      setSelSections(all);
    }
  };

  const setSectionsForDept = (dept, secs) => setSelSections(s => ({ ...s, [dept]: secs }));

  const buildParams = () => {
    // Build list of {branch, section} combos
    const combos = [];
    selDepts.forEach(dept => {
      const secs = selSections[dept] || [];
      secs.forEach(sec => combos.push({ branch: dept, section: sec }));
    });
    return { combos, docTypes: selDocTypes, admissionYear };
  };

  const fetchReport = async (e) => {
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
    } catch {
      setError('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { combos, docTypes, admissionYear: yr } = buildParams();
      const params = new URLSearchParams();
      combos.forEach(c => { params.append('branch', c.branch); params.append('section', c.section); });
      docTypes.forEach(d => params.append('docType', d));
      if (yr) params.append('admissionYear', yr);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/faculty/section-report/excel?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `section_report_${selDepts.join('-')}_${docTypes.join('-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const allDeptsSelected = selDepts.length === ALL_DEPTS.length;
  const hasData = results ? results.filter(r => r.data && r.data !== '—').length : 0;

  return (
    <div>
      <h2 style={{ color: '#1e40af', marginBottom: 4 }}>Section-wise PDF Generator</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
        Select departments, sections, document types and generate a PDF report instantly.
      </p>

      <form onSubmit={fetchReport}>
        {/* Academic Year */}
        <div style={s.card}>
          <div style={s.sectionHead}><span>Academic Year (optional)</span></div>
          <select value={admissionYear} onChange={e => setAdmissionYear(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', minWidth: 200 }}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Departments + Sections */}
        <div style={s.card}>
          <div style={s.sectionHead}>
            <span>Departments & Sections</span>
            <button type="button" style={s.selectAll} onClick={toggleAllDepts}>
              {allDeptsSelected ? 'Deselect All Departments' : 'Select All Departments'}
            </button>
          </div>
          {ALL_DEPTS.map(dept => (
            <div key={dept} style={s.deptBox(selDepts.includes(dept))}>
              {/* Dept checkbox */}
              <label style={{ ...s.checkLabel, fontWeight: 700, fontSize: 14, marginBottom: selDepts.includes(dept) ? 10 : 0 }}>
                <input type="checkbox" checked={selDepts.includes(dept)} onChange={() => toggleDept(dept)}
                  style={{ accentColor: '#1e40af', width: 16, height: 16 }} />
                {dept}
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
                  ({DEPT_SECTIONS[dept].length} sections)
                </span>
              </label>

              {/* Sections for this dept — only show when dept is selected */}
              {selDepts.includes(dept) && (
                <div style={{ marginLeft: 24, marginTop: 6 }}>
                  <CheckGroup
                    label=""
                    items={DEPT_SECTIONS[dept]}
                    selected={selSections[dept] || []}
                    onChange={(secs) => setSectionsForDept(dept, secs)}
                    renderLabel={(sec) => `Section ${sec}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Document Types */}
        <div style={s.card}>
          <CheckGroup
            label="Document Types"
            items={DOC_TYPES.map(d => d.value)}
            selected={selDocTypes}
            onChange={setSelDocTypes}
            renderLabel={(val) => DOC_TYPES.find(d => d.value === val)?.label}
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#fef2f2', padding: '9px 13px', borderRadius: 7, border: '1px solid #fecaca' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button style={s.btn('#1e40af', loading)} type="submit" disabled={loading}>
            {loading ? 'Fetching...' : '🔍 Fetch Report'}
          </button>
          {results && (
            <button style={s.btn('#059669', pdfLoading)} type="button" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? 'Generating...' : '📄 Download PDF'}
            </button>
          )}
        </div>
      </form>

      {/* Results Preview */}
      {results && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
              {results.length} student{results.length !== 1 ? 's' : ''} found
            </span>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              ✅ {hasData} filled &nbsp;|&nbsp; ❌ {results.length - hasData} missing
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Reg No', 'Name', 'Dept', 'Section', 'Document Type', 'Data', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={`${r.regNumber}-${r.docType}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e40af' }}>{r.regNumber}</td>
                  <td style={{ padding: '8px 12px' }}>{r.name}</td>
                  <td style={{ padding: '8px 12px' }}>{r.branch}</td>
                  <td style={{ padding: '8px 12px' }}>{r.section}</td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>{DOC_TYPES.find(d => d.value === r.docType)?.label || r.docType}</td>
                  <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.data && r.data !== '—' ? r.data : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={s.tag(r.data && r.data !== '—')}>
                      {r.data && r.data !== '—' ? '✓ Available' : '✗ Missing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
