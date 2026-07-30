import { useJobPolling } from '../hooks/useJobPolling.js';
import { JobCard } from '../components/JobCard.jsx';

export function Dashboard() {
	const { data: jobs, isLoading, isError } = useJobPolling();

	return (
		<div className="max-w-3xl mx-auto mt-12 flex flex-col gap-4">
			<h1 className="text-2xl font-semibold">Your generations</h1>
			{isLoading && <p className="text-sm text-gray-500">Loading…</p>}
			{isError && <p className="text-sm text-red-600">Failed to load jobs</p>}
			{jobs?.length === 0 && <p className="text-sm text-gray-500">No generations yet.</p>}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{jobs?.map((job) => (
					<JobCard key={job._id} job={job} />
				))}
			</div>
		</div>
	);
}
