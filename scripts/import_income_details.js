/**
 * Import HOPE HOSPITA INCOME DETAILS.xlsx into Supabase transactions table
 * Skips rows that already exist (matched by admission_id)
 */
const XLSX = require('xlsx');

const SUPABASE_URL = 'https://zyzmasxhfofgarfgusxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5em1hc3hoZm9mZ2FyZmd1c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjYzMDQsImV4cCI6MjA4NzUwMjMwNH0.Ceb8kwCusmtffVximZRmVYGngpkcIiQmrZqB9QoifoA';

// Convert Excel serial date to DD-MM-YYYY
function excelSerialToDate(serial) {
  // Excel epoch: 1900-01-01, but Excel thinks 1900 was a leap year (bug)
  const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Normalize date string to DD-MM-YYYY
function normalizeDate(val) {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') return excelSerialToDate(val);
  const str = String(val).trim();
  if (!str) return null;
  // DD/MM/YYYY → DD-MM-YYYY
  if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [dd, mm, yyyy] = str.split('/');
    return `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`;
  }
  // DD-MM-YYYY already
  if (str.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [dd, mm, yyyy] = str.split('-');
    return `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`;
  }
  return str;
}

// Normalize transaction type
function normalizeTxnType(val) {
  const s = String(val || '').trim().toUpperCase();
  if (s === 'RECEIPT') return 'Receipt';
  if (s === 'ADVANCE') return 'Advance';
  if (s === 'DEPOSIT') return 'Deposit';
  if (s === 'PART PAYMENT') return 'Part payment';
  return 'Receipt'; // default
}

// Normalize department
function normalizeDept(val) {
  const s = String(val || '').trim().toUpperCase();
  if (s === 'IPD') return 'IPD';
  if (s === 'OPD') return 'OPD';
  if (s === 'PHARMACY') return 'Pharmacy';
  if (s === 'LAB') return 'Lab';
  if (s === 'RADIOLOGY') return 'Radiology';
  if (s) return 'Other';
  return 'IPD'; // default for this dataset
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=minimal',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res;
}

async function main() {
  // 1. Read Excel
  const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log(`Excel has ${data.length} total rows`);

  // 2. Get existing admission_ids from DB to avoid duplicates
  const existingRes = await supabaseFetch('transactions?select=admission_id', {
    prefer: 'return=representation',
  });
  const existingData = await existingRes.json();
  const existingAdmIds = new Set(existingData.map(r => r.admission_id));
  console.log(`Existing records in DB: ${existingAdmIds.size}`);

  // 3. Parse Excel rows (skip header rows 0,1,2)
  const transactions = [];
  const skipped = [];
  const errors = [];

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const patientName = String(row[1] || '').trim();
    const admissionId = String(row[3] || '').trim();

    // Skip empty rows
    if (!patientName && !admissionId) continue;

    // Skip if no admission ID
    if (!admissionId) {
      errors.push(`Row ${i+1}: No admission_id, patient=${patientName}`);
      continue;
    }

    // Skip duplicates
    if (existingAdmIds.has(admissionId)) {
      skipped.push(`Row ${i+1}: ${admissionId} (${patientName}) — already exists`);
      continue;
    }

    const txnDate = normalizeDate(row[0]);
    const patientId = String(row[2] || '').trim();
    const voucherNo = String(row[4] || '').trim();
    const invoiceAmount = Number(row[5]) || 0;
    const discountAmount = Number(row[6]) || 0;
    const netBillAmount = Number(row[7]) || 0;
    const cashAmount = Number(row[8]) || 0;
    const otherModeAmount = Number(row[9]) || 0;
    const txnType = normalizeTxnType(row[10]);
    const dept = normalizeDept(row[11]);
    const treatmentCode = String(row[12] || '').trim();
    const narrationCol = String(row[13] || '').trim();

    // Narration: use column N if available, otherwise patient name
    const narration = narrationCol || patientName;

    transactions.push({
      transaction_date: txnDate,
      patient_id: patientId,
      admission_id: admissionId,
      invoice_number: voucherNo, // bill reference
      voucher_no: voucherNo,
      invoice_amount: Math.round(invoiceAmount * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      net_bill_amount: Math.round(netBillAmount * 100) / 100,
      cash_amount: Math.round(cashAmount * 100) / 100,
      other_mode_amount: Math.round(otherModeAmount * 100) / 100,
      transaction_type: txnType,
      department: dept,
      treatment_code: treatmentCode,
      narration: narration.substring(0, 100),
    });
  }

  console.log(`\nParsed: ${transactions.length} new records to insert`);
  console.log(`Skipped (duplicates): ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);

  if (skipped.length > 0) {
    console.log('\n--- Skipped duplicates (first 10) ---');
    skipped.slice(0, 10).forEach(s => console.log('  ', s));
    if (skipped.length > 10) console.log(`  ... and ${skipped.length - 10} more`);
  }

  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log('  ', e));
  }

  if (transactions.length === 0) {
    console.log('\nNo new records to insert. Done.');
    return;
  }

  // 4. Show sample of what will be inserted
  console.log('\n--- Sample records to insert (first 5) ---');
  transactions.slice(0, 5).forEach((t, i) => {
    console.log(`${i+1}. ${t.transaction_date || 'NULL'} | ${t.narration} | ${t.patient_id} | ${t.admission_id} | ₹${t.invoice_amount} → ₹${t.net_bill_amount} | ${t.department}`);
  });

  // 5. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await supabaseFetch('transactions', {
      method: 'POST',
      body: JSON.stringify(batch),
      prefer: 'return=minimal',
    });
    inserted += batch.length;
    console.log(`Inserted batch: ${inserted}/${transactions.length}`);
  }

  console.log(`\nDone! Inserted ${inserted} new records.`);
  console.log(`Total records in DB now: ${existingAdmIds.size + inserted}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
