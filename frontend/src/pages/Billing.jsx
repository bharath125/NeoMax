import { useState } from 'react';
import { apiClient } from '../api/client.js';

const PACKAGES = [
	{ key: 'small', label: '500 credits' },
	{ key: 'medium', label: '2,000 credits' },
	{ key: 'large', label: '6,000 credits' },
];

export function Billing() {
	const [loadingKey, setLoadingKey] = useState(null);

	async function buy(packageKey) {
		setLoadingKey(packageKey);
		try {
			const { data } = await apiClient.post('/billing/checkout-session', { package: packageKey });
			window.location.href = data.data.url;
		} finally {
			setLoadingKey(null);
		}
	}

	return (
		<div className="max-w-md mx-auto mt-12 flex flex-col gap-4">
			<h1 className="text-2xl font-semibold">Buy credits</h1>
			<div className="flex flex-col gap-3">
				{PACKAGES.map((pkg) => (
					<button
						key={pkg.key}
						onClick={() => buy(pkg.key)}
						disabled={loadingKey === pkg.key}
						className="border rounded-md px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
					>
						{loadingKey === pkg.key ? 'Redirecting…' : pkg.label}
					</button>
				))}
			</div>
		</div>
	);
}
