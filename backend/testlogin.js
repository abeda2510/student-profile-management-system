require('dotenv').config();
require('./db');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');

setTimeout(async () => {
  const s = await Student.findOne({ regNumber: '231FA04017' });
  if (!s) { console.log('Student 231FA04017 NOT FOUND'); process.exit(1); }
  const match = await bcrypt.compare('231FA04017', s.password);
  console.log('Student password match:', match);

  const f = await Faculty.findOne({ facultyId: 'FAC001' });
  if (!f) { console.log('Faculty FAC001 NOT FOUND'); process.exit(1); }
  const fmatch = await bcrypt.compare('faculty@123', f.password);
  console.log('Faculty password match:', fmatch);

  process.exit(0);
}, 1500);
