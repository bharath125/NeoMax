import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		provider: { type: String, required: true },
		prompt: { type: String, required: true },
		imageUrl: { type: String },
		durationSeconds: { type: Number, required: true, default: 5 },
		resolution: { type: String, enum: ['720p', '1080p'], default: '720p' },

		status: {
			type: String,
			enum: ['queued', 'processing', 'completed', 'failed'],
			default: 'queued',
			index: true,
		},
		providerJobId: { type: String },
		resultUrl: { type: String },
		error: { type: String },

		creditsReserved: { type: Number, required: true },
	},
	{ timestamps: true },
);

export const Job = mongoose.model('Job', jobSchema);
