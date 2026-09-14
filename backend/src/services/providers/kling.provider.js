import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

// Kling authenticates with a short-lived JWT (not a static bearer key): sign
// { iss: accessKey, exp: now+30min, nbf: now-5s } with the secret key, HS256.
// This pattern is corroborated by multiple independent Kling API integrations.
// Cached and regenerated a minute before expiry so we don't sign on every request.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function getAuthToken() {
	const now = Math.floor(Date.now() / 1000);
	if (cachedToken && cachedTokenExpiresAt - now > 60) return cachedToken;

	const expiresAt = now + 1800;
	cachedToken = jwt.sign({ iss: config.kling.accessKey, exp: expiresAt, nbf: now - 5 }, config.kling.secretKey, {
		algorithm: 'HS256',
	});
	cachedTokenExpiresAt = expiresAt;
	return cachedToken;
}

function client() {
	return axios.create({
		baseURL: config.kling.baseUrl,
		headers: { Authorization: `Bearer ${getAuthToken()}` },
	});
}

// TODO: verify field names and the response envelope against Kling's official Open Platform
// docs once you have real credentials — third-party write-ups disagree on some details (e.g.
// whether `duration` is a string or number, and the exact query-by-task-id path). The shape
// below follows the most consistently corroborated pattern: POST creates a task and returns
// { data: { task_id } }; GET polls the same resource type and returns
// { data: { task_status, task_status_msg, task_result: { videos: [{ url }] } } }.
export async function createGeneration({ prompt, imageUrl, durationSeconds, resolution }) {
	const isImageToVideo = Boolean(imageUrl);
	const path = isImageToVideo ? '/v1/videos/image2video' : '/v1/videos/text2video';

	const { data } = await client().post(path, {
		model: 'kling-v2-master',
		prompt,
		image_url: imageUrl || undefined,
		duration: String(durationSeconds),
		aspect_ratio: resolution === '1080p' ? '16:9' : '16:9',
	});

	return { providerJobId: data.data.task_id, taskType: isImageToVideo ? 'image2video' : 'text2video' };
}

export async function getStatus(providerJobId, taskType = 'text2video') {
	const { data } = await client().get(`/v1/videos/${taskType}/${providerJobId}`);
	const task = data.data;

	if (task.task_status === 'succeed') {
		return { status: 'completed', videoUrl: task.task_result?.videos?.[0]?.url };
	}
	if (task.task_status === 'failed') {
		return { status: 'failed', error: task.task_status_msg || 'Kling generation failed' };
	}
	return { status: 'processing' };
}
