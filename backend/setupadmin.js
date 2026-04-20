require('dotenv').config();
require('./db');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const bcrypt = require('bcryptjs');

setTimeout(async () => {
  try {
    // Remove old admin from students collection
    const del = await Student.deleteOne({ regNumber: '231FA04040' });
    console.log('Deleted old admin student:', del.deletedCount);

    // Remove existing admin12 if any
    await Faculty.deleteOne({ facultyId: 'admin12' });

    // Create new admin in Faculty collection
    const hashed = await bcrypt.hash('admin12', 10);
    await Faculty.create({
      facultyId: 'admin12',
      password: hashed,
      name: 'Admin',
      role: 'admin',
      email: 'admin@vignan.ac.in',
      department: 'Admin Office',
      designation: 'Administrator'
    });
    console.log('Created admin12 in Faculty collection with role admin');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}, 2000);
