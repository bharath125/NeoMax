import { Icon, Spinner } from './Icon.jsx';
import { formatElapsed } from '../lib/format.js';
import { isActive } from '../lib/jobs.js';
import { useNow } from '../hooks/useNow.js';

// One clip in a scene's timeline. Selecting it loads it into the player above.
export function ClipTile({ clip, number, selected, onSelect }) {
	const active = isActive(clip);
	const now = useNow(active);
	const playable = clip.status === 'completed' && clip.resultUrl;

	return (
		<button
			type="button"
			onClick={() => onSelect(clip)}
			aria-pressed={selected}
			aria-label={`Clip ${number}, ${clip.status === 'completed' ? 'ready' : clip.status}: ${clip.prompt}`}
			className={`group relative flex w-full flex-col overflow-hidden rounded-xl border-2 bg-ink-800 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
				selected ? 'border-violet-400' : 'border-transparent hover:border-white/20'
			}`}
		>
			<div className="relative aspect-video bg-ink-900">
				{playable && <video src={`${clip.resultUrl}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />}

				{active && (
					<div className="skeleton absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-300">
						<Spinner className="h-5 w-5 text-violet-300" />
						<span className="font-mono text-[11px] text-slate-400">{formatElapsed(now - new Date(clip.createdAt).getTime())}</span>
					</div>
				)}

				{clip.status === 'failed' && (
					<div className="absolute inset-0 grid place-items-center bg-rose-500/10 text-rose-300">
						<Icon name="alert" className="h-6 w-6" />
					</div>
				)}

				<span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-snow">Part {number}</span>
				<span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-snow">{clip.durationSeconds}s</span>
			</div>
			<p className="line-clamp-2 px-2.5 py-2 text-xs text-slate-300">
				{clip.status === 'failed' ? 'Failed — credits refunded' : clip.status === 'completed' ? clip.prompt : active ? 'Generating…' : clip.prompt}
			</p>
		</button>
	);
}
