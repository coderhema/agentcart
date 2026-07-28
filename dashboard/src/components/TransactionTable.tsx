import { useState } from 'react';
import { formatRelativeTime, truncateWallet, shortId, formatCurrency } from '../utils/format';
import TransactionModal from './TransactionModal';

interface Transaction {
  id: string;
  agent_wallet: string;
  product_id: string;
  amount_usdc: number;
  status: string;
  created_at: string;
}

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <>
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="mono-label text-muted-slate px-6 py-4">ID</th>
              <th className="mono-label text-muted-slate px-6 py-4 hidden sm:table-cell">Agent</th>
              <th className="mono-label text-muted-slate px-6 py-4">API</th>
              <th className="mono-label text-muted-slate px-6 py-4">Amount</th>
              <th className="mono-label text-muted-slate px-6 py-4 hidden md:table-cell">Status</th>
              <th className="mono-label text-muted-slate px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((txn) => (
              <tr
                key={txn.id}
                onClick={() => setSelected(txn)}
                className="border-b border-border-light hover:bg-soft-stone/30 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-caption font-mono">{shortId(txn.id)}</td>
                <td className="px-6 py-4 text-caption hidden sm:table-cell">{truncateWallet(txn.agent_wallet)}</td>
                <td className="px-6 py-4 text-caption">{txn.product_id}</td>
                <td className="px-6 py-4 text-caption font-medium">{formatCurrency(txn.amount_usdc)}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className={`pill-chip text-xs ${txn.status === 'confirmed' ? 'bg-pale-green text-enterprise-green' : 'bg-soft-stone text-muted-slate'}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-caption text-right text-muted-slate">{formatRelativeTime(txn.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!transactions || transactions.length === 0) && (
          <div className="p-12 text-center text-muted-slate text-body">
            No transactions yet
          </div>
        )}
      </div>
      {selected && <TransactionModal txn={selected} onClose={() => setSelected(null)} />}
    </>
  );
}