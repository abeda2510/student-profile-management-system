const router = require('express').Router();
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Achievement = require('../models/Achievement');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty/Admin only' });
  next();
};

// Admin: create a new faculty member
router.post('/create-faculty', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { facultyId, name, password, email, department, designation } = req.body;
    if (!facultyId || !name || !password) return res.status(400).json({ message: 'facultyId, name and password are required' });
    const exists = await Faculty.findOne({ facultyId });
    if (exists) return res.status(400).json({ message: 'Faculty ID already exists' });
    const faculty = await Faculty.create({ facultyId, name, password, email, department, designation, role: 'faculty' });
    res.status(201).json({ message: 'Faculty created', facultyId: faculty.facultyId, name: faculty.name });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: get all faculty list
router.get('/all-faculty', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const faculty = await Faculty.find().select('-password').sort({ name: 1 });
  res.json(faculty);
});

// Admin: assign students to a faculty counsellor
router.post('/assign-counsellees', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { facultyName, facultyId, regNumbers } = req.body;
    if (!regNumbers?.length) return res.status(400).json({ message: 'regNumbers required' });
    let name = facultyName;
    if (!name && facultyId) {
      const faculty = await Faculty.findOne({ facultyId });
      if (!faculty) return res.status(404).json({ message: `Faculty ID "${facultyId}" not found` });
      name = faculty.name;
    }
    if (!name) return res.status(400).json({ message: 'facultyId or facultyName required' });
    const result = await Student.updateMany({ regNumber: { $in: regNumbers } }, { $set: { counsellor: name } });
    res.json({ message: `Assigned ${result.modifiedCount} students to ${name}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get counsellor's assigned students
router.get('/my-students', protect, facultyOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id).select('name');
    const counsellorName = faculty?.name;
    if (!counsellorName) return res.json([]);
    const students = await Student.find({ counsellor: counsellorName }).select('-password').sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get own faculty profile (works for both Faculty collection and admin users from Student collection)
router.get('/me', protect, facultyOnly, async (req, res) => {
  let profile = await Faculty.findById(req.user.id).select('-password');
  if (!profile) {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    profile = {
      name: student.name,
      email: student.email,
      facultyId: student.regNumber,
      designation: 'Administrator',
      department: 'Admin Office'
    };
  }
  res.json(profile);
});

// Search student by reg number
router.get('/student/:regNumber', protect, facultyOnly, async (req, res) => {
  const student = await Student.findOne({ regNumber: req.params.regNumber }).select('-password');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// Get student documents
router.get('/student/:regNumber/documents', protect, facultyOnly, async (req, res) => {
  const docs = await Document.find({ regNumber: req.params.regNumber });
  res.json(docs);
});

// Get student achievements
router.get('/student/:regNumber/achievements', protect, facultyOnly, async (req, res) => {
  const achievements = await Achievement.find({ regNumber: req.params.regNumber });
  res.json(achievements);
});

// List all students
router.get('/students', protect, facultyOnly, async (req, res) => {
  const students = await Student.find().select('-password').sort({ createdAt: -1 });
  res.json(students);
});

// LeetCode stats cache (in-memory, per request)
const lcCache = {};
async function fetchLeetCodeStats(username) {
  if (!username) return null;
  if (lcCache[username]) return lcCache[username];
  try {
    const axios = require('axios');
    const clean = username.replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, '').replace(/\/$/, '').trim();
    const { data } = await axios.post('https://leetcode.com/graphql', {
      query: `query($username:String!){ matchedUser(username:$username){ submitStatsGlobal{ acSubmissionNum{ difficulty count } } } }`,
      variables: { username: clean }
    }, { headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' }, timeout: 8000 });
    const nums = data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
    const get = d => nums.find(n => n.difficulty === d)?.count || 0;
    const stats = { total: get('All'), easy: get('Easy'), medium: get('Medium'), hard: get('Hard') };
    lcCache[clean] = stats;
    return stats;
  } catch { return null; }
}

// CodeChef stats fetch - parse from HTML page
async function fetchCodeChefStats(username) {
  if (!username) return null;
  const axios = require('axios');
  const clean = username.replace(/^https?:\/\/(www\.)?codechef\.com\/users\//i, '').replace(/\/$/, '').trim();
  if (!clean) return null;

  try {
    const { data: html } = await axios.get(`https://www.codechef.com/users/${clean}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });

    // Stars: appears as "1★username" in HTML - digit before ★ (Unicode \u2605)
    const starsMatch = html.match(/([1-7])\u2605/) || html.match(/([1-7])&#9733;/);
    const stars = starsMatch ? parseInt(starsMatch[1]) : null;

    // Rating: look for number near "CodeChef Rating" or in rating section
    const ratingMatch = html.match(/(\d{3,4})\s*\n?\s*\(Div\s*\d\)/) ||
                        html.match(/currentRating["\s:]+(\d+)/) ||
                        html.match(/rating["\s:]+(\d{3,4})/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

    // Global rank - appears as large number before "Global Rank" text
    const rankMatch = html.match(/(\d{4,7})\s*(?:<[^>]*>)*\s*Global\s*Rank/i) ||
                      html.match(/Global\s*Rank[^0-9]*(\d{4,7})/i) ||
                      html.match(/globalRank["\s:]+(\d+)/) ||
                      html.match(/>(\d{5,7})<\/a>\s*\|\s*\d+\s*Country/i);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;

    // Total problems solved
    const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i);
    const solved = solvedMatch ? parseInt(solvedMatch[1]) : null;

    if (stars !== null || rating !== null || rank !== null) {
      return { rating, stars, rank, solved };
    }
    return null;
  } catch (err) {
    console.error('CodeChef fetch error:', err.message);
    return null;
  }
}
async function getStudentDocData(st, docType) {
  const base = { regNumber: st.regNumber, name: st.name, branch: st.branch, section: st.section, docType };
  if (docType === 'ABC_ID') return { ...base, data: st.abcId || '—' };
  if (docType === 'APAAR_ID') return { ...base, data: st.apaarId || '—' };
  if (docType === 'LEETCODE') return { ...base, data: st.leetCode ? `leetcode.com/${st.leetCode}` : '—' };

  // Auto-fetch LeetCode stats if username exists
  if (['LEETCODE_SOLVED','LEETCODE_EASY','LEETCODE_MEDIUM','LEETCODE_HARD'].includes(docType)) {
    // Use stored value if available
    const stored = { LEETCODE_SOLVED: st.leetCodeSolved, LEETCODE_EASY: st.leetCodeEasy, LEETCODE_MEDIUM: st.leetCodeMedium, LEETCODE_HARD: st.leetCodeHard };
    if (stored[docType] != null) return { ...base, data: String(stored[docType]) };
    // Try live fetch
    if (st.leetCode) {
      const stats = await fetchLeetCodeStats(st.leetCode);
      if (stats) {
        const map = { LEETCODE_SOLVED: stats.total, LEETCODE_EASY: stats.easy, LEETCODE_MEDIUM: stats.medium, LEETCODE_HARD: stats.hard };
        return { ...base, data: String(map[docType] || 0) };
      }
    }
    return { ...base, data: '—' };
  }

  if (docType === 'CODECHEF') return { ...base, data: st.codeChef ? `codechef.com/users/${st.codeChef}` : '—' };

  // Auto-fetch CodeChef stats if username exists
  if (['CODECHEF_RATING','CODECHEF_STARS','CODECHEF_RANK'].includes(docType)) {
    const stored = { CODECHEF_RATING: st.codeChefRating, CODECHEF_STARS: st.codeChefStars, CODECHEF_RANK: st.codeChefRank };
    if (stored[docType] != null) return { ...base, data: String(stored[docType]) };
    if (st.codeChef) {
      const stats = await fetchCodeChefStats(st.codeChef);
      if (stats) {
        const map = { CODECHEF_RATING: stats.rating, CODECHEF_STARS: stats.stars, CODECHEF_RANK: stats.rank };
        const val = map[docType];
        return { ...base, data: val != null ? String(val) : '—' };
      }
    }
    return { ...base, data: '—' };
  }
  if (docType === 'LINKEDIN') return { ...base, data: st.linkedIn || '—' };
  if (docType === 'EMAIL') return { ...base, data: st.email || '—' };
  if (docType === 'PHONE') return { ...base, data: st.phone || '—' };
  if (docType === 'PARENT_NAME') return { ...base, data: st.parentName || '—' };
  if (docType === 'PARENT_PHONE') return { ...base, data: st.parentPhone || '—' };
  if (docType === 'ADDRESS') return { ...base, data: st.address || '—' };
  if (docType === 'CGPA') return { ...base, data: st.cgpa != null ? String(st.cgpa) : '—' };
  if (docType === 'ADMISSION_CATEGORY') return { ...base, data: st.admissionCategory || '—' };
  if (docType === 'CURRENT_YEAR') return { ...base, data: st.currentYear != null ? String(st.currentYear) : '—' };
  if (docType === 'CURRENT_SEMESTER') return { ...base, data: st.currentSemester != null ? String(st.currentSemester) : '—' };
  if (docType === 'DOB') return { ...base, data: st.dob || '—' };
  if (docType === 'GENDER') return { ...base, data: st.gender || '—' };
  if (docType === 'BLOOD_GROUP') return { ...base, data: st.bloodGroup || '—' };
  if (docType === 'INTERNSHIP') {
    const achs = await Achievement.find({ regNumber: st.regNumber, activityType: 'INTERNSHIP' });
    return { ...base, data: achs.length ? achs.map(a => a.title).join('; ') : '—', count: achs.length };
  }
  if (docType === 'HACKATHON') {
    const achs = await Achievement.find({ regNumber: st.regNumber, activityType: 'HACKATHON' });
    return { ...base, data: achs.length ? achs.map(a => a.title).join('; ') : '—', count: achs.length };
  }
  if (docType === 'MARK_MEMO') {
    const docs = await Document.find({ regNumber: st.regNumber, docType: 'MARK_MEMO' });
    return { ...base, data: docs.length ? docs.map(d => d.label || d.filename).join('; ') : '—', count: docs.length };
  }
  return { ...base, data: '—' };
}

// Build mongoose filter supporting multi-value branch/section arrays
function buildFilter(query) {
  const branches = [].concat(query.branch || []).filter(Boolean);
  const sections = [].concat(query.section || []).filter(Boolean);
  const filter = { role: 'student' };
  if (query.admissionYear) filter.admissionYear = Number(query.admissionYear);
  if (branches.length) filter.branch = { $in: branches };
  if (sections.length) filter.section = { $in: sections };
  return filter;
}

// Section report — fetch students + their data
router.get('/section-report', protect, facultyOnly, async (req, res) => {
  const docTypes = [].concat(req.query.docType || []).filter(Boolean);
  if (!docTypes.length) return res.status(400).json({ message: 'Select at least one document type' });
  const students = await Student.find(buildFilter(req.query)).select('-password').sort({ branch: 1, section: 1, name: 1 });
  const results = [];
  for (const st of students) for (const dt of docTypes) results.push(await getStudentDocData(st, dt));
  res.json(results);
});

// Generate PDF for section report
router.get('/section-report/pdf', protect, facultyOnly, async (req, res) => {
  const DOC_LABELS = {
    ABC_ID: 'ABC ID', APAAR_ID: 'APAAR ID', LEETCODE: 'LeetCode',
    CODECHEF: 'CodeChef', LINKEDIN: 'LinkedIn',
    INTERNSHIP: 'Internship', HACKATHON: 'Hackathon', MARK_MEMO: 'Mark Memo',
  };
  const docTypes = [].concat(req.query.docType || []).filter(Boolean);
  const { admissionYear } = req.query;
  const students = await Student.find(buildFilter(req.query)).select('-password').sort({ branch: 1, section: 1, name: 1 });

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="section_report.pdf"');
  doc.pipe(res);

  const PAGE_W = doc.page.width - 60; // usable width (landscape A4 = 841 - 60 = 781)
  const FIXED_W = 25 + 75 + 110 + 40 + 30; // S.No + RegNo + Name + Dept + Sec = 280
  const docColW = Math.max(55, Math.floor((PAGE_W - FIXED_W) / docTypes.length));
  const colWidths = [25, 75, 110, 40, 30, ...docTypes.map(() => docColW)];
  const headers = ['S.No', 'Reg No', 'Name', 'Dept', 'Sec', ...docTypes.map(d => DOC_LABELS[d] || d)];
  const ROW_H = 20;

  // Title
  doc.fontSize(12).font('Helvetica-Bold')
    .text("Vignan's Foundation for Science, Technology & Research (Deemed to be University)", 30, 20, { align: 'center', width: PAGE_W });
  doc.fontSize(9).font('Helvetica')
    .text(`Section-wise Student Report${admissionYear ? ' | Year: ' + admissionYear : ''}  |  Generated: ${new Date().toLocaleString()}`, 30, 36, { align: 'center', width: PAGE_W });

  const drawRow = (rowData, y, isHeader, shade) => {
    let x = 30;
    rowData.forEach((cell, i) => {
      const w = colWidths[i];
      if (isHeader) {
        doc.rect(x, y, w, ROW_H).fillAndStroke('#1e40af', '#1e40af');
        doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold')
          .text(String(cell), x + 2, y + 6, { width: w - 4, ellipsis: true, lineBreak: false });
      } else {
        doc.rect(x, y, w, ROW_H).fillAndStroke(shade ? '#f1f5f9' : '#ffffff', '#cbd5e1');
        const ok = String(cell) !== 'Missing' && String(cell) !== 'Not filled';
        doc.fillColor(i >= 5 && !ok ? '#94a3b8' : '#0f172a').fontSize(7).font('Helvetica')
          .text(String(cell ?? ''), x + 2, y + 6, { width: w - 4, ellipsis: true, lineBreak: false });
      }
      x += w;
    });
  };

  let y = 52;
  drawRow(headers, y, true, false);
  y += ROW_H;

  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const rowData = [i + 1, st.regNumber, st.name, st.branch, st.section];
    for (const dt of docTypes) {
      const r = await getStudentDocData(st, dt);
      rowData.push(r.data && r.data !== '—' ? r.data : 'Missing');
    }
    if (y + ROW_H > doc.page.height - 30) {
      doc.addPage({ layout: 'landscape' });
      y = 30;
      drawRow(headers, y, true, false);
      y += ROW_H;
    }
    drawRow(rowData, y, false, i % 2 === 1);
    y += ROW_H;
  }

  doc.end();
});

// Generate Excel for section report
router.get('/section-report/excel', protect, facultyOnly, async (req, res) => {
  const DOC_LABELS = {
    ABC_ID: 'ABC ID', APAAR_ID: 'APAAR ID', LEETCODE: 'LeetCode',
    CODECHEF: 'CodeChef', LINKEDIN: 'LinkedIn',
    INTERNSHIP: 'Internship', HACKATHON: 'Hackathon', MARK_MEMO: 'Mark Memo',
  };

  const docTypes = [].concat(req.query.docType || []).filter(Boolean);
  const branches = [].concat(req.query.branch || []).filter(Boolean);
  const sections = [].concat(req.query.section || []).filter(Boolean);
  const { admissionYear } = req.query;

  const students = await Student.find(buildFilter(req.query)).select('-password').sort({ branch: 1, section: 1, name: 1 });

  // One flat row per student
  const rows = [];
  for (const st of students) {
    const row = { regNumber: st.regNumber, name: st.name, branch: st.branch, section: st.section };
    for (const dt of docTypes) {
      const r = await getStudentDocData(st, dt);
      row[dt] = r.data && r.data !== '—' ? r.data : '';
    }
    rows.push(row);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Student Management System';
  wb.created = new Date();

  // Group by branch+section — one sheet each
  const grouped = {};
  rows.forEach(r => {
    const key = `${r.branch}_${r.section}`;
    if (!grouped[key]) grouped[key] = { branch: r.branch, section: r.section, rows: [] };
    grouped[key].rows.push(r);
  });
  const groups = Object.values(grouped);
  if (groups.length === 0) groups.push({ branch: 'All', section: 'All', rows });

  groups.forEach(group => {
    const sheetName = `${group.branch}-${group.section}`.substring(0, 31);
    const ws = wb.addWorksheet(sheetName);

    const totalCols = 5 + docTypes.length + 1; // S.No,RegNo,Name,Dept,Sec + docs + Status
    const lastColLetter = totalCols <= 26
      ? String.fromCharCode(64 + totalCols)
      : 'A' + String.fromCharCode(64 + totalCols - 26);

    // Row 1: University title
    ws.mergeCells(`A1:${lastColLetter}1`);
    const r1 = ws.getCell('A1');
    r1.value = "Vignan's Foundation for Science, Technology & Research (Deemed to be University)";
    r1.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    r1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 20;

    // Row 2: Report subtitle
    ws.mergeCells(`A2:${lastColLetter}2`);
    const r2 = ws.getCell('A2');
    r2.value = `Section-wise Student Report  |  Dept: ${group.branch}  |  Section: ${group.section}${admissionYear ? '  |  Year: ' + admissionYear : ''}`;
    r2.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    r2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;

    // Row 3: blank spacer
    ws.addRow([]);

    // Row 4: column headers
    const headers = [
      'S.No', 'Reg No', 'Name', 'Department', 'Section',
      ...docTypes.map(d => DOC_LABELS[d] || d),
      'Status',
    ];
    const hRow = ws.addRow(headers);
    hRow.height = 20;
    hRow.eachCell(cell => {
      cell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'medium' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    // Column widths
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 16;
    ws.getColumn(3).width = 26;
    ws.getColumn(4).width = 13;
    ws.getColumn(5).width = 10;
    docTypes.forEach((_, i) => { ws.getColumn(6 + i).width = 28; });
    ws.getColumn(6 + docTypes.length).width = 14;

    // Data rows (starting row 5)
    group.rows.forEach((r, i) => {
      const filled = docTypes.filter(dt => r[dt] && r[dt] !== '').length;
      const total = docTypes.length;
      const status = filled === total ? 'Complete' : `${filled}/${total} filled`;

      const rowData = [
        i + 1, r.regNumber, r.name, r.branch, r.section,
        ...docTypes.map(dt => r[dt] || 'Not filled'),
        status,
      ];
      const row = ws.addRow(rowData);
      row.height = 16;
      row.eachCell(cell => {
        cell.font = { color: { argb: 'FF000000' }, size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });
    });

    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: headers.length } };
  });

  // Summary sheet
  const summary = wb.addWorksheet('Summary');
  summary.columns = [{ width: 22 }, { width: 55 }];
  const s1 = summary.addRow(["Vignan's Foundation for Science, Technology & Research"]);
  s1.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
  summary.mergeCells('A1:B1');
  s1.alignment = { horizontal: 'center' };
  summary.addRow([]);
  [
    ['Departments', branches.length ? branches.join(', ') : 'All'],
    ['Sections', sections.length ? sections.join(', ') : 'All'],
    ['Academic Year', admissionYear || 'All'],
    ['Document Types', docTypes.map(d => DOC_LABELS[d] || d).join(', ')],
    ['Total Students', rows.length],
    ['Generated On', new Date().toLocaleString()],
  ].forEach(([k, v]) => {
    const r = summary.addRow([k, String(v)]);
    r.getCell(1).font = { bold: true, color: { argb: 'FF000000' } };
    r.getCell(2).font = { color: { argb: 'FF000000' } };
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="section_report.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

module.exports = router;
