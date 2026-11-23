import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGenerateImage, useImages } from '../hooks/useImages.js';
import { ImageCard, ImageCardSkeleton } from '../components/ImageCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon, Spinner } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';
import { apiErrorMessage } from '../lib/jobs.js';

const MAX_PROMPT = 2000;

const RATIOS = [
	{ value: '16:9', label: 'Landscape' },
	{ value: '9:16', label: 'Portrait' },
	{ value: '1:1', label: 'Square' },
	{ value: '4:3', label: 'Classic' },
	{ value: '3:4', label: 'Tall' },
];

const EXAMPLES = [
	'A lone astronaut walking across a dusty red desert, long shadow, wide anamorphic lens',
	'A cozy neon-lit ramen shop at night, steam rising, rainy street reflections',
	'Aerial view of a misty pine forest at sunrise, golden light through the trees',
	'A golden retriever puppy wearing tiny sunglasses on a sunny beach, 35mm photo',
];

const ratioStyle = (ratio) => ({ aspectRatio: ratio.replace(':', ' / ') });

export function Images() {
	const location = useLocation();
	const navigate = useNavigate();
	const toast = useToast();
	const [prompt, setPrompt] = useState(location.state?.prompt || '');
	const [aspectRatio, setAspectRatio] = useState('16:9');
	const [latest, setLatest] = useState(null);

	const mutation = useGenerateImage();
	const { data, isLoading, isError, refetch, isFetching } = useImages();

	const usage = data?.usage;
	const remaining = usage ? Math.max(0, usage.dailyLimit - usage.usedToday) : undefined;
	const limitReached = remaining === 0;
	const canSubmit = prompt.trim().length >= 3 && !mutation.isPending && !limitReached;

	function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		mutation.mutate(
			{ prompt: prompt.trim(), aspectRatio },
			{
				onSuccess: (image) => setLatest(image),
				onError: (err) => toast.error(apiErrorMessage(err)),
			},
		);
	}

	function handleKeyDown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e);
	}

	const animate = (image) => navigate('/generate', { state: { imageIds: [image._id], prompt: image.prompt } });
	const reuse = (image) => {
		setPrompt(image.prompt);
		setAspectRatio(image.aspectRatio);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<div className="animate-fade-up">
			<header className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Create an <span className="gradient-text">image</span>
				</h1>
				<p className="mt-2 text-slate-400">Turn a description into an image, then animate it into a video.</p>
			</header>

			<div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
				<form onSubmit={handleSubmit} className="card space-y-6 p-5 sm:p-6" aria-label="Generate an image">
					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label htmlFor="image-prompt" className="text-sm font-medium text-slate-300">
								Prompt
							</label>
							<span className={`text-xs tabular-nums ${prompt.length > MAX_PROMPT - 100 ? 'text-amber-300' : 'text-slate-500'}`}>
								{prompt.length}/{MAX_PROMPT}
							</span>
						</div>
						<textarea
							id="image-prompt"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							maxLength={MAX_PROMPT}
							rows={5}
							placeholder="A watercolor fox sleeping under a lantern in a snowy village…"
							className="input resize-y leading-relaxed"
							required
						/>
						<div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example prompts">
							<span className="mr-1 flex items-center gap-1 text-xs text-slate-500">
								<Icon name="pen" className="h-3.5 w-3.5" />
								Try:
							</span>
							{EXAMPLES.map((example) => (
								<button
									key={example}
									type="button"
									onClick={() => setPrompt(example)}
									title={example}
									className="max-w-[14rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
								>
									{example}
								</button>
							))}
						</div>
					</div>

					<fieldset>
						<legend className="label">Shape</legend>
						<div className="grid grid-cols-5 gap-2" role="radiogroup">
							{RATIOS.map((ratio) => {
								const selected = ratio.value === aspectRatio;
								return (
									<button
										key={ratio.value}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => setAspectRatio(ratio.value)}
										className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
											selected ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
										}`}
									>
										<span style={ratioStyle(ratio.value)} className={`block h-5 rounded-[3px] border-2 ${selected ? 'border-violet-300' : 'border-slate-500'}`} />
										{ratio.value}
									</button>
								);
							})}
						</div>
					</fieldset>

					<div className="space-y-3 border-t border-white/10 pt-5">
						<div className="flex items-center justify-between text-sm">
							<span className="text-slate-400">Cost</span>
							<span className="font-semibold text-emerald-300">{usage?.creditCost > 0 ? `${usage.creditCost} credits` : 'Free'}</span>
						</div>
						{remaining !== undefined && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-400">Left today</span>
								<span className={`tabular-nums ${limitReached ? 'font-semibold text-rose-300' : 'text-slate-200'}`}>
									{remaining} of {usage.dailyLimit}
								</span>
							</div>
						)}
						{limitReached && (
							<p role="alert" className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
								You’ve used today’s free images. They reset in 24 hours from your first one.
							</p>
						)}
						<button type="submit" disabled={!canSubmit} className="btn-primary w-full">
							{mutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="sparkles" className="h-4 w-4" />}
							{mutation.isPending ? 'Creating…' : 'Generate image'}
						</button>
						<p className="hidden text-center text-xs text-slate-600 sm:block">Tip: press Ctrl/⌘ + Enter to generate</p>
					</div>
				</form>

				<section aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
					<div style={ratioStyle(mutation.isPending || !latest ? aspectRatio : latest.aspectRatio)} className="card relative grid max-h-[70vh] w-full place-items-center overflow-hidden">
						{mutation.isPending && (
							<div className="skeleton absolute inset-0 grid place-items-center" aria-live="polite">
								<div className="flex flex-col items-center gap-3 text-center">
									<Spinner className="h-8 w-8 text-violet-300" />
									<p className="font-medium text-slate-100">Creating your image…</p>
								</div>
							</div>
						)}
						{!mutation.isPending && latest && <img src={latest.url} alt={latest.prompt} className="h-full w-full animate-fade-up object-contain" />}
						{!mutation.isPending && !latest && (
							<div className="px-6 text-center">
								<span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-slate-400">
									<Icon name="image" className="h-7 w-7" />
								</span>
								<p className="font-medium text-slate-200">Your image will appear here</p>
								<p className="mt-1 text-sm text-slate-500">Describe what you imagine and hit generate.</p>
							</div>
						)}
					</div>

					{latest && !mutation.isPending && (
						<div className="mt-4 flex flex-wrap items-center gap-3">
							<button type="button" onClick={() => animate(latest)} className="btn-primary">
								<Icon name="film" className="h-4 w-4" />
								Animate this image
							</button>
							<a href={latest.url} download={`neomax-${latest._id}`} target="_blank" rel="noreferrer" className="btn-ghost">
								<Icon name="download" className="h-4 w-4" />
								Download
							</a>
						</div>
					)}
				</section>
			</div>

			<section className="mt-14" aria-labelledby="your-images">
				<h2 id="your-images" className="mb-5 text-xl font-semibold">
					Your images
				</h2>

				{isLoading && (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
						{Array.from({ length: 3 }, (_, i) => (
							<ImageCardSkeleton key={i} />
						))}
					</div>
				)}

				{isError && (
					<div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
						<p className="font-semibold">We couldn’t load your images</p>
						<button type="button" onClick={() => refetch()} disabled={isFetching} className="btn-ghost mt-4">
							Try again
						</button>
					</div>
				)}

				{data && data.images.length === 0 && (
					<EmptyState icon="image" title="No images yet" description="Generate your first image above. It’ll be saved here so you can animate it later." />
				)}

				{data?.images.length > 0 && (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{data.images.map((image) => (
							<ImageCard key={image._id} image={image} onAnimate={animate} onRemix={reuse} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}
