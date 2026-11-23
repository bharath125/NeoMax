import Joi from 'joi';
import { Image } from '../models/Image.js';
import { createImage, getImageUsage } from '../services/imageGeneration.service.js';
import { resolveAssetUrl } from '../services/storage.service.js';

// A subset of what the model supports that suits video work; the provider validates the rest.
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

const createImageSchema = Joi.object({
	prompt: Joi.string().trim().min(3).max(2000).required(),
	aspectRatio: Joi.string()
		.valid(...ASPECT_RATIOS)
		.default('16:9'),
});

// The bucket is private, so each image gets a fresh presigned URL whenever it is read.
async function serializeImage(image) {
	const { key, ...rest } = image.toObject();
	return { ...rest, url: await resolveAssetUrl(key) };
}

export async function create(req, res, next) {
	try {
		const { error, value } = createImageSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const image = await createImage({ user: req.user, prompt: value.prompt, aspectRatio: value.aspectRatio });
		res.status(201).json({ success: true, data: await serializeImage(image) });
	} catch (err) {
		next(err);
	}
}

export async function list(req, res, next) {
	try {
		const page = Math.max(1, Number(req.query.page || 1));
		const limit = Math.min(60, Math.max(1, Number(req.query.limit || 24)));

		// The Images page shows generated images; the video image picker asks for everything (source=all).
		const filter = { user: req.user._id };
		if (req.query.source === 'uploaded') filter.source = 'uploaded';
		else if (req.query.source === 'all') filter.source = { $ne: 'frame' };
		else filter.source = { $nin: ['uploaded', 'frame'] };

		const [images, total, usage] = await Promise.all([
			Image.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Image.countDocuments(filter),
			getImageUsage(req.user._id),
		]);

		res.json({ success: true, data: { images: await Promise.all(images.map(serializeImage)), total, page, limit, usage } });
	} catch (err) {
		next(err);
	}
}
