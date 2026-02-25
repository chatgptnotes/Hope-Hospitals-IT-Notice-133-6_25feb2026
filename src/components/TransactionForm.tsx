'use client';

import { useState } from 'react';
import { Transaction, TransactionType, Department } from '@/types/transaction';

interface Props {
  initial: Transaction | null;
  onSave: (t: Transaction) => void;
  onCancel: () => void;
}

const EMPTY: Transaction = {
  transaction_date: null,
  patient_id: '',
  admission_id: '',
  invoice_number: '',
  voucher_no: '',
  invoice_amount: 0,
  discount_amount: 0,
  net_bill_amount: 0,
  cash_amount: 0,
  other_mode_amount: 0,
  transaction_type: 'Receipt',
  department: 'OPD',
  treatment_code: '',
  narration: '',
};

export default function TransactionForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Transaction>(initial ?? EMPTY);

  const set = (field: keyof Transaction, value: string | number | null) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-compute net_bill_amount
      if (field === 'invoice_amount' || field === 'discount_amount') {
        updated.net_bill_amount =
          Number(field === 'invoice_amount' ? value : prev.invoice_amount) -
          Number(field === 'discount_amount' ? value : prev.discount_amount);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const inputClass = 'w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-900 text-white px-6 py-3 rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold">{initial ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onCancel} className="text-white/70 hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Transaction Date <span className="text-gray-400">(date patient paid)</span></label>
            <input type="text" placeholder="DD-MM-YYYY"
              className={inputClass} value={form.transaction_date ?? ''}
              onChange={e => set('transaction_date', e.target.value || null)} />
          </div>
          <div>
            <label className={labelClass}>Patient ID (UHID) *</label>
            <input type="text" required className={inputClass} value={form.patient_id}
              onChange={e => set('patient_id', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Admission ID *</label>
            <input type="text" required className={inputClass} value={form.admission_id}
              onChange={e => set('admission_id', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Invoice No <span className="text-gray-400">(Bill No)</span></label>
            <input type="text" className={inputClass} value={form.invoice_number ?? ''}
              onChange={e => set('invoice_number', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Voucher No <span className="text-gray-400">(Payment Receipt)</span></label>
            <input type="text" className={inputClass} value={form.voucher_no}
              onChange={e => set('voucher_no', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Invoice Amount (₹)</label>
            <input type="number" min="0" step="0.01" className={inputClass}
              value={form.invoice_amount}
              onChange={e => set('invoice_amount', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Discount Amount (₹)</label>
            <input type="number" min="0" step="0.01" className={inputClass}
              value={form.discount_amount}
              onChange={e => set('discount_amount', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Net Bill Amount (₹) <span className="text-gray-400">(auto)</span></label>
            <input type="number" readOnly className={`${inputClass} bg-gray-50`}
              value={form.net_bill_amount} />
          </div>
          <div>
            <label className={labelClass}>Cash Amount (₹)</label>
            <input type="number" min="0" step="0.01" className={inputClass}
              value={form.cash_amount}
              onChange={e => set('cash_amount', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Other Mode Amount (₹) <span className="text-gray-400">Card/UPI/Cheque</span></label>
            <input type="number" min="0" step="0.01" className={inputClass}
              value={form.other_mode_amount}
              onChange={e => set('other_mode_amount', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Transaction Type *</label>
            <select required className={inputClass} value={form.transaction_type}
              onChange={e => set('transaction_type', e.target.value as TransactionType)}>
              {['Receipt','Advance','Deposit','Part payment'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Department *</label>
            <select required className={inputClass} value={form.department}
              onChange={e => set('department', e.target.value as Department)}>
              {['IPD','OPD','Pharmacy','Lab','Radiology','Other'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Treatment Code</label>
            <input type="text" className={inputClass} value={form.treatment_code}
              onChange={e => set('treatment_code', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Narration (max 100 chars)</label>
            <input type="text" maxLength={100} className={inputClass} value={form.narration}
              onChange={e => set('narration', e.target.value)} />
            <p className="text-xs text-gray-400 mt-0.5">{form.narration.length}/100</p>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="px-6 py-2 bg-blue-900 text-white rounded text-sm hover:bg-blue-800">
              {initial ? 'Update' : 'Save'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
