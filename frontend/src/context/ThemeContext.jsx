import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'neomax_theme';
const THEME_COLORS = { dark: '#07070d', light: '#f6f7fb' };

const LIGHT_QUERY = '(prefers-color-scheme: light)';
const systemTheme = () => (window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark');

function readSaved() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved === 'light' || saved === 'dark' ? saved : null;
	} catch {
		return null;
	}
}

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

// Follows the operating system until the user picks a theme, then remembers that choice.
export function ThemeProvider({ children }) {
	const [saved, setSaved] = useState(readSaved);
	const [system, setSystem] = useState(systemTheme);

	useEffect(() => {
		const query = window.matchMedia(LIGHT_QUERY);
		const onChange = (event) => setSystem(event.matches ? 'light' : 'dark');
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);

	const theme = saved || system;

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		const next = theme === 'dark' ? 'light' : 'dark';
		setSaved(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// Storage can be blocked (private mode); the choice then simply lasts for this visit.
		}
	}, [theme]);

	const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	return useContext(ThemeContext);
}
