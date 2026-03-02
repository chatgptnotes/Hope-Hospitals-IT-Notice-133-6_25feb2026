const XLSX = require('xlsx');
const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Count non-empty rows
let dataRows = 0;
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (row[1] || row[2]) dataRows++; // has patient name or visit ID
}
console.log('Total data rows (with patient name or visit ID):', dataRows);

// Check departments
const depts = {};
const txnTypes = {};
const treatmentCodes = {};
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row[1] && !row[2]) continue;
  const dept = row[11] || 'EMPTY';
  const txnType = row[10] || 'EMPTY';
  const treatCode = row[12] || 'EMPTY';
  depts[dept] = (depts[dept] || 0) + 1;
  txnTypes[txnType] = (txnTypes[txnType] || 0) + 1;
  treatmentCodes[treatCode] = (treatmentCodes[treatCode] || 0) + 1;
}
console.log('\nDepartments:', depts);
console.log('Transaction Types:', txnTypes);
console.log('Treatment Codes (sample):', Object.keys(treatmentCodes).slice(0, 20));

// Show some rows with narration and treatment codes
console.log('\n--- Sample rows with treatment codes ---');
let count = 0;
for (let i = 2; i < data.length && count < 10; i++) {
  const row = data[i];
  if (row[12] && row[12] !== 'IPD' && row[12] !== 'OPD') {
    console.log(`Row ${i+1}: Name=${row[1]} | TreatCode=${row[12]} | Narration=${row[13]} | Dept=${row[11]}`);
    count++;
  }
}

// Show sample rows around row 100-120
console.log('\n--- Rows 95-115 ---');
for (let i = 94; i < Math.min(115, data.length); i++) {
  const row = data[i];
  if (!row[1] && !row[2]) continue;
  const vals = row.map((v, j) => v !== '' && v != null ? `${String.fromCharCode(65+j)}=${v}` : null).filter(Boolean);
  if (vals.length > 0) console.log(`Row ${i+1}:`, vals.join(' | '));
}

// Check date formats
console.log('\n--- Date formats sample ---');
let dateCount = { serial: 0, text: 0, empty: 0 };
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row[1] && !row[2]) continue;
  const d = row[0];
  if (!d && d !== 0) dateCount.empty++;
  else if (typeof d === 'number') dateCount.serial++;
  else dateCount.text++;
}
console.log('Date formats:', dateCount);

// Check last non-empty row
for (let i = data.length - 1; i >= 0; i--) {
  const row = data[i];
  if (row[1] || row[2]) {
    const vals = row.map((v, j) => v !== '' && v != null ? `${String.fromCharCode(65+j)}=${v}` : null).filter(Boolean);
    console.log('\nLast data row (Row', i+1, '):', vals.join(' | '));
    break;
  }
}
