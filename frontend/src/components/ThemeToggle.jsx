import { Icon } from './Icon.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

// Shows the theme you would switch to: a sun while dark, a moon while light.
export function ThemeToggle({ className = '' }) {
	const { theme, toggleTheme } = useTheme();
	const next = theme === 'dark' ? 'light' : 'dark';

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={`Switch to ${next} mode`}
			title={`Switch to ${next} mode`}
			className={`rounded-lg p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
		>
			<Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
		</button>
	);
}
