  const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./db');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors());

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit on auth routes — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/faculty-achievements', require('./routes/facultyAchievements'));
app.use('/api/dept-events', require('./routes/deptEvents'));
app.use('/api/leetcode', require('./routes/leetcode'));
app.use('/api/ai', require('./routes/ai'));

// Multer file size error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum allowed size is 2MB.' });
  }
  next(err);
});

// Auto-create admin on startup
async function ensureAdmin() {
  try {
    const Faculty = require('./models/Faculty');
    // Delete and recreate — pre('save') hook will hash the password
    await Faculty.deleteOne({ facultyId: 'admin12' });
    await Faculty.create({
      facultyId: 'admin12', password: 'admin12', name: 'Admin',
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
