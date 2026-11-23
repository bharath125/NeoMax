import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { config } from '../config/index.js';

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 120_000;

async function run(binary, args) {
	try {
		return await execFileAsync(binary, args, { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });
	} catch (err) {
		if (err.code === 'ENOENT') {
			const missing = new Error('Video processing is not available on this server (ffmpeg is not installed)');
			missing.statusCode = 503;
			throw missing;
		}
		throw new Error(`${path.basename(binary)} failed: ${(err.stderr || err.message).toString().trim().slice(-400)}`);
	}
}

async function withTempDir(fn) {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neomax-'));
	try {
		return await fn(dir);
	} finally {
		await fs.rm(dir, { recursive: true, force: true });
	}
}

// Seeks to just before the end and keeps overwriting one output image, so the file that remains is the final frame.
export function extractLastFrame(videoBuffer) {
	return withTempDir(async (dir) => {
		const input = path.join(dir, 'in.mp4');
		const output = path.join(dir, 'last.jpg');
		await fs.writeFile(input, videoBuffer);
		await run(config.ffmpegPath, ['-y', '-v', 'error', '-sseof', '-0.5', '-i', input, '-update', '1', '-q:v', '2', output]);
		return fs.readFile(output);
	});
}

async function probe(file) {
	const { stdout } = await run(config.ffprobePath, [
		'-v', 'error',
		'-show_entries', 'stream=codec_type,width,height',
		'-of', 'json',
		file,
	]);
	const streams = JSON.parse(stdout).streams || [];
	const video = streams.find((s) => s.codec_type === 'video');
	return { width: video?.width, height: video?.height, hasAudio: streams.some((s) => s.codec_type === 'audio') };
}

// Joins clips end to end. Clips are normalised to the first clip's size and frame rate before joining so a clip
// generated at a different resolution can't break the output. Audio is kept only if every clip has it.
export function concatVideos(videoBuffers) {
	return withTempDir(async (dir) => {
		const inputs = [];
		for (const [index, buffer] of videoBuffers.entries()) {
			const file = path.join(dir, `clip${index}.mp4`);
			await fs.writeFile(file, buffer);
			inputs.push(file);
		}

		const infos = await Promise.all(inputs.map(probe));
		const { width, height } = infos[0];
		const withAudio = infos.every((info) => info.hasAudio);

		const filters = inputs.map(
			(_, i) =>
				`[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p[v${i}]` +
				(withAudio ? `;[${i}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}]` : ''),
		);
		const joined = inputs.map((_, i) => `[v${i}]${withAudio ? `[a${i}]` : ''}`).join('');
		const filterGraph = `${filters.join(';')};${joined}concat=n=${inputs.length}:v=1:a=${withAudio ? 1 : 0}[v]${withAudio ? '[a]' : ''}`;

		const output = path.join(dir, 'scene.mp4');
		await run(config.ffmpegPath, [
			'-y', '-v', 'error',
			...inputs.flatMap((file) => ['-i', file]),
			'-filter_complex', filterGraph,
			'-map', '[v]',
			...(withAudio ? ['-map', '[a]', '-c:a', 'aac'] : []),
			'-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
			'-movflags', '+faststart',
			output,
		]);
		return fs.readFile(output);
	});
}
