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

module.exports = router;
