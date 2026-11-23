import Joi from 'joi';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Job } from '../models/Job.js';
import { Image } from '../models/Image.js';
import { creditRate, estimateCost, refundCredits, reserveCredits } from '../services/credits.service.js';
import { enqueueVideoJob } from '../queue/generateVideo.queue.js';
import { getProvider, normalizeRequest } from '../services/videoGeneration.service.js';
import { resolveAssetUrl } from '../services/storage.service.js';
import { claimForExtension, ensureLastFrame, exportScene, releaseExtensionClaim } from '../services/scene.service.js';

const createGenerationSchema = Joi.object({
	prompt: Joi.string().min(3).max(2000).required(),
	// Legacy: a hosted image used as the first frame. Prefer imageIds.
	imageUrl: Joi.string().uri().optional(),
	// Ids of the user's own images (uploaded or generated). 'first_frame' animates a single image; 'reference' uses
	// 1..N images as visual guidance for characters, products or style.
	imageIds: Joi.array().items(Joi.string().hex().length(24)).max(config.maxImagesPerVideo).unique().default([]),
	imageMode: Joi.string().valid('first_frame', 'reference').optional(),
	durationSeconds: Joi.number().integer().min(1).max(60).default(5),
	resolution: Joi.string().valid('720p', '1080p').default('720p'),
});

const extendSchema = Joi.object({
	prompt: Joi.string().min(3).max(2000).required(),
	durationSeconds: Joi.number().integer().min(1).max(60).default(5),
	resolution: Joi.string().valid('720p', '1080p').default('720p'),
});

