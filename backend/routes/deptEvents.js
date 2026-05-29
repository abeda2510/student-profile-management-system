const router = require('express').Router();
const multer = require('multer');
const cloudinaryPkg = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const DeptEvent = require('../models/DeptEvent');

const facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Faculty only' });
  next();
};

// Multer memory storage — upload to Cloudinary manually per field
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const DOC_FIELDS = [
  { name: 'poster', maxCount: 1 },
  { name: 'onePageReport', maxCount: 1 },
  { name: 'winnersList', maxCount: 1 },
  { name: 'sampleCertificate', maxCount: 1 },
  { name: 'budgetReport', maxCount: 1 },
];

async function uploadToCloudinary(buffer, mimetype, folder, filename) {
  return new Promise((resolve, reject) => {
    // Always upload as image — Cloudinary converts PDF first page to JPG
    // This avoids CORS issues with raw files
    const stream = cloudinaryPkg.uploader.upload_stream(
      { folder, resource_type: 'image', public_id: filename, format: mimetype === 'application/pdf' ? 'jpg' : undefined },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });
}

// GET all events (faculty sees own, admin sees all)
router.get('/', protect, facultyOnly, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    const events = await DeptEvent.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create event with document uploads
router.post('/', protect, facultyOnly, upload.fields(DOC_FIELDS), async (req, res) => {
  try {
    const { employeeId, coordinatorName, eventName, eventType, year, date, venue, description, outcome, budget } = req.body;
    if (!employeeId || !coordinatorName || !eventName || !year)
      return res.status(400).json({ message: 'Employee ID, coordinator name, event name and year are required' });

    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findById(req.user.id).select('department');
    const folder = `student-management/dept-events/${req.user.id}`;

    const docData = {};
    for (const field of DOC_FIELDS) {
      const files = req.files?.[field.name];
      if (files?.[0]) {
        const f = files[0];
        const result = await uploadToCloudinary(f.buffer, f.mimetype, folder, `${field.name}_${Date.now()}`);
        docData[field.name] = { url: result.secure_url, cloudinaryId: result.public_id };
      }
    }

    const event = await DeptEvent.create({
      employeeId, coordinatorName, eventName, eventType, year, date, venue,
      description, outcome, budget: budget ? parseFloat(budget) : undefined,
      department: faculty?.department,
      createdBy: req.user.id,
      ...docData,
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('DeptEvent POST error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE event
router.delete('/:id', protect, facultyOnly, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, createdBy: req.user.id };
    const event = await DeptEvent.findOne(filter);
    if (!event) return res.status(404).json({ message: 'Not found' });

    // Delete Cloudinary files
    for (const field of DOC_FIELDS) {
      const doc = event[field.name];
      if (doc?.cloudinaryId) {
        try { await cloudinaryPkg.uploader.destroy(doc.cloudinaryId, { resource_type: 'raw' }); } catch {}
        try { await cloudinaryPkg.uploader.destroy(doc.cloudinaryId, { resource_type: 'image' }); } catch {}
      }
    }
    await event.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

// GET dept events report — Excel (admin only)
router.get('/report/excel', protect, adminOnly, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { year } = req.query;
    const filter = year ? { year } : {};
    const events = await DeptEvent.find(filter).sort({ year: -1, createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Student Management System';
    const ws = wb.addWorksheet('Department Events');

    // Title rows
    ws.mergeCells('A1:L1');
    ws.getCell('A1').value = "Vignan's Foundation for Science, Technology & Research (Deemed to be University)";
    ws.getCell('A1').font = { bold: true, size: 13 };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    ws.getRow(1).height = 22;

    ws.mergeCells('A2:L2');
    ws.getCell('A2').value = `Department Events Report${year ? ' — Academic Year: ' + year : ' — All Years'}`;
    ws.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FF1e40af' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.addRow([]);

    const headers = ['S.No', 'Employee ID', 'Coordinator', 'Department', 'Event Name', 'Event Type', 'Academic Year', 'Date', 'Venue', 'Budget (₹)', 'Description', 'Outcome'];
    const hRow = ws.addRow(headers);
    hRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    hRow.height = 20;

    const colWidths = [6, 14, 20, 14, 28, 16, 14, 12, 18, 12, 36, 36];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    events.forEach((ev, i) => {
      const row = ws.addRow([
        i + 1, ev.employeeId, ev.coordinatorName, ev.department || '—',
        ev.eventName, ev.eventType || '—', ev.year, ev.date || '—',
        ev.venue || '—', ev.budget || '—', ev.description || '—', ev.outcome || '—',
      ]);
      row.height = 16;
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="dept_events${year ? '_' + year : ''}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Dept events Excel error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// GET dept events report — ZIP of all documents (admin only)
router.get('/report/zip', protect, adminOnly, async (req, res) => {
  try {
    const archiver = require('archiver');
    const axios = require('axios');
    const { year } = req.query;
    const filter = year ? { year } : {};
    const events = await DeptEvent.find(filter).sort({ year: -1, createdAt: -1 });

    const DOC_LABELS = { poster: 'Poster', onePageReport: 'OnePageReport', winnersList: 'WinnersList', sampleCertificate: 'SampleCertificate', budgetReport: 'BudgetReport' };

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="dept_events_docs${year ? '_' + year : ''}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    for (const ev of events) {
      const safeName = ev.eventName.replace(/[^a-zA-Z0-9_ -]/g, '_').substring(0, 40);
      const folder = `${ev.year || 'unknown'}/${safeName}`;
      for (const [key, label] of Object.entries(DOC_LABELS)) {
        const doc = ev[key];
        if (doc?.url) {
          try {
            const response = await axios.get(doc.url, { responseType: 'arraybuffer', timeout: 15000 });
            const ext = doc.url.split('?')[0].split('.').pop() || 'jpg';
            archive.append(Buffer.from(response.data), { name: `${folder}/${label}.${ext}` });
          } catch {}
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('Dept events ZIP error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

module.exports = router;
