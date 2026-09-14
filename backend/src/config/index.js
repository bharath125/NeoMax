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
		// Kling authenticates with a short-lived JWT signed by an Access Key / Secret Key pair,
		// not a static API key — see services/providers/kling.provider.js.
		accessKey: process.env.KLING_ACCESS_KEY || '',
		secretKey: process.env.KLING_SECRET_KEY || '',
		baseUrl: process.env.KLING_API_BASE_URL || 'https://api.klingai.com',
	},
	creditCostPerSecond: Number(process.env.CREDIT_COST_PER_SECOND || 8),

	s3: {
		endpoint: process.env.S3_ENDPOINT || '',
		region: process.env.S3_REGION || 'auto',
		accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
		bucket: process.env.S3_BUCKET || 'viewmax-videos',
		publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
	},

	stripe: {
		secretKey: process.env.STRIPE_SECRET_KEY || '',
		webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
	},
};
