const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');

mongoose.connection.once('open', async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to list collections:', err);
    process.exit(1);
  }
});
