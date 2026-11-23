/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
			},
			// Surfaces, text and accent tints read CSS variables (see index.css) so the whole UI flips between themes.
			// Only the shades the app actually uses are listed; every other shade keeps Tailwind's default.
			colors: {
				ink: {
					950: 'rgb(var(--c-ink-950) / <alpha-value>)',
					900: 'rgb(var(--c-ink-900) / <alpha-value>)',
					800: 'rgb(var(--c-ink-800) / <alpha-value>)',
					700: 'rgb(var(--c-ink-700) / <alpha-value>)',
				},
				// "white" is the foreground tint: soft overlays (bg-white/5, border-white/10) become dark tints in light mode.
				white: 'rgb(var(--c-white) / <alpha-value>)',
				// Always white, in both themes: text on accent buttons and on badges over video.
				snow: 'rgb(255 255 255 / <alpha-value>)',
				slate: {
					100: 'rgb(var(--c-slate-100) / <alpha-value>)',
					200: 'rgb(var(--c-slate-200) / <alpha-value>)',
					300: 'rgb(var(--c-slate-300) / <alpha-value>)',
					400: 'rgb(var(--c-slate-400) / <alpha-value>)',
					500: 'rgb(var(--c-slate-500) / <alpha-value>)',
					600: 'rgb(var(--c-slate-600) / <alpha-value>)',
				},
				violet: { 200: 'rgb(var(--c-violet-200) / <alpha-value>)', 300: 'rgb(var(--c-violet-300) / <alpha-value>)', 400: 'rgb(var(--c-violet-400) / <alpha-value>)' },
				fuchsia: { 300: 'rgb(var(--c-fuchsia-300) / <alpha-value>)', 400: 'rgb(var(--c-fuchsia-400) / <alpha-value>)' },
				rose: { 200: 'rgb(var(--c-rose-200) / <alpha-value>)', 300: 'rgb(var(--c-rose-300) / <alpha-value>)', 400: 'rgb(var(--c-rose-400) / <alpha-value>)' },
				amber: { 200: 'rgb(var(--c-amber-200) / <alpha-value>)', 300: 'rgb(var(--c-amber-300) / <alpha-value>)', 400: 'rgb(var(--c-amber-400) / <alpha-value>)' },
				emerald: { 300: 'rgb(var(--c-emerald-300) / <alpha-value>)', 400: 'rgb(var(--c-emerald-400) / <alpha-value>)' },
				sky: { 400: 'rgb(var(--c-sky-400) / <alpha-value>)' },
			},
			keyframes: {
				shimmer: {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' },
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'toast-in': {
					'0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
			},
			animation: {
				shimmer: 'shimmer 2.4s linear infinite',
				'fade-up': 'fade-up 0.4s ease-out both',
				'toast-in': 'toast-in 0.25s ease-out both',
				float: 'float 6s ease-in-out infinite',
			},
		},
	},
	plugins: [],
};
