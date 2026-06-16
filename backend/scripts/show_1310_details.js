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

    console.log(`Excel sheet has ${regNumbers.length} rows.`);

    const students = await Student.find({ regNumber: { $in: regNumbers } }).limit(20).lean();
    console.log(`Sample of 20 students from the DB:`);
    students.forEach((s, i) => {
      console.log(`${i+1}. Reg: ${s.regNumber}, Name: ${s.name}, Gender: ${s.gender}, Role: ${s.role}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
