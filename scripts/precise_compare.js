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

function normalizeDate(val) {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') return excelSerialToDate(val);
  const str = String(val).trim();
  if (!str) return null;
  if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [dd, mm, yyyy] = str.split('/');
    return `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`;
  }
  if (str.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [dd, mm, yyyy] = str.split('-');
    return `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`;
  }
  return str;
}

async function main() {
  // Get ALL DB records
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const dbRecords = await res.json();

  // Index DB records by a composite key: admission_id_lower + voucher_no_lower
  const dbKeys = new Set();
  const dbByAdmId = {};
  dbRecords.forEach(r => {
    const admKey = (r.admission_id || '').toLowerCase().trim();
    const voucherKey = (r.voucher_no || '').toLowerCase().trim();
    const nameKey = (r.narration || '').toLowerCase().trim().substring(0, 20);
    dbKeys.add(`${admKey}||${voucherKey}`);
    dbKeys.add(`${admKey}||${nameKey}`);
    if (!dbByAdmId[admKey]) dbByAdmId[admKey] = [];
    dbByAdmId[admKey].push(r);
  });

  // Read Excel
  const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  // Check each Excel row
  const missing = [];
  let matched = 0;
  let total = 0;

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const name = String(row[1] || '').trim();
    const patId = String(row[2] || '').trim();
    const admId = String(row[3] || '').trim();
    const voucher = String(row[4] || '').trim();
    const invoice = Number(row[5]) || 0;
    const discount = Number(row[6]) || 0;
    const netBill = Number(row[7]) || 0;

    if (!name && !admId) continue;
    total++;

    const admKey = admId.toLowerCase().trim();
    const voucherKey = voucher.toLowerCase().trim();
    const nameKey = name.toLowerCase().trim().substring(0, 20);

    // Try matching by admission_id + voucher, or admission_id + name
    const key1 = `${admKey}||${voucherKey}`;
    const key2 = `${admKey}||${nameKey}`;

    // Also check if there's a DB record with same admission_id AND similar invoice amount
    let found = false;
    if (dbByAdmId[admKey]) {
      for (const dbRec of dbByAdmId[admKey]) {
        const dbName = (dbRec.narration || '').toLowerCase().trim().substring(0, 20);
        const dbVoucher = (dbRec.voucher_no || '').toLowerCase().trim();
        // Match by name OR voucher OR similar invoice amount
        if (dbName === nameKey || dbVoucher === voucherKey ||
            (Math.abs(Number(dbRec.invoice_amount) - invoice) < 2 &&
             Math.abs(Number(dbRec.net_bill_amount) - netBill) < 2)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      matched++;
    } else {
      missing.push({
        row: i + 1,
        date: normalizeDate(row[0]),
        name,
        patId,
        admId,
        voucher,
        invoice,
        discount,
        netBill,
        cash: Number(row[8]) || 0,
        otherMode: Number(row[9]) || 0,
        txnType: String(row[10] || '').trim(),
        dept: String(row[11] || '').trim(),
        treatCode: String(row[12] || '').trim(),
        narration: String(row[13] || '').trim(),
      });
    }
  }

  console.log('=== PRECISE COMPARISON ===');
  console.log('Excel data rows:', total);
  console.log('Matched in DB:', matched);
  console.log('MISSING from DB:', missing.length);

  if (missing.length > 0) {
    console.log('\n--- ALL MISSING ROWS ---');
    missing.forEach(r => {
      console.log(`Row ${r.row}: ${r.date || 'NO DATE'} | ${r.name} | PatID=${r.patId} | AdmID=${r.admId} | Voucher=${r.voucher} | Invoice=₹${r.invoice} | Discount=₹${r.discount} | Net=₹${r.netBill} | Dept=${r.dept} | TxnType=${r.txnType}`);
    });
  }
}

main().catch(err => console.error('ERROR:', err));
