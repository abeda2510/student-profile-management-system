const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/documents', req.user.regNumber);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Upload document
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  const { docType, label } = req.body;
  const student = await Student.findById(req.user.id);
  const doc = await Document.create({
    student: req.user.id,
    regNumber: student.regNumber,
    docType,
    label,
    filename: req.file.filename,
    filepath: req.file.path
  });
  res.status(201).json(doc);
});

// Get own documents
router.get('/me', protect, async (req, res) => {
  const docs = await Document.find({ student: req.user.id }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Admin: get documents by reg number
router.get('/:regNumber', protect, adminOnly, async (req, res) => {
  const docs = await Document.find({ regNumber: req.params.regNumber }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Delete document (own)
router.delete('/:id', protect, async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, student: req.user.id });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  fs.unlink(doc.filepath, () => {});
  await doc.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;
