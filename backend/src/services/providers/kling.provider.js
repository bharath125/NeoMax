import axios from 'axios';
import { config } from '../../config/index.js';

// TODO: verify endpoint paths, auth header, and payload/response shape against Kling's current
// API docs before going live — this follows their documented "create task, poll by task id" pattern
// but exact field names may have shifted.
const client = axios.create({
	baseURL: config.kling.baseUrl,
	headers: { Authorization: `Bearer ${config.kling.apiKey}` },
});

export async function createGeneration({ prompt, imageUrl, durationSeconds, resolution }) {
	const { data } = await client.post('/v1/videos/generations', {
		prompt,
		image_url: imageUrl || undefined,
		duration: durationSeconds,
		resolution,
	});
	return { providerJobId: data.task_id };
}

export async function getStatus(providerJobId) {
	const { data } = await client.get(`/v1/videos/generations/${providerJobId}`);

	if (data.task_status === 'succeed') {
		return { status: 'completed', videoUrl: data.task_result?.videos?.[0]?.url };
	}
	if (data.task_status === 'failed') {
		return { status: 'failed', error: data.task_status_msg || 'Kling generation failed' };
	}
	return { status: 'processing' };
}
