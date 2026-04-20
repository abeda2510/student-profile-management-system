  const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/leetcode', require('./routes/leetcode'));

// Auto-create admin on startup
async function ensureAdmin() {
  try {
    const Faculty = require('./models/Faculty');
    const bcrypt = require('bcryptjs');
    // Always delete and recreate to ensure correct password
    await Faculty.deleteOne({ facultyId: 'admin12' });
    const hashed = await bcrypt.hash('admin12', 10);
    await Faculty.create({
      facultyId: 'admin12', password: hashed, name: 'Admin',
      role: 'admin', email: 'admin@vignan.ac.in',
      department: 'Admin Office', designation: 'Administrator'
    });
    console.log('Admin account ready: admin12 / admin12');
  } catch (err) { console.error('Admin setup error:', err.message); }
}

app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
  setTimeout(ensureAdmin, 3000);
});
