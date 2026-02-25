'use client';

import { Transaction } from '@/types/transaction';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({ transactions, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center text-gray-400">
        No transactions yet. Click &quot;+ Add Transaction&quot; or upload bills to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-blue-900 text-white">
          <tr>
            {[
              'Sr.No','Date','Voucher No','Patient ID','Admission ID',
              'Dept','Narration','Invoice ₹','Discount ₹','Net Bill ₹',
              'Cash ₹','Other Mode ₹','Type','Actions'
            ].map(h => (
              <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={t.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 text-center text-gray-500">{i + 1}</td>
              <td className="px-3 py-2 whitespace-nowrap">{t.transaction_date ?? '—'}</td>
              <td className="px-3 py-2">{t.voucher_no || '—'}</td>
              <td className="px-3 py-2">{t.patient_id}</td>
              <td className="px-3 py-2">{t.admission_id}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{t.department}</span>
              </td>
              <td className="px-3 py-2 max-w-[150px] truncate" title={t.narration}>{t.narration}</td>
              <td className="px-3 py-2 text-right">{Number(t.invoice_amount).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-red-600">{Number(t.discount_amount).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right font-medium">{Number(t.net_bill_amount).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-green-700">{Number(t.cash_amount).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right">{Number(t.other_mode_amount).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  t.transaction_type === 'Receipt' ? 'bg-green-100 text-green-800' :
                  t.transaction_type === 'Advance' ? 'bg-blue-100 text-blue-800' :
                  t.transaction_type === 'Deposit' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-purple-100 text-purple-800'
                }`}>{t.transaction_type}</span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button onClick={() => onEdit(t)} className="text-blue-600 hover:underline mr-2">Edit</button>
                <button onClick={() => onDelete(t.id!)} className="text-red-500 hover:underline">Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
