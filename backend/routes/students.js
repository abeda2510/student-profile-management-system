const router = require('express').Router();
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

// Get own profile
router.get('/me', protect, async (req, res) => {
  const student = await Student.findById(req.user.id).select('-password');
  res.json(student);
});

// Update own profile
router.put('/me', protect, async (req, res) => {
  const { password, role, _id, __v, createdAt, updatedAt, ...updates } = req.body;
  // cast numeric fields
  if (updates.cgpa !== undefined && updates.cgpa !== '') updates.cgpa = parseFloat(updates.cgpa);
  if (updates.admissionYear) updates.admissionYear = parseInt(updates.admissionYear);
  if (updates.currentYear) updates.currentYear = parseInt(updates.currentYear);
  if (updates.currentSemester) updates.currentSemester = parseInt(updates.currentSemester);
  const student = await Student.findByIdAndUpdate(
    req.user.id, { $set: updates }, { new: true, runValidators: false }
  ).select('-password');
  res.json(student);
});

// Admin: search by reg number
router.get('/search/:regNumber', protect, adminOnly, async (req, res) => {
  const student = await Student.findOne({ regNumber: req.params.regNumber }).select('-password');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// Admin: list all students
router.get('/', protect, adminOnly, async (req, res) => {
  const students = await Student.find().select('-password').sort({ createdAt: -1 });
  res.json(students);
});

module.exports = router;
