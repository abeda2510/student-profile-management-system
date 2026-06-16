const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');

mongoose.connection.once('open', async () => {
  try {
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    console.log('Databases on cluster:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Failed to list databases:', err);
    process.exit(1);
  }
});
