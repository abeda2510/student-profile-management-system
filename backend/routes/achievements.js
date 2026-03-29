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

// ── Student: add achievement ─────────────────────────────
router.post('/', protect, uploadAchievement.single('certificate'), async (req, res) => {
  const student = await Student.findById(req.user.id);
  const data = { ...req.body, student: req.user.id, regNumber: student.regNumber, status: 'PENDING' };
  if (req.file) {
    data.certificateFile = req.file.originalname;
    data.certificatePath = req.file.path;       // Cloudinary URL
    data.cloudinaryId = req.file.filename;      // Cloudinary public_id
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
  const result = await Achievement.aggregate([
    { $match: { student: req.user.id, status: 'APPROVED' } },
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
