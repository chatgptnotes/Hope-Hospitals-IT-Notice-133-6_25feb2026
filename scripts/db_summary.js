const SUPABASE_URL = 'https://zyzmasxhfofgarfgusxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5em1hc3hoZm9mZ2FyZmd1c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjYzMDQsImV4cCI6MjA4NzUwMjMwNH0.Ceb8kwCusmtffVximZRmVYGngpkcIiQmrZqB9QoifoA';

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id,admission_id,narration,invoice_amount,net_bill_amount,department,transaction_date&order=transaction_date.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const data = await res.json();
  console.log('Total DB records:', data.length);

  // Summary
  let totalInvoice = 0, totalNet = 0;
  const depts = {};
  data.forEach(r => {
    totalInvoice += Number(r.invoice_amount) || 0;
    totalNet += Number(r.net_bill_amount) || 0;
    const d = r.department || 'N/A';
    depts[d] = (depts[d] || 0) + 1;
  });
  console.log('Total Invoice: ₹' + totalInvoice.toLocaleString('en-IN'));
  console.log('Total Net Bill: ₹' + totalNet.toLocaleString('en-IN'));
  console.log('By Department:', depts);

  // List all records
  console.log('\n--- ALL RECORDS ---');
  data.forEach((r, i) => {
    console.log(`${(i+1).toString().padStart(3)}. ${(r.transaction_date || 'NULL').padEnd(12)} | ${(r.narration || '').substring(0,30).padEnd(30)} | ${r.admission_id?.padEnd(14) || 'NO_ADM_ID     '} | Invoice=₹${Number(r.invoice_amount).toLocaleString('en-IN').padStart(10)} | Net=₹${Number(r.net_bill_amount).toLocaleString('en-IN').padStart(10)} | ${r.department}`);
  });
}

main().catch(err => console.error('ERROR:', err));
