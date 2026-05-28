const mongoose = require('mongoose');

const deptEventSchema = new mongoose.Schema({
  // Coordinator Info
  employeeId: { type: String, required: true },
  coordinatorName: { type: String, required: true },
  department: String,

  // Event Info
  eventName: { type: String, required: true },
  eventType: { type: String }, // Workshop, Seminar, Hackathon, etc.
  year: { type: String, required: true },
  date: String,
  venue: String,
  description: String,
  outcome: String,
  budget: Number,

  // Documents (Cloudinary URLs)
  poster: { url: String, cloudinaryId: String },
  onePageReport: { url: String, cloudinaryId: String },
  winnersList: { url: String, cloudinaryId: String },
  sampleCertificate: { url: String, cloudinaryId: String },
  budgetReport: { url: String, cloudinaryId: String },
  additionalDocs: [{ label: String, url: String, cloudinaryId: String }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
}, { timestamps: true, collection: 'dept_events' });

module.exports = mongoose.model('DeptEvent', deptEventSchema);
