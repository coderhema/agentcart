import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface RevenueChartProps {
  data?: { date: string; revenue: number; count: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return <div className="card p-8 text-center text-muted-slate text-caption">No revenue data yet</div>;
  }

  return (
    <div className="card p-6">
      <h4 className="section-title mb-4">Revenue Over Time</h4>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#17171c" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#17171c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#93939f' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#93939f' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #d9d9dd', fontSize: 14 }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#17171c" strokeWidth={2} fill="url(#revenueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}