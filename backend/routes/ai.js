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

async function fetchLeetCodeStats(username) {
  try {
    const query = `{"query":"{ matchedUser(username: \\"${username}\\") { submitStats { acSubmissionNum { difficulty count } } } }"}`;
    const { data } = await axios.post('https://leetcode.com/graphql', JSON.parse(query), {
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      timeout: 8000
    });
    const stats = data?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
    const all = stats.find(s => s.difficulty === 'All')?.count || 0;
    const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    return { total: all, easy, medium, hard };
  } catch {
    return null;
  }
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
      // Faculty/Admin: smart context based on query
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findById(req.user.id).select('name');
      const facultyName = faculty?.name || '';
      const msgLower = message.toLowerCase();

      // Check if asking about a specific student (by name or reg number)
      const allStudents = await Student.find({}).select('name regNumber counsellor');
      const mentionedStudent = allStudents.find(s =>
        msgLower.includes(s.name.toLowerCase()) ||
        msgLower.includes(s.regNumber.toLowerCase())
      );

      if (mentionedStudent) {
        // Full data for that specific student
        const s = await Student.findById(mentionedStudent._id).select('-password');
        const achievements = await Achievement.find({ student: s._id });
        const docs = await Document.find({ student: s._id });
        const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(s[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
        const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : (s.cgpa || 'N/A');
        const semCgpa = [1,2,3,4,5,6,7,8].map(i => s[`sem${i}Cgpa`] ? `Sem${i}:${s[`sem${i}Cgpa`]}` : null).filter(Boolean).join(', ');

        // Fetch live LeetCode if asked
        let lcInfo = `LeetCode:${s.leetCode||'N/A'} | Solved:${s.leetCodeSolved||0} | Easy:${s.leetCodeEasy||0} | Medium:${s.leetCodeMedium||0} | Hard:${s.leetCodeHard||0}`;
        if (msgLower.includes('leetcode') && s.leetCode) {
          const live = await fetchLeetCodeStats(s.leetCode);
          if (live) lcInfo = `LeetCode:${s.leetCode} | Solved:${live.total} | Easy:${live.easy} | Medium:${live.medium} | Hard:${live.hard} (live data)`;
        }

        context = `Student Full Profile:
Name:${s.name} | Reg:${s.regNumber} | Branch:${s.branch} | Section:${s.section} | Year:${s.currentYear} | Sem:${s.currentSemester}
CGPA:${overallCgpa} | Sem CGPAs: ${semCgpa || 'N/A'}
Email:${s.email||'N/A'} | Phone:${s.phone||'N/A'} | Gender:${s.gender||'N/A'} | DOB:${s.dob||'N/A'}
Blood:${s.bloodGroup||'N/A'} | Nationality:${s.nationality||'N/A'} | Address:${s.address||'N/A'}
Parent:${s.parentName||'N/A'} | Parent Phone:${s.parentPhone||'N/A'}
Admission:${s.admissionCategory||'N/A'} | Year:${s.admissionYear||'N/A'} | Counsellor:${s.counsellor||'N/A'}
${lcInfo}
CodeChef:${s.codeChef||'N/A'} | Rating:${s.codeChefRating||0} | Stars:${s.codeChefStars||0}
LinkedIn:${s.linkedIn||'N/A'}
10th:${s.tenthSchool||'N/A'} ${s.tenthBoard||''} ${s.tenthYear||''} ${s.tenthPercent||''}%
Inter:${s.interCollege||'N/A'} ${s.interBoard||''} ${s.interYear||''} ${s.interPercent||''}%
Achievements:${achievements.map(a=>`${a.title}(${a.status})`).join(', ')||'None'}
Documents:${docs.map(d=>d.docType).join(', ')||'None'}`;
      } else {
        // General query — compact summary of counsellees only
        const counsellees = await Student.find({ counsellor: { $regex: facultyName, $options: 'i' } }).select('-password');
        const achMap = {};
        const allAch = await Achievement.find({ student: { $in: counsellees.map(s=>s._id) } }).select('student title status');
        allAch.forEach(a => { const k = a.student?.toString(); if(!achMap[k]) achMap[k]=[]; achMap[k].push(a.title); });

        // Fetch live LeetCode for all counsellees if asked
        let lcLiveMap = {};
        if (msgLower.includes('leetcode')) {
          await Promise.all(counsellees.filter(s=>s.leetCode).map(async s => {
            const live = await fetchLeetCodeStats(s.leetCode);
            if (live) lcLiveMap[s._id.toString()] = live;
          }));
        }

        const summarize = (s) => {
          const cgpaVals = [1,2,3,4,5,6,7,8].map(i => parseFloat(s[`sem${i}Cgpa`])).filter(v => !isNaN(v) && v > 0);
          const overallCgpa = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : (s.cgpa||'N/A');
          const semCgpa = [1,2,3,4,5,6,7,8].map(i => s[`sem${i}Cgpa`] ? `S${i}:${s[`sem${i}Cgpa`]}` : null).filter(Boolean).join(',');
          const ach = achMap[s._id.toString()]?.join(',') || 'None';
          const lc = lcLiveMap[s._id.toString()];
          const lcStr = lc ? `LeetCode:${s.leetCode}|LCSolved:${lc.total}|LCEasy:${lc.easy}|LCMed:${lc.medium}|LCHard:${lc.hard}(live)` : `LeetCode:${s.leetCode||'N/A'}|LCSolved:${s.leetCodeSolved||0}|LCEasy:${s.leetCodeEasy||0}|LCMed:${s.leetCodeMedium||0}|LCHard:${s.leetCodeHard||0}`;
          return `Reg:${s.regNumber}|Name:${s.name}|Branch:${s.branch||'N/A'}|Sec:${s.section||'N/A'}|Yr:${s.currentYear||'N/A'}|Sem:${s.currentSemester||'N/A'}|CGPA:${overallCgpa}|SemCGPA:${semCgpa||'N/A'}|Email:${s.email||'N/A'}|Phone:${s.phone||'N/A'}|Gender:${s.gender||'N/A'}|DOB:${s.dob||'N/A'}|Blood:${s.bloodGroup||'N/A'}|Parent:${s.parentName||'N/A'}|ParentPhone:${s.parentPhone||'N/A'}|Address:${s.address||'N/A'}|AdmCat:${s.admissionCategory||'N/A'}|AdmYr:${s.admissionYear||'N/A'}|${lcStr}|CodeChef:${s.codeChef||'N/A'}|CCRating:${s.codeChefRating||0}|CCStars:${s.codeChefStars||0}|LinkedIn:${s.linkedIn||'N/A'}|10th:${s.tenthSchool||'N/A'} ${s.tenthPercent||''}%|Inter:${s.interCollege||'N/A'} ${s.interPercent||''}%|Achievements:${ach}`;
        };
        context = `Faculty:${facultyName} | Counsellees(${counsellees.length}):\n${counsellees.map(summarize).join('\n')||'No counsellees found'}`;
      }
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

    // Fetch live LeetCode stats if username exists
    let lcSolved = student.leetCodeSolved || 0;
    let lcEasy = student.leetCodeEasy || 0, lcMedium = student.leetCodeMedium || 0, lcHard = student.leetCodeHard || 0;
    if (student.leetCode) {
      const live = await fetchLeetCodeStats(student.leetCode);
      if (live) { lcSolved = live.total; lcEasy = live.easy; lcMedium = live.medium; lcHard = live.hard; }
    }

    const prompt = `Generate an ATS-optimized resume JSON for a student. Return ONLY valid JSON, no markdown, no extra text.

Student data:
- Name: ${student.name}
- Branch: ${student.branch}, Section: ${student.section}
- Year: ${student.currentYear}, Semester: ${student.currentSemester}
- CGPA: ${overallCgpa}
- Email: ${student.email || ''}, Phone: ${student.phone || ''}
- LinkedIn: ${student.linkedIn || ''}
- LeetCode: ${student.leetCode || ''} (Solved: ${lcSolved}, Easy: ${lcEasy}, Medium: ${lcMedium}, Hard: ${lcHard})
- CodeChef: ${student.codeChef || ''} (Rating: ${student.codeChefRating || 0}, Stars: ${student.codeChefStars || 0})
- 10th: ${student.tenthSchool || ''} ${student.tenthBoard || ''} ${student.tenthYear || ''} ${student.tenthPercent || ''}%
- Inter: ${student.interCollege || ''} ${student.interBoard || ''} ${student.interYear || ''} ${student.interPercent || ''}%
- Achievements: ${achievements.map(a => a.title).join(', ') || 'None'}

Return this exact JSON structure (no markdown, pure JSON):
{
  "summary": "2-3 sentence professional summary with ATS keywords based on branch",
  "technicalSkillGroups": [
    {"category": "Programming Languages", "items": "list relevant languages for ${student.branch}"},
    {"category": "Web Technologies", "items": "relevant web tech"},
    {"category": "Database Management", "items": "relevant databases"},
    {"category": "Tools & Platforms", "items": "Git, VS Code and relevant tools"}
  ],
  "education": [
    {"degree": "Bachelor of Technology in ${student.branch}", "institution": "Vignan's University", "year": "${student.admissionYear || '2022'} - Present", "cgpa": "${overallCgpa}"},
    {"degree": "Intermediate (${student.interGroup || 'MPC'})", "institution": "${student.interCollege || 'N/A'}", "year": "${student.interYear || ''}", "percentage": "${student.interPercent || ''}%"},
    {"degree": "SSC", "institution": "${student.tenthSchool || 'N/A'}", "year": "${student.tenthYear || ''}", "percentage": "${student.tenthPercent || ''}%"}
  ],
  "projects": [
    {"name": "Project name relevant to ${student.branch}", "duration": "MM/YYYY - MM/YYYY", "points": ["Technologies Used: relevant tech stack", "Developed feature using technology to achieve objective", "Implemented functionality resulting in outcome"]}
  ],
  "certifications": ${achievements.length > 0 ? JSON.stringify(achievements.filter(a=>a.title.toLowerCase().includes('certif') || a.title.toLowerCase().includes('course')).map(a=>a.title)) : '["Add relevant certifications here"]'},
  "achievements": ${JSON.stringify(achievements.map(a=>a.title))},
  "codingProfiles": {"leetcode": "${student.leetCode || ''}", "leetcodeSolved": ${lcSolved}, "codechef": "${student.codeChef || ''}", "codechefRating": ${student.codeChefRating || 0}},
  "skills": ["skill1","skill2","skill3","skill4","skill5","skill6"]
}`;

    let text = await callGemini(prompt);
    // Strip any markdown code blocks
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    // Extract JSON object if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');
    const aiData = JSON.parse(jsonMatch[0]);
    res.json(aiData);
  } catch (err) {
    console.error('AI resume error:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI resume error: ' + (err.response?.data?.error?.message || err.message) });
  }
});

module.exports = router;
