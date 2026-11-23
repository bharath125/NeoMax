import { saveUpload } from '../services/upload.service.js';
import { resolveAssetUrl } from '../services/storage.service.js';

// Expects the raw file bytes as the request body (see upload.routes.js); one file per request.
export async function uploadImage(req, res, next) {
	try {
		if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
			return res.status(415).json({ success: false, error: { message: 'Send a PNG, JPEG or WebP image as the request body' } });
		}

		let originalName;
		try {
			originalName = req.headers['x-file-name'] ? decodeURIComponent(req.headers['x-file-name']) : undefined;
		} catch {
			originalName = undefined;
		}

		const image = await saveUpload({ user: req.user, buffer: req.body, originalName });
		const { key, ...rest } = image.toObject();
		res.status(201).json({ success: true, data: { ...rest, url: await resolveAssetUrl(key) } });
	} catch (err) {
		next(err);
	}
}
