import { Link } from 'react-router-dom';
import { Icon, Spinner } from './Icon.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { formatElapsed, timeAgo } from '../lib/format.js';
import { isActive } from '../lib/jobs.js';
import { useNow } from '../hooks/useNow.js';
import { useRefreshJobUrls } from '../hooks/useJobPolling.js';
import { useRef } from 'react';

// One library card per scene. A scene with several clips is drawn as a small stack, and opening it shows every clip.
export function SceneCard({ scene }) {
	const videoRef = useRef(null);
	const refreshUrls = useRefreshJobUrls();
	const { cover } = scene;
	const multi = scene.parts > 1;
	const coverPlayable = cover.status === 'completed' && cover.resultUrl;
	const coverActive = isActive(cover);
	const now = useNow(coverActive);

	const play = () => videoRef.current?.play().catch(() => {});
	const stop = () => {
		const video = videoRef.current;
		if (!video) return;
		video.pause();
		video.currentTime = 0.1;
	};

	return (
		<Link
			to={`/library/${scene.sceneId}`}
			onMouseEnter={play}
			onMouseLeave={stop}
			onFocus={play}
			onBlur={stop}
			aria-label={`Open ${multi ? `scene with ${scene.parts} clips` : 'video'}: ${scene.title}`}
			className="group relative block animate-fade-up focus-visible:outline-none"
		>
			{/* The stacked edges behind the card signal that there is more than one clip inside. */}
			{multi && (
				<>
					<span aria-hidden="true" className="absolute inset-x-4 -top-2 h-4 rounded-t-2xl border border-white/10 bg-white/[0.04]" />
					<span aria-hidden="true" className="absolute inset-x-2 -top-1 h-4 rounded-t-2xl border border-white/10 bg-white/[0.07]" />
				</>
			)}

			<article className="card relative flex h-full flex-col overflow-hidden transition group-hover:border-white/25 group-focus-visible:ring-2 group-focus-visible:ring-violet-400">
				<div className="relative aspect-video bg-ink-900">
					{coverPlayable && (
						<video
							ref={videoRef}
							src={`${cover.resultUrl}#t=0.1`}
							preload="metadata"
							muted
							loop
							playsInline
							onError={refreshUrls}
							className="h-full w-full object-cover"
						/>
					)}

					{coverActive && !coverPlayable && (
						<div className="skeleton absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
							<Spinner className="h-6 w-6 text-violet-300" />
							<p className="text-sm font-medium">{cover.status === 'queued' ? 'Waiting in queue…' : 'Creating your video…'}</p>
							<p className="font-mono text-xs text-slate-400">{formatElapsed(now - new Date(cover.createdAt).getTime())}</p>
						</div>
					)}

					{scene.status === 'failed' && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-rose-500/5 px-6 text-center">
							<span className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/15 text-rose-300">
								<Icon name="alert" className="h-5 w-5" />
							</span>
							<p className="text-sm font-medium text-rose-200">Couldn&apos;t create this video</p>
							<p className="text-xs text-slate-400">Your credits were refunded.</p>
						</div>
					)}

					{coverPlayable && (
						<span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/20">
							<span className="grid h-12 w-12 place-items-center rounded-full bg-snow/90 text-[#07070d] opacity-90 shadow-xl transition group-hover:scale-110">
								<Icon name="play" className="ml-0.5 h-5 w-5" filled />
							</span>
						</span>
					)}

					{multi && (
						<span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-snow backdrop-blur">
							<Icon name="link" className="h-3 w-3" />
							{scene.parts} clips · {scene.totalSeconds}s
						</span>
					)}

					{/* A continuation is being made while the cover still plays: say so without hiding the video. */}
					{scene.status === 'processing' && coverPlayable && (
						<span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-[#07070d]">
							<Spinner className="h-3 w-3" />
							Making next clip
						</span>
					)}
				</div>

				<div className="flex flex-1 flex-col gap-3 p-4">
					<div className="flex items-center justify-between gap-2">
						<StatusBadge status={scene.status} />
						<span className="inline-flex items-center gap-1 text-xs text-slate-500">
							<Icon name="clock" className="h-3.5 w-3.5" />
							{timeAgo(scene.lastActivity)}
						</span>
					</div>
					<p className="line-clamp-2 text-sm text-slate-200" title={scene.title}>
						{scene.title}
					</p>
					<div className="mt-auto flex items-center justify-between text-xs text-slate-500">
						<span>{multi ? `${scene.parts} clips · ${scene.totalSeconds}s` : `${cover.durationSeconds}s · ${cover.resolution}`}</span>
						<span className="inline-flex items-center gap-1 font-medium text-violet-300">
							Open
							<Icon name="arrowRight" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
						</span>
					</div>
				</div>
			</article>
		</Link>
	);
}

export function SceneCardSkeleton() {
	return (
		<div className="card overflow-hidden" aria-hidden="true">
			<div className="skeleton aspect-video" />
			<div className="space-y-3 p-4">
				<div className="skeleton h-5 w-24 rounded-full" />
				<div className="skeleton h-4 w-full rounded" />
				<div className="skeleton h-4 w-2/3 rounded" />
			</div>
		</div>
	);
}
