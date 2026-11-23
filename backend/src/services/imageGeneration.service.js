import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Image } from '../models/Image.js';
import { generateImage } from './providers/openrouter.image.provider.js';
import { uploadBuffer } from './storage.service.js';
import { refundCredits, reserveCredits } from './credits.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

export async function getImageUsage(userId) {
	const usedToday = await Image.countDocuments({ user: userId, source: { $nin: ['uploaded', 'frame'] }, createdAt: { $gte: new Date(Date.now() - DAY_MS) } });
	return { usedToday, dailyLimit: config.images.dailyLimitPerUser, creditCost: config.images.creditCost };
}

export async function createImage({ user, prompt, aspectRatio }) {
	const { usedToday, dailyLimit, creditCost } = await getImageUsage(user._id);
	if (usedToday >= dailyLimit) {
		const err = new Error(`You’ve reached today’s limit of ${dailyLimit} images. Try again tomorrow.`);
		err.statusCode = 429;
		throw err;
	}

	if (creditCost > 0) await reserveCredits(user._id, creditCost);

	try {
		const generated = await generateImage({ prompt, aspectRatio });

		const _id = new mongoose.Types.ObjectId();
		const key = `images/${_id}.${EXTENSIONS[generated.mediaType] || 'png'}`;
		await uploadBuffer(generated.buffer, key, generated.mediaType);

		return await Image.create({
			_id,
			user: user._id,
			prompt,
			aspectRatio,
			model: generated.model,
			key,
			mediaType: generated.mediaType,
			costUsd: generated.costUsd,
			creditsCharged: creditCost,
		});
	} catch (err) {
		if (creditCost > 0) await refundCredits(user._id, creditCost);
		throw err;
	}
}
