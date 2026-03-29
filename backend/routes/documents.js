const router = require('express').Router();
const Document = require('../models/Document');
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadDoc, cloudinary } = require('../cloudinary');

// Upload document
router.post('/upload', protect, uploadDoc.single('file'), async (req, res) => {
  const { docType, label } = req.body;
  const student = await Student.findById(req.user.id);
  const doc = await Document.create({
    student: req.user.id,
    regNumber: student.regNumber,
    docType,
    label,
    filename: req.file.originalname,
    filepath: req.file.path,
    fileUrl: req.file.path,
    cloudinaryId: req.file.filename,
  });
  res.status(201).json(doc);
});

// Get own documents
router.get('/me', protect, async (req, res) => {
  const docs = await Document.find({ student: req.user.id }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Admin/Faculty: get documents by reg number
router.get('/:regNumber', protect, adminOnly, async (req, res) => {
  const docs = await Document.find({ regNumber: req.params.regNumber }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Delete document (own)
router.delete('/:id', protect, async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, student: req.user.id });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.cloudinaryId) {
    try { await cloudinary.uploader.destroy(doc.cloudinaryId, { resource_type: 'auto' }); } catch {}
  }
  await doc.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;
