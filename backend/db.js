const mongoose = require('mongoose');

const uri = process.env.MONGO_URI_ATLAS || process.env.MONGO_URI;

if (!uri) {
  console.error('MongoDB URI not set. Set MONGO_URI_ATLAS (preferred) or MONGO_URI in .env');
  process.exit(1);
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = mongoose;