// The bucket is private, so completed jobs get fresh presigned URLs on every read instead of stored ones.
// Scene fields are computed here in bulk (one query each) so the client can render Extend / export without extra calls.
async function serializeJobs(jobs) {
	const frameIds = jobs.map((job) => job.lastFrameImage).filter(Boolean);
	const sceneIds = [...new Set(jobs.map((job) => job.sceneId?.toString()).filter(Boolean))];

	const [frames, sceneCounts] = await Promise.all([
		frameIds.length ? Image.find({ _id: { $in: frameIds } }).select('key') : [],
		sceneIds.length
			? Job.aggregate([
					{ $match: { sceneId: { $in: sceneIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: 'completed' } },
					{ $group: { _id: '$sceneId', count: { $sum: 1 } } },
				])
			: [],
	]);
	const frameKeyById = new Map(frames.map((frame) => [frame._id.toString(), frame.key]));
	const partsByScene = new Map(sceneCounts.map((row) => [row._id.toString(), row.count]));
	const canUseImages = getProvider().supportsImageInputs;

	return Promise.all(
		jobs.map(async (job) => {
			const { resultKey, extendedBy, lastFrameImage, ...rest } = job.toObject();
			const frameKey = lastFrameImage && frameKeyById.get(lastFrameImage.toString());
			return {
				...rest,
				resultUrl: await resolveAssetUrl(resultKey),
				lastFrameUrl: frameKey ? await resolveAssetUrl(frameKey) : undefined,
				isExtended: Boolean(extendedBy),
				canExtend: canUseImages && job.status === 'completed' && !extendedBy && (job.sequence || 0) < config.maxSceneParts - 1,
				sceneParts: (job.sceneId && partsByScene.get(job.sceneId.toString())) || 1,
			};
		}),
	);
}

const serializeJob = async (job) => (await serializeJobs([job]))[0];

// Lets the client show the real cost before submitting instead of hard-coding rates.
export function getPricing(req, res) {
	res.json({
		success: true,
		data: {
			creditsPerSecond: creditRate(0),
			referenceCreditsPerSecond: creditRate(1),
			maxImages: config.maxImagesPerVideo,
			maxSceneParts: config.maxSceneParts,
		},
	});
}

export async function createGeneration(req, res, next) {
	try {
		const { error, value } = createGenerationSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const { imageIds } = value;
		if (imageIds.length && value.imageUrl) {
			return res.status(400).json({ success: false, error: { message: 'Send either imageUrl or imageIds, not both' } });
		}
		const imageMode = imageIds.length ? value.imageMode || (imageIds.length === 1 ? 'first_frame' : 'reference') : undefined;
		if (imageMode === 'first_frame' && imageIds.length !== 1) {
			return res.status(400).json({ success: false, error: { message: 'Animating an image needs exactly one image' } });
		}
		if (imageIds.length && !getProvider().supportsImageInputs) {
			return res.status(400).json({ success: false, error: { message: 'The current video provider does not support image inputs' } });
		}
		if (imageIds.length) {
			// Only the caller's own images may be attached.
			const owned = await Image.countDocuments({ _id: { $in: imageIds }, user: req.user._id });
			if (owned !== imageIds.length) {
				return res.status(400).json({ success: false, error: { message: 'One or more images were not found' } });
			}
		}

		const referenceCount = imageMode === 'reference' ? imageIds.length : 0;
		const { durationSeconds, resolution } = normalizeRequest({ ...value, referenceCount });
		const creditsReserved = estimateCost(durationSeconds, referenceCount);
		await reserveCredits(req.user._id, creditsReserved);

		// Every clip starts its own scene (sceneId = its own id); extending it later adds clips to that scene.
		const jobId = new mongoose.Types.ObjectId();
		const job = await Job.create({
			_id: jobId,
			sceneId: jobId,
			sequence: 0,
			user: req.user._id,
			provider: config.videoProvider,
			prompt: value.prompt,
			imageUrl: value.imageUrl,
			imageIds,
			imageMode,
			durationSeconds,
			resolution,
			creditsReserved,
		});

		await enqueueVideoJob(job._id.toString());

		res.status(201).json({ success: true, data: await serializeJob(job) });
	} catch (err) {
		next(err);
	}
}

export async function getJob(req, res, next) {
	try {
		const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
		if (!job) return res.status(404).json({ success: false, error: { message: 'Job not found' } });
		res.json({ success: true, data: await serializeJob(job) });
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

		res.json({ success: true, data: { jobs: await serializeJobs(jobs), total, page, limit } });
	} catch (err) {
		next(err);
	}
}

// Continues a finished clip: the new clip starts from the parent's last frame and joins the same scene.
export async function extendJob(req, res, next) {
	try {
		const { error, value } = extendSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const parent = await Job.findOne({ _id: req.params.id, user: req.user._id });
		if (!parent) return res.status(404).json({ success: false, error: { message: 'Video not found' } });
		if (parent.status !== 'completed') {
			return res.status(409).json({ success: false, error: { message: 'Only finished videos can be extended' } });
		}
		if (!getProvider().supportsImageInputs) {
			return res.status(400).json({ success: false, error: { message: 'The current video provider does not support extending videos' } });
		}

		const childId = new mongoose.Types.ObjectId();
		const claimed = await claimForExtension(parent._id, req.user._id, childId);
		if (!claimed) {
			return res.status(409).json({
				success: false,
				error: { message: `This clip was already extended, or the scene has reached its maximum of ${config.maxSceneParts} clips` },
			});
		}

		try {
			const frame = await ensureLastFrame(claimed);
			const { durationSeconds, resolution } = normalizeRequest({ ...value, referenceCount: 0 });
			const creditsReserved = estimateCost(durationSeconds);
			await reserveCredits(req.user._id, creditsReserved);

			try {
				const sceneId = parent.sceneId || parent._id;
				if (!parent.sceneId) await Job.updateOne({ _id: parent._id }, { $set: { sceneId, sequence: 0 } });

				const job = await Job.create({
					_id: childId,
					user: req.user._id,
					provider: config.videoProvider,
					prompt: value.prompt,
					imageIds: [frame._id],
					imageMode: 'first_frame',
					durationSeconds,
					resolution,
					creditsReserved,
					parentJob: parent._id,
					sceneId,
					sequence: (parent.sequence || 0) + 1,
				});
				await enqueueVideoJob(job._id.toString());

				return res.status(201).json({ success: true, data: await serializeJob(job) });
			} catch (err) {
				await refundCredits(req.user._id, creditsReserved);
				throw err;
			}
		} catch (err) {
			await releaseExtensionClaim(parent._id, childId);
			throw err;
		}
	} catch (err) {
		next(err);
	}
}

// Joins every finished clip of a scene, in order, into one downloadable video.
export async function exportSceneVideo(req, res, next) {
	try {
		if (!mongoose.isValidObjectId(req.params.sceneId)) {
			return res.status(400).json({ success: false, error: { message: 'Invalid scene id' } });
		}
		res.json({ success: true, data: await exportScene(req.params.sceneId, req.user._id) });
	} catch (err) {
		next(err);
	}
}

const ACTIVE_STATUSES = ['queued', 'processing'];

// One entry per scene (a clip that was never extended is a scene of one), newest activity first. Grouping happens in
// the database so a scene's older clips can't fall off the end of a paginated job list.
export async function listScenes(req, res, next) {
	try {
		const page = Math.max(1, Number(req.query.page || 1));
		const limit = Math.min(60, Math.max(1, Number(req.query.limit || 24)));
		const scoped = [{ $match: { user: req.user._id } }, { $addFields: { scene: { $ifNull: ['$sceneId', '$_id'] } } }];

		const [groups, totals] = await Promise.all([
			Job.aggregate([
				...scoped,
				{ $sort: { sequence: 1, createdAt: 1 } },
				{
					$group: {
						_id: '$scene',
						title: { $first: '$prompt' },
						lastActivity: { $max: '$updatedAt' },
						clips: { $push: { id: '$_id', status: '$status', seconds: '$durationSeconds' } },
					},
				},
				{ $sort: { lastActivity: -1 } },
				{ $skip: (page - 1) * limit },
				{ $limit: limit },
			]),
			Job.aggregate([...scoped, { $group: { _id: '$scene' } }, { $count: 'total' }]),
		]);

		// The cover is the newest finished clip (or the newest clip if none has finished yet).
		const summaries = groups.map((group) => {
			const completed = group.clips.filter((clip) => clip.status === 'completed');
			const active = group.clips.some((clip) => ACTIVE_STATUSES.includes(clip.status));
			return {
				sceneId: group._id,
				title: group.title,
				status: active ? 'processing' : completed.length ? 'completed' : 'failed',
				parts: completed.length,
				totalSeconds: completed.reduce((sum, clip) => sum + clip.seconds, 0),
				lastActivity: group.lastActivity,
				coverId: (completed.at(-1) || group.clips.at(-1)).id,
			};
		});

		const covers = await serializeJobs(await Job.find({ _id: { $in: summaries.map((summary) => summary.coverId) } }));
		const coverById = new Map(covers.map((cover) => [cover._id.toString(), cover]));

		res.json({
			success: true,
			data: {
				scenes: summaries.map(({ coverId, ...summary }) => ({ ...summary, cover: coverById.get(coverId.toString()) })),
				total: totals[0]?.total ?? 0,
				page,
				limit,
			},
		});
	} catch (err) {
		next(err);
	}
}

// A scene with its clips in order. Videos made before scenes existed have no sceneId, so a clip's own id also
// identifies it as a scene of one.
export async function getScene(req, res, next) {
	try {
		if (!mongoose.isValidObjectId(req.params.sceneId)) {
			return res.status(400).json({ success: false, error: { message: 'Invalid scene id' } });
		}
		const sceneId = new mongoose.Types.ObjectId(req.params.sceneId);

		const jobs = await Job.find({ user: req.user._id, $or: [{ sceneId }, { _id: sceneId }] }).sort({ sequence: 1, createdAt: 1 });
		if (jobs.length === 0) return res.status(404).json({ success: false, error: { message: 'Scene not found' } });

		const clips = await serializeJobs(jobs);
		const completed = clips.filter((clip) => clip.status === 'completed');
		res.json({
			success: true,
			data: {
				sceneId,
				title: clips[0].prompt,
				clips,
				parts: completed.length,
				totalSeconds: completed.reduce((sum, clip) => sum + clip.durationSeconds, 0),
			},
		});
	} catch (err) {
		next(err);
	}
}
