const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// In-memory OTP store: { email: { otp, expires, userId, userType } }
const otpStore = {};

const signToken = (user, type) =>
  jwt.sign(
    { id: user._id, regNumber: user.regNumber || user.facultyId, role: user.role, type },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(to, otp, name) {
  await transporter.sendMail({
    from: `"Student Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#1e40af;margin-bottom:8px">Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your OTP for password reset is:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1e40af;text-align:center;padding:20px;background:#eff6ff;border-radius:8px;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Vignan's Foundation for Science, Technology & Research</p>
      </div>
    `,
  });
}

// ─── STUDENT LOGIN ───────────────────────────────────────
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
  res.json({
    token: signToken(student, student.role),
    role: student.role,
    regNumber: student.regNumber,
    name: student.name,
  });
});

// ─── FACULTY LOGIN ───────────────────────────────────────
router.post('/faculty/login', async (req, res) => {
  const { facultyId, password } = req.body;
  const faculty = await Faculty.findOne({ facultyId });
  if (faculty && (await faculty.matchPassword(password))) {
    return res.json({ token: signToken(faculty, 'faculty'), role: 'faculty', facultyId: faculty.facultyId, name: faculty.name });
  }
  const student = await Student.findOne({ regNumber: facultyId });
  if (student && (await student.matchPassword(password))) {
    return res.json({ token: signToken(student, 'faculty'), role: 'faculty', regNumber: student.regNumber, facultyId: student.regNumber, name: student.name });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// ─── FORGOT PASSWORD — send OTP ──────────────────────────
// POST /api/auth/forgot-password
// body: { id, userType: 'student' | 'faculty' }
router.post('/forgot-password', async (req, res) => {
  const { id, userType } = req.body;
  let user = null;
  let email = null;
  let name = null;
  let userId = null;
  let collection = null;

  if (userType === 'student') {
    user = await Student.findOne({ regNumber: id });
    if (user) { email = user.email; name = user.name; userId = user._id; collection = 'student'; }
  } else {
    user = await Faculty.findOne({ facultyId: id });
    if (user) { email = user.email; name = user.name; userId = user._id; collection = 'faculty'; }
    if (!user) {
      user = await Student.findOne({ regNumber: id, role: 'faculty' });
      if (user) { email = user.email; name = user.name; userId = user._id; collection = 'student'; }
    }
  }

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!email) return res.status(400).json({ message: 'No email registered for this account. Contact admin.' });

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000, userId, collection };

  try {
    await sendOTPEmail(email, otp, name);
    // Return masked email e.g. sr***@gmail.com
    const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
    res.json({ message: 'OTP sent', maskedEmail: masked });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP email. Check server email config.' });
  }
});

// ─── VERIFY OTP ──────────────────────────────────────────
// POST /api/auth/verify-otp
// body: { id, userType, otp }
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

  // OTP valid — issue a short-lived reset token
  const resetToken = jwt.sign({ email: user.email, userId: record.userId, collection: record.collection }, process.env.JWT_SECRET, { expiresIn: '15m' });
  delete otpStore[user.email];
  res.json({ message: 'OTP verified', resetToken });
});

// ─── RESET PASSWORD ──────────────────────────────────────
// POST /api/auth/reset-password
// body: { resetToken, newPassword }
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
