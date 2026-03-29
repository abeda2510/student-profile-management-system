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

// Helper: resolve data for one student + one docType
async function getStudentDocData(st, docType) {
  const base = { regNumber: st.regNumber, name: st.name, branch: st.branch, section: st.section, docType };
  if (docType === 'ABC_ID') return { ...base, data: st.abcId || '—' };
  if (docType === 'APAAR_ID') return { ...base, data: st.apaarId || '—' };
  
  if (docType === 'LEETCODE') return { ...base, data: st.leetCode ? `leetcode.com/${st.leetCode}` : '—' };
  if (docType === 'CODECHEF') return { ...base, data: st.codeChef ? `codechef.com/users/${st.codeChef}` : '—' };
  if (docType === 'LINKEDIN') return { ...base, data: st.linkedIn || '—' };
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
  if (branches.length && sections.length) {
    filter.$or = [];
    branches.forEach(b => sections.forEach(s =>
      filter.$or.push({
        branch: { $regex: new RegExp(`^${b}$`, 'i') },
        section: { $regex: new RegExp(`^${s}$`, 'i') }
      })
    ));
  } else if (branches.length) {
    filter.$or = branches.map(b => ({ branch: { $regex: new RegExp(`^${b}$`, 'i') } }));
  } else if (sections.length) {
    filter.$or = sections.map(s => ({ section: { $regex: new RegExp(`^${s}$`, 'i') } }));
  }
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

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="section_report.pdf"');
  doc.pipe(res);

  // Title
  doc.fontSize(13).font('Helvetica-Bold')
    .text("Vignan's Foundation for Science, Technology & Research (Deemed to be University)", { align: 'center' });
  doc.fontSize(10).font('Helvetica')
    .text(`Section-wise Student Report${admissionYear ? ' | Year: ' + admissionYear : ''}  |  Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(0.5);

  // Fixed columns: S.No, Reg No, Name, Dept, Sec, Doc Type, Data, Status
  const pageWidth = doc.page.width - 80; // 80 = margins
  const colWidths = [30, 85, 120, 45, 35, 90, 230, 55];
  const headers = ['S.No', 'Reg No', 'Name', 'Dept', 'Sec', 'Doc Type', 'Data', 'Status'];
  const ROW_H = 18;

  const drawRow = (rowData, y, isHeader, shade) => {
    let x = 40;
    rowData.forEach((cell, i) => {
      const w = colWidths[i];
      if (isHeader) {
        doc.rect(x, y, w, ROW_H).fillAndStroke('#1e40af', '#1e40af');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
          .text(String(cell), x + 3, y + 5, { width: w - 6, ellipsis: true, lineBreak: false });
      } else {
        doc.rect(x, y, w, ROW_H).fillAndStroke(shade ? '#f8fafc' : '#ffffff', '#e2e8f0');
        doc.fillColor('#000000').fontSize(7.5).font('Helvetica')
          .text(String(cell || '—'), x + 3, y + 5, { width: w - 6, ellipsis: true, lineBreak: false });
      }
      x += w;
    });
  };

  let y = doc.y;
  drawRow(headers, y, true, false);
  y += ROW_H;

  let rowIdx = 0;
  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    for (const dt of docTypes) {
      const r = await getStudentDocData(st, dt);
      const val = r.data && r.data !== '—' ? r.data : 'Not filled';
      const status = val !== 'Not filled' ? 'Available' : 'Missing';
      const rowData = [rowIdx + 1, st.regNumber, st.name, st.branch, st.section, DOC_LABELS[dt] || dt, val, status];

      if (y + ROW_H > doc.page.height - 40) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
        drawRow(headers, y, true, false);
        y += ROW_H;
      }
      drawRow(rowData, y, false, rowIdx % 2 === 1);
      y += ROW_H;
      rowIdx++;
    }
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
