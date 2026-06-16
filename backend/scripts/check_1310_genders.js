const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');
const XLSX = require('xlsx');

setTimeout(async () => {
  try {
    const excelPath = path.join(__dirname, '../../june3.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const regNumbers = data.map(row => {
      const rawReg = row['Register No'] || row['register no'] || row['regNumber'] || Object.values(row)[0];
      return String(rawReg || '').trim().toUpperCase();
    }).filter(Boolean);

    console.log(`Loaded ${regNumbers.length} registration numbers from Excel.`);

    const students = await Student.find({ regNumber: { $in: regNumbers } }).select('regNumber name gender').lean();
    console.log(`Found ${students.length} of these students in the database.`);

    const stats = {
      male: 0,
      female: 0,
      emptyOrNull: 0,
      others: {}
    };

    const studentMap = {};
    students.forEach(s => {
      studentMap[s.regNumber] = s;
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

    console.log('\n--- 1310 Students Gender Statistics ---');
    console.log(`Male: ${stats.male}`);
    console.log(`Female: ${stats.female}`);
    console.log(`Empty/Null/Unset: ${stats.emptyOrNull}`);
    console.log('Others:', stats.others);
    console.log('------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Failed to run analysis:', err);
    process.exit(1);
  }
}, 1000);
