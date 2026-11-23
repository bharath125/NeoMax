import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import { Icon } from '../components/Icon.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';

const STEPS = [
	{ icon: 'pen', title: 'Describe it', text: 'Write a sentence about the scene you imagine, or start from an image.' },
	{ icon: 'sparkles', title: 'We generate it', text: 'Our AI renders your clip. Most are ready in about a minute.' },
	{ icon: 'download', title: 'Download & share', text: 'Watch it in your library, remix the prompt, or download the MP4.' },
];

const FEATURES = [
	{ icon: 'image', title: 'Text or image to video', text: 'Start from words alone, or bring a still image to life.' },
	{ icon: 'zap', title: 'Fast results', text: 'Short clips come back in about a minute, with sound.' },
	{ icon: 'coins', title: 'Pay for what you use', text: 'Credits are spent per second generated. Failed videos are refunded.' },
	{ icon: 'remix', title: 'Remix anything', text: 'Reuse any past prompt in one click and iterate quickly.' },
];

export function Landing() {
	return (
		<div className="relative min-h-screen overflow-hidden">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_-5%,rgba(139,92,246,0.35),transparent),radial-gradient(40%_30%_at_90%_30%,rgba(217,70,239,0.15),transparent)]"
			/>

			<header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Logo to="/" />
				<div className="flex items-center gap-1 sm:gap-2">
					<ThemeToggle />
					<Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
						Log in
					</Link>
					<Link to="/register" className="btn-primary min-h-[40px]">
						Get started
					</Link>
				</div>
			</header>

			<main>
				<section className="mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
					<p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
						<Icon name="sparkles" className="h-3.5 w-3.5 text-violet-300" />
						AI video generation, simplified
					</p>
					<h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
						Turn a sentence into a <span className="gradient-text">cinematic video</span>
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
						Describe a scene or upload an image and NeoMax generates a short video for you — no editing skills, no subscriptions.
					</p>
					<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link to="/register" className="btn-primary min-h-[52px] px-8 text-base">
							Start creating free
							<Icon name="arrowRight" className="h-4 w-4" />
						</Link>
						<Link to="/login" className="btn-ghost min-h-[52px] px-8 text-base">
							I have an account
						</Link>
					</div>
					<p className="mt-4 text-sm text-slate-500">New accounts start with free credits. No card needed.</p>

					<div className="relative mx-auto mt-16 max-w-3xl">
						<div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-2xl" aria-hidden="true" />
						<div className="card animate-float overflow-hidden p-3 text-left shadow-2xl">
							<div className="mb-3 flex items-center gap-1.5 px-1">
								<span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
								<span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
								<span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
							</div>
							<div className="rounded-xl bg-ink-900 p-4">
								<p className="text-xs font-medium uppercase tracking-wider text-slate-500">Prompt</p>
								<p className="mt-1 text-sm text-slate-200 sm:text-base">
									A red paper boat drifting down a rain-soaked street gutter, slow cinematic shot
								</p>
							</div>
							<div className="skeleton mt-3 grid aspect-video place-items-center rounded-xl">
								<span className="grid h-16 w-16 place-items-center rounded-full bg-snow/90 text-[#07070d] shadow-xl">
									<Icon name="play" className="ml-1 h-7 w-7" filled />
								</span>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how">
					<h2 id="how" className="text-center text-3xl font-bold tracking-tight">
						How it works
					</h2>
					<ol className="mt-12 grid gap-6 md:grid-cols-3">
						{STEPS.map((step, i) => (
							<li key={step.title} className="card p-6">
								<div className="flex items-center gap-3">
									<span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
										<Icon name={step.icon} className="h-5 w-5" />
									</span>
									<span className="text-sm font-semibold text-slate-500">Step {i + 1}</span>
								</div>
								<h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>
							</li>
						))}
					</ol>
				</section>

				<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="features">
					<h2 id="features" className="text-center text-3xl font-bold tracking-tight">
						Everything you need to make videos
					</h2>
					<div className="mt-12 grid gap-6 sm:grid-cols-2">
						{FEATURES.map((feature) => (
							<div key={feature.title} className="card flex gap-4 p-6">
								<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
									<Icon name={feature.icon} className="h-5 w-5" />
								</span>
								<div>
									<h3 className="font-semibold">{feature.title}</h3>
									<p className="mt-1 text-sm leading-relaxed text-slate-400">{feature.text}</p>
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
					<div className="card relative overflow-hidden px-6 py-14">
						<div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(139,92,246,0.3),transparent)]" />
						<h2 className="text-3xl font-bold tracking-tight">Ready to make your first video?</h2>
						<p className="mx-auto mt-3 max-w-md text-slate-400">Create an account and generate a clip in under two minutes.</p>
						<Link to="/register" className="btn-primary mt-8 min-h-[52px] px-8 text-base">
							Get started free
							<Icon name="arrowRight" className="h-4 w-4" />
						</Link>
					</div>
				</section>
			</main>

			<footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} NeoMax</footer>
		</div>
	);
}
