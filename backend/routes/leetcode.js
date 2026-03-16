const router = require('express').Router();
const axios = require('axios');
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty/Admin only' });
  next();
};

async function fetchLeetCodeStats(username) {
  if (!username) return null;
  try {
    const { data } = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `query($username:String!){
          matchedUser(username:$username){
            submitStatsGlobal{ acSubmissionNum{ difficulty count } }
          }
        }`,
        variables: { username },
      },
      { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, timeout: 8000 }
    );
    const nums = data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
    const get = (d) => nums.find((n) => n.difficulty === d)?.count || 0;
    return { easy: get('Easy'), medium: get('Medium'), hard: get('Hard'), total: get('All') };
  } catch {
    return null;
  }
}

// GET /api/leetcode/report?branch=CSE&section=A&minCgpa=8&minLeetcode=10
router.get('/report', protect, facultyOnly, async (req, res) => {
  const { branch, section } = req.query;
  const filter = { role: 'student' };
  if (branch) filter.branch = { $regex: new RegExp(`^${branch}$`, 'i') };
  if (section) filter.section = { $regex: new RegExp(`^${section}$`, 'i') };

  const students = await Student.find(filter)
    .select('regNumber name branch section leetCode cgpa')
    .sort({ name: 1 });

  const results = await Promise.all(
    students.map(async (st) => ({
      regNumber: st.regNumber,
      name: st.name,
      branch: st.branch || '—',
      section: st.section || '—',
      cgpa: st.cgpa || null,
      username: st.leetCode || null,
      stats: st.leetCode ? await fetchLeetCodeStats(st.leetCode) : null,
    }))
  );
  res.json(results);
});

