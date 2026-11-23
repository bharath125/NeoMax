import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

export function useGenerateVideo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload) => {
			const { data } = await apiClient.post('/generate', payload);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['jobs'] });
			queryClient.invalidateQueries({ queryKey: ['scenes'] });
			queryClient.invalidateQueries({ queryKey: ['me'] });
		},
	});
}
