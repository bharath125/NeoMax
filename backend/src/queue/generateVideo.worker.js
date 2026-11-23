import { Worker } from 'bullmq';
import { config } from '../config/index.js';
import { connectDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { redisConnection } from './connection.js';
import { VIDEO_QUEUE_NAME } from './generateVideo.queue.js';
import { Job } from '../models/Job.js';
import { Image } from '../models/Image.js';
import { getProvider } from '../services/videoGeneration.service.js';
import { downloadFile, resolveAssetUrl, uploadBuffer } from '../services/storage.service.js';
import { CONTINUITY_PREFIX, captureLastFrame, releaseExtensionClaim } from '../services/scene.service.js';
import { refundCredits } from '../services/credits.service.js';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // Kling generations can take minutes; bail out rather than hang forever.

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilDone(provider, providerJobId, taskType) {
	const deadline = Date.now() + POLL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		const result = await provider.getStatus(providerJobId, taskType);
		if (result.status !== 'processing') return result;
		await sleep(POLL_INTERVAL_MS);
	}
	return { status: 'failed', error: 'Timed out waiting for provider' };
}

// Attached images are stored by id; sign fresh URLs now so the provider can fetch them even if the job sat in the queue.
async function resolveJobImages(job) {
	if (!job.imageIds?.length) return { imageUrl: job.imageUrl, referenceUrls: [] };

	const images = await Image.find({ _id: { $in: job.imageIds } });
	const keyById = new Map(images.map((image) => [image._id.toString(), image.key]));
	const urls = await Promise.all(
		job.imageIds.map((id) => {
			const key = keyById.get(id.toString());
			if (!key) throw new Error('An attached image is no longer available');
			return resolveAssetUrl(key);
		}),
	);

	return job.imageMode === 'first_frame' ? { imageUrl: urls[0], referenceUrls: [] } : { imageUrl: undefined, referenceUrls: urls };
}

async function processVideoJob({ data }) {
	const job = await Job.findById(data.jobId);
	if (!job) {
		logger.error(`Job ${data.jobId} not found`);
		return;
	}

	try {
		job.status = 'processing';
		await job.save();

		const provider = getProvider(job.provider);
		const { imageUrl, referenceUrls } = await resolveJobImages(job);
		const { providerJobId, taskType } = await provider.createGeneration({
			// A continuation always starts from its parent's last frame; tell the model to keep the scene consistent.
			prompt: job.parentJob ? `${CONTINUITY_PREFIX} ${job.prompt}` : job.prompt,
			imageUrl,
			referenceUrls,
			durationSeconds: job.durationSeconds,
			resolution: job.resolution,
		});
		job.providerJobId = providerJobId;
		job.providerTaskType = taskType;
		await job.save();

		const result = await pollUntilDone(provider, providerJobId, taskType);
		if (result.status !== 'completed') {
			throw new Error(result.error || 'Generation failed');
		}

		const video = await downloadFile(result.videoUrl, result.videoHeaders);
		const resultKey = await uploadBuffer(video, `${job._id}.mp4`, 'video/mp4');

		job.status = 'completed';
		job.resultKey = resultKey;
		await job.save();
		logger.info(`Job ${job._id} completed`);

		// Best effort: save the last frame now so "Extend" is instant later. A missing frame never fails the video —
		// it is re-created on demand when the user extends.
		try {
			await captureLastFrame(job, video);
		} catch (err) {
			logger.warn(`Could not save last frame for job ${job._id}: ${err.message}`);
		}
	} catch (err) {
		job.status = 'failed';
		job.error = err.message;
		await job.save();
		// A failed continuation frees its parent so the user can try extending again.
		if (job.parentJob) await releaseExtensionClaim(job.parentJob, job._id);
		await refundCredits(job.user, job.creditsReserved, job._id);
		logger.error(`Job ${job._id} failed: ${err.message}`);
	}
}

async function start() {
	await connectDb();
	const worker = new Worker(VIDEO_QUEUE_NAME, processVideoJob, {
		connection: redisConnection,
		concurrency: 3,
	});
	worker.on('failed', (bullJob, err) => logger.error(`Worker error on ${bullJob?.id}: ${err.message}`));
	logger.info('Video generation worker started');
}

start();
