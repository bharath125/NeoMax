import { useEffect, useState } from 'react';

// Re-renders on an interval so elapsed-time labels stay live while a job is running.
export function useNow(active = true, intervalMs = 1000) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!active) return undefined;
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [active, intervalMs]);

	return now;
}
