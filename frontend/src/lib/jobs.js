export const ACTIVE_STATUSES = new Set(['queued', 'processing']);

export function isActive(job) {
	return ACTIVE_STATUSES.has(job.status);
}

export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
	return err?.response?.data?.error?.message || fallback;
}
