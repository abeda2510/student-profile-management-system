const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected:', process.env.MONGO_URI))
  .catch(err => console.error('MongoDB error:', err));

module.exports = mongoose;
