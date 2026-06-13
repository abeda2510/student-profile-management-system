// node scripts/import_students.js [optional_excel_path]
require('dotenv').config();
const mongoose = require('../db');
const Student = require('../models/Student');
const XLSX = require('xlsx');
const path = require('path');

// Excel file path: use command line argument if provided, otherwise default
const excelPath = process.argv[2] || '\\data\\projects\\docker-apps\\student-profile-management-system\\june3.xlsx';

console.log(`Starting student registration import from: ${excelPath}`);

setTimeout(async () => {
  try {
    // 1. Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // read first sheet
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      console.error('Error: Excel sheet is empty or could not be read.');
      process.exit(1);
    }

    console.log(`Read ${data.length} rows from sheet "${sheetName}".`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Iterate and import registration numbers
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // Normalize column header key, matching 'Register No' or 'regNumber' or case variations
      const rawReg = row['Register No'] || row['register no'] || row['regNumber'] || row['regNumber'] || Object.values(row)[0];

      if (!rawReg) {
        skippedCount++;
        continue;
      }

      const regNumber = String(rawReg).trim().toUpperCase();

      if (!regNumber) {
        skippedCount++;
        continue;
      }

      try {
        // Check if student already exists
        const existingStudent = await Student.findOne({ regNumber });
        if (!existingStudent) {
          // Schema requires 'name' and 'password'.
          // Defaulting password to registration number (will be hashed by pre-save hook)
          // Defaulting name to registration number as placeholder
          await Student.create({
            regNumber,
            password: regNumber,
            name: regNumber,
            role: 'student'
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error importing row ${i + 1} (${regNumber}):`, err.message);
        errorCount++;
      }
    }

    console.log('\n--- Import Summary ---');
    console.log(`Successfully created: ${createdCount}`);
    console.log(`Skipped / Already exist: ${skippedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log('----------------------\n');

    console.log('Import operation completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Import failed with critical error:', err.message);
    process.exit(1);
  }
}, 1000);
