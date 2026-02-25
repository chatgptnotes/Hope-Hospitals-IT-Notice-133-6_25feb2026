'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types/transaction';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*');
    if (!error && data) {
      // Sort by date descending (DD-MM-YYYY text → proper date comparison)
      data.sort((a, b) => {
        const parse = (d: string | null) => {
          if (!d) return 0;
          const [dd, mm, yyyy] = d.split('-');
          return new Date(`${yyyy}-${mm}-${dd}`).getTime();
        };
        return parse(b.transaction_date) - parse(a.transaction_date);
      });
      setTransactions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSave = async (tx: Transaction) => {
    if (editRow?.id) {
      await supabase.from('transactions').update(tx).eq('id', editRow.id);
    } else {
      await supabase.from('transactions').insert([tx]);
    }
    setShowForm(false);
    setEditRow(null);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTransactions();
  };

  const exportCSV = () => {
    const headers = [
      'transaction_date','patient_id','admission_id','voucher_no',
      'invoice_amount','discount_amount','net_bill_amount',
      'cash_amount','other_mode_amount','transaction_type',
      'department','treatment_code','narration'
    ];
    const rows = transactions.map(t => headers.map(h => {
      const val = t[h as keyof Transaction] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hope_hospitals_transactions_FY2024-25.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCash = transactions.reduce((s, t) => s + Number(t.cash_amount), 0);
  const totalNet = transactions.reduce((s, t) => s + Number(t.net_bill_amount), 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hope Hospitals — IT Notice 133(6)</h1>
            <p className="text-blue-200 text-sm">
              Notice No: ITBA/COM/F/17/2025-26/1081358809(1) &nbsp;|&nbsp; FY 2024-25 &nbsp;|&nbsp; Due: 10 Oct 2025
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Export CSV
            </button>
            <button
              onClick={() => { setEditRow(null); setShowForm(true); }}
              className="bg-white text-blue-900 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50"
            >
              + Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Net Billed (₹)</p>
          <p className="text-2xl font-bold text-blue-900">₹{totalNet.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Cash Received (₹)</p>
          <p className="text-2xl font-bold text-green-700">₹{totalCash.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading transactions...</div>
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={(t) => { setEditRow(t); setShowForm(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <TransactionForm
          initial={editRow}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditRow(null); }}
        />
      )}
    </main>
  );
}
