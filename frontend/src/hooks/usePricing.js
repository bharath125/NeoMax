import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { CREDITS_PER_SECOND } from '../lib/format.js';

const FALLBACK = { creditsPerSecond: CREDITS_PER_SECOND, referenceCreditsPerSecond: CREDITS_PER_SECOND, maxImages: 6, maxSceneParts: 10 };

// Rates come from the server so the UI never disagrees with what a job will actually cost.
export function usePricing() {
	const { data } = useQuery({
		queryKey: ['pricing'],
		queryFn: async () => {
			const { data: response } = await apiClient.get('/generate/pricing');
			return response.data;
		},
		staleTime: 10 * 60_000,
	});
	return data || FALLBACK;
}
