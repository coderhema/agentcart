import { truncateWallet, formatCurrency, formatRelativeTime } from '../utils/format';

export default function AgentRow({ agent }: { agent: any }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border-light last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-soft-stone flex items-center justify-center text-caption font-mono text-muted-slate">
          {agent.wallet_address?.slice(0, 2)?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="font-mono text-caption">{truncateWallet(agent.wallet_address)}</div>
          <div className="text-micro text-muted-slate">
            {agent.total_calls || 0} calls · last seen {formatRelativeTime(agent.last_seen)}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-caption font-medium">{formatCurrency(agent.total_spent || 0)}</div>
        <div className="text-micro text-muted-slate">total spent</div>
      </div>
    </div>
  );
}