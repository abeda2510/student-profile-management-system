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

// Student profile PDF — accessible by student (own) or faculty/admin (any)
router.get('/profile-pdf/:regNumber', protect, async (req, res) => {
  try {
    const { regNumber } = req.params;
    if (req.user.role === 'student' && req.user.regNumber !== regNumber)
      return res.status(403).json({ message: 'Forbidden' });
    const student = await Student.findOne({ regNumber }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const Achievement = require('../models/Achievement');
    const Document = require('../models/Document');
    const [achievements, documents] = await Promise.all([
      Achievement.find({ regNumber, status: 'APPROVED' }).sort({ createdAt: -1 }),
      Document.find({ regNumber }).sort({ createdAt: -1 }),
    ]);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${regNumber}_profile.pdf"`);
    doc.pipe(res);

    const W = 495;
    const blue = '#1e40af';
    const gray = '#64748b';
    const light = '#f1f5f9';

    // ── HEADER ──────────────────────────────────────────────
    doc.rect(50, 50, W, 110).fill('#1e3a8a');
    doc.fillColor('#fff')
      .fontSize(10).font('Helvetica').text("VIGNAN'S FOUNDATION FOR SCIENCE, TECHNOLOGY & RESEARCH", 50, 62, { width: W, align: 'center' })
      .fontSize(8).text('(Deemed to be University) · Estd. u/s 3 of UGC Act 1956', 50, 76, { width: W, align: 'center' });
    doc.moveTo(70, 90).lineTo(W + 30, 90).strokeColor('#93c5fd').lineWidth(0.5).stroke();
    doc.fontSize(18).font('Helvetica-Bold').text('STUDENT PROFILE REPORT', 50, 96, { width: W, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text(student.name || '—', 50, 118, { width: W, align: 'center' });
    doc.fillColor('#93c5fd').fontSize(9).font('Helvetica')
      .text(`${student.branch || '—'} | Year ${student.currentYear || '—'} | Section ${student.section || '—'} | Sem ${student.currentSemester || '—'}`, 50, 136, { width: W, align: 'center' });

    let y = 175;

    const sectionTitle = (title) => {
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      y += 8;
      doc.rect(50, y, W, 18).fill(blue);
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text(title.toUpperCase(), 56, y + 5);
      y += 26;
      doc.fillColor('#0f172a');
    };

    const row2col = (label1, val1, label2, val2) => {
      const half = W / 2 - 10;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(gray).text(label1, 50, y, { width: 90 });
      doc.font('Helvetica').fillColor('#0f172a').text(String(val1 || '—'), 145, y, { width: half - 95 });
      if (label2) {
        doc.font('Helvetica-Bold').fillColor(gray).text(label2, 300, y, { width: 90 });
        doc.font('Helvetica').fillColor('#0f172a').text(String(val2 || '—'), 395, y, { width: half - 95 });
      }
      y += 16;
    };

    const row1col = (label, val) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(gray).text(label, 50, y, { width: 120 });
      doc.font('Helvetica').fillColor('#0f172a').text(String(val || '—'), 145, y, { width: W - 95 });
      y += 16;
    };

    const checkPage = (needed = 60) => {
      if (y + needed > 780) { doc.addPage(); y = 50; }
    };

    // ── IDENTITY STRIP ───────────────────────────────────────
    doc.rect(50, y, W, 28).fill(light);
    doc.fillColor(blue).fontSize(9).font('Helvetica-Bold').text('Reg. No:', 56, y + 9);
    doc.fillColor('#0f172a').font('Helvetica').text(student.regNumber || '—', 110, y + 9);
    doc.fillColor(blue).font('Helvetica-Bold').text('Email:', 230, y + 9);
    doc.fillColor('#0f172a').font('Helvetica').text(student.email || '—', 265, y + 9, { width: 200 });
    y += 36;
    doc.rect(50, y - 8, W, 20).fill(light);
    doc.fillColor(blue).fontSize(9).font('Helvetica-Bold').text('Phone:', 56, y - 2);
    doc.fillColor('#0f172a').font('Helvetica').text(student.phone || '—', 100, y - 2);
    doc.fillColor(blue).font('Helvetica-Bold').text('Counsellor:', 230, y - 2);
    doc.fillColor('#0f172a').font('Helvetica').text(student.counsellor || '—', 295, y - 2);
    y += 20;

    // ── PERSONAL DETAILS ─────────────────────────────────────
    sectionTitle('Personal Details');
    row2col('Date of Birth', student.dob, 'Gender', student.gender);
    row2col('Blood Group', student.bloodGroup, 'Nationality', student.nationality);
    row2col('Religion', student.religion, 'Caste / Category', student.caste);
    row1col('Address', student.address ? student.address.trim() : null);
    row2col('Parent Name', student.parentName, 'Parent Phone', student.parentPhone);
    y += 4;

    // ── ACADEMIC DETAILS ─────────────────────────────────────
    checkPage(80);
    sectionTitle('Academic Details');
    row2col('Admission Category', student.admissionCategory, 'Admission Year', student.admissionYear);
    row2col('Branch', student.branch, 'Current Year', student.currentYear);
    row2col('Current Semester', student.currentSemester, 'CGPA', student.cgpa);
    row2col('APAAR ID', student.apaarId, 'ABC ID', student.abcId);
    y += 4;

    // ── EDUCATION ────────────────────────────────────────────
    checkPage(80);
    sectionTitle('Education History');
    if (student.tenthSchool || student.tenthPercent) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(blue).text('10th Standard', 50, y); y += 14;
      row2col('School', student.tenthSchool, 'Board', student.tenthBoard);
      row2col('Year', student.tenthYear, 'Percentage', student.tenthPercent ? student.tenthPercent + '%' : null);
      y += 4;
    }
    if (student.interCollege || student.interPercent) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(blue).text('12th / Intermediate', 50, y); y += 14;
      row2col('College', student.interCollege, 'Board', student.interBoard);
      row2col('Group', student.interGroup, 'Year', student.interYear);
      row1col('Percentage', student.interPercent ? student.interPercent + '%' : null);
      y += 4;
    }

    // ── SEMESTER CGPA TABLE ───────────────────────────────────
    checkPage(100);
    sectionTitle('Semester-wise CGPA / SGPA');
    const colW = [60, 80, 80];
    const tableX = 50;
    doc.rect(tableX, y, 220, 16).fill(blue);
    let cx = tableX + 4;
    ['Sem','CGPA','SGPA'].forEach((h, i) => {
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold').text(h, cx, y + 4, { width: colW[i] });
      cx += colW[i];
    });
    y += 16;
    let overallCgpa = null;
    for (let s = 1; s <= 8; s++) {
      const cgpa = student[`sem${s}Cgpa`];
      const sgpa = student[`sem${s}Sgpa`];
      if (cgpa == null && sgpa == null) continue;
      if (cgpa != null) overallCgpa = cgpa;
      doc.rect(tableX, y, 220, 14).fill(s % 2 === 0 ? light : '#fff');
      cx = tableX + 4;
      [`Semester ${s}`, cgpa != null ? String(cgpa) : '—', sgpa != null ? String(sgpa) : '—'].forEach((v, i) => {
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica').text(v, cx, y + 3, { width: colW[i] });
        cx += colW[i];
      });
      y += 14;
    }
    if (overallCgpa != null) {
      doc.rect(tableX, y, 220, 16).fill('#1e3a8a');
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold').text('Overall CGPA', tableX + 4, y + 4, { width: 60 });
      doc.text(String(overallCgpa), tableX + 64, y + 4, { width: 80 });
      y += 16;
    }
    y += 8;

    // ── ACHIEVEMENTS ─────────────────────────────────────────
    if (achievements.length > 0) {
      checkPage(60);
      sectionTitle('Achievements & Certifications');
      const groups = {};
      achievements.forEach(a => { const t = a.activityType || 'OTHER'; if (!groups[t]) groups[t] = []; groups[t].push(a); });
      for (const [type, items] of Object.entries(groups)) {
        checkPage(30);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(blue).text(type.replace(/_/g, ' '), 50, y); y += 14;
        items.forEach(a => {
          checkPage(24);
          const certUrl = a.certificateUrl || a.certificatePath || '';
          const label = `• ${a.title}${a.academicYear ? '  (' + a.academicYear + ')' : ''}${a.position ? '  |  ' + a.position : ''}`;
          doc.fontSize(8).font('Helvetica').fillColor('#0f172a').text(label, 58, y, { width: W - 80 });
          if (certUrl && certUrl.startsWith('http')) {
            doc.fontSize(7.5).font('Helvetica').fillColor('#1e40af')
              .text('View Certificate', 400, y, { width: 90, link: certUrl, underline: true });
          }
          y += 14;
        });
        y += 4;
      }
    }

    // ── DOCUMENTS ────────────────────────────────────────────
    if (documents.length > 0) {
      checkPage(60);
      sectionTitle('Uploaded Documents');
      documents.forEach(d => {
        checkPage(16);
        const fileUrl = d.fileUrl || d.filepath || '';
        doc.fontSize(8).font('Helvetica-Bold').fillColor(gray).text(d.docType || '', 50, y, { width: 130 });
        doc.font('Helvetica').fillColor('#0f172a').text(d.label || d.filename || '—', 185, y, { width: W - 235 });
        if (fileUrl && fileUrl.startsWith('http')) {
          doc.fontSize(7.5).font('Helvetica').fillColor('#1e40af')
            .text('Open', 420, y, { width: 60, link: fileUrl, underline: true });
        }
        y += 14;
      });
      y += 4;
    }

    // ── CODING PROFILES ──────────────────────────────────────
    if (student.linkedIn || student.leetCode || student.codeChef) {
      checkPage(60);
      sectionTitle('Coding & Professional Profiles');

      const linkRow = (label, displayText, url) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(gray).text(label, 50, y, { width: 120 });
        doc.font('Helvetica').fillColor('#1e40af').text(displayText, 175, y, { width: W - 125, link: url, underline: true });
        y += 16;
      };

      if (student.linkedIn) linkRow('LinkedIn', student.linkedIn, student.linkedIn.startsWith('http') ? student.linkedIn : 'https://' + student.linkedIn);
      if (student.leetCode) {
        const url = `https://leetcode.com/${student.leetCode}`;
        const display = url + (student.leetCodeSolved != null ? `  |  Solved: ${student.leetCodeSolved}` : '');
        linkRow('LeetCode', display, url);
      }
      if (student.codeChef) {
        const url = `https://www.codechef.com/users/${student.codeChef}`;
        const display = url + (student.codeChefRating != null ? `  |  Rating: ${student.codeChefRating}` : '');
        linkRow('CodeChef', display, url);
      }
    }

    // ── FOOTER ───────────────────────────────────────────────
    const footerY = 810;
    doc.moveTo(50, footerY - 8).lineTo(545, footerY - 8).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.fontSize(7).font('Helvetica').fillColor(gray)
      .text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, footerY, { width: W / 2 })
      .text("Vignan's Foundation for Science, Technology & Research · Deemed to be University", 50, footerY, { width: W, align: 'right' });

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
