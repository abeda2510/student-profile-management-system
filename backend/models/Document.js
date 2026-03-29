const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  regNumber:    { type: String, required: true },
  docType:      { type: String, required: true },
  label:        String,
  filename:     String,
  filepath:     String,
  fileUrl:      String,       // Cloudinary URL
  cloudinaryId: String,       // Cloudinary public_id for deletion
  uploadedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
