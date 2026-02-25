# Skill Guide — Hope Hospitals Bill Import

## What This Skill Does
Extracts data from hospital bill Excel files and imports them into the Supabase `transactions` table, which is displayed in the IT Notice 133(6) web app at localhost:3000.

---

## Quick Reference — What Each Field Means

| Field | Plain English |
|-------|--------------|
| `transaction_date` | Date patient/corporate **paid** the hospital — BLANK until payment |
| `invoice_number` | The bill number printed on the hospital's invoice (e.g. BL24-L12/12) |
| `voucher_no` | The receipt/voucher number issued when payment is received — BLANK until payment |
| `invoice_amount` | Total amount the hospital **charged** (from the bill) |
| `net_bill_amount` | After discount — same as invoice if no discount |
| `cash_amount` | Cash paid by patient — 0 for all corporate/scheme patients |
| `other_mode_amount` | Amount received via card/UPI/CAPF/insurance — 0 until payment arrives |
| `treatment_code` | Type of treatment + medicine cost + investigation cost |
| `narration` | Patient name + short diagnosis (max 100 chars) |

---

## Step-by-Step: Import a New Bill Folder

### Step 1 — Inspect the files first
```python
import openpyxl
wb = openpyxl.load_workbook('path/to/file.xlsx', data_only=True)
ws = wb.active
for i, row in enumerate(ws.iter_rows(min_row=1, max_row=25, values_only=True), 1):
    if any(v is not None for v in row):
        print(f'Row {i}:', row)
```
Identify which rows contain: bill no, patient ID, case no, diagnosis, total amount.

### Step 2 — Map fields to the transaction schema
Use CAPF mapping as reference (see CLAUDE.md). For new schemes (Railway, CGHS, etc.) the row positions may differ — always verify.

### Step 3 — Run import via psycopg2
```python
import psycopg2, openpyxl, glob, os

conn = psycopg2.connect(
    host='db.zyzmasxhfofgarfgusxk.supabase.co',
    port=5432, dbname='postgres', user='postgres',
    password='2ECY2N28MDEAfaKy', sslmode='require'
)
cur = conn.cursor()

cur.execute('''
    INSERT INTO transactions
      (transaction_date, patient_id, admission_id, invoice_number, voucher_no,
       invoice_amount, discount_amount, net_bill_amount,
       cash_amount, other_mode_amount, transaction_type,
       department, treatment_code, narration)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
''', (None, patient_id, case_no, bill_no, '',
      total, 0, total, 0, 0, 'Receipt',
      'IPD', treatment_code, narration))

conn.commit()
```

### Step 4 — Verify
Refresh http://localhost:3000 — new rows should appear in the table.

---

## treatment_code Extraction Logic

```python
def extract_treatment_info(ws):
    treatment_type = ''
    medicine_cost = 0.0
    investigation_cost = 0.0
    for row in ws.iter_rows(values_only=True):
        col_a = str(row[0] or '').strip()
        col_b = str(row[1] or '').strip()
        col_f = row[5]
        # Treatment type from Col A (row ~21)
        if ('Surgical' in col_a or 'Conservative' in col_a) and not treatment_type:
            treatment_type = col_a
        # Medicine cost
        if 'Medicine Charges' in col_b and col_f:
            medicine_cost = float(col_f)
        # Investigation/Pathology cost
        if 'Pathology Charges' in col_b and col_f:
            investigation_cost = float(col_f)
    return f"{treatment_type} | Med: Rs.{medicine_cost:,.0f} | Inv: Rs.{investigation_cost:,.0f}"
```

---

## Already Imported

| Folder | Bills | Total Amount |
|--------|-------|-------------|
| CAPF/2024/IPD | 7 | ₹4,54,795 |

---

## Rules That Must Never Be Broken
1. `transaction_date` = **NULL** always at import time
2. `other_mode_amount` = **0** always at import time
3. `cash_amount` = **0** for all corporate/scheme/insurance bills
4. `voucher_no` = **empty string** always at import time
5. `invoice_number` = bill reference number (separate from voucher_no)
6. `treatment_code` = must include treatment type + medicine + investigation costs

---

## When Payment Is Received (Future)
Update these fields:
```sql
UPDATE transactions
SET transaction_date = 'DD-MM-YYYY',
    voucher_no = 'receipt_number',
    other_mode_amount = amount_received
WHERE invoice_number = 'BL24-XXX';
```
