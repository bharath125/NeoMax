import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { config } from '../config/index.js';

const s3 = new S3Client({
	region: config.s3.region,
	endpoint: config.s3.endpoint || undefined,
	credentials: {
		accessKeyId: config.s3.accessKeyId,
		secretAccessKey: config.s3.secretAccessKey,
	},
});

export async function uploadVideoFromUrl(remoteUrl, key) {
	const response = await axios.get(remoteUrl, { responseType: 'arraybuffer' });

	await s3.send(
		new PutObjectCommand({
			Bucket: config.s3.bucket,
			Key: key,
			Body: response.data,
			ContentType: 'video/mp4',
		}),
	);

	return `${config.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
}
