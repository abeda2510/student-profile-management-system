const mongoose = require('mongoose');

const POINTS = {
  'HACKATHON WINNER': 10, 'HACKATHON RUNNER': 7, 'HACKATHON PARTICIPATION': 5,
  'INTERNSHIP': 8, 'RESEARCH_PUBLICATION': 12,
  'TECHNICAL_COMPETITION WINNER': 10, 'TECHNICAL_COMPETITION PARTICIPATION': 4,
  'WORKSHOP': 3, 'SEMINAR': 2, 'CULTURAL': 3,
  'SPORTS WINNER': 8, 'SPORTS PARTICIPATION': 3, 'OTHER': 2,
};

const achievementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  regNumber: String,
  academicYear: String,
  semester: Number,
  activityType: { type: String, required: true },
  title: { type: String },
  description: String,
  position: String,
  issuingOrg: String,
  date: String,
  certificateFile: String,
  certificatePath: String,
  cloudinaryId: String,
  status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING' },
  reviewNote: String,
  points: { type: Number, default: 0 },
}, { timestamps: true, collection: 'achievements' });

achievementSchema.pre('save', function (next) {
  this.points = POINTS[this.activityType] || 2;
  if (!this.title) this.title = this.activityType;
  next();
});

achievementSchema.statics.POINTS = POINTS;

module.exports = mongoose.model('Achievement', achievementSchema);
