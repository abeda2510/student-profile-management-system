/**
 * update_emails.js
 * Updates all student email addresses in the database to be: <regNumber>@gmail.com
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');

setTimeout(async () => {
  try {
    console.log('Fetching all students...');
    const students = await Student.find({ role: 'student' }).select('_id regNumber').lean();
    console.log(`Found ${students.length} students in database.`);

    if (students.length === 0) {
      console.log('No students found to update.');
      process.exit(0);
    }

    console.log('Preparing updates...');
    const ops = students.map(s => {
      const email = `${String(s.regNumber).trim().toLowerCase()}@gmail.com`;
      return {
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { email } }
        }
      };
    });

    console.log('Executing updates in batches...');
    const BATCH_SIZE = 1000;
    let updatedCount = 0;
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const batch = ops.slice(i, i + BATCH_SIZE);
      const res = await Student.bulkWrite(batch, { ordered: false });
      updatedCount += res.modifiedCount;
      console.log(`Updated batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ops.length / BATCH_SIZE)} (modified: ${res.modifiedCount})...`);
    }

    console.log(`\n✅ Success! Updated ${updatedCount} student email addresses in the database.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}, 1000);
