
const PATHS = {
	sparkles:
		'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z',
	play: 'M7 4.5l13 7.5-13 7.5v-15z',
	download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
	x: 'M18 6L6 18 M6 6l12 12',
	check: 'M5 13l4 4L19 7',
	alert: 'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
	remix: 'M3 12a9 9 0 0115-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 01-15 6.7L3 16 M3 21v-5h5',
	image: 'M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 20',
	clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2',
	logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
	coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
	film: 'M4 4h16v16H4z M8 4v16 M16 4v16 M4 9h4 M4 15h4 M16 9h4 M16 15h4',
	grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
	plus: 'M12 5v14 M5 12h14',
	arrowRight: 'M5 12h14 M13 6l6 6-6 6',
	zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
	link: 'M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1 1 M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1-1',
	sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
	moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
	pen: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z',
};

export function Icon({ name, className = 'h-5 w-5', filled = false }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill={filled ? 'currentColor' : 'none'}
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d={PATHS[name]} />
		</svg>
	);
}


export function Spinner({ className = 'h-5 w-5' }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden="true">
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
			<path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
		</svg>
	);
}

