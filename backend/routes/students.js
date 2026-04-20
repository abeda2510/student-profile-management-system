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
  try {
    const { password, role, _id, __v, createdAt, updatedAt, ...updates } = req.body;
    // cast numeric fields
    if (updates.cgpa !== undefined && updates.cgpa !== '') updates.cgpa = parseFloat(updates.cgpa);
    else if (updates.cgpa === '') delete updates.cgpa;
    if (updates.admissionYear) updates.admissionYear = parseInt(updates.admissionYear);
    if (updates.currentYear) updates.currentYear = parseInt(updates.currentYear);
    if (updates.currentSemester) updates.currentSemester = parseInt(updates.currentSemester);
    if (updates.tenthYear) updates.tenthYear = parseInt(updates.tenthYear);
    if (updates.tenthPercent) updates.tenthPercent = parseFloat(updates.tenthPercent);
    if (updates.interYear) updates.interYear = parseInt(updates.interYear);
    if (updates.interPercent) updates.interPercent = parseFloat(updates.interPercent);
    const student = await Student.findByIdAndUpdate(
      req.user.id, { $set: updates }, { new: true, runValidators: false }
    ).select('-password');
    res.json(student);
  } catch (err) {
    console.error('PUT /students/me error:', err);
    res.status(500).json({ message: err.message });
  }
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

// Admin: bulk assign counsellors from Excel/CSV
router.post('/bulk-counsellor', protect, adminOnly, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const multer = require('multer');
    const upload = multer({ storage: multer.memoryStorage() });

    // Parse uploaded file from req (already handled by multer middleware below)
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ message: 'Invalid data' });

    let updated = 0, notFound = 0;
    for (const row of rows) {
      const regNumber = String(row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] || '').trim();
      const counsellor = String(row.counsellor || row.Counsellor || row['Counsellor Name'] || '').trim();
      if (!regNumber || !counsellor) continue;
      const result = await Student.updateOne({ regNumber }, { $set: { counsellor } });
      if (result.matchedCount > 0) updated++;
      else notFound++;
    }
    res.json({ message: `Updated ${updated} students. ${notFound} not found.`, updated, notFound });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: upload Excel/CSV for counsellor assignment (file upload)
router.post('/bulk-counsellor-file', protect, adminOnly, (req, res) => {
  const XLSX = require('xlsx');
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() }).single('file');

  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: 'File upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      let updated = 0, notFound = 0;
      for (const row of rows) {
        const regNumber = String(row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] || '').trim();
        const counsellor = String(row.counsellor || row.Counsellor || row['Counsellor Name'] || row['counsellor_name'] || '').trim();
        if (!regNumber || !counsellor) continue;
        const result = await Student.updateOne({ regNumber }, { $set: { counsellor } });
        if (result.matchedCount > 0) updated++;
        else notFound++;
      }
      res.json({ message: `Updated ${updated} students. ${notFound} reg numbers not found.`, updated, notFound });
    } catch (err) {
      res.status(500).json({ message: 'Failed to parse file: ' + err.message });
    }
  });
});

module.exports = router;
