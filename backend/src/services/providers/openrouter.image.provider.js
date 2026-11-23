import axios from 'axios';
import { config } from '../../config/index.js';

// Upstream limits and outages are our problem, not the user's: surface them as a generic "busy" 503 rather than
// leaking provider details, while provider-side prompt rejections (400) keep their message so users can fix the prompt.
function toServiceError(err) {
	const status = err.response?.status;
	const message = err.response?.data?.error?.message;

	if (status === 400 && message) {
		const wrapped = new Error(message);
		wrapped.statusCode = 400;
		return wrapped;
	}
	if (status === 429 || status === 402 || status === 502 || status === 503 || err.code === 'ECONNABORTED') {
		const wrapped = new Error('Image generation is busy right now. Please try again in a few minutes.');
		wrapped.statusCode = 503;
		wrapped.cause = err;
		return wrapped;
	}
	return message ? new Error(`OpenRouter image API error ${status}: ${message}`) : err;
}

// POST /images is synchronous: the response carries the image as base64 (docs: openrouter.ai/docs/features/multimodal/image-generation).
export async function generateImage({ prompt, aspectRatio, model = config.openrouter.imageModel }) {
	try {
		const { data } = await axios.post(
			`${config.openrouter.baseUrl}/images`,
			{ model, prompt, aspect_ratio: aspectRatio },
			{ headers: { Authorization: `Bearer ${config.openrouter.apiKey}` }, timeout: 120_000 },
		);

		const image = data.data?.[0];
		if (!image?.b64_json) throw new Error('OpenRouter returned no image');

		return {
			buffer: Buffer.from(image.b64_json, 'base64'),
			mediaType: image.media_type || 'image/png',
			costUsd: data.usage?.cost ?? 0,
			model,
		};
	} catch (err) {
		throw toServiceError(err);
	}
}
