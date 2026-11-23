import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

// source: 'generated' (the Images page), 'uploaded', or 'all' (the video image picker).
export function useImages(source = 'generated') {
	return useQuery({
		queryKey: ['images', source],
		queryFn: async () => {
			const { data } = await apiClient.get('/images', { params: { limit: 48, source } });
			return data.data;
		},
		// Signed image URLs last an hour; no need to refetch (and re-sign) on every focus or mount.
		staleTime: 10 * 60_000,
	});
}

export function useGenerateImage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload) => {
			const { data } = await apiClient.post('/images', payload, { timeout: 130_000 });
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['images'] });
			queryClient.invalidateQueries({ queryKey: ['me'] });
		},
	});
}

// Uploads one file as the raw request body (no multipart), reporting progress as 0-100.
export function useUploadImage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ file, onProgress }) => {
			const { data } = await apiClient.post('/uploads', file, {
				headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
				timeout: 120_000,
				onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
			});
			return data.data;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['images'] }),
	});
}
