import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { config } from '../config/index.js';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const s3 = new S3Client({
	region: config.s3.region,
	endpoint: config.s3.endpoint || undefined,
	credentials:
		config.s3.accessKeyId && config.s3.secretAccessKey
			? { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey }
			: undefined,
});

export async function downloadFile(url, headers) {
	const response = await axios.get(url, { responseType: 'arraybuffer', headers });
	return Buffer.from(response.data);
}

// Fetches a private object back through a short-lived signed URL (the same mechanism used for playback).
export async function downloadAsset(key) {
	return downloadFile(await resolveAssetUrl(key));
}

// Returns the object key; the bucket stays private and callers turn the key into a playable URL
// with resolveAssetUrl().
export async function uploadBuffer(buffer, key, contentType) {
	await s3.send(new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, Body: buffer, ContentType: contentType }));
	return key;
}

// With S3_PUBLIC_BASE_URL set (CloudFront / R2 public domain) the key maps straight to a public URL;
// otherwise the bucket is private and we hand out a short-lived presigned GET URL.
export async function resolveAssetUrl(key) {
	if (!key) return undefined;
	if (config.s3.publicBaseUrl) return `${config.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;

	return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }), {
		expiresIn: SIGNED_URL_TTL_SECONDS,
	});
}
