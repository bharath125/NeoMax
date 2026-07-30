const STATUS_STYLES = {
	queued: 'bg-gray-200 text-gray-700',
	processing: 'bg-yellow-100 text-yellow-800',
	completed: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
};

export function JobCard({ job }) {
	return (
		<div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[job.status]}`}>{job.status}</span>
				<span className="text-xs text-gray-500">{job.creditsReserved} credits</span>
			</div>
			<p className="text-sm text-gray-800 line-clamp-2">{job.prompt}</p>
			{job.status === 'completed' && job.resultUrl && (
				<video src={job.resultUrl} controls className="w-full rounded-md" />
			)}
			{job.status === 'failed' && job.error && <p className="text-xs text-red-600">{job.error}</p>}
		</div>
	);
}
