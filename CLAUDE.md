# Hope Hospitals — IT Notice 133(6) — Claude Instructions

## Project
- **Stack:** Next.js 16 + Supabase + TypeScript + Tailwind CSS
- **Purpose:** Track hospital transactions for IT Notice ITBA/COM/F/17/2025-26 (FY 2024-25)
- **Working dir:** `/Users/murali/133(6)tan based case/`
- **Dev:** `npm run dev` → http://localhost:3000

---

## Supabase
- **URL:** https://zyzmasxhfofgarfgusxk.supabase.co
- **DB host:** db.zyzmasxhfofgarfgusxk.supabase.co | port 5432 | user: postgres
- **Anon key & URL** in `.env.local`
- **Connect via psycopg2** (psql is NOT installed). Always use `sslmode='require'`.
- **Table:** `transactions` — schema in `supabase-schema.sql`

---

## Key Source Files
| File | Purpose |
|------|---------|
| `src/types/transaction.ts` | Transaction TypeScript interface |
| `src/components/TransactionTable.tsx` | Table display UI |
| `src/components/TransactionForm.tsx` | Add/Edit form |
| `src/lib/supabase.ts` | Supabase JS client |
| `src/app/page.tsx` | Main page — fetch + display |
| `scripts/import_capf_bills.py` | Excel → Supabase import script |
| `supabase-schema.sql` | DB schema (already applied) |

---

## Bill Folders
Root: `24.02.2026-ALL BILL FOLDER/`

| Folder | Status |
|--------|--------|
| CAPF/2024/IPD | ✅ Imported (7 bills, ₹4,54,795) |
| CAPF/2024/OPD | ⏳ Pending |
| CAPF/2025 | ⏳ Pending |
| Central Railway | ⏳ Pending |
| CGHS FINAL BILL | ⏳ Pending |
| FINAL BILL WCL | ⏳ Pending |
| Insurance And TPA | ⏳ Pending |
| MPKAY FINAL | ⏳ Pending |
| MPPOLICE | ⏳ Pending |
| SECR FINAL BILL | ⏳ Pending |

> Before importing any new folder, always inspect first 20 rows of one file to understand its structure.

---

## CAPF Excel Bill Structure
Open with: `openpyxl.load_workbook(path, data_only=True)` — Sheet: `CGHS BILL`

| Row | Col | Field | Notes |
|-----|-----|-------|-------|
| 3 | D | Bill Date | Format: `DATE:- DD/MM/YYYY` |
| 4 | C | Bill No | e.g. `BL24-L12/12` → `invoice_number` |
| 5 | C | Registration No | → `patient_id` |
| 6 | C | Patient Name | Used in narration |
| 13 | C | Case No | → `admission_id` |
| 15 | C | Diagnosis | Used in narration |
| 17 | C | Date of Admission | For reference only |
| 18 | C | Date of Discharge | For reference only |
| 21 | A | Treatment Type | Surgical / Conservative / Conservative & Intensive |
| ~35 | F | Investigation cost | Search "Pathology Charges" in Col B → Col F |
| ~39 | F | Medicine cost | Search "Medicine Charges" in Col B → Col F |
| 62 | F | TOTAL BILL AMOUNT | Search dynamically for this text |

---

## Transaction Field Mapping

| DB Field | Source | Rule |
|----------|--------|------|
| `transaction_date` | — | **NULL** — date patient/corporate PAID; unknown until payment received |
| `invoice_number` | Row 4 Col C | Bill/invoice reference number (e.g. BL24-L12/12) |
| `voucher_no` | — | **BLANK** — payment receipt no; filled when hospital receives money |
| `patient_id` | Row 5 Col C | Registration No |
| `admission_id` | Row 13 Col C | Case No |
| `invoice_amount` | Row 62 Col F | Total amount hospital charged |
| `discount_amount` | 0 | Not in CAPF bills |
| `net_bill_amount` | = invoice_amount | No discount applied |
| `cash_amount` | 0 | CAPF/corporate = cashless scheme |
| `other_mode_amount` | **0** | Corporate payment comes LATER |
| `transaction_type` | "Receipt" | Fixed |
| `department` | Folder path | IPD or OPD |
| `treatment_code` | Extracted | Format below |
| `narration` | Extracted | "PatientName: Diagnosis" max 100 chars |

### treatment_code Format
```
{Type} | Med: Rs.{medicine_cost} | Inv: Rs.{investigation_cost}
```
Examples:
- `Surgical Treatment | Med: Rs.13,610 | Inv: Rs.3,171`
- `Conservative Treatment | Med: Rs.2,621 | Inv: Rs.1,637`
- `Conservative & Intensive Treatment | Med: Rs.1,34,590 | Inv: Rs.11,245`

---

## CRITICAL RULES — Never Violate These

1. **`transaction_date` = NULL** — This is the date the patient/corporate PAID. We do not know this yet. Never set from bill date.
2. **`other_mode_amount` = 0** — Amount received from corporate/insurance is filled LATER when payment arrives.
3. **`cash_amount` = 0** — All CAPF/Railway/CGHS/Insurance/TPA bills are cashless.
4. **`voucher_no` = BLANK** — Voucher/receipt number is issued only when payment is received.
5. **`invoice_number`** = the bill reference number (NOT voucher_no — these are different things).
6. **`treatment_code`** must always show: treatment type + medicine cost + investigation cost.
7. Bills record what hospital **charged**, NOT what was **received**.

---

## Python DB Connection
```python
import psycopg2
conn = psycopg2.connect(
    host='db.zyzmasxhfofgarfgusxk.supabase.co',
    port=5432, dbname='postgres', user='postgres',
    password='2ECY2N28MDEAfaKy', sslmode='require'
)
```
Required packages: `pip3 install openpyxl psycopg2-binary --break-system-packages`
