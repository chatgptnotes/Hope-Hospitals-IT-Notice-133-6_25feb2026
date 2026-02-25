export type TransactionType = 'Receipt' | 'Advance' | 'Deposit' | 'Part payment';
export type Department = 'IPD' | 'OPD' | 'Pharmacy' | 'Lab' | 'Radiology' | 'Other';

export interface Transaction {
  id?: string;
  transaction_date: string | null; // DD-MM-YYYY — date patient paid; null if not yet received
  patient_id: string;
  admission_id: string;
  invoice_number?: string; // bill/invoice reference number
  voucher_no: string;      // payment receipt no (filled when payment received)
  invoice_amount: number;
  discount_amount: number;
  net_bill_amount: number;
  cash_amount: number;
  other_mode_amount: number;
  transaction_type: TransactionType;
  department: Department;
  treatment_code: string;
  narration: string; // max 100 chars
  created_at?: string;
}
