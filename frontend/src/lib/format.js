// Mirrors the backend's CREDIT_COST_PER_SECOND default — keep in sync if that changes.
export const CREDITS_PER_SECOND = 8;

export function estimateCredits(durationSeconds) {
	return Math.ceil(durationSeconds * CREDITS_PER_SECOND);
}

export function timeAgo(dateString) {
	const seconds = Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 1000));
	if (seconds < 45) return 'just now';
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} h ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} d ago`;
	return new Date(dateString).toLocaleDateString();
}

export function formatElapsed(ms) {
	const total = Math.max(0, Math.floor(ms / 1000));
	const minutes = String(Math.floor(total / 60)).padStart(2, '0');
	const seconds = String(total % 60).padStart(2, '0');
	return `${minutes}:${seconds}`;
}

// `amount` is in the currency's smallest unit (paise / cents).
export function formatMoney(amount, currency) {
	const value = amount / 100;
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
	}).format(value);
}
