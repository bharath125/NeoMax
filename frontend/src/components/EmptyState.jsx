import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function EmptyState({ icon = 'film', title, description, actionLabel, actionTo }) {
	return (
		<div className="card flex flex-col items-center px-6 py-16 text-center">
			<span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
				<Icon name={icon} className="h-7 w-7" />
			</span>
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
			{actionLabel && (
				<Link to={actionTo} className="btn-primary mt-6">
					<Icon name="sparkles" className="h-4 w-4" />
					{actionLabel}
				</Link>
			)}
		</div>
	);
}

