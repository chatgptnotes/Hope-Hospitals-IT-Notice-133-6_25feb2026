const XLSX = require('xlsx');
const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
const ws = wb.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

console.log('Sheet range:', ws['!ref']);
console.log('Total rows parsed:', data.length);

// Check ALL rows from 125 onwards for any data
console.log('\n=== Rows after 125 with ANY data ===');
let hiddenCount = 0;
for (let i = 125; i < data.length; i++) {
  const row = data[i];
  const nonEmpty = row.filter((v, j) => v !== '' && v != null);
  if (nonEmpty.length > 0) {
    hiddenCount++;
    const vals = row.map((v, j) => {
      if (v === '' || v == null) return null;
      const col = j < 26 ? String.fromCharCode(65 + j) : 'A' + String.fromCharCode(65 + j - 26);
      return `${col}=${v}`;
    }).filter(Boolean);
    console.log(`Row ${i+1}: ${vals.join(' | ')}`);
  }
}
console.log('\nTotal hidden data rows after row 125:', hiddenCount);

// Also check merged cells
if (ws['!merges']) {
  console.log('\nMerged cells:', ws['!merges'].length);
  ws['!merges'].forEach(m => {
    console.log(`  ${XLSX.utils.encode_range(m)}`);
  });
}

// Check for any other sheets with data
for (const name of wb.SheetNames) {
  if (name === 'Sheet1') continue;
  const s = wb.Sheets[name];
  if (s['!ref']) {
    const d = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
    const nonEmpty = d.filter(r => r.some(v => v !== '' && v != null));
    if (nonEmpty.length > 0) {
      console.log(`\n=== Sheet ${name} has ${nonEmpty.length} non-empty rows ===`);
      nonEmpty.slice(0, 10).forEach((r, i) => {
        const vals = r.map((v, j) => v !== '' && v != null ? `${String.fromCharCode(65+j)}=${v}` : null).filter(Boolean);
        console.log(`  ${vals.join(' | ')}`);
      });
    }
  }
}
