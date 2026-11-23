import { Icon } from './Icon.jsx';
import { timeAgo } from '../lib/format.js';

const ratioStyle = (aspectRatio) => ({ aspectRatio: aspectRatio.replace(':', ' / ') });

const actionClass =
	'rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400';

export function ImageCard({ image, onAnimate, onRemix }) {
	return (
		<article className="card group flex animate-fade-up flex-col overflow-hidden transition hover:border-white/20">
			<a
				href={image.url}
				target="_blank"
				rel="noreferrer"
				aria-label={`Open full-size image: ${image.prompt}`}
				className="block bg-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
			>
				<img
					src={image.url}
					alt={image.prompt}
					loading="lazy"
					style={ratioStyle(image.aspectRatio)}
					className="w-full object-cover transition duration-300 group-hover:scale-[1.02]"
				/>
			</a>
			<div className="flex flex-1 flex-col gap-3 p-4">
				<p className="line-clamp-2 text-sm text-slate-200" title={image.prompt}>
					{image.prompt}
				</p>
				<div className="mt-auto flex items-center justify-between gap-2">
					<span className="inline-flex items-center gap-1 text-xs text-slate-500">
						<Icon name="clock" className="h-3.5 w-3.5" />
						{timeAgo(image.createdAt)} · {image.aspectRatio}
					</span>
					<div className="flex items-center gap-1">
						<button type="button" onClick={() => onAnimate(image)} aria-label="Animate this image" title="Animate this image" className={actionClass}>
							<Icon name="film" className="h-4 w-4" />
						</button>
						<button type="button" onClick={() => onRemix(image)} aria-label="Reuse this prompt" title="Reuse this prompt" className={actionClass}>
							<Icon name="remix" className="h-4 w-4" />
						</button>
						<a href={image.url} download={`neomax-${image._id}`} target="_blank" rel="noreferrer" aria-label="Download image" title="Download image" className={actionClass}>
							<Icon name="download" className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</article>
	);
}

export function ImageCardSkeleton() {
	return (
		<div className="card overflow-hidden" aria-hidden="true">
			<div className="skeleton aspect-video" />
			<div className="space-y-3 p-4">
				<div className="skeleton h-4 w-full rounded" />
				<div className="skeleton h-4 w-2/3 rounded" />
			</div>
		</div>
	);
}
