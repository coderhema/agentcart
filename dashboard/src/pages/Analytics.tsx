import { useState } from 'react';
import { useStats } from '../hooks/useStats';
import RevenueChart from '../components/RevenueChart';
import StatsCard from '../components/StatsCard';
import { formatCurrency } from '../utils/format';

export default function Analytics() {
  const token = localStorage.getItem('agentcart_token') || '';
  const [days, setDays] = useState(7);
  const { data, isLoading } = useStats(token, days);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-section-heading text-near-black tracking-tight">Analytics</h2>
          <p className="text-muted-slate text-caption mt-1">Revenue and usage metrics</p>
        </div>
        <div className="flex gap-2">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`btn-pill-outline text-xs ${days === d ? 'bg-near-black text-white border-near-black' : ''}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-muted-slate">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Total Calls" value={(data?.overview?.total_calls || 0).toLocaleString()} />
            <StatsCard label="Revenue" value={formatCurrency(data?.overview?.revenue || 0)} />
            <StatsCard label="Unique Agents" value={(data?.overview?.unique_agents || 0).toString()} />
            <StatsCard label="Avg Price" value={formatCurrency(data?.overview?.avg_price || 0)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={data?.revenueByDay} />
            </div>
            <div className="card p-6">
              <h4 className="section-title mb-4">Top APIs by Revenue</h4>
              <div className="space-y-4">
                {data?.topApis?.map((api: any, i: number) => (
                  <div key={api.product_id || i}>
                    <div className="flex justify-between text-caption mb-1">
                      <span>{api.product_id || 'Unknown'}</span>
                      <span className="font-medium">{formatCurrency(api.revenue)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-soft-stone rounded-full overflow-hidden">
                      <div
                        className="h-full bg-near-black rounded-full"
                        style={{ width: `${Math.min(100, (api.revenue / (data?.topApis?.[0]?.revenue || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}