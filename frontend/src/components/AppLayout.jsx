import { useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMe } from '../hooks/useMe.js';
import { useJobPolling } from '../hooks/useJobPolling.js';
import { isActive } from '../lib/jobs.js';

const NAV = [
	{ to: '/generate', label: 'Video', icon: 'film' },
	{ to: '/images', label: 'Images', icon: 'image' },
	{ to: '/library', label: 'Library', icon: 'grid' },
	{ to: '/billing', label: 'Credits', icon: 'coins' },
];

const desktopLink = ({ isActive: on }) =>
	`relative rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
		on ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
	}`;

const mobileLink = ({ isActive: on }) =>
	`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 ${
		on ? 'text-violet-300' : 'text-slate-500'
	}`;

export function AppLayout() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: me } = useMe();
	const { data: jobs } = useJobPolling();

	const activeCount = jobs?.filter(isActive).length ?? 0;

	// A finished (or failed + refunded) job changes the balance, so refresh it when the active count drops.
	const previousActive = useRef(activeCount);
	useEffect(() => {
		if (activeCount < previousActive.current) queryClient.invalidateQueries({ queryKey: ['me'] });
		previousActive.current = activeCount;
	}, [activeCount, queryClient]);

	function handleLogout() {
		logout();
		queryClient.clear();
		navigate('/');
	}

	const dot = (to) =>
		to === '/library' && activeCount > 0 ? (
			<span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-amber-400" title={`${activeCount} generating`} />
		) : null;

	return (
		<div className="relative min-h-screen">
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(139,92,246,0.14),transparent),radial-gradient(50%_40%_at_90%_10%,rgba(217,70,239,0.08),transparent)]"
			/>

			<header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-lg">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-8">
						<Logo to="/generate" />
						<nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
							{NAV.map((item) => (
								<NavLink key={item.to} to={item.to} className={desktopLink}>
									{item.label}
									{dot(item.to)}
								</NavLink>
							))}
						</nav>
					</div>
					<div className="flex items-center gap-1 sm:gap-2">
						<ThemeToggle />
						<Link
							to="/billing"
							className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 text-sm font-medium transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
							aria-label={me ? `${me.credits} credits. Buy more` : 'Credits'}
						>
							<Icon name="coins" className="h-4 w-4 text-amber-300" />
							{me ? <span className="tabular-nums">{me.credits}</span> : <span className="skeleton h-4 w-8 rounded" />}
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							aria-label="Log out"
							title={me?.email ? `Log out (${me.email})` : 'Log out'}
							className="rounded-lg p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
						>
							<Icon name="logout" className="h-5 w-5" />
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
				<Outlet />
			</main>

			<nav
				className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-ink-950/95 backdrop-blur-lg sm:hidden"
				aria-label="Main"
			>
				{NAV.map((item) => (
					<NavLink key={item.to} to={item.to} className={mobileLink}>
						<Icon name={item.icon} className="h-5 w-5" />
						{item.label}
						{dot(item.to)}
					</NavLink>
				))}
			</nav>
		</div>
	);
}
