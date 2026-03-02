const XLSX = require('xlsx');
const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

console.log('Total rows in sheet:', data.length);
console.log('Range:', ws['!ref']);

// Print ALL non-empty rows with row numbers
let dataRowCount = 0;
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const nonEmpty = row.filter((v, j) => v !== '' && v != null);
  if (nonEmpty.length > 0) {
    dataRowCount++;
    const vals = row.map((v, j) => {
      if (v === '' || v == null) return null;
      const col = j < 26 ? String.fromCharCode(65 + j) : 'A' + String.fromCharCode(65 + j - 26);
      return `${col}=${v}`;
    }).filter(Boolean);
    console.log(`Row ${i+1}: ${vals.join(' | ')}`);
  }
}
console.log('\nTotal non-empty rows:', dataRowCount);
