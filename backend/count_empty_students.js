const { MongoClient } = require('mongodb');
const path = require('path');
const backendPath = 'c:/Users/banda/Desktop/student-profile-management-system/backend';
require('dotenv').config({ path: path.join(backendPath, '.env') });

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const studentsCol = db.collection('students');
  const docsCol = db.collection('documents');

  const students = await studentsCol.find({
    branch: 'CSE',
    section: { $in: ['10', '11'] }
  }).toArray();

  let noDocsCount = 0;
  let partialDocsCount = 0;
  let allDocsCount = 0;

  console.log(`Analyzing document counts for ${students.length} students in CSE 10/11...\n`);

  for (const st of students) {
    const docs = await docsCol.find({ regNumber: st.regNumber }).toArray();
    const docTypes = docs.map(d => d.docType);
    const hasAadhaar = docTypes.includes('AADHAAR');
    const hasPan = docTypes.includes('PAN');
    const has10th = docs.some(d => d.docType === 'MARK_MEMO' && /10th|SSC/i.test(d.label || ''));
    const hasInter = docs.some(d => d.docType === 'MARK_MEMO' && /inter|12th/i.test(d.label || ''));

    const uploadCount = [hasAadhaar, hasPan, has10th, hasInter].filter(Boolean).length;

    if (uploadCount === 0) {
      noDocsCount++;
      if (noDocsCount <= 10) {
        console.log(`Student ${st.regNumber} (${st.name}) has UPLOADED 0 / 4 main documents.`);
      }
    } else if (uploadCount < 4) {
      partialDocsCount++;
      if (partialDocsCount <= 10) {
        console.log(`Student ${st.regNumber} (${st.name}) has partial documents (${uploadCount}/4): Aadhaar:${hasAadhaar}, PAN:${hasPan}, 10th:${has10th}, Inter:${hasInter}`);
      }
    } else {
      allDocsCount++;
    }
  }

  console.log('\n--- Document Upload Summary ---');
  console.log(`Total CSE 10/11 Students: ${students.length}`);
  console.log(`Students with ALL 4 documents: ${allDocsCount}`);
  console.log(`Students with PARTIAL (1-3) documents: ${partialDocsCount}`);
  console.log(`Students with ZERO documents: ${noDocsCount}`);
  console.log('------------------------------');

  await client.close();
}

run().catch(console.error);
