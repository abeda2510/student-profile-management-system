const mongoose = require('mongoose');

// Points table
const POINTS = {
  HACKATHON_WINNER: 10,
  HACKATHON_RUNNER: 7,
  HACKATHON_PARTICIPATION: 5,
  INTERNSHIP: 8,
  RESEARCH_PUBLICATION: 12,
  TECHNICAL_COMPETITION_WINNER: 10,
  TECHNICAL_COMPETITION_PARTICIPATION: 4,
  WORKSHOP: 3,
  SEMINAR: 2,
  CULTURAL: 3,
  SPORTS_WINNER: 8,
  SPORTS_PARTICIPATION: 3,
  OTHER: 2,
};

const achievementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  regNumber: String,
  academicYear: String,
  semester: Number,
  activityType: { type: String, required: true },
  mainCategory: { type: String },
  subType: { type: String, default: 'NA' },
  title: { type: String, required: true },
  description: String,
  position: String,
  issuingOrg: String,
  date: String,
  certificateFile: String,
  certificatePath: String,
  certificateUrl: String,
  cloudinaryId: String,
  status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING' },
  reviewNote: String,
  points: { type: Number, default: 0 },
}, { timestamps: true, collection: 'achievements' });

// Auto-calculate points based on activityType + subType
achievementSchema.pre('save', function (next) {
  const key = this.subType && this.subType !== 'NA'
    ? `${this.activityType}_${this.subType}`
    : this.activityType;
  this.points = POINTS[key] || POINTS[this.activityType] || 2;
  next();
});

achievementSchema.statics.POINTS = POINTS;

module.exports = mongoose.model('Achievement', achievementSchema);
