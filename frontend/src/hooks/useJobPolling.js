import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

const ACTIVE_STATUSES = new Set(['queued', 'processing']);

export function useJobPolling() {
	return useQuery({
		queryKey: ['jobs'],
		queryFn: async () => {
			const { data } = await apiClient.get('/generate/jobs');
			return data.data.jobs;
		},
		refetchInterval: (query) => (query.state.data?.some((job) => ACTIVE_STATUSES.has(job.status)) ? 4000 : false),
	});
}
