import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Job } from '../models/Job.js';
import { Image } from '../models/Image.js';
import { downloadAsset, resolveAssetUrl, uploadBuffer } from './storage.service.js';
import { concatVideos, extractLastFrame } from './video.service.js';

// What the model is told on every continuation, on top of the user's "what happens next".
export const CONTINUITY_PREFIX =
	'Continue directly from the first frame as the next moment of the same scene. Keep the same characters, clothing, setting, lighting and camera style.';

export class SceneError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
	}
}

// Stores a video's final frame as an image so the next clip can start from it.
export async function captureLastFrame(job, videoBuffer) {
	const jpeg = await extractLastFrame(videoBuffer);
	const _id = new mongoose.Types.ObjectId();
	const key = `frames/${_id}.jpg`;
	await uploadBuffer(jpeg, key, 'image/jpeg');

	const frame = await Image.create({ _id, user: job.user, source: 'frame', key, mediaType: 'image/jpeg', size: jpeg.length });
	await Job.updateOne({ _id: job._id }, { $set: { lastFrameImage: frame._id } });
	return frame;
}

// Videos finished before Extend existed have no stored frame, so fetch the video and extract it on demand.
export async function ensureLastFrame(job) {
	if (job.lastFrameImage) {
		const existing = await Image.findById(job.lastFrameImage);
		if (existing) return existing;
	}
	return captureLastFrame(job, await downloadAsset(job.resultKey));
}

// Atomically claims the right to extend `parent` so two simultaneous clicks can't create two continuations.
// Returns the parent with the claim recorded, or null if it was not extendable / already claimed.
export function claimForExtension(parentId, userId, childId) {
	return Job.findOneAndUpdate(
		{
			_id: parentId,
			user: userId,
			status: 'completed',
			extendedBy: { $exists: false },
			// Clips from before scenes existed have no sequence yet (treated as 0).
			$or: [{ sequence: { $exists: false } }, { sequence: { $lt: config.maxSceneParts - 1 } }],
		},
		{ $set: { extendedBy: childId } },
		{ new: true },
	);
}

export function releaseExtensionClaim(parentId, childId) {
	return Job.updateOne({ _id: parentId, extendedBy: childId }, { $unset: { extendedBy: 1 } });
}

// Stitches a scene's finished clips, in order, into one video and returns a playable URL.
export async function exportScene(sceneId, userId) {
	const clips = await Job.find({ sceneId, user: userId, status: 'completed', resultKey: { $exists: true } }).sort({ sequence: 1 });
	if (clips.length < 2) throw new SceneError('A scene needs at least two finished clips to export', 400);

	const buffers = [];
	for (const clip of clips) buffers.push(await downloadAsset(clip.resultKey));

	const key = `scenes/${sceneId}.mp4`;
	await uploadBuffer(await concatVideos(buffers), key, 'video/mp4');
	return { url: await resolveAssetUrl(key), clips: clips.length };
}
