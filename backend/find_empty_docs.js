const { MongoClient } = require('mongodb');
const path = require('path');
const backendPath = 'c:/Users/banda/Desktop/student-profile-management-system/backend';
require('dotenv').config({ path: path.join(backendPath, '.env') });

function parseQueryArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'object') return Object.values(val).map(String).filter(Boolean);
  return [String(val)].filter(Boolean);
}

function buildFilter(query) {
  const branches = parseQueryArray(query.branch);
  const sections = parseQueryArray(query.section);
  const filter = { role: 'student' };
  if (branches.length) filter.branch = { $in: branches };
  if (sections.length) filter.section = { $in: sections };
  return filter;
}

async function getStudentDocData(st, docType, preloadedDocs) {
  const base = { regNumber: st.regNumber, name: st.name, branch: st.branch, section: st.section, docType };
  if (docType === 'AADHAAR_DOC') {
    const docs = (preloadedDocs[st.regNumber] || []).filter(d => d.docType === 'AADHAAR');
    return { ...base, data: docs.length ? (docs[0].fileUrl || docs[0].filepath || 'Uploaded') : '—' };
  }
  if (docType === 'PAN_DOC') {
    const docs = (preloadedDocs[st.regNumber] || []).filter(d => d.docType === 'PAN');
    return { ...base, data: docs.length ? (docs[0].fileUrl || docs[0].filepath || 'Uploaded') : '—' };
  }
  if (docType === 'TENTH_MEMO') {
    const docs = (preloadedDocs[st.regNumber] || []).filter(d => d.docType === 'MARK_MEMO' && /10th|SSC/i.test(d.label || ''));
    return { ...base, data: docs.length ? (docs[0].fileUrl || docs[0].filepath || 'Uploaded') : '—' };
  }
  if (docType === 'INTER_MEMO') {
    const docs = (preloadedDocs[st.regNumber] || []).filter(d => d.docType === 'MARK_MEMO' && /inter|12th/i.test(d.label || ''));
    return { ...base, data: docs.length ? (docs[0].fileUrl || docs[0].filepath || 'Uploaded') : '—' };
  }
  return { ...base, data: '—' };
}

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const studentsCol = db.collection('students');
  const docsCol = db.collection('documents');

  const query = { branch: ['CSE'], section: ['10', '11'] };
  const filter = buildFilter(query);
  const students = await studentsCol.find(filter).toArray();

  const regNumbers = students.map(s => s.regNumber);
  const allDocs = await docsCol.find({ regNumber: { $in: regNumbers } }).toArray();

  const preloadedDocs = {};
  allDocs.forEach(d => {
    if (!preloadedDocs[d.regNumber]) preloadedDocs[d.regNumber] = [];
    preloadedDocs[d.regNumber].push(d);
  });

  console.log(`Checking matching for ${students.length} students...`);

  let mismatchCount = 0;
  for (const st of students) {
    const docTypes = ['AADHAAR_DOC', 'PAN_DOC', 'TENTH_MEMO', 'INTER_MEMO'];
    for (const dt of docTypes) {
      const apiResult = await getStudentDocData(st, dt, preloadedDocs);
      if (apiResult.data === '—') {
        // Check if there is any document of that category in DB for this student
        let dbMatches = [];
        if (dt === 'AADHAAR_DOC') {
          dbMatches = await docsCol.find({ regNumber: st.regNumber, docType: 'AADHAAR' }).toArray();
        } else if (dt === 'PAN_DOC') {
          dbMatches = await docsCol.find({ regNumber: st.regNumber, docType: 'PAN' }).toArray();
        } else if (dt === 'TENTH_MEMO') {
          dbMatches = await docsCol.find({ regNumber: st.regNumber, docType: 'MARK_MEMO', label: /10th|SSC/i }).toArray();
        } else if (dt === 'INTER_MEMO') {
          dbMatches = await docsCol.find({ regNumber: st.regNumber, docType: 'MARK_MEMO', label: /inter|12th/i }).toArray();
        }

        if (dbMatches.length > 0) {
          mismatchCount++;
          console.log(`\n[MISMATCH] Student ${st.regNumber} (${st.name}) has empty '${dt}' but document exists in DB:`);
          dbMatches.forEach(dm => {
            console.log(`  - docId: ${dm._id}, docType: ${dm.docType}, label: "${dm.label}", fileUrl: "${dm.fileUrl}", filepath: "${dm.filepath}"`);
          });
        }
      }
    }
  }

  console.log(`\nCheck complete. Found ${mismatchCount} mismatches between preloaded docs and database matches.`);
  await client.close();
}

run().catch(console.error);
