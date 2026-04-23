const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const Achievement = require('../models/Achievement');
const Document = require('../models/Document');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Chatbot ──────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    // Fetch context about the logged-in user
    let context = '';
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).select('-password');
      const achievements = await Achievement.find({ student: req.user.id }).sort({ createdAt: -1 }).limit(10);
      const docs = await Document.find({ student: req.user.id });
      context = `
Student Profile:
- Name: ${student?.name}
- Reg Number: ${student?.regNumber}
- Branch: ${student?.branch}, Section: ${student?.section}
- Current Year: ${student?.currentYear}, Semester: ${student?.currentSemester}
- CGPA: ${student?.cgpa || 'Not set'}
- Email: ${student?.email}, Phone: ${student?.phone}
- LeetCode: ${student?.leetCode || 'Not set'} (Solved: ${student?.leetCodeSolved || 0})
- CodeChef: ${student?.codeChef || 'Not set'} (Rating: ${student?.codeChefRating || 0})
- LinkedIn: ${student?.linkedIn || 'Not set'}
- Achievements (${achievements.length}): ${achievements.map(a => `${a.title} (${a.activityType}, ${a.academicYear})`).join(', ') || 'None'}
- Documents uploaded: ${docs.map(d => d.docType).join(', ') || 'None'}
`;
    } else {
      context = `You are an AI assistant for the Student Management System at Vignan's Foundation for Science, Technology & Research. You help faculty and admin users with student data, reports, and achievements.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are an AI assistant for a Student Management System at Vignan's University. 
${context}

User question: ${message}

Answer helpfully and concisely. If asked about data not available, say so politely.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ reply: text });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ message: 'AI service error: ' + err.message });
  }
});

// ── AI Resume Generator ──────────────────────────────────
router.post('/generate-resume', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const achievements = await Achievement.find({ student: req.user.id, status: 'APPROVED' }).sort({ createdAt: -1 });

    const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(student[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
    const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : student.cgpa;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Generate a professional resume summary and skills section for this student. Return JSON with keys: "summary" (2-3 sentences professional summary), "skills" (array of technical skills based on their profile), "objective" (1 sentence career objective).

Student Details:
- Name: ${student.name}
- Branch: ${student.branch}
- CGPA: ${overallCgpa || 'N/A'}
- LeetCode: ${student.leetCode || 'N/A'} (Solved: ${student.leetCodeSolved || 0}, Easy: ${student.leetCodeEasy || 0}, Medium: ${student.leetCodeMedium || 0}, Hard: ${student.leetCodeHard || 0})
- CodeChef: ${student.codeChef || 'N/A'} (Rating: ${student.codeChefRating || 0})
- LinkedIn: ${student.linkedIn || 'N/A'}
- Achievements: ${achievements.map(a => `${a.title} (${a.activityType})`).join(', ') || 'None'}
- Internships: ${achievements.filter(a => a.activityType === 'INTERNSHIP').map(a => a.title).join(', ') || 'None'}

Return only valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Strip markdown code blocks if present
    text = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const aiData = JSON.parse(text);
    res.json(aiData);
  } catch (err) {
    console.error('AI resume error:', err.message);
    res.status(500).json({ message: 'AI resume error: ' + err.message });
  }
});

module.exports = router;
