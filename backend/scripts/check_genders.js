const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');

setTimeout(async () => {
  try {
    console.log('Fetching all student records...');
    const students = await Student.find({ role: 'student' }).select('regNumber name gender').lean();
    console.log(`Total students in DB: ${students.length}`);

    const stats = {
      male: 0,
      female: 0,
      emptyOrNull: 0,
      others: {}
    };

    students.forEach(s => {
      const g = s.gender;
      if (!g || g.trim() === '') {
        stats.emptyOrNull++;
      } else {
        const norm = g.trim().toLowerCase();
        if (norm === 'male') {
          stats.male++;
        } else if (norm === 'female') {
          stats.female++;
        } else {
          stats.others[g] = (stats.others[g] || 0) + 1;
        }
      }
    });

    console.log('\n--- Gender Statistics ---');
    console.log(`Male: ${stats.male}`);
    console.log(`Female: ${stats.female}`);
    console.log(`Empty/Null: ${stats.emptyOrNull}`);
    console.log('Others:', stats.others);
    console.log('------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Failed to query stats:', err);
    process.exit(1);
  }
}, 1000);
