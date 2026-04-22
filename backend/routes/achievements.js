const router = require('express').Router();
const Achievement = require('../models/Achievement');
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadAchievement, cloudinary } = require('../cloudinary');

const facultyOrAdmin = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty/Admin only' });
  next();
};

const POINTS_MAP = {
  'HACKATHON WINNER': 10, 'HACKATHON RUNNER': 7, 'HACKATHON PARTICIPATION': 5,
  'INTERNSHIP': 8, 'RESEARCH_PUBLICATION': 12,
  'TECHNICAL_COMPETITION WINNER': 10, 'TECHNICAL_COMPETITION PARTICIPATION': 4,
  'WORKSHOP': 3, 'SEMINAR': 2, 'CULTURAL': 3,
  'SPORTS WINNER': 8, 'SPORTS PARTICIPATION': 3, 'OTHER': 2,
};

// ── Student: add achievement ─────────────────────────────
router.post('/', protect, uploadAchievement.single('certificate'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const points = POINTS_MAP[req.body.activityType] || 0;
    const data = { ...req.body, student: req.user.id, regNumber: student?.regNumber, status: 'APPROVED', points };
    if (req.file) {
      data.certificateFile = req.file.originalname;
      data.certificatePath = req.file.path;
      data.certificateUrl = req.file.path;
      data.cloudinaryId = req.file.filename;
    }
    const achievement = new Achievement(data);
    await achievement.save();
    res.status(201).json(achievement);
  } catch (err) {
    console.error('Achievement POST error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Student: get own achievements ───────────────────────
router.get('/me', protect, async (req, res) => {
  const filter = { student: req.user.id };
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  if (req.query.semester) filter.semester = req.query.semester;
  if (req.query.activityType) filter.activityType = req.query.activityType;
  if (req.query.status) filter.status = req.query.status;
  const achievements = await Achievement.find(filter).sort({ createdAt: -1 });
  res.json(achievements);
});

// ── Student: get own total points ───────────────────────
router.get('/my-points', protect, async (req, res) => {
  const mongoose = require('mongoose');
  const result = await Achievement.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(req.user.id), status: 'APPROVED' } },
    { $group: { _id: null, total: { $sum: '$points' }, count: { $sum: 1 } } },
  ]);
  res.json({ points: result[0]?.total || 0, approved: result[0]?.count || 0 });
});

// ── Student: delete own achievement ─────────────────────
router.delete('/:id', protect, async (req, res) => {
  const a = await Achievement.findOne({ _id: req.params.id, student: req.user.id });
  if (!a) return res.status(404).json({ message: 'Not found' });
  if (a.cloudinaryId) {
    try { await cloudinary.uploader.destroy(a.cloudinaryId, { resource_type: 'auto' }); } catch {}
  }
  await a.deleteOne();
  res.json({ message: 'Deleted' });
});

// ── Faculty/Admin: get all pending achievements ──────────
router.get('/pending', protect, facultyOrAdmin, async (req, res) => {
  const filter = { status: 'PENDING' };
  if (req.query.branch) filter['studentInfo.branch'] = req.query.branch;
  const achievements = await Achievement.find(filter).sort({ createdAt: 1 });
  // attach student info
  const withStudent = await Promise.all(achievements.map(async a => {
    const st = await Student.findOne({ regNumber: a.regNumber }).select('name branch section');
    return { ...a.toObject(), studentName: st?.name, branch: st?.branch, section: st?.section };
  }));
  res.json(withStudent);
});

// ── Faculty/Admin: approve or reject ────────────────────
router.put('/:id/review', protect, facultyOrAdmin, async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status))
    return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
  const a = await Achievement.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote: reviewNote || '' },
    { new: true }
  );
  if (!a) return res.status(404).json({ message: 'Not found' });
  res.json(a);
});

