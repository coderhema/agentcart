import { formatDate, truncateWallet, formatCurrency } from '../utils/format';
import { X } from 'lucide-react';

interface TransactionModalProps {
  txn: any;
  onClose: () => void;
}

export default function TransactionModal({ txn, onClose }: TransactionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card p-8 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-feature-heading">Transaction Details</h3>
          <button onClick={onClose} className="text-muted-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 text-caption">
          <Row label="ID" value={txn.id} mono />
          <Row label="Agent" value={truncateWallet(txn.agent_wallet)} mono />
          <Row label="API" value={txn.product_id} />
          <Row label="Amount" value={formatCurrency(txn.amount_usdc)} />
          <Row label="Status" value={txn.status} />
          {txn.txn_id && <Row label="Algo Tx" value={txn.txn_id} mono />}
          <Row label="Time" value={formatDate(txn.created_at)} />
          {txn.request_data && (
            <div>
              <div className="text-muted-slate mb-1">Request</div>
              <pre className="bg-soft-stone/50 p-3 rounded-sm text-xs overflow-auto max-h-32">{JSON.stringify(JSON.parse(txn.request_data), null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-slate">{label}</span>
      <span className={mono ? 'font-mono text-right max-w-[60%] break-all' : 'text-right'}>{value}</span>
    </div>
  );
}