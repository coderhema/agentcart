import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import AgentRow from '../components/AgentRow';

export default function Agents() {
  const token = localStorage.getItem('agentcart_token') || '';
  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/admin/agents', token),
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-section-heading text-near-black tracking-tight">Agents</h2>
        <p className="text-muted-slate text-caption mt-1">{data?.agents?.length || 0} agent wallets</p>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-muted-slate">Loading...</div>
      ) : (
        <div className="card p-6">
          {data?.agents?.map((agent: any) => (
            <AgentRow key={agent.wallet_address} agent={agent} />
          ))}
          {(!data?.agents || data.agents.length === 0) && (
            <div className="text-center text-muted-slate text-caption py-8">No agents yet</div>
          )}
        </div>
      )}
    </div>
  );
}