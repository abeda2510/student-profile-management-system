const path = require('path');
const XLSX = require('xlsx');

try {
  const excelPath = path.join(__dirname, '../../june3.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`Sheet name: ${sheetName}`);
  console.log(`Number of rows: ${data.length}`);
  if (data.length > 0) {
    console.log('Sample row fields:', Object.keys(data[0]));
    console.log('Sample row 0:', data[0]);
    console.log('Sample row 1:', data[1]);
  }
} catch (err) {
  console.error('Error reading excel:', err);
}
