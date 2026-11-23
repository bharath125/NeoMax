import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function Logo({ to = '/', className = '' }) {
	return (
		<Link
			to={to}
			className={`inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
		>
			<span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-snow shadow-lg shadow-violet-500/30">
				<Icon name="play" className="h-4 w-4" filled />
			</span>
			<span className="text-lg font-bold tracking-tight">NeoMax</span>
		</Link>
	);
}

