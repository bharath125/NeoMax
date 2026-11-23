import axios from 'axios';
import { config } from '../../config/index.js';

export const supportsImageInputs = false;

function client() {
	return axios.create({
		baseURL: config.kling.baseUrl,
		headers: { Authorization: `Bearer ${config.kling.apiKey}` },
	});
}

// Kling's error envelope is { code, message, request_id } (confirmed live — e.g. code 1102
// "Account balance not enough"). Surface that message instead of Axios's generic
// "Request failed with status code N" so failures are diagnosable from the job record alone.
function unwrapKlingError(err) {
	const body = err.response?.data;
	if (body?.message) {
		const wrapped = new Error(`Kling API error ${body.code}: ${body.message}`);
		wrapped.klingCode = body.code;
		throw wrapped;
	}
	throw err;
}

// Confirmed live against the real API: POST creates a task and returns
// { code, message, request_id, data: { task_id } }; GET polls the same resource type and
// returns { data: { task_status, task_status_msg, task_result: { videos: [{ url }] } } }.
export async function createGeneration({ prompt, imageUrl, durationSeconds, resolution }) {
	const isImageToVideo = Boolean(imageUrl);
	const path = isImageToVideo ? '/v1/videos/image2video' : '/v1/videos/text2video';

	try {
		const { data } = await client().post(path, {
			model: 'kling-v2-master',
			prompt,
			image_url: imageUrl || undefined,
			duration: String(durationSeconds),
			aspect_ratio: resolution === '1080p' ? '16:9' : '16:9',
		});

		return { providerJobId: data.data.task_id, taskType: isImageToVideo ? 'image2video' : 'text2video' };
	} catch (err) {
		unwrapKlingError(err);
	}
}

export async function getStatus(providerJobId, taskType = 'text2video') {
	try {
		const { data } = await client().get(`/v1/videos/${taskType}/${providerJobId}`);
		const task = data.data;

		if (task.task_status === 'succeed') {
			return { status: 'completed', videoUrl: task.task_result?.videos?.[0]?.url };
		}
		if (task.task_status === 'failed') {
			return { status: 'failed', error: task.task_status_msg || 'Kling generation failed' };
		}
		return { status: 'processing' };
	} catch (err) {
		unwrapKlingError(err);
	}
}
