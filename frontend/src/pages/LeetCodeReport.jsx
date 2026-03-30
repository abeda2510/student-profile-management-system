import { useState } from "react";
import api from "../api";

const DEPTS = ["CSE","ECE","EEE","MECH","CIVIL","IT","AIML","CSBS"];
const DEPT_SECTIONS = {
  CSE: Array.from({length:19},(_,i)=>String(i+1)),
  ECE: Array.from({length:8},(_,i)=>String(i+1)),
  EEE: Array.from({length:4},(_,i)=>String(i+1)),
  MECH: Array.from({length:5},(_,i)=>String(i+1)),
  CIVIL: Array.from({length:3},(_,i)=>String(i+1)),
  IT: Array.from({length:6},(_,i)=>String(i+1)),
  AIML: Array.from({length:6},(_,i)=>String(i+1)),
  CSBS: Array.from({length:3},(_,i)=>String(i+1)),
};
const DEPT_COLORS = { CSE:"#1e40af",ECE:"#7c3aed",EEE:"#d97706",MECH:"#dc2626",CIVIL:"#059669",IT:"#0891b2",AIML:"#db2777",CSBS:"#65a30d" };
const th = { padding:"10px 12px", textAlign:"left", color:"#fff", fontWeight:700, background:"#1d4ed8", fontSize:12, textTransform:"uppercase" };
const td = { padding:"9px 12px", fontSize:13, borderBottom:"1px solid #f1f5f9", color:"#334155" };
const pill = c => ({ display:"inline-block", background:c+"22", color:c, borderRadius:6, padding:"2px 9px", fontWeight:700, fontSize:12 });
const sel = { padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, outline:"none", background:"#f8fafc", fontFamily:"inherit" };

