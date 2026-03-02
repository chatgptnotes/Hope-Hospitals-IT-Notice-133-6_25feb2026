const XLSX = require('xlsx');

const SUPABASE_URL = 'https://zyzmasxhfofgarfgusxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5em1hc3hoZm9mZ2FyZmd1c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjYzMDQsImV4cCI6MjA4NzUwMjMwNH0.Ceb8kwCusmtffVximZRmVYGngpkcIiQmrZqB9QoifoA';

async function main() {
  // Get ALL DB records
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const dbRecords = await res.json();
  console.log('=== DB STATE ===');
  console.log('Total DB records:', dbRecords.length);

  // Find duplicates in DB
  const admIdCount = {};
  dbRecords.forEach(r => {
    const key = r.admission_id?.toLowerCase().trim() || 'NULL';
    if (!admIdCount[key]) admIdCount[key] = [];
    admIdCount[key].push(r);
  });
  const dups = Object.entries(admIdCount).filter(([k, v]) => v.length > 1);
  if (dups.length > 0) {
    console.log('\nDuplicate admission_ids in DB:', dups.length);
    dups.forEach(([admId, records]) => {
      console.log(`\n  ${admId} (${records.length} copies):`);
      records.forEach(r => {
        console.log(`    id=${r.id?.substring(0,8)} | date=${r.transaction_date} | name=${r.narration?.substring(0,30)} | invoice=₹${r.invoice_amount} | discount=₹${r.discount_amount} | net=₹${r.net_bill_amount} | voucher=${r.voucher_no}`);
      });
    });
  }

  // Read Excel
  const wb = XLSX.readFile('HOPE HOSPITA INCOME DETAILS.xlsx');
  const ws = wb.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  // Build Excel lookup by admission_id
  const excelByAdmId = {};
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const name = String(row[1] || '').trim();
    const admId = String(row[3] || '').trim();
    if (!name && !admId) continue;
    if (!admId) continue;
    const key = admId.toLowerCase().trim();
    if (!excelByAdmId[key]) excelByAdmId[key] = [];
    excelByAdmId[key].push({ row: i + 1, data: row, name });
  }

  // Check Excel duplicates
  const excelDups = Object.entries(excelByAdmId).filter(([k, v]) => v.length > 1);
  if (excelDups.length > 0) {
    console.log('\n\n=== Duplicate admission_ids WITHIN Excel ===');
    excelDups.forEach(([admId, entries]) => {
      console.log(`  ${admId}: rows ${entries.map(e => e.row).join(', ')} (${entries.map(e => e.name).join(', ')})`);
    });
  }

  // Compare data: DB records vs Excel
  console.log('\n\n=== DATA MISMATCHES (DB vs Excel) ===');
  let mismatchCount = 0;
  for (const dbRec of dbRecords) {
    const key = dbRec.admission_id?.toLowerCase().trim();
    const excelEntries = excelByAdmId[key];
    if (!excelEntries) continue;
    const excel = excelEntries[0]; // Use first Excel match
    const row = excel.data;

    const exInvoice = Math.round((Number(row[5]) || 0) * 100) / 100;
    const exDiscount = Math.round((Number(row[6]) || 0) * 100) / 100;
    const exNet = Math.round((Number(row[7]) || 0) * 100) / 100;
    const dbInvoice = Number(dbRec.invoice_amount);
    const dbDiscount = Number(dbRec.discount_amount);
    const dbNet = Number(dbRec.net_bill_amount);

    if (Math.abs(exInvoice - dbInvoice) > 1 || Math.abs(exDiscount - dbDiscount) > 1 || Math.abs(exNet - dbNet) > 1) {
      mismatchCount++;
      console.log(`\n  ${dbRec.admission_id} (${excel.name}):`);
      console.log(`    DB:    invoice=₹${dbInvoice} discount=₹${dbDiscount} net=₹${dbNet}`);
      console.log(`    Excel: invoice=₹${exInvoice} discount=₹${exDiscount} net=₹${exNet}`);
    }
  }
  if (mismatchCount === 0) console.log('  No mismatches found.');
  else console.log(`\n  Total mismatches: ${mismatchCount}`);

  // Records in DB but NOT in Excel
  console.log('\n\n=== DB records NOT in Excel ===');
  let notInExcel = 0;
  for (const dbRec of dbRecords) {
    const key = dbRec.admission_id?.toLowerCase().trim();
    if (!excelByAdmId[key]) {
      notInExcel++;
      console.log(`  ${dbRec.admission_id} | ${dbRec.narration} | invoice=₹${dbRec.invoice_amount}`);
    }
  }
  console.log(`Total DB records not in Excel: ${notInExcel}`);
}

main().catch(err => console.error('ERROR:', err));
