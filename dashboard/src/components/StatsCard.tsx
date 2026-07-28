import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string;
  children?: ReactNode;
}

export default function StatsCard({ label, value, children }: StatsCardProps) {
  return (
    <div className="card p-6">
      <div className="stat-label">{label}</div>
      <div className="stat-value mt-1">{value}</div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}