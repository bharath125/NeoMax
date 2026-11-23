import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function useMe() {
	const { token } = useAuth();
	return useQuery({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await apiClient.get('/auth/me');
			return data.data;
		},
		enabled: Boolean(token),
		staleTime: 30_000,
	});
}
