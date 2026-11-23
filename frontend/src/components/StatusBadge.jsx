const STYLES = {
	queued: { label: 'In queue', cls: 'bg-slate-500/15 text-slate-300', dot: 'bg-slate-400' },
	processing: { label: 'Generating', cls: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
	completed: { label: 'Ready', cls: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
	failed: { label: 'Failed', cls: 'bg-rose-500/15 text-rose-300', dot: 'bg-rose-400' },
};

export function StatusBadge({ status }) {
	const style = STYLES[status] || STYLES.queued;
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.cls}`}>
			<span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
			{style.label}
		</span>
	);
}
