/**
 * seed_crt_attendance.js
 * Populates crtPerformance and attendance for all students with realistic mock data.
 * Run: node backend/scripts/seed_crt_attendance.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const BRANCH_SUBJECTS = {
  CSE:  ['Data Structures','Algorithms','DBMS','OS','Computer Networks','OOP'],
  CSBS: ['Data Structures','Business Analytics','DBMS','Machine Learning','Statistics','OOP'],
  AIML: ['Machine Learning','Deep Learning','Python','Statistics','NLP','Computer Vision'],
  IT:   ['Data Structures','Web Technologies','DBMS','OS','Networking','OOP'],
  ECE:  ['Signals & Systems','VLSI','Embedded Systems','Communication','Electronics','Networks'],
  EEE:  ['Power Systems','Control Systems','Electrical Machines','Circuit Theory','Power Electronics','Signals'],
  MECH: ['Thermodynamics','Fluid Mechanics','Machine Design','Manufacturing','Engineering Mechanics','CAD/CAM'],
  CIVIL:['Structural Analysis','Geotechnical Engg','Fluid Mechanics','Surveying','Construction Management','Design of Structures'],
};
const DEFAULT_SUBJECTS = ['Mathematics','Physics','Chemistry','English','Programming','Engineering Drawing'];

const CRT_MODULES = ['Aptitude', 'Reasoning', 'Verbal Ability', 'Technical', 'Mock Interview', 'Group Discussion', 'Coding'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min, max, d = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }

function genCrt(currentYear) {
  const yr = parseInt(currentYear) || 1;
  const count = yr === 1 ? 4 : yr === 2 ? 5 : yr === 3 ? 6 : 7;
  const mods = CRT_MODULES.slice(0, count);
  return mods.map(module => ({
    module,
    score: rand(38, 96),
    maxScore: 100,
  }));
}

function genAttendance(branch, currentYear) {
  const subjects = BRANCH_SUBJECTS[branch] || DEFAULT_SUBJECTS;
  const yr = parseInt(currentYear) || 1;
  const total = yr <= 2 ? rand(70, 90) : rand(80, 100);
  return subjects.map(subject => ({
    subject,
    present: rand(Math.max(1, Math.floor(total * 0.55)), total),
    total,
  }));
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const students = await Student.find({ role: 'student' }).select('_id branch currentYear');
  console.log(`Found ${students.length} students — seeding CRT + Attendance data...`);

  let updated = 0;
  const BATCH = 500;
  for (let i = 0; i < students.length; i += BATCH) {
    const batch = students.slice(i, i + BATCH);
    const ops = batch.map(s => ({
      updateOne: {
        filter: { _id: s._id },
        update: {
          $set: {
            crtPerformance: genCrt(s.currentYear),
            attendance: genAttendance(s.branch, s.currentYear),
          }
        }
      }
    }));
    const result = await Student.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount;
    if ((i / BATCH) % 10 === 0) process.stdout.write(`  ${updated} updated...\r`);
  }

  console.log(`\n✅ Done. ${updated} / ${students.length} students seeded.`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
