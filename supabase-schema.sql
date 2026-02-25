-- Hope Hospitals IT Notice 133(6) - Transaction Table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date TEXT NOT NULL,        -- DD-MM-YYYY as per IT dept format
  patient_id TEXT NOT NULL,
  admission_id TEXT NOT NULL,
  voucher_no TEXT NOT NULL,
  invoice_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_bill_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_mode_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Receipt','Advance','Deposit','Part payment')),
  department TEXT NOT NULL CHECK (department IN ('IPD','OPD','Pharmacy','Lab','Radiology','Other')),
  treatment_code TEXT,
  narration TEXT CHECK (char_length(narration) <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (update with your auth policy as needed)
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_patient ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_admission ON transactions(admission_id);
