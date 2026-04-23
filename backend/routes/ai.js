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
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048
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
      const semCgpa = [1,2,3,4,5,6,7,8].map(i => student?.[`sem${i}Cgpa`] ? `Sem${i}: ${student[`sem${i}Cgpa`]}` : null).filter(Boolean).join(', ');
      context = `Student Profile:
- Name: ${student?.name}
- Reg Number: ${student?.regNumber}
- Branch: ${student?.branch}, Section: ${student?.section}
- Year: ${student?.currentYear}, Semester: ${student?.currentSemester}
- Overall CGPA: ${overallCgpa || 'N/A'}
- Semester CGPAs: ${semCgpa || 'N/A'}
- Email: ${student?.email}, Phone: ${student?.phone}
- Gender: ${student?.gender}, DOB: ${student?.dob}
- Blood Group: ${student?.bloodGroup}, Nationality: ${student?.nationality}
- Address: ${student?.address}
- Parent Name: ${student?.parentName}, Parent Phone: ${student?.parentPhone}
- Admission Category: ${student?.admissionCategory}, Admission Year: ${student?.admissionYear}
- Counsellor: ${student?.counsellor || 'N/A'}
- LeetCode: ${student?.leetCode || 'N/A'} (Solved: ${student?.leetCodeSolved || 0}, Easy: ${student?.leetCodeEasy || 0}, Medium: ${student?.leetCodeMedium || 0}, Hard: ${student?.leetCodeHard || 0})
- CodeChef: ${student?.codeChef || 'N/A'} (Rating: ${student?.codeChefRating || 0}, Stars: ${student?.codeChefStars || 0})
- LinkedIn: ${student?.linkedIn || 'N/A'}
- 10th: ${student?.tenthSchool || 'N/A'}, ${student?.tenthBoard || ''}, ${student?.tenthYear || ''}, ${student?.tenthPercent || ''}%
- Inter: ${student?.interCollege || 'N/A'}, ${student?.interBoard || ''}, ${student?.interYear || ''}, ${student?.interPercent || ''}%
- Achievements (${achievements.length}): ${achievements.map(a => `${a.title} (${a.status})`).join(', ') || 'None'}
- Documents: ${docs.map(d => d.docType).join(', ') || 'None'}`;
    } else {
      // Faculty/Admin: load all students with full data
      const students = await Student.find({}).select('-password');
      const allAchievements = await Achievement.find({});
      context = `You are assisting a faculty/admin at Vignan's University. You have access to all ${students.length} students' data.\n\n`;
      context += students.map(s => {
        const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(s[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
        const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : s.cgpa;
        const semCgpa = [1,2,3,4,5,6,7,8].map(i => s[`sem${i}Cgpa`] ? `Sem${i}:${s[`sem${i}Cgpa`]}` : null).filter(Boolean).join(',');
        const stuAchievements = allAchievements.filter(a => a.student?.toString() === s._id.toString());
        return `[${s.regNumber}] ${s.name} | Branch:${s.branch} Sec:${s.section} Year:${s.currentYear} | CGPA:${overallCgpa || 'N/A'} (${semCgpa}) | Counsellor:${s.counsellor || 'N/A'} | LeetCode:${s.leetCodeSolved || 0} solved | CodeChef:${s.codeChefRating || 0} rating | Achievements:${stuAchievements.map(a=>a.title).join(',') || 'None'}`;
      }).join('\n');
    }

    const prompt = `You are an AI assistant for Vignan's University Student Management System. Answer ONLY using the data provided below. Do NOT guess, fabricate, or say "fetching" — if data is not in the context, say "I don't have that information".\n\nData:\n${context}\n\nUser question: ${message}\n\nAnswer directly and concisely using only the above data.`;
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
