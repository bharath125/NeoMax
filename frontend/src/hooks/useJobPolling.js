import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { isActive } from '../lib/jobs.js';

// The API signs a fresh video URL on every read. If each poll swapped the URL, every <video> on the
// page would reload mid-playback, so we pin a job's URL until it is close to the 1h signature expiry.
const URL_REUSE_MS = 45 * 60 * 1000;
const urlCache = new Map();

const SIGNED_FIELDS = ['resultUrl', 'lastFrameUrl'];

export function withStableUrl(job) {
	const present = SIGNED_FIELDS.filter((field) => job[field]);
	if (present.length === 0) return job;

	const cached = urlCache.get(job._id);
	const fresh = cached && Date.now() - cached.at < URL_REUSE_MS && present.every((field) => cached[field]);
	if (fresh) return { ...job, ...Object.fromEntries(present.map((field) => [field, cached[field]])) };

	urlCache.set(job._id, { ...Object.fromEntries(present.map((field) => [field, job[field]])), at: Date.now() });
	return job;
}

// Call when a video fails to load (expired signature) to force fresh URLs.
export function refreshJobUrls(queryClient) {
	urlCache.clear();
	return Promise.all([queryClient.invalidateQueries({ queryKey: ['jobs'] }), queryClient.invalidateQueries({ queryKey: ['scenes'] })]);
}

export function useJobPolling() {
	return useQuery({
		queryKey: ['jobs'],
		queryFn: async () => {
			const { data } = await apiClient.get('/generate/jobs', { params: { limit: 48 } });
			return data.data.jobs.map(withStableUrl);
		},
		refetchInterval: (query) => (query.state.data?.some(isActive) ? 4000 : false),
	});
}

export function useRefreshJobUrls() {
	const queryClient = useQueryClient();
	return () => refreshJobUrls(queryClient);
}
