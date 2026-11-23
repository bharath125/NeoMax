import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Spinner } from './Icon.jsx';
import { useToast } from './Toast.jsx';
import { useExtendVideo } from '../hooks/useScenes.js';
import { useMe } from '../hooks/useMe.js';
import { usePricing } from '../hooks/usePricing.js';
import { apiErrorMessage } from '../lib/jobs.js';

const DURATIONS = [5, 8, 10, 15];
const MAX_PROMPT = 2000;

// The "add the next clip" form that sits at the end of a scene. `from` is the finished clip to continue from; the
// new clip starts at its last frame, so characters and setting carry over.
export const ExtendPanel = forwardRef(function ExtendPanel({ from, nextNumber, onStarted }, ref) {
	const toast = useToast();
	const [prompt, setPrompt] = useState('');
	const [durationSeconds, setDurationSeconds] = useState(5);
	const mutation = useExtendVideo();
	const { data: me } = useMe();
	const pricing = usePricing();

	const cost = Math.ceil(durationSeconds * pricing.creditsPerSecond);
	const balance = me?.credits;
	const insufficient = balance !== undefined && cost > balance;
	const canSubmit = prompt.trim().length >= 3 && !mutation.isPending && !insufficient;

	function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		mutation.mutate(
			{ id: from._id, prompt: prompt.trim(), durationSeconds },
			{
				onSuccess: (clip) => {
					setPrompt('');
					toast.success(`Part ${nextNumber} is on its way.`);
					onStarted?.(clip);
				},
				onError: (err) => toast.error(apiErrorMessage(err)),
			},
		);
	}

	return (
		<form ref={ref} onSubmit={handleSubmit} aria-labelledby="extend-heading" className="card scroll-mt-24 space-y-5 p-5 sm:p-6">
			<div>
				<h2 id="extend-heading" className="flex items-center gap-2 text-lg font-semibold">
					<span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
						<Icon name="link" className="h-4 w-4" />
					</span>
					Add Part {nextNumber}
				</h2>
				<p className="mt-1 text-sm text-slate-400">The next clip starts from the final frame of Part {nextNumber - 1}, so your characters and setting carry over.</p>
			</div>

			<div className="flex gap-4">
				{from.lastFrameUrl ? (
					<div className="relative w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 sm:w-48">
						<img src={from.lastFrameUrl} alt={`Final frame of Part ${nextNumber - 1}`} className="aspect-video w-full object-cover" />
						<span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-snow">Starts here</span>
					</div>
				) : (
					<div className="grid aspect-video w-36 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-900 text-slate-500 sm:w-48">
						<Icon name="film" className="h-6 w-6" />
					</div>
				)}

				<div className="min-w-0 flex-1">
					<div className="mb-1.5 flex items-center justify-between">
						<label htmlFor="extend-prompt" className="text-sm font-medium text-slate-300">
							What happens next?
						</label>
						<span className="text-xs tabular-nums text-slate-500">
							{prompt.length}/{MAX_PROMPT}
						</span>
					</div>
					<textarea
						id="extend-prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && handleSubmit(e)}
						maxLength={MAX_PROMPT}
						rows={4}
						placeholder="The camera keeps moving forward as a delivery cyclist rides past…"
						className="input resize-y leading-relaxed"
						required
					/>
				</div>
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
									selected ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
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
					<span className="text-slate-400">Cost</span>
					<span className="inline-flex items-center gap-1.5 font-semibold">
						<Icon name="coins" className="h-4 w-4 text-amber-300" />
						<span className="tabular-nums">{cost}</span> credits
					</span>
				</div>
				{insufficient && (
					<p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
						You need {cost - balance} more credits.{' '}
						<Link to="/billing" className="font-semibold underline underline-offset-2">
							Get credits
						</Link>
					</p>
				)}
				<button type="submit" disabled={!canSubmit} className="btn-primary w-full">
					{mutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="sparkles" className="h-4 w-4" />}
					{mutation.isPending ? 'Preparing next clip…' : `Generate Part ${nextNumber}`}
				</button>
			</div>
		</form>
	);
});
