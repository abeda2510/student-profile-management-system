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

// Proxy — fetches any Cloudinary file server-side and streams it (bypasses CORS)
// Available at both /proxy-pdf and /spm/proxy-pdf
const proxyHandler = async (req, res) => {
  const axios = require('axios');
  let { url } = req.query;
  if (!url || !url.startsWith('https://res.cloudinary.com'))
    return res.status(400).send('Invalid URL');
  url = url.replace('/fl_inline/', '/');
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const contentType = url.includes('/raw/upload/')
      ? 'application/pdf'
      : (response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="document.${contentType.includes('pdf') ? 'pdf' : contentType.includes('png') ? 'png' : 'jpg'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('proxy error:', err.response?.status, err.message);
    res.status(500).send('Failed: ' + err.message);
  }
};
app.get('/proxy-pdf', proxyHandler);
app.get('/spm/proxy-pdf', proxyHandler);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);
app.use('/spm/api/', limiter);

// Stricter limit on auth routes — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);
app.use('/spm/api/auth/', authLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/spm/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes — mounted on both /api and /spm/api
const routes = [
  ['/api/auth',                '/spm/api/auth',                require('./routes/auth')],
  ['/api/students',            '/spm/api/students',            require('./routes/students')],
  ['/api/documents',           '/spm/api/documents',           require('./routes/documents')],
  ['/api/achievements',        '/spm/api/achievements',        require('./routes/achievements')],
  ['/api/faculty',             '/spm/api/faculty',             require('./routes/faculty')],
  ['/api/faculty-achievements','/spm/api/faculty-achievements',require('./routes/facultyAchievements')],
  ['/api/dept-events',         '/spm/api/dept-events',         require('./routes/deptEvents')],
  ['/api/leetcode',            '/spm/api/leetcode',            require('./routes/leetcode')],
  ['/api/ai',                  '/spm/api/ai',                  require('./routes/ai')],
];
routes.forEach(([path1, path2, router]) => {
  app.use(path1, router);
  app.use(path2, router);
});

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
