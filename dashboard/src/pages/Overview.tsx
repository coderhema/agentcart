import { useTransactionStats } from '../hooks/useTransactions';
import { useStats } from '../hooks/useStats';
import { useTransactions } from '../hooks/useTransactions';
import StatsCard from '../components/StatsCard';
import RevenueChart from '../components/RevenueChart';
import TransactionTable from '../components/TransactionTable';
import { formatCurrency } from '../utils/format';

export default function Overview() {
  const token = localStorage.getItem('agentcart_token') || '';
  const { data: txnStats } = useTransactionStats(token);
  const { data: stats } = useStats(token);
  const { data: txns } = useTransactions(token);

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-section-heading text-near-black tracking-tight">Overview</h2>
        <p className="text-muted-slate text-caption mt-1">Real-time marketplace activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Calls" value={(txnStats?.total_txns || 0).toLocaleString()} />
        <StatsCard label="Revenue (Today)" value={formatCurrency(txnStats?.today_volume || 0)} />
        <StatsCard label="Total Revenue" value={formatCurrency(txnStats?.total_volume || 0)} />
        <StatsCard label="Avg. Price" value={formatCurrency(stats?.overview?.avg_price || 0)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={stats?.revenueByDay} />
        </div>
        <div className="card p-6">
          <h4 className="section-title mb-4">Top APIs</h4>
          <div className="space-y-3">
            {stats?.topApis?.slice(0, 5).map((api: any, i: number) => (
              <div key={api.product_id || i} className="flex items-center justify-between">
                <span className="text-caption">{api.product_id || 'Unknown'}</span>
                <span className="text-caption font-medium">{formatCurrency(api.revenue)}</span>
              </div>
            ))}
            {(!stats?.topApis || stats.topApis.length === 0) && (
              <p className="text-caption text-muted-slate">No data yet</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="section-title mb-4">Recent Transactions</h3>
        <TransactionTable transactions={txns?.transactions?.slice(0, 10) || []} />
      </div>
    </div>
  );
}