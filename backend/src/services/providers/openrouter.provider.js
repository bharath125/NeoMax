import axios from 'axios';
import { config } from '../../config/index.js';

// Per-model limits from GET /videos/models. Models differ in which durations and resolutions they
// accept (e.g. HeyGen: 5-15s, 480p/768p/2K only), so requests are normalised before they hit the API
// — and before credits are reserved, so users are charged for what is actually generated.
const MODEL_PROFILES = {
	'heygen/heygen-video-1': { alwaysAudio: true, minDuration: 5, maxDuration: 15, resolutions: { '720p': '768p', '1080p': '2K' } },
	'google/veo-3.1-lite': { allowedDurations: [4, 6, 8] },
	'x-ai/grok-imagine-video-1.5-lite': { minDuration: 1, maxDuration: 15 },
	'alibaba/wan-3.0': { minDuration: 2, maxDuration: 30 },
	'kwaivgi/kling-v3.0-std': { minDuration: 3, maxDuration: 15, resolutions: { '720p': '720p', '1080p': '720p' } },
};

// Reference-image jobs are routed to a different model (see config.openrouter.referenceModel).
export function modelFor({ referenceCount = 0 } = {}) {
	return referenceCount > 0 ? config.openrouter.referenceModel : config.openrouter.model;
}

export const supportsImageInputs = true;

export function normalizeRequest({ durationSeconds, resolution, referenceCount = 0 }, model = modelFor({ referenceCount })) {
	const profile = MODEL_PROFILES[model];
	if (!profile) return { durationSeconds, resolution };

	let duration = durationSeconds;
	if (profile.allowedDurations) {
		duration = profile.allowedDurations.reduce((best, d) =>
			Math.abs(d - durationSeconds) < Math.abs(best - durationSeconds) ? d : best,
		);
	} else {
		duration = Math.min(Math.max(durationSeconds, profile.minDuration), profile.maxDuration);
	}

	return { durationSeconds: duration, resolution: profile.resolutions?.[resolution] || resolution };
}

function authHeaders() {
	return { Authorization: `Bearer ${config.openrouter.apiKey}` };
}

function client() {
	return axios.create({ baseURL: config.openrouter.baseUrl, headers: authHeaders() });
}

// OpenRouter errors come back as { error: { message } } (or a plain string); surface that
// instead of Axios's generic "Request failed with status code N".
function unwrapError(err) {
	const body = err.response?.data;
	const message = typeof body?.error === 'string' ? body.error : body?.error?.message || body?.message;
	if (message) throw new Error(`OpenRouter API error ${err.response.status}: ${message}`);
	throw err;
}

// POST /videos is async: returns 202 { id, status: 'pending', polling_url }. Poll GET /videos/:id
// until status is completed | failed | cancelled | expired (see openrouter.ai/docs video-generation).
export async function createGeneration(params) {
	const { prompt, imageUrl, referenceUrls = [] } = params;
	const model = modelFor({ referenceCount: referenceUrls.length });
	const { durationSeconds, resolution } = normalizeRequest({ ...params, referenceCount: referenceUrls.length }, model);
	try {
		const { data } = await client().post('/videos', {
			model,
			prompt,
			duration: durationSeconds,
			resolution,
			aspect_ratio: '16:9',
			// Audio costs extra on models where it's optional, so default it off — but some models
			// (HeyGen) always render audio and reject an explicit false.
			generate_audio: MODEL_PROFILES[model]?.alwaysAudio ? undefined : false,
			// frame_images (start frame) and input_references (style/content guidance) are separate modes; the API
			// treats a request with both as image-to-video, so callers only ever pass one.
			frame_images: imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl }, frame_type: 'first_frame' }] : undefined,
			input_references: referenceUrls.length ? referenceUrls.map((url) => ({ type: 'image_url', image_url: { url } })) : undefined,
		});
		return { providerJobId: data.id };
	} catch (err) {
		unwrapError(err);
	}
}

export async function getStatus(providerJobId) {
	try {
		const { data } = await client().get(`/videos/${providerJobId}`);

		if (data.status === 'completed') {
			// unsigned_urls aren't presigned — downloading them needs the same Authorization header.
			return { status: 'completed', videoUrl: data.unsigned_urls?.[0], videoHeaders: authHeaders() };
		}
		if (['failed', 'cancelled', 'expired'].includes(data.status)) {
			return { status: 'failed', error: data.error || `OpenRouter job ${data.status}` };
		}
		return { status: 'processing' };
	} catch (err) {
		unwrapError(err);
	}
}
