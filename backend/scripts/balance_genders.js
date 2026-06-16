const path = require('path');
const XLSX = require('xlsx');

// Load environment variables if .env is present
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Student = require('../models/Student');

// Read custom MONGO_URI from arguments if provided
const customMongoUri = process.argv[2];
const mongoUri = customMongoUri || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Error: Please provide a MONGO_URI as an argument or set it in your .env file.');
  console.error('Usage: node scripts/balance_genders.js [MONGO_URI]');
  process.exit(1);
}

console.log(`Connecting to database...`);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully.');
    runBalancing();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

async function runBalancing() {
  try {
    const excelPath = path.join(__dirname, '../../june3.xlsx');
    console.log(`Reading Excel file from: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const regNumbers = data.map(row => {
      const rawReg = row['Register No'] || row['register no'] || row['regNumber'] || Object.values(row)[0];
      return String(rawReg || '').trim().toUpperCase();
    }).filter(Boolean);

    console.log(`Loaded ${regNumbers.length} registration numbers from Excel.`);

    // 1. Get initial stats
    const studentsBefore = await Student.find({ regNumber: { $in: regNumbers } }).select('regNumber gender').lean();
    console.log(`Found ${studentsBefore.length} matching students in DB.`);

    let initialMale = 0;
    let initialFemale = 0;
    let initialEmpty = 0;
    studentsBefore.forEach(s => {
      const g = String(s.gender || '').trim().toLowerCase();
      if (g === 'male') initialMale++;
      else if (g === 'female') initialFemale++;
      else initialEmpty++;
    });

    console.log(`Initial DB stats for these students: Male: ${initialMale}, Female: ${initialFemale}, Empty: ${initialEmpty}`);

    // 2. Prepare bulk updates to balance genders
    const ops = regNumbers.map((regNumber, index) => {
      const gender = (index % 2 === 0) ? 'Male' : 'Female';
      return {
        updateOne: {
          filter: { regNumber },
          update: { $set: { gender } }
        }
      };
    });

    console.log(`Prepared ${ops.length} bulk update operations. Executing...`);
    const result = await Student.bulkWrite(ops, { ordered: false });
    console.log(`Bulk write finished. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    // 3. Get final stats
    const studentsAfter = await Student.find({ regNumber: { $in: regNumbers } }).select('regNumber gender').lean();
    let finalMale = 0;
    let finalFemale = 0;
    let finalEmpty = 0;
    studentsAfter.forEach(s => {
      const g = String(s.gender || '').trim().toLowerCase();
      if (g === 'male') finalMale++;
      else if (g === 'female') finalFemale++;
      else finalEmpty++;
    });

    console.log(`\nFinal DB stats for these students: Male: ${finalMale}, Female: ${finalFemale}, Empty: ${finalEmpty}`);
    console.log(`Verification: Total balanced: ${finalMale + finalFemale}, Difference: ${Math.abs(finalMale - finalFemale)}`);

    process.exit(0);
  } catch (err) {
    console.error('Error during balancing:', err);
    process.exit(1);
  }
}
