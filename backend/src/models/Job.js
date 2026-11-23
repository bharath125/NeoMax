import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		provider: { type: String, required: true },
		prompt: { type: String, required: true },
		imageUrl: { type: String },
		// Images the user attached (uploaded or generated). Stored as ids, not URLs: the bucket is private, so the worker
		// signs fresh URLs at run time instead of trusting ones that may have expired in the queue.
		imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
		imageMode: { type: String, enum: ['first_frame', 'reference'] },

		// Extend scene: clips of one scene share sceneId (the first clip's own _id). A clip continues from its parent's
		// last frame; extendedBy points at the clip that continued this one, which also stops it being extended twice.
		parentJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
		sceneId: { type: mongoose.Schema.Types.ObjectId, index: true },
		sequence: { type: Number, default: 0 },
		extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
		lastFrameImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
		durationSeconds: { type: Number, required: true, default: 5 },
		resolution: { type: String, default: '720p' },

		status: {
			type: String,
			enum: ['queued', 'processing', 'completed', 'failed'],
			default: 'queued',
			index: true,
		},
		providerJobId: { type: String },
		providerTaskType: { type: String },
		resultKey: { type: String },
		error: { type: String },

		creditsReserved: { type: Number, required: true },
	},
	{ timestamps: true },
);

export const Job = mongoose.model('Job', jobSchema);
