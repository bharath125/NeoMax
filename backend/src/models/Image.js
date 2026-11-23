import mongoose from 'mongoose';

// Prompt, model and aspect ratio only exist for text-to-image results; uploads and extracted frames have none.
function isGeneratedImage() {
	return this.source === 'generated';
}

const imageSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		// 'generated' images come from text-to-image; 'uploaded' ones are the user's own files; 'frame' images are the last
		// frame of a finished video (used to extend it) and stay out of the user's image lists. Both can be attached
		// to a video, so they share a collection. Records created before this field existed are generated images.
		source: { type: String, enum: ['generated', 'uploaded', 'frame'], default: 'generated', index: true },
		prompt: { type: String, required: isGeneratedImage },
		model: { type: String, required: isGeneratedImage },
		aspectRatio: { type: String, required: isGeneratedImage },
		originalName: { type: String },
		size: { type: Number },

		key: { type: String, required: true },
		mediaType: { type: String, required: true },
		// Provider-reported cost in USD (0 for free models) — for our own margin tracking.
		costUsd: { type: Number, default: 0 },
		creditsCharged: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

export const Image = mongoose.model('Image', imageSchema);