// ── Leaderboard: multi branch/section filter ────────────
router.get('/leaderboard/multi', protect, facultyOrAdmin, async (req, res) => {
  const { branch, section, minPoints, limit = 500 } = req.query;
  const branches = branch ? (Array.isArray(branch) ? branch : [branch]) : [];
  const sections = section ? (Array.isArray(section) ? section : [section]) : [];
  const matchStudents = { role: 'student' };
  if (branches.length > 0) matchStudents.branch = { $in: branches };
  if (sections.length > 0) matchStudents.section = { $in: sections };
  const students = await Student.find(matchStudents).select('regNumber name branch section');
  const regNumbers = students.map(s => s.regNumber);
  const scores = await Achievement.aggregate([
    { $match: { regNumber: { $in: regNumbers }, status: 'APPROVED' } },
    { $group: { _id: '$regNumber', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: Number(limit) },
  ]);
  let result = scores.map((s, i) => {
    const st = students.find(x => x.regNumber === s._id);
    return { rank: i+1, regNumber: s._id, name: st?.name || s._id, branch: st?.branch || '—', section: st?.section || '—', totalPoints: s.totalPoints, achievements: s.count };
  });
  if (minPoints) result = result.filter(r => r.totalPoints >= parseInt(minPoints));
  res.json(result);
});

// ── Leaderboard Excel export ─────────────────────────────
router.get('/leaderboard/excel', protect, facultyOrAdmin, async (req, res) => {
  const XLSX = require('xlsx');
  const { branch, section, minPoints, limit = 500 } = req.query;
  const branches = branch ? (Array.isArray(branch) ? branch : [branch]) : [];
  const sections = section ? (Array.isArray(section) ? section : [section]) : [];
  const matchStudents = { role: 'student' };
  if (branches.length > 0) matchStudents.branch = { $in: branches };
  if (sections.length > 0) matchStudents.section = { $in: sections };
  const students = await Student.find(matchStudents).select('regNumber name branch section');
  const regNumbers = students.map(s => s.regNumber);
  const scores = await Achievement.aggregate([
    { $match: { regNumber: { $in: regNumbers }, status: 'APPROVED' } },
    { $group: { _id: '$regNumber', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: Number(limit) },
  ]);
  let result = scores.map((s, i) => {
    const st = students.find(x => x.regNumber === s._id);
    return { rank: i+1, regNumber: s._id, name: st?.name || s._id, branch: st?.branch || '—', section: st?.section || '—', totalPoints: s.totalPoints, achievements: s.count };
  });
  if (minPoints) result = result.filter(r => r.totalPoints >= parseInt(minPoints));
  const sheetData = [
    ['Rank','Reg No','Name','Department','Section','Total Points','Achievements'],
    ...result.map(r => [r.rank, r.regNumber, r.name, r.branch, r.section, r.totalPoints, r.achievements])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [6,14,24,12,10,14,14].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.xlsx"');
  res.send(buf);
});

// ── Leaderboard: top students by approved points ─────────
router.get('/leaderboard', protect, facultyOrAdmin, async (req, res) => {
  const { branch, section, limit = 20 } = req.query;
  const matchStudents = { role: 'student' };
  if (branch) matchStudents.branch = branch;
  if (section) matchStudents.section = section;
  const students = await Student.find(matchStudents).select('regNumber name branch section');

  const regNumbers = students.map(s => s.regNumber);
  const scores = await Achievement.aggregate([
    { $match: { regNumber: { $in: regNumbers }, status: 'APPROVED' } },
    { $group: { _id: '$regNumber', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: Number(limit) },
  ]);

  const result = scores.map((s, i) => {
    const st = students.find(x => x.regNumber === s._id);
    return { rank: i + 1, regNumber: s._id, name: st?.name || s._id, branch: st?.branch, section: st?.section, totalPoints: s.totalPoints, achievements: s.count };
  });
  res.json(result);
});

// ── Section-wise ranking ─────────────────────────────────
router.get('/ranking/section', protect, facultyOrAdmin, async (req, res) => {
  const students = await Student.find({ role: 'student' }).select('regNumber branch section');
  const scores = await Achievement.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$regNumber', totalPoints: { $sum: '$points' } } },
  ]);
  const scoreMap = {};
  scores.forEach(s => { scoreMap[s._id] = s.totalPoints; });

  const sectionMap = {};
  students.forEach(st => {
    const key = `${st.branch}-${st.section}`;
    if (!sectionMap[key]) sectionMap[key] = { branch: st.branch, section: st.section, totalPoints: 0, studentCount: 0 };
    sectionMap[key].totalPoints += scoreMap[st.regNumber] || 0;
    sectionMap[key].studentCount++;
  });

  const result = Object.values(sectionMap)
    .map(s => ({ ...s, avgPoints: s.studentCount ? +(s.totalPoints / s.studentCount).toFixed(1) : 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  res.json(result);
});

// ── Department-wise ranking ──────────────────────────────
router.get('/ranking/department', protect, facultyOrAdmin, async (req, res) => {
  const students = await Student.find({ role: 'student' }).select('regNumber branch');
  const scores = await Achievement.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$regNumber', totalPoints: { $sum: '$points' } } },
  ]);
  const scoreMap = {};
  scores.forEach(s => { scoreMap[s._id] = s.totalPoints; });

  const deptMap = {};
  students.forEach(st => {
    if (!deptMap[st.branch]) deptMap[st.branch] = { branch: st.branch, totalPoints: 0, studentCount: 0 };
    deptMap[st.branch].totalPoints += scoreMap[st.regNumber] || 0;
    deptMap[st.branch].studentCount++;
  });

  const result = Object.values(deptMap)
    .map(d => ({ ...d, avgPoints: d.studentCount ? +(d.totalPoints / d.studentCount).toFixed(1) : 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  res.json(result);
});

// Faculty: achievement report with filters
router.get('/faculty-report', protect, async (req, res) => {
  try {
    const { academicYear, currentYear, activityType, activityTypes, branch, section } = req.query;
    const achFilter = {};
    if (academicYear) achFilter.academicYear = academicYear;
    if (activityType) achFilter.activityType = activityType;
    if (activityTypes) achFilter.activityType = { $in: [].concat(activityTypes).map(t => new RegExp("^" + t.trim() + "$", "i")) };

    if (branch || section || currentYear) {
      const studentFilter = { role: 'student' };
      if (branch) studentFilter.branch = branch;
      if (section) studentFilter.section = section;
      if (currentYear) studentFilter.currentYear = parseInt(currentYear);
      const students = await Student.find(studentFilter).select('regNumber name branch section currentYear');
      const regNumbers = students.map(s => s.regNumber);
      achFilter.regNumber = { $in: regNumbers };
      const achievements = await Achievement.find(achFilter).sort({ createdAt: -1 });
      const studentMap = {};
      students.forEach(s => { studentMap[s.regNumber] = s; });
      return res.json(achievements.map(a => ({
        ...a.toObject(),
        studentName: studentMap[a.regNumber]?.name || a.regNumber,
        branch: studentMap[a.regNumber]?.branch,
        section: studentMap[a.regNumber]?.section,
        currentYear: studentMap[a.regNumber]?.currentYear,
      })));
    }

    const achievements = await Achievement.find(achFilter).sort({ createdAt: -1 });
    const regNumbers = [...new Set(achievements.map(a => a.regNumber))];
    const students = await Student.find({ regNumber: { $in: regNumbers } }).select('regNumber name branch section currentYear');
    const studentMap = {};
    students.forEach(s => { studentMap[s.regNumber] = s; });
    res.json(achievements.map(a => ({
      ...a.toObject(),
      studentName: studentMap[a.regNumber]?.name || a.regNumber,
      branch: studentMap[a.regNumber]?.branch,
      section: studentMap[a.regNumber]?.section,
      currentYear: studentMap[a.regNumber]?.currentYear,
    })));
  } catch (err) {
    console.error('faculty-report error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Faculty: achievement report Excel download
router.get('/faculty-report/excel', protect, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { academicYear, currentYear, activityType, activityTypes, branch, section } = req.query;
    const achFilter = {};
    if (academicYear) achFilter.academicYear = academicYear;
    if (activityType) achFilter.activityType = activityType;
    if (activityTypes) achFilter.activityType = { $in: [].concat(activityTypes).map(t => new RegExp("^" + t.trim() + "$", "i")) };
    const studentFilter = { role: 'student' };
    if (branch) studentFilter.branch = branch;
    if (section) studentFilter.section = section;
    if (currentYear) studentFilter.currentYear = parseInt(currentYear);
    let students = [];
    if (branch || section || currentYear) {
      students = await Student.find(studentFilter).select('regNumber name branch section currentYear');
      const regNumbers = students.map(s => s.regNumber);
      if (regNumbers.length) achFilter.regNumber = { $in: regNumbers };
    }
    const achievements = await Achievement.find(achFilter).sort({ regNumber: 1 });
    if (!students.length) {
      const regs = [...new Set(achievements.map(a => a.regNumber))];
      students = await Student.find({ regNumber: { $in: regs } }).select('regNumber name branch section currentYear');
    }
    const studentMap = {};
    students.forEach(s => { studentMap[s.regNumber] = s; });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Achievements');
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = "Vignan's Foundation for Science, Technology & Research";
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    ws.addRow([]);
    const hRow = ws.addRow(['S.No','Reg No','Name','Branch','Title','Academic Year','Points','Certificate URL']);
    hRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'} };
    });
    [6,16,24,10,30,14,10,40].forEach((w,i) => { ws.getColumn(i+1).width = w; });
    achievements.forEach((a, i) => {
      const st = studentMap[a.regNumber];
      const row = ws.addRow([i+1, a.regNumber, st?.name||'', st?.branch||'', a.title, a.academicYear||'', a.points, a.certificateUrl||a.certificatePath||'']);
      row.eachCell(cell => { cell.border = { top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'} }; });
      if (i%2===1) row.eachCell(cell => { cell.fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FFF0FDF4'} }; });
    });
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="achievements_report.xlsx"');
    await wb.xlsx.write(res); res.end();
  } catch (err) {
    console.error('excel error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// Faculty: ZIP download of certificates
router.get('/faculty-report/zip', protect, async (req, res) => {
  try {
    const archiver = require('archiver');
    const axios = require('axios');
    const path = require('path');
    const fs = require('fs');
    const { academicYear, currentYear, activityType, activityTypes, branch, section } = req.query;
    const achFilter = {};
    if (academicYear) achFilter.academicYear = academicYear;
    if (activityType) achFilter.activityType = activityType;
    if (activityTypes) achFilter.activityType = { $in: [].concat(activityTypes).map(t => new RegExp("^" + t.trim() + "$", "i")) };
    const studentFilter = { role: 'student' };
    if (branch) studentFilter.branch = branch;
    if (section) studentFilter.section = section;
    if (currentYear) studentFilter.currentYear = parseInt(currentYear);
    let students = [];
    if (branch || section || currentYear) {
      students = await Student.find(studentFilter).select('regNumber name branch section');
      const regNumbers = students.map(s => s.regNumber);
      if (regNumbers.length) achFilter.regNumber = { $in: regNumbers };
    }
    const achievements = await Achievement.find(achFilter).sort({ regNumber: 1 });
    if (!students.length) {
      const regs = [...new Set(achievements.map(a => a.regNumber))];
      students = await Student.find({ regNumber: { $in: regs } }).select('regNumber name branch section');
    }
    const studentMap = {};
    students.forEach(s => { studentMap[s.regNumber] = s; });
    const withCert = achievements.filter(a => {
      const url = a.certificateUrl || a.certificatePath || '';
      return url.startsWith('http') || (url && !url.startsWith('http') && fs.existsSync(url));
    });
    if (withCert.length === 0) return res.status(404).json({ message: 'No certificates found. Students may not have uploaded certificates yet.' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.zip"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);
    for (const a of withCert) {
      const st = studentMap[a.regNumber];
      const safeName = (st?.name || a.regNumber).replace(/[^a-zA-Z0-9_ -]/g, '_');
      const safeType = (a.activityType || 'cert').replace(/[^a-zA-Z0-9_]/g, '_');
      const safeTitle = (a.title || 'certificate').replace(/[^a-zA-Z0-9_ -]/g, '_').substring(0, 40);
      const url = a.certificateUrl || a.certificatePath || '';
      if (url.startsWith('http')) {
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          const contentType = response.headers['content-type'] || '';
          let ext = path.extname(url.split('?')[0]) || '.bin';
          if (contentType.includes('pdf')) ext = '.pdf';
          else if (contentType.includes('png')) ext = '.png';
          else if (contentType.includes('jpg') || contentType.includes('jpeg')) ext = '.jpg';
          archive.append(Buffer.from(response.data), { name: a.regNumber + '_' + safeName + '_' + safeType + '_' + safeTitle + ext });
        } catch (err) { console.error('cert fetch failed:', err.message); }
      } else if (a.certificatePath && fs.existsSync(a.certificatePath)) {
        const ext = path.extname(a.certificatePath) || '.bin';
        archive.file(a.certificatePath, { name: a.regNumber + '_' + safeName + '_' + safeType + '_' + safeTitle + ext });
      }
    }
    await archive.finalize();
  } catch (err) {
    console.error('ZIP error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'ZIP failed: ' + err.message });
  }
});

// ── Admin: get achievements by reg number ────────────────
router.get('/:regNumber', protect, facultyOrAdmin, async (req, res) => {
  const filter = { regNumber: req.params.regNumber };
  if (req.query.status) filter.status = req.query.status;
  const achievements = await Achievement.find(filter).sort({ createdAt: -1 });
  res.json(achievements);
});

module.exports = router;
