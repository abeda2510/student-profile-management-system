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
  const student = await Student.findById(req.user.id);
  const points = POINTS_MAP[req.body.activityType] || 0;
  const data = { ...req.body, student: req.user.id, regNumber: student.regNumber, status: 'APPROVED', points };
  if (req.file) {
    data.certificateFile = req.file.originalname;
    data.certificatePath = req.file.path;
    data.cloudinaryId = req.file.filename;
  }
  const achievement = new Achievement(data);
  await achievement.save();
  res.status(201).json(achievement);
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

// ── Admin: get achievements by reg number ────────────────
router.get('/:regNumber', protect, facultyOrAdmin, async (req, res) => {
  const filter = { regNumber: req.params.regNumber };
  if (req.query.status) filter.status = req.query.status;
  const achievements = await Achievement.find(filter).sort({ createdAt: -1 });
  res.json(achievements);
});

module.exports = router;
