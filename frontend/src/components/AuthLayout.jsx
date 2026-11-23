import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const POINTS = ['Text or image to video', 'Ready in about a minute', 'Pay only for what you generate'];

export function AuthLayout({ title, subtitle, children, footer }) {
	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<aside className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12">
				<div
					aria-hidden="true"
					className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_20%_10%,rgba(139,92,246,0.35),transparent),radial-gradient(60%_50%_at_90%_90%,rgba(217,70,239,0.25),transparent)]"
				/>
				<Logo to="/" />
				<div>
					<h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
						Turn a sentence into a <span className="gradient-text">cinematic video.</span>
					</h2>
					<ul className="mt-8 space-y-3">
						{POINTS.map((point) => (
							<li key={point} className="flex items-center gap-3 text-slate-300">
								<span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/20 text-violet-300">
									<Icon name="check" className="h-3.5 w-3.5" />
								</span>
								{point}
							</li>
						))}
					</ul>
				</div>
				<p className="text-sm text-slate-500">New accounts start with free credits.</p>
			</aside>

			<main className="flex flex-col px-4 py-8 sm:px-8">
				<div className="flex items-center justify-between">
					<div className="lg:hidden">
						<Logo to="/" />
					</div>
					<ThemeToggle className="ml-auto" />
				</div>
				<div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
					<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
					<p className="mt-2 text-sm text-slate-400">{subtitle}</p>
					<div className="mt-8">{children}</div>
					<p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
				</div>
			</main>
		</div>
	);
}
