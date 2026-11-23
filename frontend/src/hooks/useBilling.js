import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

export function useCreditPackages() {
	return useQuery({
		queryKey: ['billing-packages'],
		queryFn: async () => {
			const { data } = await apiClient.get('/billing/packages');
			return data.data;
		},
		staleTime: 5 * 60_000,
	});
}

export function usePayments() {
	return useQuery({
		queryKey: ['payments'],
		queryFn: async () => {
			const { data } = await apiClient.get('/billing/payments');
			return data.data;
		},
	});
}
