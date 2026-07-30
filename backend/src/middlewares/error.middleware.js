import { logger } from '../utils/logger.js';

export function errorMiddleware(err, req, res, next) {
	logger.error(err.stack || err.message);
	const status = err.statusCode || 500;
	res.status(status).json({
		success: false,
		error: { message: err.message || 'Internal server error' },
	});
}
