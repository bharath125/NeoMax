import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { useTheme } from '../context/ThemeContext.jsx';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisPromise;
function loadGoogleScript() {
	if (window.google?.accounts?.id) return Promise.resolve();
	gisPromise ??= new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = GIS_SRC;
		script.async = true;
		script.onload = resolve;
		script.onerror = () => {
			gisPromise = undefined;
			reject(new Error('Failed to load Google sign-in'));
		};
		document.head.appendChild(script);
	});
	return gisPromise;
}

// Renders Google's official sign-in button. Hidden entirely unless the backend has GOOGLE_CLIENT_ID set,
// so the app works fine before Google is configured.
export function GoogleButton({ onCredential, onError }) {
	const containerRef = useRef(null);
	const { theme } = useTheme();
	const [ready, setReady] = useState(false);
	const handlers = useRef({ onCredential, onError });
	handlers.current = { onCredential, onError };

	const { data: clientId } = useQuery({
		queryKey: ['auth-config'],
		queryFn: async () => {
			const { data } = await apiClient.get('/auth/config');
			return data.data.googleClientId;
		},
		staleTime: Infinity,
		retry: false,
	});

	// Two effects so a theme switch only redraws the button; Google warns if initialize() runs more than once per mount.
	useEffect(() => {
		if (!clientId) return undefined;
		let cancelled = false;

		loadGoogleScript()
			.then(() => {
				if (cancelled) return;
				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: (response) => handlers.current.onCredential(response.credential),
				});
				setReady(true);
			})
			.catch(() => handlers.current.onError?.('Couldn’t load Google sign-in. Check your connection or use email instead.'));

		return () => {
			cancelled = true;
		};
	}, [clientId]);

	useEffect(() => {
		const container = containerRef.current;
		if (!ready || !container) return;
		container.replaceChildren();
		window.google.accounts.id.renderButton(container, {
			theme: theme === 'light' ? 'outline' : 'filled_black',
			size: 'large',
			text: 'continue_with',
			shape: 'rectangular',
			width: Math.min(400, Math.max(200, container.offsetWidth)),
		});
	}, [ready, theme]);

	if (!clientId) return null;

	return (
		<div className="mt-6">
			<div className="flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
				<span className="h-px flex-1 bg-white/10" />
				or
				<span className="h-px flex-1 bg-white/10" />
			</div>
			<div ref={containerRef} className="mt-6 flex min-h-[44px] justify-center" />
		</div>
	);
}
