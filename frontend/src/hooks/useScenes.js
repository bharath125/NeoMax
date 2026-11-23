import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { withStableUrl } from './useJobPolling.js';
import { isActive } from '../lib/jobs.js';

const POLL_MS = 4000;

// One entry per scene (a lone video is a scene of one), newest activity first.
export function useSceneList() {
	return useQuery({
		queryKey: ['scenes', 'list'],
		queryFn: async () => {
			const { data } = await apiClient.get('/generate/scenes', { params: { limit: 48 } });
			return data.data.scenes.map((scene) => ({ ...scene, cover: withStableUrl(scene.cover) }));
		},
		refetchInterval: (query) => (query.state.data?.some((scene) => scene.status === 'processing') ? POLL_MS : false),
	});
}

// A scene with all of its clips in order. Polls while any clip is still being generated.
export function useScene(sceneId) {
	return useQuery({
		queryKey: ['scenes', sceneId],
		queryFn: async () => {
			const { data } = await apiClient.get(`/generate/scenes/${sceneId}`);
			return { ...data.data, clips: data.data.clips.map(withStableUrl) };
		},
		refetchInterval: (query) => (query.state.data?.clips.some(isActive) ? POLL_MS : false),
		retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
	});
}

// Continues a finished clip from its last frame; the new clip joins the same scene.
export function useExtendVideo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, ...payload }) => {
			const { data } = await apiClient.post(`/generate/${id}/extend`, payload);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['jobs'] });
			queryClient.invalidateQueries({ queryKey: ['scenes'] });
			queryClient.invalidateQueries({ queryKey: ['me'] });
		},
	});
}

// Stitches every finished clip of a scene into one video and returns { url, clips }.
export function useExportScene() {
	return useMutation({
		mutationFn: async (sceneId) => {
			const { data } = await apiClient.post(`/generate/scenes/${sceneId}/export`, null, { timeout: 180_000 });
			return data.data;
		},
	});
}
