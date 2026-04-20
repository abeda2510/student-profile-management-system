const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'faculty'], default: 'student' },
  name: { type: String, required: true },
  dob: String,
  gender: String,
  bloodGroup: String,
  nationality: String,
  religion: String,
  caste: String,
  email: String,
  phone: String,
  address: String,
  parentName: String,
  parentPhone: String,
  admissionCategory: {
    type: String,
    enum: ['VSAT', 'EAMCET', 'JEE', 'MANAGEMENT', 'NRI', 'OTHER']
  },
  admissionYear: Number,
  branch: String,
  section: String,
  currentSemester: Number,
  currentYear: Number,
  apaarId: String,
  abcId: String,
  linkedIn: String,
  codeChef: String,
  leetCode: String,
  cgpa: Number,
  // Semester-wise CGPA
  sem1Cgpa: Number,
  sem2Cgpa: Number,
  sem3Cgpa: Number,
  sem4Cgpa: Number,
  sem5Cgpa: Number,
  sem6Cgpa: Number,
  sem7Cgpa: Number,
  sem8Cgpa: Number,
  // Academic history
  tenthSchool: String,
  tenthBoard: String,
  tenthYear: Number,
  tenthPercent: Number,
  interCollege: String,
  interBoard: String,
  interYear: Number,
  interPercent: Number,
  interGroup: String,
}, { timestamps: true, collection: 'students' }); // → students collection

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
