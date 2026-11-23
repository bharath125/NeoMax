import { useState } from 'react';

export function PasswordField({ id, label, value, onChange, autoComplete, hint, minLength }) {
	const [visible, setVisible] = useState(false);
	return (
		<div>
			<label htmlFor={id} className="label">
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					type={visible ? 'text' : 'password'}
					value={value}
					onChange={onChange}
					autoComplete={autoComplete}
					minLength={minLength}
					required
					className="input pr-16"
				/>
				<button
					type="button"
					onClick={() => setVisible((v) => !v)}
					aria-pressed={visible}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
				>
					{visible ? 'Hide' : 'Show'}
				</button>
			</div>
			{hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
		</div>
	);
}
