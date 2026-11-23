import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Image } from '../models/Image.js';
import { uploadBuffer } from './storage.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export class UploadError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
	}
}

// Identify the file from its bytes. The Content-Type header is client-controlled, so it is never trusted on its own.
export function sniffImageType(buffer) {
	if (buffer.length < 12) return null;
	if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return { mediaType: 'image/png', ext: 'png' };
	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mediaType: 'image/jpeg', ext: 'jpg' };
	if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { mediaType: 'image/webp', ext: 'webp' };
	return null;
}

export async function saveUpload({ user, buffer, originalName }) {
	const type = sniffImageType(buffer);
	if (!type) throw new UploadError('Unsupported image. Please upload a PNG, JPEG or WebP file.', 415);

	const uploadedToday = await Image.countDocuments({
		user: user._id,
		source: 'uploaded',
		createdAt: { $gte: new Date(Date.now() - DAY_MS) },
	});
	if (uploadedToday >= config.uploads.dailyLimitPerUser) {
		throw new UploadError(`You’ve reached today’s limit of ${config.uploads.dailyLimitPerUser} uploads. Try again tomorrow.`, 429);
	}

	const _id = new mongoose.Types.ObjectId();
	const key = `uploads/${_id}.${type.ext}`;
	await uploadBuffer(buffer, key, type.mediaType);

	return Image.create({
		_id,
		user: user._id,
		source: 'uploaded',
		key,
		mediaType: type.mediaType,
		size: buffer.length,
		originalName: originalName?.slice(0, 120),
	});
}
