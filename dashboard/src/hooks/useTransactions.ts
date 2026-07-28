import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useTransactions(token: string, page = 1) {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.get(`/admin/transactions?page=${page}&limit=50`, token),
  });
}

export function useTransactionStats(token: string) {
  return useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => api.get('/admin/transactions/stats', token),
  });
}