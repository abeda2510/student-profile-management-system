// node seed.js
require('dotenv').config();
require('./db');

const Student = require('./models/Student');
const Faculty = require('./models/Faculty');

setTimeout(async () => {
  try {
    // students collection
    const s1 = await Student.findOne({ regNumber: '231FA04017' });
    if (!s1) {
      await Student.create({ regNumber: '231FA04017', password: '231FA04017', role: 'student', name: 'Student 231FA04017', email: '231fa04017@gmail.com' });
      console.log('[students]  Created: 231FA04017 / 231FA04017');
    } else console.log('[students]  231FA04017 already exists');

    const s2 = await Student.findOne({ regNumber: '231FA04040' });
    if (!s2) {
      await Student.create({ regNumber: '231FA04040', password: '231FA04040', role: 'admin', name: 'Admin 231FA04040', email: '231fa04040@gmail.com' });
      console.log('[students]  Created: 231FA04040 / 231FA04040 (admin)');
    } else console.log('[students]  231FA04040 already exists');

    // Faculty collection
    const f1 = await Faculty.findOne({ facultyId: 'FAC001' });
    if (!f1) {
      await Faculty.create({ facultyId: 'FAC001', password: 'faculty@123', role: 'faculty', name: 'Dr. Priya Sharma', email: 'priya@college.edu', phone: '9000000001', department: 'Computer Science', designation: 'Associate Professor' });
      console.log('[Faculty]   Created: FAC001 / faculty@123');
    } else console.log('[Faculty]   FAC001 already exists');

    // Amrutha Darsi
    const s3 = await Student.findOne({ regNumber: '231FA04016' });
    if (!s3) {
      await Student.create({ regNumber: '231FA04016', password: '231FA04016', role: 'student', name: 'Amrutha Darsi', email: '231fa04016@gmail.com' });
      console.log('[students]  Created: 231FA04016 / 231FA04016 (Amrutha Darsi)');
    } else console.log('[students]  231FA04016 already exists');

    // Faculty stored in students collection (role: faculty)
    const f2 = await Student.findOne({ regNumber: '231FA04754' });
    if (!f2) {
      await Student.create({ regNumber: '231FA04754', password: '231FA04754', role: 'faculty', name: 'Abeda Begum', email: '231fa04754@gmail.com' });
      console.log('[students]  Created: 231FA04754 / 231FA04754 (faculty)');
    } else console.log('[students]  231FA04754 already exists');

    console.log('\nDatabase: student_management');
    console.log('Collections: students | Faculty | achievements | documents');
    console.log('\n--- Credentials ---');
    console.log('Student  → 231FA04017 / 231FA04017  (Student tab)');
    console.log('Admin    → 231FA04040 / 231FA04040  (Student tab)');
    console.log('Faculty  → 231FA04754 / 231FA04754  (Faculty tab)');
    console.log('Faculty  → FAC001     / faculty@123 (Faculty tab)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}, 1000);
