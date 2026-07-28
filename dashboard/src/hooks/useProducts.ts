import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useProducts(token: string) {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/admin/products', token),
  });
}