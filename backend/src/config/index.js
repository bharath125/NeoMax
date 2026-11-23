import dotenv from 'dotenv';

dotenv.config();

export const config = {
	port: Number(process.env.PORT || 4000),
	frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

	mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/viewmax',

	jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

	redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

	videoProvider: process.env.VIDEO_PROVIDER || 'kling',
	kling: {
		apiKey: process.env.KLING_API_KEY || '',
		baseUrl: process.env.KLING_API_BASE_URL || 'https://api.klingai.com',
	},
	openrouter: {
		apiKey: process.env.OPENROUTER_API_KEY || '',
		baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
		model: process.env.OPENROUTER_VIDEO_MODEL || 'heygen/heygen-video-1',
		// Free text-to-image model. OpenRouter caps ':free' models at 50 requests/day per account (1000 once you have
		// bought $10+ of credits), shared by every user — hence the per-user limit below.
		// Video model used when the user supplies reference images (input_references). HeyGen charges ~2.8x per second
		// in reference mode plus $0.04/image; Wan 3.0 prices reference-guided video the same as a normal clip.
		referenceModel: process.env.OPENROUTER_REFERENCE_MODEL || 'alibaba/wan-3.0',
		imageModel: process.env.OPENROUTER_IMAGE_MODEL || 'recraft/recraft-v4.1-flash-v2:free',
	},
	images: {
		dailyLimitPerUser: Number(process.env.IMAGE_DAILY_LIMIT_PER_USER || 10),
		// 0 while the image model is free. Set > 0 if you switch to a paid model.
		creditCost: Number(process.env.IMAGE_CREDIT_COST || 0),
	},
	google: {
		clientId: process.env.GOOGLE_CLIENT_ID || '',
	},
	creditCostPerSecond: Number(process.env.CREDIT_COST_PER_SECOND || 8),
	// PLACEHOLDER: ~2.8x the base rate, matching Wan 3.0 720p ($0.10/s) vs HeyGen 768p ($0.036/s). Tune with pricing.
	creditCostPerSecondReference: Number(process.env.CREDIT_COST_PER_SECOND_REFERENCE || 22),
	// Images a user can attach to one video (first frame, or references).
	maxImagesPerVideo: 6,
	// Clips in one extended scene. Every extension is a full paid generation, so this also caps runaway spend.
	maxSceneParts: Number(process.env.MAX_SCENE_PARTS || 10),
	ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
	ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
	uploads: {
		maxFileBytes: 10 * 1024 * 1024,
		dailyLimitPerUser: Number(process.env.UPLOAD_DAILY_LIMIT_PER_USER || 60),
	},

	s3: {
		endpoint: process.env.S3_ENDPOINT || '',
		region: process.env.S3_REGION || 'auto',
		accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
		bucket: process.env.S3_BUCKET || 'viewmax-videos',
		publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
	},

	paymentProvider: process.env.PAYMENT_PROVIDER || 'razorpay',
	billing: {
		currency: process.env.BILLING_CURRENCY || 'INR',
	},
	razorpay: {
		keyId: process.env.RAZORPAY_KEY_ID || '',
		keySecret: process.env.RAZORPAY_KEY_SECRET || '',
		webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
	},
};
