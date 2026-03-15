const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'faculty' },
  name: { type: String, required: true },
  email: String,
  phone: String,
  department: String,
  designation: String,
}, { timestamps: true, collection: 'Faculty' }); // → Faculty collection

facultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

facultySchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Faculty', facultySchema);
