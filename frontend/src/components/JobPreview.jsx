import { Link } from 'react-router-dom';
import { Icon, Spinner } from './Icon.jsx';
import { isActive } from '../lib/jobs.js';
import { formatElapsed } from '../lib/format.js';
import { useNow } from '../hooks/useNow.js';
import { useRefreshJobUrls } from '../hooks/useJobPolling.js';

const STEPS = ['Queued', 'Generating', 'Ready'];

function stepIndex(status) {
	if (status === 'completed') return 2;
	if (status === 'processing') return 1;
	return 0;
}

export function JobPreview({ job }) {
	const active = job ? isActive(job) : false;
	const now = useNow(active);
	const refreshUrls = useRefreshJobUrls();

	if (!job) {
		return (
			<div className="card grid aspect-video place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]">
				<div className="px-6 text-center">
					<span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-slate-400">
						<Icon name="film" className="h-7 w-7" />
					</span>
					<p className="font-medium text-slate-200">Your video will appear here</p>
					<p className="mt-1 text-sm text-slate-500">Describe a scene and hit generate.</p>
				</div>
			</div>
		);
	}

	if (job.status === 'completed' && job.resultUrl) {
		return (
			<div className="animate-fade-up space-y-4">
				<video
					key={job._id}
					src={job.resultUrl}
					controls
					autoPlay
					muted
					loop
					playsInline
					onError={refreshUrls}
					className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
				/>
				<div className="flex flex-wrap items-center gap-3">
					<a href={job.resultUrl} download={`neomax-${job._id}.mp4`} target="_blank" rel="noreferrer" className="btn-primary">
						<Icon name="download" className="h-4 w-4" />
						Download
					</a>
					{job.canExtend && (
						<Link to={`/library/${job.sceneId || job._id}`} state={{ focus: 'extend' }} className="btn-ghost">
							<Icon name="link" className="h-4 w-4" />
							Extend scene
						</Link>
					)}
					<Link to="/library" className="btn-ghost">
						<Icon name="grid" className="h-4 w-4" />
						Open library
					</Link>
					<span className="text-xs text-slate-500">
						{job.durationSeconds}s · {job.resolution}
					</span>
				</div>
			</div>
		);
	}

	if (job.status === 'failed') {
		return (
			<div className="card flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center" role="alert">
				<span className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
					<Icon name="alert" className="h-6 w-6" />
				</span>
				<p className="font-medium text-rose-200">We couldn&apos;t create this video</p>
				<p className="text-sm text-slate-400">Your {job.creditsReserved} credits were refunded. Try again or tweak the prompt.</p>
				{job.error && (
					<details className="mt-1 max-w-md text-xs text-slate-500">
						<summary className="cursor-pointer hover:text-slate-300">Technical details</summary>
						<p className="mt-1 break-words">{job.error}</p>
					</details>
				)}
			</div>
		);
	}

	const current = stepIndex(job.status);
	return (
		<div className="space-y-4" aria-live="polite">
			<div className="skeleton relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-white/10">
				<div className="flex flex-col items-center gap-3 text-center">
					<Spinner className="h-8 w-8 text-violet-300" />
					<p className="font-medium text-slate-100">{job.status === 'queued' ? 'Waiting for a free slot…' : 'Rendering your video…'}</p>
					<p className="font-mono text-sm text-slate-400">{formatElapsed(now - new Date(job.createdAt).getTime())}</p>
				</div>
			</div>
			<ol className="flex items-center gap-2 text-xs">
				{STEPS.map((label, i) => (
					<li key={label} className="flex flex-1 items-center gap-2">
						<span
							className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
								i < current ? 'bg-emerald-500/20 text-emerald-300' : i === current ? 'bg-violet-500 text-snow' : 'bg-white/5 text-slate-500'
							}`}
						>
							{i < current ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
						</span>
						<span className={i === current ? 'font-medium text-slate-100' : 'text-slate-500'}>{label}</span>
						{i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/10" />}
					</li>
				))}
			</ol>
			<p className="text-xs text-slate-500">Most videos are ready in about a minute. You can leave this page — it will be in your library.</p>
		</div>
	);
}
