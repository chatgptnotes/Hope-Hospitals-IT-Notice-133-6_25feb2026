const XLSX = require('xlsx');

const SUPABASE_URL = 'https://zyzmasxhfofgarfgusxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5em1hc3hoZm9mZ2FyZmd1c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjYzMDQsImV4cCI6MjA4NzUwMjMwNH0.Ceb8kwCusmtffVximZRmVYGngpkcIiQmrZqB9QoifoA';

function excelSerialToDate(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function main() {
  // Read Excel row 39 (index 38) — MOHAN SHNAKAR UIKEY with RECEIPT + discount
  const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  const row = data[38]; // Row 39 (0-indexed = 38)
  console.log('Row 39 raw:', row.filter((v, j) => v !== '' && v != null).map((v, j) => `${v}`));

  const record = {
    transaction_date: excelSerialToDate(row[0]), // 45327 serial
    patient_id: String(row[2] || '').trim() || 'UHHO24D26010',
    admission_id: 'IH24D26012_R', // Suffix _R to differentiate from original
    invoice_number: String(row[4] || '').trim(),
    voucher_no: String(row[4] || '').trim(),
    invoice_amount: Number(row[5]) || 0,
    discount_amount: Number(row[6]) || 0,
    net_bill_amount: Number(row[7]) || 0,
    cash_amount: Number(row[8]) || 0,
    other_mode_amount: Number(row[9]) || 0,
    transaction_type: 'Receipt',
    department: 'IPD',
    treatment_code: String(row[12] || '').trim(),
    narration: 'MOHAN SHNAKAR UIKEY',
  };

  console.log('Record to insert:', JSON.stringify(record, null, 2));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify([record]),
  });

  if (res.ok) {
    console.log('Inserted successfully!');
  } else {
    const err = await res.text();
    console.error('Error:', err);
  }

  // Verify total count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const all = await countRes.json();
  console.log('Total DB records now:', all.length);
}

main().catch(err => console.error('ERROR:', err));
