const path = require('path');
const XLSX = require('xlsx');

try {
  const excelPath = path.join(__dirname, '../../june3.xlsx');
  const workbook = XLSX.readFile(excelPath);
  console.log('Sheet names:', workbook.SheetNames);
} catch (err) {
  console.error('Error reading excel:', err);
}
