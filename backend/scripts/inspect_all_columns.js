const path = require('path');
const XLSX = require('xlsx');

try {
  const excelPath = path.join(__dirname, '../../june3.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const allKeys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(k => allKeys.add(k));
  });
  
  console.log('All unique columns in sheet:', Array.from(allKeys));
} catch (err) {
  console.error('Error reading excel:', err);
}
