import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';

export const VIDEO_QUEUE_NAME = 'video-generation';

export const videoQueue = new Queue(VIDEO_QUEUE_NAME, { connection: redisConnection });

export async function enqueueVideoJob(jobId) {
	await videoQueue.add(
		'generate',
		{ jobId },
		{ attempts: 1, removeOnComplete: 500, removeOnFail: 500 },
	);
}