// GET /api/leetcode/report/pdf?branch=CSE&section=A&minCgpa=8&minLeetcode=10
router.get('/report/pdf', protect, facultyOnly, async (req, res) => {
  const { branch = 'All', section = 'All', minCgpa, minLeetcode } = req.query;
  const minC = minCgpa    ? parseFloat(minCgpa)    : null;
  const minL = minLeetcode ? parseInt(minLeetcode)  : null;

  const filter = { role: 'student' };
  if (branch !== 'All') filter.branch = { $regex: new RegExp(`^${branch}$`, 'i') };
  if (section !== 'All') filter.section = { $regex: new RegExp(`^${section}$`, 'i') };

  const students = await Student.find(filter)
    .select('regNumber name branch section leetCode cgpa')
    .sort({ name: 1 });

  let rows = await Promise.all(
    students.map(async (st) => ({
      regNumber: st.regNumber,
      name: st.name,
      branch: st.branch || '—',
      section: st.section || '—',
      cgpa: st.cgpa || null,
      username: st.leetCode || null,
      stats: st.leetCode ? await fetchLeetCodeStats(st.leetCode) : null,
    }))
  );

  // Apply filters
  if (minC !== null) rows = rows.filter(r => r.cgpa !== null && r.cgpa >= minC);
  if (minL !== null) rows = rows.filter(r => r.stats && r.stats.total >= minL);

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="leetcode_filtered_${branch}_${section}.pdf"`);
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
    .text("Vignan's Foundation for Science, Technology & Research (Deemed to be University)", { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#374151')
    .text(`LeetCode + CGPA Filtered Report  |  Dept: ${branch}  |  Section: ${section}`, { align: 'center' });

  const filterDesc = [
    minC !== null ? `CGPA ≥ ${minC}` : null,
    minL !== null ? `LeetCode Solved ≥ ${minL}` : null,
  ].filter(Boolean).join('  &  ');
  if (filterDesc) {
    doc.fontSize(9).fillColor('#059669').text(`Filters Applied: ${filterDesc}`, { align: 'center' });
  }
  doc.fontSize(9).fillColor('#64748b')
    .text(`Generated: ${new Date().toLocaleString()}  |  Matching Students: ${rows.length}`, { align: 'center' });
  doc.moveDown(0.8);

  // ── Summary boxes ────────────────────────────────────────
  const withStats = rows.filter(r => r.stats);
  const avgCgpa   = rows.filter(r => r.cgpa).length
    ? (rows.filter(r => r.cgpa).reduce((s, r) => s + r.cgpa, 0) / rows.filter(r => r.cgpa).length).toFixed(2)
    : '—';
  const avgSolved = withStats.length
    ? Math.round(withStats.reduce((s, r) => s + r.stats.total, 0) / withStats.length)
    : 0;

  const boxes = [
    { label: 'Matching Students', value: rows.length,   color: [30, 64, 175] },
    { label: 'Avg CGPA',          value: avgCgpa,        color: [5, 150, 105] },
    { label: 'Avg LeetCode',      value: avgSolved,      color: [124, 58, 237] },
    { label: 'Easy Total',        value: withStats.reduce((s,r)=>s+r.stats.easy,0),   color: [22, 163, 74] },
    { label: 'Medium Total',      value: withStats.reduce((s,r)=>s+r.stats.medium,0), color: [217, 119, 6] },
    { label: 'Hard Total',        value: withStats.reduce((s,r)=>s+r.stats.hard,0),   color: [220, 38, 38] },
  ];
  const bw = 118, bh = 48, bx0 = 40, by0 = doc.y;
  boxes.forEach((b, i) => {
    const bx = bx0 + i * (bw + 6);
    const [r, g, bl] = b.color;
    doc.rect(bx, by0, bw, bh).fill(`rgb(${r},${g},${bl})`);
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold')
      .text(String(b.value), bx, by0 + 7, { width: bw, align: 'center' });
    doc.fontSize(8).font('Helvetica')
      .text(b.label, bx, by0 + 30, { width: bw, align: 'center' });
  });

  // ── Bar chart top 20 ─────────────────────────────────────
  const top20 = [...withStats].sort((a, b) => b.stats.total - a.stats.total).slice(0, 20);
  if (top20.length > 0) {
    const chartY = by0 + bh + 22;
    const chartX = 40, chartW = 760, chartH = 120;
    const maxVal = Math.max(...top20.map(r => r.stats.total), 1);
    const barW   = Math.floor(chartW / top20.length) - 3;

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b')
      .text('Top Students — Problems Solved', chartX, chartY - 13);

    [0.5, 1].forEach(pct => {
      const gy = chartY + chartH - pct * chartH;
      doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).stroke('#e2e8f0');
      doc.fillColor('#94a3b8').fontSize(6)
        .text(String(Math.round(maxVal * pct)), chartX - 20, gy - 3, { width: 18, align: 'right' });
    });

    top20.forEach((r, i) => {
      const bx  = chartX + i * (barW + 3);
      const eH  = Math.round((r.stats.easy   / maxVal) * chartH);
      const mH  = Math.round((r.stats.medium / maxVal) * chartH);
      const hH  = Math.round((r.stats.hard   / maxVal) * chartH);
      const base = chartY + chartH;
      doc.rect(bx, base - eH,           barW, eH).fill('#16a34a');
      doc.rect(bx, base - eH - mH,      barW, mH).fill('#d97706');
      doc.rect(bx, base - eH - mH - hH, barW, hH).fill('#dc2626');
      doc.fillColor('#1e293b').fontSize(5.5).font('Helvetica')
        .text(String(r.stats.total), bx, base - eH - mH - hH - 8, { width: barW, align: 'center' });
      doc.fillColor('#374151').fontSize(5)
        .text(r.name.split(' ')[0].substring(0, 8), bx, base + 2, { width: barW, align: 'center' });
    });

    const lx = chartX + chartW - 110, ly = chartY;
    [['#16a34a','Easy'],['#d97706','Medium'],['#dc2626','Hard']].forEach(([color, label], i) => {
      doc.rect(lx, ly + i * 13, 9, 9).fill(color);
      doc.fillColor('#374151').fontSize(7).font('Helvetica').text(label, lx + 13, ly + i * 13 + 1);
    });
  }

  // ── Page 2: Full table ───────────────────────────────────
  doc.addPage({ layout: 'landscape' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af')
    .text(`Filtered Student Report — ${branch} / Section ${section}${filterDesc ? '  |  ' + filterDesc : ''}`, { align: 'center' });
  doc.moveDown(0.4);

  const cols = [26, 85, 130, 48, 44, 85, 44, 44, 50, 44, 50];
  const hdrs = ['S.No','Reg No','Name','Dept','Sec','LeetCode ID','Total','Easy','Medium','Hard','CGPA'];

  const drawRow = (cells, y, isHeader) => {
    let x = 40;
    cells.forEach((cell, i) => {
      const w = cols[i];
      if (isHeader) {
        doc.rect(x, y, w, 18).fill('#1e40af');
        doc.fillColor('#fff').fontSize(7.5).font('Helvetica-Bold')
          .text(String(cell), x + 2, y + 5, { width: w - 4, align: 'center', ellipsis: true });
      } else {
        doc.rect(x, y, w, 15).fill(i % 2 === 0 ? '#f8fafc' : '#fff').stroke('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica')
          .text(String(cell ?? '—'), x + 3, y + 3, { width: w - 6, ellipsis: true });
      }
      x += w;
    });
  };

  let ty = doc.y;
  drawRow(hdrs, ty, true);
  ty += 19;

  rows.forEach((r, i) => {
    if (ty + 15 > doc.page.height - 40) {
      doc.addPage({ layout: 'landscape' });
      ty = 40;
      drawRow(hdrs, ty, true);
      ty += 19;
    }
    const st = r.stats;
    drawRow([
      i + 1, r.regNumber, r.name, r.branch, r.section,
      r.username || 'Not set',
      st ? st.total  : 'N/A',
      st ? st.easy   : '—',
      st ? st.medium : '—',
      st ? st.hard   : '—',
      r.cgpa !== null ? r.cgpa : '—',
    ], ty, false);
    ty += 15;
  });

  doc.end();
});

module.exports = router;
