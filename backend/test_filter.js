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
  if (query.admissionYear) {
    const yr = Number(query.admissionYear);
    if (!isNaN(yr)) filter.admissionYear = yr;
  }
  if (query.currentYear) {
    const cyr = Number(query.currentYear);
    if (!isNaN(cyr)) filter.currentYear = cyr;
  }
  if (branches.length) filter.branch = { $in: branches };
  if (sections.length) filter.section = { $in: sections };

  return filter;
}

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const studentsCol = db.collection('students');

  const query = { branch: ['CSE'], section: ['10'] };
  const filter = buildFilter(query);
  console.log('Filter:', JSON.stringify(filter, null, 2));

  const results = await studentsCol.find(filter).toArray();
  console.log(`Found ${results.length} students:`);
  results.forEach(s => {
    console.log(`- regNumber: ${s.regNumber}, name: ${s.name}, branch: ${s.branch}, section: ${s.section}`);
  });

  await client.close();
}

run().catch(console.error);
