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

  console.log('Querying student: 231FA04E17...');
  const student = await studentsCol.findOne({ regNumber: '231FA04E17' });
  if (student) {
    console.log(JSON.stringify(student, null, 2));
  } else {
    console.log('Student not found!');
  }

  const docs = await docsCol.find({ regNumber: '231FA04E17' }).toArray();
  console.log('Docs found:', docs.length);
  docs.forEach(d => {
    console.log(`- docId: ${d._id}, docType: ${d.docType}, label: "${d.label}"`);
  });

  await client.close();
}

run().catch(console.error);
