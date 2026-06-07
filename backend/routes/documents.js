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

// Admin: bulk upload documents from Excel — handles unlimited rows via chunked streaming
router.post('/admin-bulk-meta', protect, adminOnly, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const multer = require('multer');
    // Allow up to 500MB files
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }).single('file');

    upload(req, res, async (err) => {
      if (err || !req.file) return res.status(400).json({ message: 'No file uploaded' });
      const { docType, label } = req.body;
      if (!docType || !label) return res.status(400).json({ message: 'docType and label required' });

      // Stream NDJSON progress back — keeps connection alive for huge files
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.flushHeaders();

      const sendProgress = (data) => {
        try { res.write(JSON.stringify(data) + '\n'); } catch {}
      };

      try {
        // Parse Excel
        sendProgress({ status: 'parsing', message: 'Parsing Excel file...' });
        const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        if (!rows.length) { sendProgress({ status: 'error', message: 'Excel file is empty' }); return res.end(); }

        const detectedCols = Object.keys(rows[0]);
        const totalRows = rows.length;
        sendProgress({ status: 'parsed', message: `Found ${totalRows} rows, columns: ${detectedCols.join(', ')}`, totalRows, detectedColumns: detectedCols });

        // Parse all rows into structured objects
        const parsed = [];
        for (const row of rows) {
          const regNumber = String(
            row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] ||
            row['Registration Number'] || row['registration_number'] || row['RegNo'] ||
            row['Reg No'] || row['reg no'] || row['REGNUMBER'] || row['REG NUMBER'] ||
            Object.values(row)[0] || ''
          ).trim();
          if (!regNumber) continue;
          const regCol = Object.keys(row)[0];
          const dataEntries = Object.entries(row)
            .filter(([k]) => k !== regCol && !k.toLowerCase().includes('student') && !k.toLowerCase().includes('name'))
            .map(([k, v]) => [k, String(v)]);
          const combinedValue = dataEntries.map(([k, v]) => `${k}: ${v}`).join(' | ');
          parsed.push({ regNumber, combinedValue, dataEntries });
        }

        // Get distinct sub-labels for bulk delete
        const subLabelSet = new Set();
        parsed.forEach(({ dataEntries }) => dataEntries.forEach(([colName]) => subLabelSet.add(`${label} - ${colName}`)));
        const subLabels = [...subLabelSet];

        const BATCH = 500; // process 500 students at a time
        let totalCreated = 0, totalSkipped = 0, allErrors = [];

        for (let i = 0; i < parsed.length; i += BATCH) {
          const chunk = parsed.slice(i, i + BATCH);
          const chunkRegs = chunk.map(p => p.regNumber);

          sendProgress({ status: 'progress', message: `Processing rows ${i + 1}–${Math.min(i + BATCH, parsed.length)} of ${parsed.length}...`, processed: i, total: parsed.length });

          // Fetch students for this batch
          const students = await Student.find({ regNumber: { $in: chunkRegs } }).select('_id regNumber').lean();
          const studentMap = {};
          students.forEach(s => { studentMap[s.regNumber] = s._id; });

          // Bulk delete old docs for this batch
          await Document.deleteMany({ regNumber: { $in: chunkRegs }, uploadedBy: 'admin', label });
          if (subLabels.length) {
            await Document.deleteMany({ regNumber: { $in: chunkRegs }, uploadedBy: 'admin', label: { $in: subLabels } });
          }

          // Build bulk write ops
          const toInsert = [];
          for (const { regNumber, combinedValue, dataEntries } of chunk) {
            const studentId = studentMap[regNumber];
            if (!studentId) { totalSkipped++; allErrors.push(regNumber); continue; }

            toInsert.push({ student: studentId, regNumber, docType, label, fileUrl: combinedValue || null, filename: combinedValue || null, uploadedBy: 'admin' });
            for (const [colName, colVal] of dataEntries) {
              toInsert.push({ student: studentId, regNumber, docType: 'ADMIN_CUSTOM', label: `${label} - ${colName}`, fileUrl: colVal, filename: colVal, uploadedBy: 'admin' });
            }
            totalCreated++;
          }

          if (toInsert.length) await Document.insertMany(toInsert, { ordered: false });
        }

        sendProgress({
          status: 'done',
          message: `Done! Created ${totalCreated} records. ${totalSkipped} reg numbers not found.${allErrors.length ? ' Not found: ' + allErrors.slice(0, 10).join(', ') + (allErrors.length > 10 ? `... and ${allErrors.length - 10} more` : '') : ''}`,
          created: totalCreated,
          skipped: totalSkipped,
          detectedColumns: detectedCols,
          totalRows,
        });
      } catch (innerErr) {
        sendProgress({ status: 'error', message: innerErr.message });
      }
      res.end();
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

// Admin: delete ALL docs with a given label (parent + all sub-columns)
router.delete('/admin-label/:label', protect, adminOnly, async (req, res) => {
  try {
    const label = decodeURIComponent(req.params.label);
    // Delete exact label + any sub-labels starting with "label - "
    const result = await Document.deleteMany({
      uploadedBy: 'admin',
      $or: [
        { label },
        { label: { $regex: `^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} - ` } }
      ]
    });
    res.json({ message: `Deleted ${result.deletedCount} records for "${label}"`, deletedCount: result.deletedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
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
