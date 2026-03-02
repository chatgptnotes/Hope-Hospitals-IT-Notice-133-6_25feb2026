const XLSX = require('xlsx');

const SUPABASE_URL = 'https://zyzmasxhfofgarfgusxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5em1hc3hoZm9mZ2FyZmd1c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjYzMDQsImV4cCI6MjA4NzUwMjMwNH0.Ceb8kwCusmtffVximZRmVYGngpkcIiQmrZqB9QoifoA';

async function main() {
  // Get all existing records from DB
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=admission_id,patient_id,narration`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  const dbRecords = await res.json();
  console.log('DB records count:', dbRecords.length);

  // Build sets for matching (case-insensitive)
  const dbAdmIds = new Set(dbRecords.map(r => r.admission_id?.toLowerCase().trim()));
  console.log('Unique admission_ids in DB:', dbAdmIds.size);

  // Read Excel
  const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  // Check each Excel row
  let excelDataRows = 0;
  let matchedRows = 0;
  let missingRows = [];
  let noAdmIdRows = [];

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const patientName = String(row[1] || '').trim();
    const admissionId = String(row[3] || '').trim();

    // Skip completely empty rows and header/separator rows
    if (!patientName && !admissionId) continue;
    // Skip row 95 which is just G=0, K=RECEIPT, etc.
    if (!patientName && !admissionId && !row[0]) continue;

    excelDataRows++;

    if (!admissionId) {
      noAdmIdRows.push({ row: i + 1, name: patientName, voucher: String(row[4] || '') });
      continue;
    }

    if (dbAdmIds.has(admissionId.toLowerCase().trim())) {
      matchedRows++;
    } else {
      missingRows.push({
        row: i + 1,
        name: patientName,
        admId: admissionId,
        patId: String(row[2] || ''),
        voucher: String(row[4] || ''),
        invoice: row[5] || 0,
        netBill: row[7] || 0,
      });
    }
  }

  console.log('\nExcel data rows:', excelDataRows);
  console.log('Matched in DB:', matchedRows);
  console.log('Missing from DB:', missingRows.length);
  console.log('No admission_id:', noAdmIdRows.length);

  if (missingRows.length > 0) {
    console.log('\n--- MISSING ROWS (not in DB) ---');
    missingRows.forEach(r => {
      console.log(`  Row ${r.row}: ${r.name} | AdmID=${r.admId} | PatID=${r.patId} | Voucher=${r.voucher} | Invoice=₹${r.invoice} | NetBill=₹${r.netBill}`);
    });
  }

  if (noAdmIdRows.length > 0) {
    console.log('\n--- NO ADMISSION ID ---');
    noAdmIdRows.forEach(r => {
      console.log(`  Row ${r.row}: ${r.name} | Voucher=${r.voucher}`);
    });
  }
}

main().catch(err => console.error('ERROR:', err));
