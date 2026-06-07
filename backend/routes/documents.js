const router = require('express').Router();
const Document = require('../models/Document');
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadDoc, cloudinary } = require('../cloudinary');

const facultyOrAdmin = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty/Admin only' });
  next();
};

// Upload document (student uploads own)
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
    uploadedBy: 'student',
  });
  res.status(201).json(doc);
});

// Admin: upload a document for a specific student
router.post('/admin-upload', protect, adminOnly, uploadDoc.single('file'), async (req, res) => {
  try {
    const { regNumber, docType, label } = req.body;
    if (!regNumber || !docType || !label)
      return res.status(400).json({ message: 'regNumber, docType and label are required' });
    const student = await Student.findOne({ regNumber });
    if (!student) return res.status(404).json({ message: `Student ${regNumber} not found` });

    // If file uploaded, store it; otherwise store as metadata-only doc
    const docData = {
      student: student._id,
      regNumber,
      docType,
      label,
      uploadedBy: 'admin',
    };
    if (req.file) {
      docData.filename = req.file.originalname;
      docData.filepath = req.file.path;
      docData.fileUrl = req.file.path;
      docData.cloudinaryId = req.file.filename;
    }
    // Replace existing doc of same type+label to avoid duplicates
    await Document.deleteMany({ regNumber, docType, label, uploadedBy: 'admin' });
    const doc = await Document.create(docData);
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: bulk upload documents from Excel — assigns metadata (no file) to multiple students
router.post('/admin-bulk-meta', protect, adminOnly, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const multer = require('multer');
    const upload = multer({ storage: multer.memoryStorage() }).single('file');
    upload(req, res, async (err) => {
      if (err || !req.file) return res.status(400).json({ message: 'No file uploaded' });
      const { docType, label } = req.body;
      if (!docType || !label) return res.status(400).json({ message: 'docType and label required' });

      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!rows.length) return res.status(400).json({ message: 'Excel file is empty or has no data rows' });
      
      // Log detected columns to help debug
      const detectedCols = Object.keys(rows[0]);
      console.log('Admin bulk upload - detected columns:', detectedCols, '| Total rows:', rows.length);

      let created = 0, skipped = 0, errors = [];
      for (const row of rows) {
        // Accept many possible column names for reg number
        const regNumber = String(
          row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] ||
          row['Registration Number'] || row['registration_number'] || row['RegNo'] ||
          row['Reg No'] || row['reg no'] || row['REGNUMBER'] || row['REG NUMBER'] ||
          Object.values(row)[0] || '' // fallback: use first column
        ).trim();
        // Smart value extraction:
        // 1. Look for column matching the label name (e.g. "CRT Performance")
        // 2. Then try common data column names
        // 3. Do NOT use second column as fallback (could be student name)
        const labelKey = Object.keys(row).find(k => k.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(k.toLowerCase()));
        const value = String(
          (labelKey ? row[labelKey] : null) ||
          row.value || row.Value || row.data || row.Data ||
          row.Score || row.score || row.Percentage || row.percentage ||
          row.Marks || row.marks || row['Attendance (%)'] || row['Attendance(%)'] ||
          row['attendance'] || row['Attendance'] ||
          row['Performance'] || row['performance'] ||
          ''
        ).trim();
        if (!regNumber) continue;
        const student = await Student.findOne({ regNumber });
        if (!student) { skipped++; errors.push(regNumber); continue; }
        await Document.deleteMany({ regNumber, docType, label, uploadedBy: 'admin' });
        await Document.create({ student: student._id, regNumber, docType, label, fileUrl: value || null, uploadedBy: 'admin' });
        created++;
      }
      res.json({
        message: `Created ${created} records. ${skipped} reg numbers not found.${errors.length ? ' Not found: ' + errors.slice(0,5).join(', ') + (errors.length > 5 ? '...' : '') : ''}`,
        created, skipped,
        detectedColumns: detectedCols,
        totalRows: rows.length
      });
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: get all admin-uploaded docs summary (distinct labels per docType)
router.get('/admin-types', protect, facultyOrAdmin, async (req, res) => {
  try {
    const types = await Document.aggregate([
      { $match: { uploadedBy: 'admin' } },
      { $group: { _id: { docType: '$docType', label: '$label' }, count: { $sum: 1 } } },
      { $sort: { '_id.label': 1 } }
    ]);
    res.json(types.map(t => ({ docType: t._id.docType, label: t._id.label, count: t.count })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get own documents
router.get('/me', protect, async (req, res) => {
  const docs = await Document.find({ student: req.user.id }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Admin/Faculty: get documents by reg number
router.get('/:regNumber', protect, facultyOrAdmin, async (req, res) => {
  const docs = await Document.find({ regNumber: req.params.regNumber }).sort({ uploadedAt: -1 });
  res.json(docs);
});

// Delete document (own or admin)
router.delete('/:id', protect, async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, student: req.user.id };
  const doc = await Document.findOne(filter);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.cloudinaryId) {
    try { await cloudinary.uploader.destroy(doc.cloudinaryId, { resource_type: 'auto' }); } catch {}
  }
  await doc.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;
