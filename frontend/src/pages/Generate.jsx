import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGenerateVideo } from '../hooks/useGenerateVideo.js';
import { useJobPolling } from '../hooks/useJobPolling.js';
import { useMe } from '../hooks/useMe.js';
import { useImages } from '../hooks/useImages.js';
import { usePricing } from '../hooks/usePricing.js';
import { ImagePicker } from '../components/ImagePicker.jsx';
import { JobPreview } from '../components/JobPreview.jsx';
import { Icon, Spinner } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';
import { apiErrorMessage } from '../lib/jobs.js';

const DURATIONS = [5, 8, 10, 15];
const MAX_PROMPT = 2000;

const MODES = [
	{ value: 'first_frame', label: 'Animate it', hint: 'Your image becomes the first frame.' },
	{ value: 'reference', label: 'Use as reference', hint: 'Keeps your character, product or style consistent.' },
];

const EXAMPLES = [
	'A red paper boat drifting down a rain-soaked street gutter, slow cinematic shot',
	'Aerial view of a misty pine forest at sunrise, golden light breaking through the trees',
	'A neon-lit ramen shop at night, steam rising, camera slowly pushing in',
	'An astronaut walking across a dusty red desert, long shadow, wide anamorphic lens',
];

export function Generate() {
	const location = useLocation();
	const toast = useToast();
	const previewRef = useRef(null);
	const [prompt, setPrompt] = useState(location.state?.prompt || '');
	const [images, setImages] = useState([]);
	const [mode, setMode] = useState('first_frame');
	const [durationSeconds, setDurationSeconds] = useState(5);
	const [trackedJobId, setTrackedJobId] = useState(null);

	const mutation = useGenerateVideo();
	const { data: jobs } = useJobPolling();
	const { data: me } = useMe();
	const pricing = usePricing();
	const { data: allImages } = useImages('all');

	// Coming from the Images page or a remix: preselect the images by id once they're loaded.
	const pendingImageIds = useRef(location.state?.imageIds || []);
	useEffect(() => {
		if (!allImages || pendingImageIds.current.length === 0) return;
		const wanted = pendingImageIds.current;
		pendingImageIds.current = [];
		setImages(allImages.images.filter((image) => wanted.includes(image._id)).slice(0, pricing.maxImages));
	}, [allImages, pricing.maxImages]);

	// A single image can be animated or used as a reference; several can only be references.
	const effectiveMode = images.length === 1 ? mode : 'reference';
	const referenceCount = images.length > 0 && effectiveMode === 'reference' ? images.length : 0;
	const creditsPerSecond = referenceCount > 0 ? pricing.referenceCreditsPerSecond : pricing.creditsPerSecond;

	const trackedJob = trackedJobId ? jobs?.find((j) => j._id === trackedJobId) || mutation.data : null;
	const cost = Math.ceil(durationSeconds * creditsPerSecond);
	const balance = me?.credits;
	const insufficient = balance !== undefined && cost > balance;
	const canSubmit = prompt.trim().length >= 3 && !mutation.isPending && !insufficient;

	function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		mutation.mutate(
			{
					prompt: prompt.trim(),
					durationSeconds,
					...(images.length > 0 && { imageIds: images.map((image) => image._id), imageMode: effectiveMode }),
				},
			{
				onSuccess: (job) => {
					setTrackedJobId(job._id);
					toast.success('Generation started — we’ll show it here when it’s ready.');
					if (window.matchMedia('(max-width: 1023px)').matches) {
						previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
				},
				onError: (err) => toast.error(apiErrorMessage(err)),
			},
		);
	}

	function handleKeyDown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e);
	}

	return (
		<div className="animate-fade-up">
			<header className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Create a <span className="gradient-text">video</span>
				</h1>
				<p className="mt-2 text-slate-400">Describe a scene, optionally add up to 6 images, and we’ll generate it for you.</p>
			</header>

			<div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
				<form onSubmit={handleSubmit} className="card space-y-6 p-5 sm:p-6" aria-label="Generate a video">
					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label htmlFor="prompt" className="text-sm font-medium text-slate-300">
								Prompt
							</label>
							<span className={`text-xs tabular-nums ${prompt.length > MAX_PROMPT - 100 ? 'text-amber-300' : 'text-slate-500'}`}>
								{prompt.length}/{MAX_PROMPT}
							</span>
						</div>
						<textarea
							id="prompt"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							maxLength={MAX_PROMPT}
							rows={5}
							placeholder="A golden retriever running through shallow surf at sunset, slow motion…"
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
									className="max-w-[14rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
									title={example}
								>
									{example}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<ImagePicker images={images} onChange={setImages} max={pricing.maxImages} />

						{images.length > 0 && (
							<fieldset>
								<legend className="label">How should we use {images.length === 1 ? 'it' : 'them'}?</legend>
								<div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
									{MODES.map((option) => {
										const disabled = option.value === 'first_frame' && images.length !== 1;
										const selected = option.value === effectiveMode;
										return (
											<button
												key={option.value}
												type="button"
												role="radio"
												aria-checked={selected}
												disabled={disabled}
												onClick={() => setMode(option.value)}
												className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-40 ${
													selected ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 bg-white/5 hover:border-white/20'
												}`}
											>
												<span className="block text-sm font-semibold text-white">{option.label}</span>
												<span className="mt-0.5 block text-xs text-slate-400">{disabled ? 'Only works with a single image.' : option.hint}</span>
											</button>
										);
									})}
								</div>
							</fieldset>
						)}
					</div>

					<fieldset>
						<legend className="label">Length</legend>
						<div className="grid grid-cols-4 gap-2" role="radiogroup">
							{DURATIONS.map((seconds) => {
								const selected = seconds === durationSeconds;
								return (
									<button
										key={seconds}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => setDurationSeconds(seconds)}
										className={`min-h-[44px] rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
											selected
												? 'border-violet-400 bg-violet-500/15 text-white'
												: 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
										}`}
									>
										{seconds}s
									</button>
								);
							})}
						</div>
					</fieldset>

					<div className="space-y-3 border-t border-white/10 pt-5">
						<div className="flex items-center justify-between text-sm">
							<span className="text-slate-400">
								Cost <span className="text-slate-600">({creditsPerSecond} credits / sec{referenceCount > 0 ? ', reference mode' : ''})</span>
							</span>
							<span className="inline-flex items-center gap-1.5 font-semibold">
								<Icon name="coins" className="h-4 w-4 text-amber-300" />
								<span className="tabular-nums">{cost}</span> credits
							</span>
						</div>
						{balance !== undefined && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-400">Your balance</span>
								<span className={`tabular-nums ${insufficient ? 'font-semibold text-rose-300' : 'text-slate-200'}`}>{balance} credits</span>
							</div>
						)}
						{insufficient && (
							<p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
								You need {cost - balance} more credits for this video.{' '}
								<Link to="/billing" className="font-semibold underline underline-offset-2">
									Get credits
								</Link>
							</p>
						)}
						<button type="submit" disabled={!canSubmit} className="btn-primary w-full">
							{mutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="sparkles" className="h-4 w-4" />}
							{mutation.isPending ? 'Starting…' : 'Generate video'}
						</button>
						<p className="hidden text-center text-xs text-slate-600 sm:block">Tip: press Ctrl/⌘ + Enter to generate</p>
					</div>
				</form>

				<section ref={previewRef} aria-label="Preview" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
					<JobPreview job={trackedJob} />
					{trackedJob && (
						<p className="mt-4 line-clamp-2 text-sm text-slate-400">
							<span className="text-slate-500">Prompt: </span>
							{trackedJob.prompt}
						</p>
					)}
				</section>
			</div>
		</div>
	);
}
