import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useStats(token: string, days = 7) {
  return useQuery({
    queryKey: ['stats', days],
    queryFn: () => api.get(`/admin/stats?days=${days}`, token),
  });
}