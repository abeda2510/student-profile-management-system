const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const https = require('https');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const otpStore = {};

const signToken = (user, type) =>
  jwt.sign(
    { id: user._id, regNumber: user.regNumber || user.facultyId, role: user.role, type },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendOTPEmail(to, otp, userName) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: { name: 'Student Management System', email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: 'Password Reset OTP',
      htmlContent: '<div style="font-family:sans-serif;padding:32px"><h2 style="color:#1e40af">Password Reset OTP</h2><p>Hi <strong>' + userName + '</strong>,</p><div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1e40af;text-align:center;padding:20px;background:#eff6ff;border-radius:8px;margin:20px 0">' + otp + '</div><p style="color:#64748b">Valid for 10 minutes.</p></div>',
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error('Brevo API error: ' + res.statusCode + ' ' + data));
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// One-time admin setup route
router.post('/setup-admin', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'vignan-setup-2026') return res.status(403).json({ message: 'Forbidden' });

    // Remove old admin from students
    await Student.deleteOne({ regNumber: '231FA04040' });

    // Remove existing admin12
    await Faculty.deleteOne({ facultyId: 'admin12' });

    // Create new admin in Faculty (pre('save') hook will hash the password)
    await Faculty.create({
      facultyId: 'admin12',
      password: 'admin12',
      name: 'Admin',
      role: 'admin',
      email: 'admin@vignan.ac.in',
      department: 'Admin Office',
      designation: 'Administrator'
    });
    res.json({ message: 'Admin setup complete. Login with facultyId: admin12, password: admin12' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/student/register', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ token: signToken(student, 'student'), role: 'student' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/student/login', async (req, res) => {
  const { regNumber, password } = req.body;
  const student = await Student.findOne({ regNumber });
  if (!student || !(await student.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  if (student.role === 'admin' || student.role === 'faculty')
    return res.status(403).json({ message: 'Please use Faculty login' });
  res.json({ token: signToken(student, student.role), role: student.role, regNumber: student.regNumber, name: student.name });
});

router.post('/faculty/login', async (req, res) => {
  const { facultyId, password } = req.body;
  const faculty = await Faculty.findOne({ facultyId });
  if (faculty && (await faculty.matchPassword(password))) {
    const role = faculty.role || 'faculty';
    return res.json({ token: signToken(faculty, 'faculty'), role, facultyId: faculty.facultyId, name: faculty.name });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

router.post('/forgot-password', async (req, res) => {
  const { id, userType } = req.body;
  let user = null, email = null, userName = null, userId = null, collection = null;

  if (userType === 'student') {
    user = await Student.findOne({ regNumber: id });
    if (user) { email = user.email; userName = user.name; userId = user._id; collection = 'student'; }
  } else {
    user = await Faculty.findOne({ facultyId: id });
    if (user) { email = user.email; userName = user.name; userId = user._id; collection = 'faculty'; }
    if (!user) {
      user = await Student.findOne({ regNumber: id, role: { $in: ['faculty', 'admin'] } });
      if (user) { email = user.email; userName = user.name; userId = user._id; collection = 'student'; }
    }
  }

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!email) return res.status(400).json({ message: 'No email registered for this account. Contact admin.' });

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000, userId, collection };

  try {
    await sendOTPEmail(email, otp, userName);
    const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
    res.json({ message: 'OTP sent', maskedEmail: masked });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ message: 'Email failed: ' + err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { id, userType, otp } = req.body;
  let user = null;
  if (userType === 'student') {
    user = await Student.findOne({ regNumber: id });
  } else {
    user = await Faculty.findOne({ facultyId: id });
    if (!user) user = await Student.findOne({ regNumber: id, role: 'faculty' });
  }
  if (!user || !user.email) return res.status(404).json({ message: 'User not found' });
  const record = otpStore[user.email];
  if (!record) return res.status(400).json({ message: 'No OTP requested. Please request again.' });
  if (Date.now() > record.expires) {
    delete otpStore[user.email];
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  const resetToken = jwt.sign({ email: user.email, userId: record.userId, collection: record.collection }, process.env.JWT_SECRET, { expiresIn: '15m' });
  delete otpStore[user.email];
  res.json({ message: 'OTP verified', resetToken });
});

router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ message: 'Reset token expired or invalid. Start over.' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  if (payload.collection === 'faculty') {
    await Faculty.findByIdAndUpdate(payload.userId, { password: hashed });
  } else {
    await Student.findByIdAndUpdate(payload.userId, { password: hashed });
  }
  res.json({ message: 'Password reset successfully' });
});

module.exports = router;
