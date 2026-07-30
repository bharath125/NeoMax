import { Worker } from 'bullmq';
import { config } from '../config/index.js';
import { connectDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { redisConnection } from './connection.js';
import { VIDEO_QUEUE_NAME } from './generateVideo.queue.js';
import { Job } from '../models/Job.js';
import { getProvider } from '../services/videoGeneration.service.js';
import { uploadVideoFromUrl } from '../services/storage.service.js';
import { refundCredits } from '../services/credits.service.js';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // Kling generations can take minutes; bail out rather than hang forever.

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilDone(provider, providerJobId) {
	const deadline = Date.now() + POLL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		const result = await provider.getStatus(providerJobId);
		if (result.status !== 'processing') return result;
		await sleep(POLL_INTERVAL_MS);
	}
	return { status: 'failed', error: 'Timed out waiting for provider' };
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
		const { providerJobId } = await provider.createGeneration({
			prompt: job.prompt,
			imageUrl: job.imageUrl,
			durationSeconds: job.durationSeconds,
			resolution: job.resolution,
		});
		job.providerJobId = providerJobId;
		await job.save();

		const result = await pollUntilDone(provider, providerJobId);
		if (result.status !== 'completed') {
			throw new Error(result.error || 'Generation failed');
		}

		const resultUrl = await uploadVideoFromUrl(result.videoUrl, `${job._id}.mp4`);

		job.status = 'completed';
		job.resultUrl = resultUrl;
		await job.save();
		logger.info(`Job ${job._id} completed`);
	} catch (err) {
		job.status = 'failed';
		job.error = err.message;
		await job.save();
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
