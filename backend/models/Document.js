const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  regNumber: String,
  docType: {
    type: String,
    // Core types uploaded by student
    // Admin types: CRT_ATTENDANCE, CRT_PERFORMANCE, SEMESTER_ATTENDANCE, ADMIN_CUSTOM
    required: true
  },
  label: String,      // Human-readable title e.g. "CRT Attendance Sem 3"
  filename: String,
  filepath: String,
  fileUrl: String,
  cloudinaryId: String,
  uploadedBy: { type: String, default: 'student' }, // 'student' | 'admin'
  uploadedAt: { type: Date, default: Date.now }
}, { collection: 'documents' });

module.exports = mongoose.model('Document', documentSchema);
