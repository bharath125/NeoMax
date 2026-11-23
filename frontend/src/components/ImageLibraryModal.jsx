import { useEffect, useRef, useState } from 'react';
import { useImages } from '../hooks/useImages.js';
import { Icon, Spinner } from './Icon.jsx';

// Pick from everything the user already has (generated + uploaded). `excludeIds` are already attached.
export function ImageLibraryModal({ maxSelectable, excludeIds, onConfirm, onClose }) {
	const closeRef = useRef(null);
	const { data, isLoading, isError, refetch } = useImages('all');
	const [selected, setSelected] = useState([]);

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

	const available = data?.images.filter((image) => !excludeIds.includes(image._id)) ?? [];

	function toggle(image) {
		setSelected((current) => {
			if (current.some((item) => item._id === image._id)) return current.filter((item) => item._id !== image._id);
			return current.length < maxSelectable ? [...current, image] : current;
		});
	}

	return (
		<div role="dialog" aria-modal="true" aria-label="Choose images" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
			<div className="card flex max-h-[85vh] w-full max-w-3xl animate-fade-up flex-col bg-ink-800" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<div>
						<h2 className="font-semibold">Choose images</h2>
						<p className="text-xs text-slate-500">
							{selected.length} of {maxSelectable} selected
						</p>
					</div>
					<button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
						<Icon name="x" className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{isLoading && (
						<div className="grid place-items-center py-12 text-slate-400">
							<Spinner className="h-6 w-6" />
						</div>
					)}
					{isError && (
						<div className="py-10 text-center" role="alert">
							<p className="text-sm text-slate-300">We couldn’t load your images.</p>
							<button type="button" onClick={() => refetch()} className="btn-ghost mt-3">
								Try again
							</button>
						</div>
					)}
					{data && available.length === 0 && <p className="py-12 text-center text-sm text-slate-400">No other images yet. Upload a file or generate one on the Images page.</p>}
					{available.length > 0 && (
						<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{available.map((image) => {
								const picked = selected.some((item) => item._id === image._id);
								const full = !picked && selected.length >= maxSelectable;
								return (
									<li key={image._id}>
										<button
											type="button"
											onClick={() => toggle(image)}
											disabled={full}
											aria-pressed={picked}
											aria-label={image.prompt || image.originalName || 'Uploaded image'}
											className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-40 ${
												picked ? 'border-violet-400' : 'border-transparent hover:border-white/20'
											}`}
										>
											<img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
											{picked && (
												<span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-violet-500 text-snow shadow">
													<Icon name="check" className="h-3.5 w-3.5" />
												</span>
											)}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
					<button type="button" onClick={onClose} className="btn-ghost">
						Cancel
					</button>
					<button type="button" onClick={() => onConfirm(selected)} disabled={selected.length === 0} className="btn-primary">
						Add {selected.length > 0 ? selected.length : ''} {selected.length === 1 ? 'image' : 'images'}
					</button>
				</div>
			</div>
		</div>
	);
}
