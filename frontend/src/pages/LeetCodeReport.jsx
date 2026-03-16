import { useState, useMemo } from "react";
import api from "../api";

const DEPT_SECTIONS = {
  CSE: ["A","B","C","D","E","F","G"], ECE: ["A","B","C","D","E"],
  EEE: ["A","B","C"], MECH: ["A","B","C","D"], CIVIL: ["A","B"],
  IT: ["A","B","C","D"], AIML: ["A","B","C","D"], CSBS: ["A","B"],
};

const th = { padding: "11px 12px", textAlign: "left", color: "#fff", fontWeight: 700, background: "#1d4ed8", fontSize: 12, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.3 };
const td = { padding: "9px 12px", fontSize: 13, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", color: "#334155" };
const pill = (c) => ({ display: "inline-block", background: c + "22", color: c, borderRadius: 6, padding: "2px 9px", fontWeight: 700, fontSize: 12 });
const sel = { padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, outline: "none", background: "#f8fafc", fontFamily: "inherit" };
const lbl = { fontSize: 13, fontWeight: 700, color: '#1e293b', display: "block", marginBottom: 5 };
const btn = (color, off) => ({ background: off ? "#94a3b8" : color, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 9, cursor: off ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, transition: "opacity 0.15s" });

export default function LeetCodeReport() {
  const [branch, setBranch] = useState("CSE");
  const [section, setSection] = useState("A");
  const [minCgpa, setMinCgpa] = useState("");
  const [minLeet, setMinLeet] = useState("");
  const [allRows, setAllRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoad, setPdfLoad] = useState(false);
  const [error, setError] = useState("");
  const sections = DEPT_SECTIONS[branch] || ["A"];

  const rows = useMemo(() => {
    if (!allRows) return null;
    return allRows.filter(r => {
      if (minCgpa !== "" && (r.cgpa === null || r.cgpa < parseFloat(minCgpa))) return false;
      if (minLeet !== "" && (!r.stats || r.stats.total < parseInt(minLeet))) return false;
      return true;
    });
  }, [allRows, minCgpa, minLeet]);

  const fetchStats = async () => {
    setLoading(true); setError(""); setAllRows(null);
    try {
      const { data } = await api.get("/leetcode/report?branch=" + branch + "&section=" + section);
      setAllRows(data);
    } catch { setError("Failed to fetch. Make sure backend is running."); }
    finally { setLoading(false); }
  };

  const downloadPdf = async () => {
    setPdfLoad(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ branch, section });
      if (minCgpa !== "") params.set("minCgpa", minCgpa);
      if (minLeet !== "") params.set("minLeetcode", minLeet);
      const res = await window.fetch("/api/leetcode/report/pdf?" + params, { headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `leetcode_${branch}_${section}_filtered.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Failed to generate PDF."); }
    finally { setPdfLoad(false); }
  };

  const withStats = rows ? rows.filter(r => r.stats) : [];
  const avgSolved = withStats.length ? Math.round(withStats.reduce((s, r) => s + r.stats.total, 0) / withStats.length) : 0;
  const cgpaRows = rows ? rows.filter(r => r.cgpa) : [];
  const avgCgpa = cgpaRows.length ? (cgpaRows.reduce((s, r) => s + r.cgpa, 0) / cgpaRows.length).toFixed(2) : "—";
  const filtersActive = minCgpa !== "" || minLeet !== "";

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: -0.4 }}>LeetCode + CGPA Report</div>
        <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>Filter students by CGPA and LeetCode performance, then export to PDF</div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={lbl}>Department</label>
            <select style={sel} value={branch} onChange={e => { setBranch(e.target.value); setSection(DEPT_SECTIONS[e.target.value][0]); setAllRows(null); }}>
              {Object.keys(DEPT_SECTIONS).map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Section</label>
            <select style={sel} value={section} onChange={e => { setSection(e.target.value); setAllRows(null); }}>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />
          <div><label style={lbl}>Min CGPA</label>
            <input style={{ ...sel, width: 120 }} type="number" min="0" max="10" step="0.1" placeholder="e.g. 8.0" value={minCgpa} onChange={e => setMinCgpa(e.target.value)} />
          </div>
          <div><label style={lbl}>Min LeetCode Solved</label>
            <input style={{ ...sel, width: 140 }} type="number" min="0" placeholder="e.g. 10" value={minLeet} onChange={e => setMinLeet(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn("#1d4ed8", loading)} onClick={fetchStats} disabled={loading}>{loading ? "Fetching..." : "Fetch Stats"}</button>
            {rows && rows.length > 0 && <button style={btn("#dc2626", pdfLoad)} onClick={downloadPdf} disabled={pdfLoad}>{pdfLoad ? "Generating..." : "Download PDF"}</button>}
            {filtersActive && <button style={btn("#64748b", false)} onClick={() => { setMinCgpa(""); setMinLeet(""); }}>Clear Filters</button>}
          </div>
        </div>
        {filtersActive && rows && (
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {minCgpa !== "" && <span style={{ background: "#ecfdf5", color: "#065f46", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>CGPA ≥ {minCgpa}</span>}
            {minLeet !== "" && <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>LeetCode ≥ {minLeet}</span>}
            <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{rows.length} of {allRows.length} students match</span>
          </div>
        )}
      </div>

      {error && <div style={{ color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}

      {rows && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { label: "Matching Students", value: rows.length, color: "#1d4ed8", bg: "#eff6ff" },
              { label: "Avg CGPA", value: avgCgpa, color: "#059669", bg: "#ecfdf5" },
              { label: "Avg LeetCode", value: avgSolved, color: "#7c3aed", bg: "#f5f3ff" },
              { label: "Total Easy", value: withStats.reduce((s, r) => s + r.stats.easy, 0), color: "#16a34a", bg: "#f0fdf4" },
              { label: "Total Medium", value: withStats.reduce((s, r) => s + r.stats.medium, 0), color: "#d97706", bg: "#fffbeb" },
              { label: "Total Hard", value: withStats.reduce((s, r) => s + r.stats.hard, 0), color: "#dc2626", bg: "#fef2f2" },
            ].map(item => (
              <div key={item.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0", borderTop: `3px solid ${item.color}`, minWidth: 120, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {rows.length === 0 && <div className="card" style={{ color: "#64748b", textAlign: "center", padding: 48 }}>No students match the selected filters.</div>}
          {withStats.length > 0 && <BarChart data={withStats} />}

          {rows.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 14 }}>
                {branch} — Section {section} &nbsp;·&nbsp; {rows.length} students {filtersActive && <span style={{ color: "#64748b", fontWeight: 400 }}>(filtered)</span>}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["#","Reg No","Name","CGPA","LeetCode ID","Total","Easy","Medium","Hard","Status"].map((h, i) => (
                      <th key={h} style={{ ...th, borderRadius: i === 0 ? "8px 0 0 0" : i === 9 ? "0 8px 0 0" : 0 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.regNumber} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={td}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 700, color: "#1d4ed8" }}>{r.regNumber}</td>
                        <td style={td}>{r.name}</td>
                        <td style={td}>{r.cgpa ? <span style={pill(r.cgpa >= 8 ? "#059669" : r.cgpa >= 6 ? "#d97706" : "#dc2626")}>{r.cgpa}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={td}>{r.username ? <a href={"https://leetcode.com/" + r.username} target="_blank" rel="noreferrer" style={{ color: "#f59e0b", fontWeight: 700 }}>{r.username}</a> : <span style={{ color: "#94a3b8" }}>Not set</span>}</td>
                        <td style={td}>{r.stats ? <span style={pill("#1d4ed8")}>{r.stats.total}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={td}>{r.stats ? <span style={pill("#16a34a")}>{r.stats.easy}</span> : "—"}</td>
                        <td style={td}>{r.stats ? <span style={pill("#d97706")}>{r.stats.medium}</span> : "—"}</td>
                        <td style={td}>{r.stats ? <span style={pill("#dc2626")}>{r.stats.hard}</span> : "—"}</td>
                        <td style={td}>
                          {!r.username ? <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>No username</span>
                            : !r.stats ? <span style={{ background: "#fffbeb", color: "#92400e", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Private</span>
                            : <span style={{ background: "#ecfdf5", color: "#065f46", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>✓ Fetched</span>}
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

function BarChart({ data }) {
  const top = [...data].sort((a, b) => b.stats.total - a.stats.total).slice(0, 20);
  const maxVal = Math.max(...top.map(r => r.stats.total), 1);
  const chartH = 150;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>Top {top.length} Students by Problems Solved</div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: chartH + 48, overflowX: "auto", paddingBottom: 4 }}>
        {top.map(r => {
          const eH = Math.round((r.stats.easy / maxVal) * chartH);
          const mH = Math.round((r.stats.medium / maxVal) * chartH);
          const hH = Math.round((r.stats.hard / maxVal) * chartH);
          return (
            <div key={r.regNumber} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 38 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{r.stats.total}</div>
              <div style={{ width: 28, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: chartH, borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                <div style={{ width: "100%", height: hH, background: "#dc2626" }} />
                <div style={{ width: "100%", height: mH, background: "#d97706" }} />
                <div style={{ width: "100%", height: eH, background: "#16a34a" }} />
              </div>
              {r.cgpa && <div style={{ fontSize: 8, color: "#059669", fontWeight: 700, marginTop: 2 }}>{r.cgpa}</div>}
              <div style={{ fontSize: 8, color: "#64748b", textAlign: "center", width: 38, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
        {[["#16a34a","Easy"],["#d97706","Medium"],["#dc2626","Hard"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}
