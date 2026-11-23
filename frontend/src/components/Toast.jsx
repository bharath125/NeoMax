import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Icon } from './Icon.jsx';

const ToastContext = createContext(null);

const STYLES = {
	success: { icon: 'check', ring: 'border-emerald-400/30', dot: 'bg-emerald-500/20 text-emerald-300' },
	error: { icon: 'alert', ring: 'border-rose-400/30', dot: 'bg-rose-500/20 text-rose-300' },
	info: { icon: 'sparkles', ring: 'border-violet-400/30', dot: 'bg-violet-500/20 text-violet-300' },
};

let nextId = 0;

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const dismiss = useCallback((id) => setToasts((current) => current.filter((t) => t.id !== id)), []);

	const push = useCallback(
		(type, message) => {
			const id = ++nextId;
			setToasts((current) => [...current.slice(-2), { id, type, message }]);
			setTimeout(() => dismiss(id), 5000);
		},
		[dismiss],
	);

	const api = useMemo(
		() => ({
			success: (message) => push('success', message),
			error: (message) => push('error', message),
			info: (message) => push('info', message),
		}),
		[push],
	);

	return (
		<ToastContext.Provider value={api}>
			{children}
			<div
				aria-live="polite"
				className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:left-auto"
			>
				{toasts.map((toast) => {
					const style = STYLES[toast.type];
					return (
						<div
							key={toast.id}
							role="status"
							className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border bg-ink-800 px-4 py-3 shadow-2xl ${style.ring}`}
						>
							<span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${style.dot}`}>
								<Icon name={style.icon} className="h-3.5 w-3.5" />
							</span>
							<p className="flex-1 text-sm text-slate-200">{toast.message}</p>
							<button
								type="button"
								onClick={() => dismiss(toast.id)}
								aria-label="Dismiss notification"
								className="rounded p-0.5 text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
							>
								<Icon name="x" className="h-4 w-4" />
							</button>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}


export function useToast() {
	return useContext(ToastContext);
}
