  const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
require('./db'); // single MongoDB connection → student_management

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/leetcode', require('./routes/leetcode'));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
