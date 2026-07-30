import Joi from 'joi';
import { config } from '../config/index.js';
import { Job } from '../models/Job.js';
import { estimateCost, reserveCredits } from '../services/credits.service.js';
import { enqueueVideoJob } from '../queue/generateVideo.queue.js';

const createGenerationSchema = Joi.object({
	prompt: Joi.string().min(3).max(2000).required(),
	imageUrl: Joi.string().uri().optional(),
	durationSeconds: Joi.number().integer().min(1).max(60).default(5),
	resolution: Joi.string().valid('720p', '1080p').default('720p'),
});

export async function createGeneration(req, res, next) {
	try {
		const { error, value } = createGenerationSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const creditsReserved = estimateCost(value.durationSeconds);
		await reserveCredits(req.user._id, creditsReserved);

		const job = await Job.create({
			user: req.user._id,
			provider: config.videoProvider,
			prompt: value.prompt,
			imageUrl: value.imageUrl,
			durationSeconds: value.durationSeconds,
			resolution: value.resolution,
			creditsReserved,
		});

		await enqueueVideoJob(job._id.toString());

		res.status(201).json({ success: true, data: job });
	} catch (err) {
		next(err);
	}
}

export async function getJob(req, res, next) {
	try {
		const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
		if (!job) return res.status(404).json({ success: false, error: { message: 'Job not found' } });
		res.json({ success: true, data: job });
	} catch (err) {
		next(err);
	}
}

export async function listJobs(req, res, next) {
	try {
		const page = Number(req.query.page || 1);
		const limit = Number(req.query.limit || 20);

		const [jobs, total] = await Promise.all([
			Job.find({ user: req.user._id })
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Job.countDocuments({ user: req.user._id }),
		]);

		res.json({ success: true, data: { jobs, total, page, limit } });
	} catch (err) {
		next(err);
	}
}
