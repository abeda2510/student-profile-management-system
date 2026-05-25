const router = require('express').Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { uploadAchievement, cloudinary } = require('../cloudinary');

// Inline schema for faculty achievements (separate collection)
const facultyAchievementSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  facultyId: String,
  facultyName: String,
  department: String,
  activityType: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  issuingOrg: String,
  academicYear: String,
  date: String,
  position: String,
  certificateUrl: String,
  certificatePath: String,
  cloudinaryId: String,
}, { timestamps: true, collection: 'faculty_achievements' });

const FacultyAchievement = mongoose.models.FacultyAchievement ||
  mongoose.model('FacultyAchievement', facultyAchievementSchema);

const facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty only' });
  next();
};

// GET own achievements
router.get('/my', protect, facultyOnly, async (req, res) => {
  try {
    const achievements = await FacultyAchievement.find({ faculty: req.user.id }).sort({ createdAt: -1 });
    res.json(achievements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add achievement
router.post('/my', protect, facultyOnly, uploadAchievement.single('certificate'), async (req, res) => {  try {
    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findById(req.user.id).select('name facultyId department');
    const data = {
      ...req.body,
      faculty: req.user.id,
      facultyId: faculty?.facultyId,
      facultyName: faculty?.name,
      department: faculty?.department,
    };
    if (req.file) {
      data.certificatePath = req.file.path;
      data.certificateUrl = req.file.path;
      data.cloudinaryId = req.file.filename;
    }
    const achievement = await FacultyAchievement.create(data);
    res.status(201).json(achievement);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE own achievement
router.delete('/my/:id', protect, facultyOnly, async (req, res) => {
  try {
    const a = await FacultyAchievement.findOne({ _id: req.params.id, faculty: req.user.id });
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (a.cloudinaryId) {
      try { await cloudinary.uploader.destroy(a.cloudinaryId, { resource_type: 'auto' }); } catch {}
    }
    await a.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
