const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');
const XLSX = require('xlsx');

mongoose.connection.once('open', async () => {
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

    const students = await Student.find({ regNumber: { $in: regNumbers } }).select('regNumber createdAt updatedAt gender').lean();
    console.log(`Checking timestamps for ${students.length} students...`);
    
    const timeGroups = {};
    students.forEach(s => {
      const timeStr = s.createdAt ? new Date(s.createdAt).toISOString().substring(0, 16) : 'N/A';
      timeGroups[timeStr] = (timeGroups[timeStr] || 0) + 1;
    });

    console.log('Creation times distribution:');
    console.log(timeGroups);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
