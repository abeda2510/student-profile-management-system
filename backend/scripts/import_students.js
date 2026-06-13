// node scripts/import_students.js [optional_excel_path]
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');
const XLSX = require('xlsx');

// Excel file path: use command line argument if provided, otherwise default
const excelPath = process.argv[2] || path.join(__dirname, '../../june3.xlsx');

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

    // Fetch existing registration numbers from database
    console.log('Fetching existing students from database for duplicate checking...');
    const existingStudents = await Student.find({}, 'regNumber').lean();
    const existingRegSet = new Set(existingStudents.map(s => String(s.regNumber || '').trim().toUpperCase()));
    console.log(`Found ${existingRegSet.size} existing students in the database.`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const toCreateRegs = [];
    const seenInSheet = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rawReg = row['Register No'] || row['register no'] || row['regNumber'] || Object.values(row)[0];
      
      if (!rawReg) {
        skippedCount++;
        continue;
      }

      const regNumber = String(rawReg).trim().toUpperCase();

      if (!regNumber) {
        skippedCount++;
        continue;
      }

      // Check duplicate within the same sheet
      if (seenInSheet.has(regNumber)) {
        skippedCount++;
        continue;
      }
      seenInSheet.add(regNumber);

      // Check if student already exists in DB
      if (existingRegSet.has(regNumber)) {
        skippedCount++;
      } else {
        toCreateRegs.push({ regNumber, rowIndex: i + 1 });
      }
    }

    console.log(`Found ${toCreateRegs.length} new students to insert.`);

    // 2. Process insertions in batches of 100
    const BATCH_SIZE = 100;
    const bcrypt = require('bcryptjs');

    for (let i = 0; i < toCreateRegs.length; i += BATCH_SIZE) {
      const batch = toCreateRegs.slice(i, i + BATCH_SIZE);
      console.log(`Creating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toCreateRegs.length / BATCH_SIZE)} (students ${i + 1} to ${Math.min(i + BATCH_SIZE, toCreateRegs.length)})...`);
      
      try {
        // Hash passwords in parallel
        const docs = await Promise.all(batch.map(async (item) => {
          const hashedPassword = await bcrypt.hash(item.regNumber, 10);
          return {
            regNumber: item.regNumber,
            password: hashedPassword,
            name: item.regNumber,
            role: 'student'
          };
        }));

        // Insert batch
        await Student.insertMany(docs);
        createdCount += docs.length;
      } catch (batchErr) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchErr.message);
        // Fallback to sequential insertion for this batch to locate exact error and continue
        for (const item of batch) {
          try {
            const hashedPassword = await bcrypt.hash(item.regNumber, 10);
            await Student.create({
              regNumber: item.regNumber,
              password: hashedPassword,
              name: item.regNumber,
              role: 'student'
            });
            createdCount++;
          } catch (singleErr) {
            console.error(`Error importing row ${item.rowIndex} (${item.regNumber}):`, singleErr.message);
            errorCount++;
          }
        }
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
