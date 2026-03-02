const XLSX = require('xlsx');
const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
console.log('Sheet names:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  console.log('\n=== Sheet:', name, '===');
  console.log('Range:', ws['!ref']);
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('Total rows:', data.length);
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i].map((v, j) => v !== '' && v != null ? `${String.fromCharCode(65+j)}=${v}` : null).filter(Boolean);
    if (row.length > 0) console.log(`Row ${i+1}:`, row.join(' | '));
  }
}
