const router = require('express').Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const Achievement = require('../models/Achievement');
const Document = require('../models/Document');

async function callGemini(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    },
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return data.choices?.[0]?.message?.content || 'No response';
}

// ── Chatbot ──────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    let context = '';
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).select('-password');
      const achievements = await Achievement.find({ student: req.user.id }).sort({ createdAt: -1 }).limit(10);
      const docs = await Document.find({ student: req.user.id });
      const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(student?.[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
      const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : student?.cgpa;
      context = `Student: ${student?.name}, Reg: ${student?.regNumber}, Branch: ${student?.branch}, Year: ${student?.currentYear}, Sem: ${student?.currentSemester}, CGPA: ${overallCgpa || 'N/A'}, Email: ${student?.email}, LeetCode: ${student?.leetCode || 'N/A'} (Solved: ${student?.leetCodeSolved || 0}), CodeChef: ${student?.codeChef || 'N/A'} (Rating: ${student?.codeChefRating || 0}), Achievements: ${achievements.map(a => a.title).join(', ') || 'None'}, Documents: ${docs.map(d => d.docType).join(', ') || 'None'}`;
    } else {
      context = `Faculty/Admin user at Vignan's University Student Management System.`;
    }

    const prompt = `You are an AI assistant for Vignan's University Student Management System.\nStudent context: ${context}\nUser question: ${message}\nAnswer helpfully and concisely.`;
    const reply = await callGemini(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI service error: ' + (err.response?.data?.error?.message || err.message) });
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

    const prompt = `Generate a professional resume for this student. Return JSON with: "summary" (2-3 sentences), "skills" (array of strings), "objective" (1 sentence). Student: Name=${student.name}, Branch=${student.branch}, CGPA=${overallCgpa}, LeetCode solved=${student.leetCodeSolved || 0}, CodeChef rating=${student.codeChefRating || 0}, Achievements=${achievements.map(a => a.title).join(', ') || 'None'}. Return only valid JSON, no markdown.`;
    
    let text = await callGemini(prompt);
    text = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    const aiData = JSON.parse(text);
    res.json(aiData);
  } catch (err) {
    console.error('AI resume error:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI resume error: ' + (err.response?.data?.error?.message || err.message) });
  }
});

module.exports = router;
