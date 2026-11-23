import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { useRefreshJobUrls } from '../hooks/useJobPolling.js';

export function VideoModal({ job, onClose, onRemix }) {
	const closeRef = useRef(null);
	const refreshUrls = useRefreshJobUrls();

	useEffect(() => {
		const previouslyFocused = document.activeElement;
		closeRef.current?.focus();
		const onKey = (e) => e.key === 'Escape' && onClose();
		document.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
			previouslyFocused?.focus?.();
		};
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Video player"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div data-theme="dark" className="w-full max-w-3xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
				<div className="mb-3 flex items-start justify-between gap-4">
					<p className="line-clamp-2 text-sm text-slate-300">{job.prompt}</p>
					<button
						ref={closeRef}
						type="button"
						onClick={onClose}
						aria-label="Close video"
						className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
					>
						<Icon name="x" className="h-5 w-5" />
					</button>
				</div>
				<video
					src={job.resultUrl}
					controls
					autoPlay
					playsInline
					onError={refreshUrls}
					className="aspect-video w-full rounded-2xl bg-black"
				/>
				<div className="mt-4 flex flex-wrap gap-3">
					<a href={job.resultUrl} download={`neomax-${job._id}.mp4`} target="_blank" rel="noreferrer" className="btn-primary">
						<Icon name="download" className="h-4 w-4" />
						Download
					</a>
					{onRemix && (
						<button type="button" onClick={() => onRemix(job)} className="btn-ghost">
							<Icon name="remix" className="h-4 w-4" />
							Remix prompt
						</button>
					)}

				</div>
			</div>
		</div>
	);
}

