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

// PDF/Image proxy — bypasses Cloudinary CORS
const proxyHandler = async (req, res) => {
  const axios = require('axios');
  let { url } = req.query;
  if (!url || !url.startsWith('https://res.cloudinary.com'))
    return res.status(400).send('Invalid URL');
  url = url.replace('/fl_inline/', '/');
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const contentType = url.includes('/raw/upload/') ? 'application/pdf' : (response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="document.${contentType.includes('pdf') ? 'pdf' : contentType.includes('png') ? 'png' : 'jpg'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('proxy error:', err.response?.status, err.message);
    res.status(500).send('Failed: ' + err.message);
  }
};
app.get('/spm/proxy-pdf', proxyHandler);

// Trust proxy (necessary if behind a reverse proxy/load balancer like Heroku, Render, Nginx, etc.)
app.set('trust proxy', 1);

// Rate limiting (adjusted limits to accommodate 150+ concurrent users/classrooms sharing a NAT IP)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests, please try again later.' } });
app.use('/spm/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { message: 'Too many login attempts, please try again later.' } });
app.use('/spm/auth/', authLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/spm/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/spm/auth',                require('./routes/auth'));
app.use('/spm/students',            require('./routes/students'));
app.use('/spm/documents',           require('./routes/documents'));
app.use('/spm/achievements',        require('./routes/achievements'));
app.use('/spm/faculty',             require('./routes/faculty'));
app.use('/spm/faculty-achievements',require('./routes/facultyAchievements'));
app.use('/spm/dept-events',         require('./routes/deptEvents'));
app.use('/spm/leetcode',            require('./routes/leetcode'));
app.use('/spm/ai',                  require('./routes/ai'));

// Multer file size error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File too large. Maximum allowed size is 2MB.' });
  next(err);
});

// Auto-create admin on startup
async function ensureAdmin() {
  try {
    const Faculty = require('./models/Faculty');
    await Faculty.deleteOne({ facultyId: 'admin12' });
    await Faculty.create({ facultyId: 'admin12', password: 'admin12', name: 'Admin', role: 'admin', email: 'admin@vignan.ac.in', department: 'Admin Office', designation: 'Administrator' });
    console.log('Admin account ready: admin12 / admin12');
  } catch (err) { console.error('Admin setup error:', err.message); }
}

app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
  setTimeout(ensureAdmin, 3000);
});
