import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSceneList } from '../hooks/useScenes.js';
import { SceneCard, SceneCardSkeleton } from '../components/SceneCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon } from '../components/Icon.jsx';

const FILTERS = [
	{ key: 'all', label: 'All', match: () => true },
	{ key: 'completed', label: 'Ready', match: (scene) => scene.status === 'completed' },
	{ key: 'active', label: 'In progress', match: (scene) => scene.status === 'processing' },
	{ key: 'failed', label: 'Failed', match: (scene) => scene.status === 'failed' },
];

export function Library() {
	const { data: scenes, isLoading, isError, refetch, isFetching } = useSceneList();
	const [filter, setFilter] = useState('all');

	const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, scenes?.filter(f.match).length ?? 0])), [scenes]);
	const visible = useMemo(() => scenes?.filter(FILTERS.find((f) => f.key === filter).match) ?? [], [scenes, filter]);

	return (
		<div className="animate-fade-up">
			<header className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Library</h1>
					<p className="mt-2 text-slate-400">Your videos and scenes. Open one to play it, add the next clip, or download it.</p>
				</div>
				<Link to="/generate" className="btn-primary">
					<Icon name="plus" className="h-4 w-4" />
					New video
				</Link>
			</header>

			{!isLoading && !isError && scenes.length > 0 && (
				<div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter videos">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							role="tab"
							aria-selected={filter === f.key}
							onClick={() => setFilter(f.key)}
							className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
								filter === f.key ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
							}`}
						>
							{f.label}
							<span className="rounded-full bg-white/10 px-1.5 text-xs tabular-nums">{counts[f.key]}</span>
						</button>
					))}
				</div>
			)}

			{isLoading && (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading videos">
					{Array.from({ length: 6 }, (_, i) => (
						<SceneCardSkeleton key={i} />
					))}
				</div>
			)}

			{isError && (
				<div className="card flex flex-col items-center px-6 py-14 text-center" role="alert">
					<span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
						<Icon name="alert" className="h-6 w-6" />
					</span>
					<p className="font-semibold">We couldn’t load your videos</p>
					<p className="mt-1 text-sm text-slate-400">Check your connection and try again.</p>
					<button type="button" onClick={() => refetch()} disabled={isFetching} className="btn-ghost mt-5">
						<Icon name="remix" className="h-4 w-4" />
						Try again
					</button>
				</div>
			)}

			{!isLoading && !isError && scenes.length === 0 && (
				<EmptyState
					title="No videos yet"
					description="Your generations will show up here. Write your first prompt and see what NeoMax can do."
					actionLabel="Create your first video"
					actionTo="/generate"
				/>
			)}

			{!isLoading && !isError && scenes.length > 0 && visible.length === 0 && (
				<p className="card px-6 py-12 text-center text-sm text-slate-400">No videos match this filter.</p>
			)}

			{visible.length > 0 && (
				<div className="grid gap-x-5 gap-y-7 pt-2 sm:grid-cols-2 lg:grid-cols-3">
					{visible.map((scene) => (
						<SceneCard key={scene.sceneId} scene={scene} />
					))}
				</div>
			)}
		</div>
	);
}
