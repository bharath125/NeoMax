import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useScene, useExportScene } from '../hooks/useScenes.js';
import { usePricing } from '../hooks/usePricing.js';
import { useRefreshJobUrls } from '../hooks/useJobPolling.js';
import { ClipTile } from '../components/ClipTile.jsx';
import { ExtendPanel } from '../components/ExtendPanel.jsx';
import { VideoModal } from '../components/VideoModal.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon, Spinner } from '../components/Icon.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { apiErrorMessage, isActive } from '../lib/jobs.js';
import { formatElapsed } from '../lib/format.js';
import { useNow } from '../hooks/useNow.js';

const partNumber = (clip) => (clip.sequence || 0) + 1;

// A failed attempt that was retried is noise; keep it only while it is the latest word on that part.
function withoutSupersededFailures(clips) {
	return clips.filter(
		(clip) =>
			!(clip.status === 'failed' && clips.some((other) => other !== clip && (other.sequence || 0) === (clip.sequence || 0) && new Date(other.createdAt) > new Date(clip.createdAt))),
	);
}

export function Scene() {
	const { sceneId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();
	const pricing = usePricing();
	const refreshUrls = useRefreshJobUrls();
	const exportScene = useExportScene();
	const extendRef = useRef(null);

	const { data, isLoading, isError, error, refetch } = useScene(sceneId);
	const [selectedId, setSelectedId] = useState(null);
	const [autoPlay, setAutoPlay] = useState(false);
	const [exportedVideo, setExportedVideo] = useState(null);

	const clips = useMemo(() => withoutSupersededFailures(data?.clips ?? []), [data]);
	const playable = clips.filter((clip) => clip.status === 'completed' && clip.resultUrl);
	// Default to the newest finished clip: that is what the user just made.
	const selected = clips.find((clip) => clip._id === selectedId) || playable.at(-1) || clips.at(-1);
	const selectedActive = selected ? isActive(selected) : false;
	const now = useNow(selectedActive);

	const extendFrom = clips.filter((clip) => clip.status === 'completed' && clip.canExtend).at(-1);
	const generating = clips.some(isActive);
	// The server allows at most maxSceneParts clips per scene.
	const atMaxLength = !extendFrom && !generating && playable.length >= pricing.maxSceneParts;

	// Arriving from "Extend scene" elsewhere: bring the form into view.
	useEffect(() => {
		if (location.state?.focus === 'extend' && extendFrom) {
			extendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			extendRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
		}
	}, [location.state?.focus, Boolean(extendFrom)]);

	function selectClip(clip, { play = true } = {}) {
		setSelectedId(clip._id);
		setAutoPlay(play && clip.status === 'completed');
	}

	function playAll() {
		if (playable.length > 0) selectClip(playable[0]);
	}

	// Plays the scene straight through: when a clip ends, move on to the next finished one.
	function handleEnded() {
		const index = playable.findIndex((clip) => clip._id === selected?._id);
		const next = playable[index + 1];
		if (next) selectClip(next);
	}

	function handleExport() {
		exportScene.mutate(sceneId, {
			onSuccess: ({ url, clips: count }) => setExportedVideo({ _id: sceneId, prompt: `Full scene — ${count} clips joined`, resultUrl: url }),
			onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t join the clips. Please try again.')),
		});
	}

	if (isLoading) {
		return (
			<div className="animate-fade-up space-y-6" aria-busy="true" aria-label="Loading scene">
				<div className="skeleton h-8 w-64 rounded" />
				<div className="skeleton aspect-video w-full rounded-2xl" />
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => (
						<div key={i} className="skeleton aspect-video rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	if (isError) {
		const missing = error?.response?.status === 404;
		return (
			<div className="animate-fade-up">
				<Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
					<Icon name="arrowRight" className="h-4 w-4 rotate-180" />
					Library
				</Link>
				<div className="card flex flex-col items-center px-6 py-14 text-center" role="alert">
					<span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
						<Icon name="alert" className="h-6 w-6" />
					</span>
					<p className="font-semibold">{missing ? 'We couldn’t find that video' : 'We couldn’t load this scene'}</p>
					<p className="mt-1 text-sm text-slate-400">{missing ? 'It may have been removed, or the link is wrong.' : 'Check your connection and try again.'}</p>
					{!missing && (
						<button type="button" onClick={() => refetch()} className="btn-ghost mt-5">
							Try again
						</button>
					)}
				</div>
			</div>
		);
	}

	const multi = data.parts > 1;

	return (
		<div className="animate-fade-up">
			<Link to="/library" className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
				<Icon name="arrowRight" className="h-4 w-4 rotate-180" />
				Library
			</Link>

			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h1 className="line-clamp-2 text-2xl font-bold tracking-tight sm:text-3xl" title={data.title}>
						{data.title}
					</h1>
					<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
						<span>
							{data.parts} {data.parts === 1 ? 'clip' : 'clips'}
						</span>
						<span aria-hidden="true">·</span>
						<span>{data.totalSeconds}s total</span>
						{generating && (
							<span className="inline-flex items-center gap-1.5 text-amber-300">
								<Spinner className="h-3.5 w-3.5" />
								Generating…
							</span>
						)}
					</p>
				</div>
				{multi && (
					<div className="flex flex-wrap gap-2">
						<button type="button" onClick={playAll} className="btn-ghost">
							<Icon name="play" className="h-4 w-4" filled />
							Play all
						</button>
						<button type="button" onClick={handleExport} disabled={exportScene.isPending} className="btn-primary">
							{exportScene.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="download" className="h-4 w-4" />}
							{exportScene.isPending ? 'Joining clips…' : 'Download full scene'}
						</button>
					</div>
				)}
			</header>

			{clips.length === 0 && <EmptyState icon="film" title="Nothing here yet" description="This scene has no clips." actionLabel="Create a video" actionTo="/generate" />}

			{selected && (
				<section aria-label="Player" className="mb-8">
					{selected.status === 'completed' && selected.resultUrl ? (
						<video
							key={selected._id}
							src={selected.resultUrl}
							controls
							autoPlay={autoPlay}
							playsInline
							onEnded={handleEnded}
							onError={refreshUrls}
							className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
						/>
					) : selectedActive ? (
						<div className="skeleton grid aspect-video w-full place-items-center rounded-2xl border border-white/10" aria-live="polite">
							<div className="flex flex-col items-center gap-3 text-center">
								<Spinner className="h-8 w-8 text-violet-300" />
								<p className="font-medium text-slate-100">{selected.status === 'queued' ? 'Waiting for a free slot…' : `Rendering Part ${partNumber(selected)}…`}</p>
								<p className="font-mono text-sm text-slate-400">{formatElapsed(now - new Date(selected.createdAt).getTime())}</p>
							</div>
						</div>
					) : (
						<div className="card flex aspect-video w-full flex-col items-center justify-center gap-2 px-6 text-center" role="alert">
							<span className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
								<Icon name="alert" className="h-6 w-6" />
							</span>
							<p className="font-medium text-rose-200">We couldn’t create Part {partNumber(selected)}</p>
							<p className="text-sm text-slate-400">Your {selected.creditsReserved} credits were refunded. You can try again below.</p>
						</div>
					)}

					<div className="mt-4 flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="mb-1 flex items-center gap-2">
								<span className="text-sm font-semibold">Part {partNumber(selected)}</span>
								<StatusBadge status={selected.status} />
								<span className="text-xs text-slate-500">
									{selected.durationSeconds}s · {selected.resolution}
								</span>
							</div>
							<p className="text-sm text-slate-400">{selected.prompt}</p>
						</div>
						{selected.status === 'completed' && selected.resultUrl && (
							<div className="flex gap-2">
								<a href={selected.resultUrl} download={`neomax-${selected._id}.mp4`} target="_blank" rel="noreferrer" className="btn-ghost min-h-[40px] px-4">
									<Icon name="download" className="h-4 w-4" />
									Download
								</a>
								<button type="button" onClick={() => navigate('/generate', { state: { prompt: selected.prompt, imageIds: selected.imageIds } })} className="btn-ghost min-h-[40px] px-4">
									<Icon name="remix" className="h-4 w-4" />
									Remix
								</button>
							</div>
						)}
					</div>
				</section>
			)}

			{clips.length > 0 && (
				<section aria-labelledby="timeline" className="mb-10">
					<h2 id="timeline" className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
						Clips
					</h2>
					<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
						{clips.map((clip) => (
							<li key={clip._id}>
								<ClipTile clip={clip} number={partNumber(clip)} selected={clip._id === selected?._id} onSelect={(c) => selectClip(c)} />
							</li>
						))}
						{extendFrom && (
							<li>
								<button
									type="button"
									onClick={() => extendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
									className="grid aspect-video h-full min-h-[100px] w-full place-items-center rounded-xl border-2 border-dashed border-white/15 text-slate-400 transition hover:border-violet-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
								>
									<span className="flex flex-col items-center gap-1 text-xs font-medium">
										<Icon name="plus" className="h-5 w-5" />
										Add Part {partNumber(extendFrom) + 1}
									</span>
								</button>
							</li>
						)}
					</ul>
				</section>
			)}

			{extendFrom && (
				<ExtendPanel
					key={extendFrom._id}
					ref={extendRef}
					from={extendFrom}
					nextNumber={partNumber(extendFrom) + 1}
					onStarted={(clip) => selectClip(clip, { play: false })}
				/>
			)}

			{!extendFrom && generating && (
				<p role="status" className="card flex items-center gap-3 px-5 py-4 text-sm text-slate-300">
					<Spinner className="h-4 w-4 shrink-0 text-violet-300" />
					Your next clip is being created. You can continue the scene as soon as it finishes.
				</p>
			)}

			{atMaxLength && (
				<p role="status" className="card px-5 py-4 text-sm text-slate-300">
					This scene has reached its maximum length of {pricing.maxSceneParts} clips. Download the full scene, or start a new one from the Video page.
				</p>
			)}

			{exportedVideo && <VideoModal job={exportedVideo} onClose={() => setExportedVideo(null)} />}
		</div>
	);
}
