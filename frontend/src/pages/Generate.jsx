import { useState } from 'react';
import { useGenerateVideo } from '../hooks/useGenerateVideo.js';

export function Generate() {
	const [prompt, setPrompt] = useState('');
	// TODO: replace with a real pre-signed S3 upload flow — v1 accepts a hosted image URL directly.
	const [imageUrl, setImageUrl] = useState('');
	const [durationSeconds, setDurationSeconds] = useState(5);
	const mutation = useGenerateVideo();

	async function handleSubmit(e) {
		e.preventDefault();
		mutation.mutate({ prompt, imageUrl: imageUrl || undefined, durationSeconds });
	}

	return (
		<div className="max-w-xl mx-auto mt-12 flex flex-col gap-4">
			<h1 className="text-2xl font-semibold">Generate a video</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-3">
				<textarea
					placeholder="Describe the video you want…"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					className="border rounded-md px-3 py-2 h-28"
					required
				/>
				<input
					type="url"
					placeholder="Optional source image URL"
					value={imageUrl}
					onChange={(e) => setImageUrl(e.target.value)}
					className="border rounded-md px-3 py-2"
				/>
				<label className="text-sm text-gray-600">
					Duration: {durationSeconds}s
					<input
						type="range"
						min={1}
						max={15}
						value={durationSeconds}
						onChange={(e) => setDurationSeconds(Number(e.target.value))}
						className="w-full"
					/>
				</label>
				{mutation.isError && (
					<p className="text-sm text-red-600">
						{mutation.error?.response?.data?.error?.message || 'Something went wrong'}
					</p>
				)}
				{mutation.isSuccess && <p className="text-sm text-green-600">Job queued — check the dashboard for progress.</p>}
				<button
					type="submit"
					disabled={mutation.isPending}
					className="bg-black text-white rounded-md py-2 disabled:opacity-50"
				>
					{mutation.isPending ? 'Queuing…' : 'Generate'}
				</button>
			</form>
		</div>
	);
}
