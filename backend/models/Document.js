const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  regNumber: String,
  docType: {
    type: String,
    enum: ['MARK_MEMO', 'AADHAAR', 'PAN', 'VOTER_ID', 'APAAR_ABC', 'OTHER'],
    required: true
  },
  label: String,
  filename: String,
  filepath: String,
  fileUrl: String,
  cloudinaryId: String,
  uploadedAt: { type: Date, default: Date.now }
}, { collection: 'documents' }); // → documents collection

module.exports = mongoose.model('Document', documentSchema);
