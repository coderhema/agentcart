import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionTable from '../components/TransactionTable';
import { Search } from 'lucide-react';

export default function Transactions() {
  const token = localStorage.getItem('agentcart_token') || '';
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(token, page);

  const totalPages = data ? Math.ceil((data.total || 0) / 50) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-section-heading text-near-black tracking-tight">Transactions</h2>
          <p className="text-muted-slate text-caption mt-1">{data?.total || 0} total transactions</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-slate" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 border border-border-light rounded-sm text-caption focus:outline-none focus:ring-2 focus:ring-form-focus focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-muted-slate">Loading...</div>
      ) : (
        <>
          <TransactionTable transactions={data?.transactions || []} />
          <div className="flex items-center justify-between mt-6">
            <span className="text-caption text-muted-slate">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn-pill-outline text-xs disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="btn-pill-outline text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}