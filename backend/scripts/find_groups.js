const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('../db');
const Student = require('../models/Student');

mongoose.connection.once('open', async () => {
  try {
    console.log('Querying student branches and sections...');
    const results = await Student.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: {
            branch: "$branch",
            admissionYear: "$admissionYear",
            currentYear: "$currentYear"
          },
          total: { $sum: 1 },
          male: { $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, 'male'] }, 1, 0] } },
          female: { $sum: { $cond: [{ $eq: [{ $toLower: "$gender" }, 'female'] }, 1, 0] } },
          empty: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$gender", null] },
                    { $eq: ["$gender", ""] },
                    { $not: ["$gender"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    console.log('Groups in database:');
    results.forEach(r => {
      console.log(`Branch: ${r._id.branch || 'N/A'}, AdmYear: ${r._id.admissionYear || 'N/A'}, CurrentYear: ${r._id.currentYear || 'N/A'} => Total: ${r.total}, Male: ${r.male}, Female: ${r.female}, Empty: ${r.empty}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
});
