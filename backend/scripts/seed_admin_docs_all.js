/**
 * seed_admin_docs_all.js
 * Populates admin custom documents for all 23,723 students in the database.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('../db');
const Document = require('../models/Document');
const Student = require('../models/Student');

setTimeout(async () => {
  try {
    console.log('1. Clearing existing admin documents...');
    const delRes = await Document.deleteMany({ uploadedBy: 'admin' });
    console.log(`Cleared ${delRes.deletedCount} existing admin documents.`);

    console.log('2. Fetching all students...');
    const students = await Student.find({ role: 'student' }).select('_id regNumber').lean();
    console.log(`Found ${students.length} students in database.`);

    console.log('3. Preparing bulk insert operations...');
    const ops = [];
    
    let count = 0;
    students.forEach(st => {
      // 1. CRT Attendance
      const crtAtt = Math.floor(Math.random() * 30) + 70; // 70 to 99
      ops.push({
        insertOne: {
          document: {
            student: st._id,
            regNumber: st.regNumber,
            docType: 'ADMIN_CUSTOM',
            label: 'CRT Attendance',
            fileUrl: String(crtAtt),
            filename: String(crtAtt),
            uploadedBy: 'admin'
          }
        }
      });

      // 2. CRT Performance sub-metrics
      const sApt = Math.floor(Math.random() * 51) + 50; // 50 to 100
      const sCod = Math.floor(Math.random() * 51) + 50;
      const sCom = Math.floor(Math.random() * 51) + 50;
      const sMck = Math.floor(Math.random() * 51) + 50;
      const sAvg = ((sApt + sCod + sCom + sMck) / 4).toFixed(2);

      const metrics = [
        { label: 'CRT Performance - Aptitude', val: String(sApt) },
        { label: 'CRT Performance - Coding', val: String(sCod) },
        { label: 'CRT Performance - Communication', val: String(sCom) },
        { label: 'CRT Performance - Mock Interview', val: String(sMck) },
        { label: 'CRT Performance - Overall %', val: String(sAvg) }
      ];

      metrics.forEach(m => {
        ops.push({
          insertOne: {
            document: {
              student: st._id,
              regNumber: st.regNumber,
              docType: 'ADMIN_CUSTOM',
              label: m.label,
              fileUrl: m.val,
              filename: m.val,
              uploadedBy: 'admin'
            }
          }
        });
      });

      // CRT Performance parent
      const crtPerfSummary = `Aptitude: ${sApt} | Coding: ${sCod} | Communication: ${sCom} | Mock Interview: ${sMck} | Overall %: ${sAvg}`;
      ops.push({
        insertOne: {
          document: {
            student: st._id,
            regNumber: st.regNumber,
            docType: 'ADMIN_CUSTOM',
            label: 'CRT Performance',
            fileUrl: crtPerfSummary,
            filename: crtPerfSummary,
            uploadedBy: 'admin'
          }
        }
      });

      // 3. Semester Attendance - Sem 1
      const semAtt = Math.floor(Math.random() * 35) + 65; // 65 to 99
      const semMetrics = [
        { label: 'Semester Attendance - Sem 1 - Total Classes', val: '100' },
        { label: 'Semester Attendance - Sem 1 - Classes Attended', val: String(semAtt) },
        { label: 'Semester Attendance - Sem 1 - Attendance %', val: String(semAtt) }
      ];

      semMetrics.forEach(m => {
        ops.push({
          insertOne: {
            document: {
              student: st._id,
              regNumber: st.regNumber,
              docType: 'ADMIN_CUSTOM',
              label: m.label,
              fileUrl: m.val,
              filename: m.val,
              uploadedBy: 'admin'
            }
          }
        });
      });

      const semSummary = `Total Classes: 100 | Classes Attended: ${semAtt} | Attendance %: ${semAtt}`;
      ops.push({
        insertOne: {
          document: {
            student: st._id,
            regNumber: st.regNumber,
            docType: 'ADMIN_CUSTOM',
            label: 'Semester Attendance - Sem 1',
            fileUrl: semSummary,
            filename: semSummary,
            uploadedBy: 'admin'
          }
        }
      });

      count++;
      if (count % 5000 === 0) {
        console.log(`Prepared ${count} students (${ops.length} insert ops)...`);
      }
    });

    console.log(`Total prepare done. Students: ${count}, Total insert operations: ${ops.length}`);
    console.log('4. Executing bulk write operations in chunks...');
    
    const chunkSize = 15000; // 15,000 operations per write
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      await Document.bulkWrite(chunk, { ordered: false });
      console.log(`Inserted batch ${i / chunkSize + 1} / ${Math.ceil(ops.length / chunkSize)} (${Math.min(i + chunkSize, ops.length)} / ${ops.length})`);
    }

    console.log('✅ Done! Seeded admin documents for all 23k+ students.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}, 1000);
