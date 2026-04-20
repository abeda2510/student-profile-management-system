const router = require('express').Router();
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

// Get own profile
router.get('/me', protect, async (req, res) => {
  const student = await Student.findById(req.user.id).select('-password');
  res.json(student);
});

// Update own profile
router.put('/me', protect, async (req, res) => {
  try {
    const { password, role, _id, __v, createdAt, updatedAt, ...updates } = req.body;
    // cast numeric fields
    if (updates.cgpa !== undefined && updates.cgpa !== '') updates.cgpa = parseFloat(updates.cgpa);
    else if (updates.cgpa === '') delete updates.cgpa;
    if (updates.admissionYear) updates.admissionYear = parseInt(updates.admissionYear);
    if (updates.currentYear) updates.currentYear = parseInt(updates.currentYear);
    if (updates.currentSemester) updates.currentSemester = parseInt(updates.currentSemester);
    if (updates.tenthYear) updates.tenthYear = parseInt(updates.tenthYear);
    if (updates.tenthPercent) updates.tenthPercent = parseFloat(updates.tenthPercent);
    if (updates.interYear) updates.interYear = parseInt(updates.interYear);
    if (updates.interPercent) updates.interPercent = parseFloat(updates.interPercent);
    const student = await Student.findByIdAndUpdate(
      req.user.id, { $set: updates }, { new: true, runValidators: false }
    ).select('-password');
    res.json(student);
  } catch (err) {
    console.error('PUT /students/me error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Student profile PDF — resume style
router.get('/profile-pdf/:regNumber', protect, async (req, res) => {
  try {
    const { regNumber } = req.params;
    if (req.user.role === 'student' && req.user.regNumber !== regNumber)
      return res.status(403).json({ message: 'Forbidden' });
    const student = await Student.findOne({ regNumber }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const Achievement = require('../models/Achievement');
    const [achievements] = await Promise.all([
      Achievement.find({ regNumber, status: 'APPROVED' }).sort({ createdAt: -1 }),
    ]);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 55, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${regNumber}_resume.pdf"`);
    doc.pipe(res);

    const L = 55, R = 540, W = R - L;
    let y = 55;

    const checkPage = (need = 50) => {
      if (y + need > 800) { doc.addPage(); y = 55; }
    };

    // ── section heading: bold + underline ──────────────────
    const heading = (title) => {
      checkPage(30);
      y += 6;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(title, L, y);
      const tw = doc.widthOfString(title);
      doc.moveTo(L, y + 13).lineTo(R, y + 13).strokeColor('#000000').lineWidth(0.8).stroke();
      y += 18;
    };

    // ── bullet line ────────────────────────────────────────
    const bullet = (text, indent = 10) => {
      checkPage(16);
      doc.fontSize(9.5).font('Helvetica').fillColor('#000000')
        .text(`\u2022  ${text}`, L + indent, y, { width: W - indent });
      y += doc.heightOfString(`\u2022  ${text}`, { width: W - indent }) + 3;
    };

    // ── entry with right-aligned date ──────────────────────
    const entryHeader = (left, right) => {
      checkPage(16);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(left, L, y, { width: W - 100, continued: false });
      doc.fontSize(9.5).font('Helvetica').fillColor('#000000').text(right || '', L, y, { width: W, align: 'right' });
      y += 14;
    };

    const subLine = (text) => {
      checkPage(14);
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#333333').text(text, L, y, { width: W });
      y += 13;
    };

    const normalLine = (text) => {
      checkPage(14);
      doc.fontSize(9.5).font('Helvetica').fillColor('#000000').text(text, L, y, { width: W });
      y += 13;
    };

    // ════════════════════════════════════════════════════════
    // HEADER — Name + contact
    // ════════════════════════════════════════════════════════
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000')
      .text((student.name || 'STUDENT NAME').toUpperCase(), L, y, { width: W, align: 'center' });
    y += 22;

    const contactParts = [
      student.phone,
      student.email,
      student.address ? student.address.split(',').slice(-2).join(',').trim() : null,
      student.linkedIn ? 'LinkedIn' : null,
      student.leetCode ? `LeetCode: ${student.leetCode}` : null,
    ].filter(Boolean);
    doc.fontSize(9.5).font('Helvetica').fillColor('#000000')
      .text(contactParts.join('  |  '), L, y, { width: W, align: 'center' });
    y += 14;
    doc.moveTo(L, y).lineTo(R, y).strokeColor('#000000').lineWidth(0.8).stroke();
    y += 10;

    // ════════════════════════════════════════════════════════
    // EDUCATION
    // ════════════════════════════════════════════════════════
    heading('Education');

    // B.Tech
    const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(student[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : student.cgpa;
    entryHeader(
      `Bachelor of Technology in ${student.branch || '[Branch]'}`,
      `${student.admissionYear || 'MM/YYYY'} – Present`
    );
    subLine(`Vignan's Foundation for Science, Technology & Research (Deemed University)${overallCgpa ? `  CGPA: ${overallCgpa}/10.0` : ''}`);
    y += 4;

    // Intermediate
    if (student.interCollege || student.interPercent) {
      entryHeader(
        `12th / Intermediate${student.interGroup ? ' (' + student.interGroup + ')' : ''}`,
        student.interYear ? `${student.interYear}` : ''
      );
      subLine(`${student.interCollege || '[College]'}${student.interBoard ? ', ' + student.interBoard : ''}${student.interPercent ? '  |  ' + student.interPercent + '%' : ''}`);
      y += 4;
    }

    // 10th
    if (student.tenthSchool || student.tenthPercent) {
      entryHeader('10th Standard', student.tenthYear ? `${student.tenthYear}` : '');
      subLine(`${student.tenthSchool || '[School]'}${student.tenthBoard ? ', ' + student.tenthBoard : ''}${student.tenthPercent ? '  |  ' + student.tenthPercent + '%' : ''}`);
      y += 4;
    }

    // ════════════════════════════════════════════════════════
    // TECHNICAL SKILLS / CODING PROFILES
    // ════════════════════════════════════════════════════════
    if (student.linkedIn || student.leetCode || student.codeChef) {
      checkPage(50);
      heading('Technical Profiles');
      if (student.leetCode) {
        const lc = `LeetCode: leetcode.com/${student.leetCode}` +
          (student.leetCodeSolved != null ? `  |  Solved: ${student.leetCodeSolved}` +
            (student.leetCodeEasy != null ? ` (Easy: ${student.leetCodeEasy}, Medium: ${student.leetCodeMedium}, Hard: ${student.leetCodeHard})` : '') : '');
        bullet(lc);
      }
      if (student.codeChef) {
        const cc = `CodeChef: codechef.com/users/${student.codeChef}` +
          (student.codeChefRating != null ? `  |  Rating: ${student.codeChefRating}${student.codeChefStars ? ', Stars: ' + student.codeChefStars : ''}` : '');
        bullet(cc);
      }
      if (student.linkedIn) bullet(`LinkedIn: ${student.linkedIn}`);
      y += 4;
    }

    // ════════════════════════════════════════════════════════
    // INTERNSHIP EXPERIENCE
    // ════════════════════════════════════════════════════════
    const internships = achievements.filter(a => a.activityType === 'INTERNSHIP');
    if (internships.length > 0) {
      heading('Internship Experience');
      internships.forEach(a => {
        entryHeader(a.title, a.academicYear || '');
        if (a.description) subLine(a.description);
        if (a.position) bullet(`Role: ${a.position}`);
        y += 4;
      });
    }

    // ════════════════════════════════════════════════════════
    // CERTIFICATIONS
    // ════════════════════════════════════════════════════════
    const certs = achievements.filter(a => a.activityType === 'CERTIFICATION' || a.activityType === 'ONLINE_COURSE');
    if (certs.length > 0) {
      heading('Certifications');
      certs.forEach(a => {
        bullet(`${a.title}${a.academicYear ? '  (' + a.academicYear + ')' : ''}${a.position ? '  —  ' + a.position : ''}`);
      });
      y += 4;
    }

    // ════════════════════════════════════════════════════════
    // ACADEMIC ACHIEVEMENTS & ACTIVITIES
    // ════════════════════════════════════════════════════════
    const others = achievements.filter(a => !['INTERNSHIP','CERTIFICATION','ONLINE_COURSE'].includes(a.activityType));
    if (others.length > 0) {
      heading('Academic Achievements & Activities');
      others.forEach(a => {
        bullet(`${a.title}${a.activityType ? '  [' + a.activityType.replace(/_/g,' ') + ']' : ''}${a.academicYear ? '  (' + a.academicYear + ')' : ''}${a.position ? '  |  ' + a.position : ''}`);
      });
      y += 4;
    }

    // ════════════════════════════════════════════════════════
    // SEMESTER CGPA TABLE
    // ════════════════════════════════════════════════════════
    const semData = [];
    for (let s = 1; s <= 8; s++) {
      const c = student[`sem${s}Cgpa`], g = student[`sem${s}Sgpa`];
      if (c != null || g != null) semData.push({ sem: s, cgpa: c, sgpa: g });
    }
    if (semData.length > 0) {
      checkPage(semData.length * 14 + 40);
      heading('Semester-wise Academic Performance');
      const cols = [80, 80, 80];
      const tx = L;
      // header
      doc.rect(tx, y, 240, 15).fill('#1e40af');
      ['Semester','CGPA','SGPA'].forEach((h, i) => {
        doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold')
          .text(h, tx + cols.slice(0,i).reduce((a,b)=>a+b,0) + 4, y + 3, { width: cols[i] });
      });
      y += 15;
      semData.forEach((row, i) => {
        doc.rect(tx, y, 240, 13).fill(i % 2 === 0 ? '#f8fafc' : '#fff');
        const vals = [`Semester ${row.sem}`, row.cgpa != null ? String(row.cgpa) : '—', row.sgpa != null ? String(row.sgpa) : '—'];
        vals.forEach((v, j) => {
          doc.fillColor('#000').fontSize(8.5).font('Helvetica')
            .text(v, tx + cols.slice(0,j).reduce((a,b)=>a+b,0) + 4, y + 2, { width: cols[j] });
        });
        y += 13;
      });
      if (overallCgpa) {
        doc.rect(tx, y, 240, 14).fill('#1e3a8a');
        doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text('Overall CGPA', tx + 4, y + 3, { width: 76 });
        doc.text(String(overallCgpa), tx + 84, y + 3, { width: 76 });
        y += 14;
      }
      y += 8;
    }

    // ════════════════════════════════════════════════════════
    // PERSONAL DETAILS (compact, at bottom)
    // ════════════════════════════════════════════════════════
    checkPage(60);
    heading('Personal Details');
    const personal = [
      ['Reg. Number', student.regNumber], ['Date of Birth', student.dob],
      ['Gender', student.gender], ['Blood Group', student.bloodGroup],
      ['Nationality', student.nationality], ['Admission Category', student.admissionCategory],
      ['APAAR ID', student.apaarId], ['ABC ID', student.abcId],
      ['Counsellor', student.counsellor],
    ].filter(([,v]) => v);
    for (let i = 0; i < personal.length; i += 2) {
      checkPage(14);
      const [l1, v1] = personal[i];
      const [l2, v2] = personal[i+1] || [];
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(l1 + ':', L, y, { width: 90, continued: false });
      doc.font('Helvetica').fillColor('#000').text(String(v1), L + 95, y, { width: W/2 - 95 });
      if (l2) {
        doc.font('Helvetica-Bold').fillColor('#333').text(l2 + ':', L + W/2, y, { width: 90 });
        doc.font('Helvetica').fillColor('#000').text(String(v2), L + W/2 + 95, y, { width: W/2 - 95 });
      }
      y += 14;
    }

    // ── footer ─────────────────────────────────────────────
    doc.fontSize(7.5).font('Helvetica').fillColor('#888888')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}  ·  Vignan's Foundation for Science, Technology & Research`, L, 820, { width: W, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// Admin: search by reg number
router.get('/search/:regNumber', protect, adminOnly, async (req, res) => {
  const student = await Student.findOne({ regNumber: req.params.regNumber }).select('-password');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// Admin: list all students
router.get('/', protect, adminOnly, async (req, res) => {
  const students = await Student.find().select('-password').sort({ createdAt: -1 });
  res.json(students);
});

// Admin: bulk assign counsellors from Excel/CSV
router.post('/bulk-counsellor', protect, adminOnly, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const multer = require('multer');
    const upload = multer({ storage: multer.memoryStorage() });

    // Parse uploaded file from req (already handled by multer middleware below)
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ message: 'Invalid data' });

    let updated = 0, notFound = 0;
    for (const row of rows) {
      const regNumber = String(row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] || '').trim();
      const counsellor = String(row.counsellor || row.Counsellor || row['Counsellor Name'] || '').trim();
      if (!regNumber || !counsellor) continue;
      const result = await Student.updateOne({ regNumber }, { $set: { counsellor } });
      if (result.matchedCount > 0) updated++;
      else notFound++;
    }
    res.json({ message: `Updated ${updated} students. ${notFound} not found.`, updated, notFound });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: upload Excel/CSV for counsellor assignment (file upload)
router.post('/bulk-counsellor-file', protect, adminOnly, (req, res) => {
  const XLSX = require('xlsx');
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() }).single('file');

  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: 'File upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      let updated = 0, notFound = 0;
      for (const row of rows) {
        const regNumber = String(row.regNumber || row.RegNumber || row['Reg Number'] || row['reg_number'] || '').trim();
        const counsellor = String(row.counsellor || row.Counsellor || row['Counsellor Name'] || row['counsellor_name'] || '').trim();
        if (!regNumber || !counsellor) continue;
        const result = await Student.updateOne({ regNumber }, { $set: { counsellor } });
        if (result.matchedCount > 0) updated++;
        else notFound++;
      }
      res.json({ message: `Updated ${updated} students. ${notFound} reg numbers not found.`, updated, notFound });
    } catch (err) {
      res.status(500).json({ message: 'Failed to parse file: ' + err.message });
    }
  });
});

// Admin: assign counsellor to specific students
router.post('/assign-counsellor', protect, adminOnly, async (req, res) => {
  try {
    const { regNumbers, counsellor } = req.body;
    if (!regNumbers || !counsellor) return res.status(400).json({ message: 'regNumbers and counsellor required' });
    const result = await Student.updateMany({ regNumber: { $in: regNumbers } }, { $set: { counsellor } });
    res.json({ message: `Assigned ${counsellor} to ${result.modifiedCount} students` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