export default function LeetCodeReport() {
  const [selDepts, setSelDepts] = useState([]);
  const [selSections, setSelSections] = useState({});
  const [minCgpa, setMinCgpa] = useState("");
  const [minLeet, setMinLeet] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [excelLoad, setExcelLoad] = useState(false);
  const [error, setError] = useState("");

  const toggleDept = dept => {
    if (selDepts.includes(dept)) {
      setSelDepts(d => d.filter(x => x !== dept));
      setSelSections(s => { const n={...s}; delete n[dept]; return n; });
    } else {
      setSelDepts(d => [...d, dept]);
      setSelSections(s => ({ ...s, [dept]: [...DEPT_SECTIONS[dept]] }));
    }
  };

  const toggleSection = (dept, sec) => {
    const cur = selSections[dept] || [];
    setSelSections(s => ({ ...s, [dept]: cur.includes(sec) ? cur.filter(x=>x!==sec) : [...cur, sec] }));
  };

  const toggleAllDepts = () => {
    if (selDepts.length === DEPTS.length) { setSelDepts([]); setSelSections({}); }
    else {
      setSelDepts([...DEPTS]);
      const all = {};
      DEPTS.forEach(d => { all[d] = [...DEPT_SECTIONS[d]]; });
      setSelSections(all);
    }
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    selDepts.forEach(d => params.append("branch", d));
    // only filter by section if user deselected some (not all selected)
    selDepts.forEach(d => {
      const allSecs = DEPT_SECTIONS[d];
      const chosen = selSections[d] || [];
      if (chosen.length > 0 && chosen.length < allSecs.length) {
        chosen.forEach(s => params.append("section", s));
      }
    });
    if (minCgpa !== "") params.set("minCgpa", minCgpa);
    if (minLeet !== "") params.set("minLeetcode", minLeet);
    return params;
  };

  const fetchStats = async () => {
    if (selDepts.length === 0) return setError("Select at least one department");
    setLoading(true); setError(""); setRows(null);
    try {
      const params = buildParams();
      const { data } = await api.get("/leetcode/report/multi?" + params);
      setRows(data);
    } catch { setError("Failed to fetch. Make sure backend is running."); }
    finally { setLoading(false); }
  };

  const downloadExcel = async () => {
    setExcelLoad(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const params = buildParams();
      const res = await window.fetch("http://localhost:5000/api/leetcode/report/excel?" + params, {
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "leetcode_report.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Failed to generate Excel."); }
    finally { setExcelLoad(false); }
  };

  const withStats = rows ? rows.filter(r => r.stats) : [];
  const avgSolved = withStats.length ? Math.round(withStats.reduce((s,r)=>s+r.stats.total,0)/withStats.length) : 0;
  const cgpaRows = rows ? rows.filter(r => r.cgpa) : [];
  const avgCgpa = cgpaRows.length ? (cgpaRows.reduce((s,r)=>s+r.cgpa,0)/cgpaRows.length).toFixed(2) : "—";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>LeetCode + CGPA Report</div>
        <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Select departments, sections and filters to generate report</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>Select Departments & Sections</div>
          <button type="button" onClick={toggleAllDepts}
            style={{ fontSize:12, color:"#1e40af", fontWeight:700, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, padding:"5px 12px", cursor:"pointer" }}>
            {selDepts.length === DEPTS.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:10 }}>
          {DEPTS.map(dept => {
            const selected = selDepts.includes(dept);
            const color = DEPT_COLORS[dept] || "#1e40af";
            return (
              <div key={dept} style={{ border:`2px solid ${selected ? color : "#e2e8f0"}`, borderRadius:12, overflow:"hidden", background: selected ? "#fff" : "#fafafa" }}>
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background: selected ? color+"10" : "transparent" }}>
                  <input type="checkbox" checked={selected} onChange={() => toggleDept(dept)} style={{ accentColor:color, width:15, height:15 }} />
                  <span style={{ fontWeight:700, fontSize:13, color: selected ? color : "#374151" }}>{dept}</span>
                  <span style={{ fontSize:11, color:"#94a3b8", marginLeft:2 }}>({DEPT_SECTIONS[dept].length} sec)</span>
                  {selected && <span style={{ marginLeft:"auto", background:color, color:"#fff", borderRadius:99, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{(selSections[dept]||[]).length}/{DEPT_SECTIONS[dept].length}</span>}
                </label>
                {selected && (
                  <div style={{ padding:"8px 14px 10px", borderTop:`1px solid ${color}22`, background:"#fff", display:"flex", flexWrap:"wrap", gap:5 }}>
                    {DEPT_SECTIONS[dept].map(sec => {
                      const secSel = (selSections[dept]||[]).includes(sec);
                      return (
                        <label key={sec} style={{ cursor:"pointer" }}>
                          <input type="checkbox" checked={secSel} onChange={() => toggleSection(dept, sec)} style={{ display:"none" }} />
                          <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:99, fontSize:12, fontWeight:600, border:`1.5px solid ${secSel ? color : "#e2e8f0"}`, background: secSel ? color : "#fff", color: secSel ? "#fff" : "#64748b" }}>
                            {sec}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end", marginTop:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:4, textTransform:"uppercase" }}>Min CGPA</div>
            <input style={{ ...sel, width:120 }} type="number" min="0" max="10" step="0.1" placeholder="e.g. 8.0" value={minCgpa} onChange={e => setMinCgpa(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:4, textTransform:"uppercase" }}>Min LeetCode Solved</div>
            <input style={{ ...sel, width:140 }} type="number" min="0" placeholder="e.g. 10" value={minLeet} onChange={e => setMinLeet(e.target.value)} />
          </div>
          <button onClick={fetchStats} disabled={loading || selDepts.length===0}
            style={{ background: loading||selDepts.length===0 ? "#94a3b8" : "#1d4ed8", color:"#fff", border:"none", padding:"10px 22px", borderRadius:9, cursor: loading||selDepts.length===0 ? "not-allowed" : "pointer", fontWeight:700, fontSize:13 }}>
            {loading ? "Fetching..." : "Fetch Stats"}
          </button>
          {rows && rows.length > 0 && (
            <button onClick={downloadExcel} disabled={excelLoad}
              style={{ background: excelLoad ? "#94a3b8" : "#059669", color:"#fff", border:"none", padding:"10px 22px", borderRadius:9, cursor: excelLoad ? "not-allowed" : "pointer", fontWeight:700, fontSize:13 }}>
              {excelLoad ? "Generating..." : "📊 Download Excel"}
            </button>
          )}
          {(selDepts.length>0||minCgpa||minLeet) && (
            <button onClick={() => { setSelDepts([]); setSelSections({}); setMinCgpa(""); setMinLeet(""); setRows(null); }}
              style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#374151", padding:"10px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600 }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ color:"#991b1b", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, padding:"10px 14px", marginBottom:16, fontSize:13 }}>⚠️ {error}</div>}

      {rows && (
        <>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
            {[
              { label:"Matching Students", value:rows.length, color:"#1d4ed8", bg:"#eff6ff" },
              { label:"Avg CGPA", value:avgCgpa, color:"#059669", bg:"#ecfdf5" },
              { label:"Avg LeetCode", value:avgSolved, color:"#7c3aed", bg:"#f5f3ff" },
              { label:"Total Easy", value:withStats.reduce((s,r)=>s+r.stats.easy,0), color:"#16a34a", bg:"#f0fdf4" },
              { label:"Total Medium", value:withStats.reduce((s,r)=>s+r.stats.medium,0), color:"#d97706", bg:"#fffbeb" },
              { label:"Total Hard", value:withStats.reduce((s,r)=>s+r.stats.hard,0), color:"#dc2626", bg:"#fef2f2" },
            ].map(item => (
              <div key={item.label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e2e8f0", borderTop:`3px solid ${item.color}`, minWidth:120, textAlign:"center" }}>
                <div style={{ fontSize:26, fontWeight:800, color:item.color }}>{item.value}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:4, fontWeight:500 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {rows.length === 0 && <div className="card" style={{ color:"#64748b", textAlign:"center", padding:48 }}>No students match the selected filters.</div>}

          {rows.length > 0 && (
            <div className="card">
              <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:14 }}>{rows.length} students</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["#","Reg No","Name","Dept","Sec","CGPA","LeetCode ID","Total","Easy","Medium","Hard","Status"].map((h,i) => (
                      <th key={h} style={{ ...th, borderRadius: i===0?"8px 0 0 0":i===11?"0 8px 0 0":0 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r,i) => (
                      <tr key={r.regNumber} style={{ background: i%2===0?"#fff":"#f8fafc" }}>
                        <td style={td}>{i+1}</td>
                        <td style={{ ...td, fontWeight:700, color:"#1d4ed8" }}>{r.regNumber}</td>
                        <td style={td}>{r.name}</td>
                        <td style={td}>{r.branch}</td>
                        <td style={td}>{r.section}</td>
                        <td style={td}>{r.cgpa ? <span style={pill(r.cgpa>=8?"#059669":r.cgpa>=6?"#d97706":"#dc2626")}>{r.cgpa}</span> : <span style={{ color:"#94a3b8" }}>—</span>}</td>
                        <td style={td}>{r.username ? <a href={"https://leetcode.com/"+r.username} target="_blank" rel="noreferrer" style={{ color:"#f59e0b", fontWeight:700 }}>{r.username}</a> : <span style={{ color:"#94a3b8" }}>Not set</span>}</td>
                        <td style={td}>{r.stats ? <span style={pill("#1d4ed8")}>{r.stats.total}</span> : <span style={{ color:"#94a3b8" }}>—</span>}</td>
                        <td style={td}>{r.stats ? <span style={pill("#16a34a")}>{r.stats.easy}</span> : "—"}</td>
                        <td style={td}>{r.stats ? <span style={pill("#d97706")}>{r.stats.medium}</span> : "—"}</td>
                        <td style={td}>{r.stats ? <span style={pill("#dc2626")}>{r.stats.hard}</span> : "—"}</td>
                        <td style={td}>
                          {!r.username ? <span style={{ background:"#f1f5f9", color:"#64748b", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>No username</span>
                            : !r.stats ? <span style={{ background:"#fffbeb", color:"#92400e", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>Private</span>
                            : <span style={{ background:"#ecfdf5", color:"#065f46", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>✓ Fetched</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}