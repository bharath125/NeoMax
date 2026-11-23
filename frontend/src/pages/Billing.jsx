import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { useMe } from '../hooks/useMe.js';
import { useCreditPackages, usePayments } from '../hooks/useBilling.js';
import { Icon, Spinner } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatMoney } from '../lib/format.js';
import { usePricing } from '../hooks/usePricing.js';
import { apiErrorMessage } from '../lib/jobs.js';
import { openCheckout } from '../lib/razorpay.js';

const BLURBS = { small: 'Try a few ideas', medium: 'For regular posting', large: 'For heavy use' };
const POPULAR = 'medium';

const formatSeconds = (credits, creditsPerSecond) => {
	const seconds = Math.floor(credits / creditsPerSecond);
	return seconds >= 120 ? `${Math.floor(seconds / 60)} min` : `${seconds} sec`;
};

export function Billing() {
	const toast = useToast();
	const { creditsPerSecond } = usePricing();
	const queryClient = useQueryClient();
	const { data: me } = useMe();
	const { data: catalog, isLoading: packagesLoading, isError: packagesError, refetch } = useCreditPackages();
	const { data: payments } = usePayments();
	const [loadingKey, setLoadingKey] = useState(null);

	const enabled = catalog?.enabled;

	async function confirmPayment(order, response) {
		try {
			const { data } = await apiClient.post('/billing/verify', {
				orderId: response.razorpay_order_id,
				paymentId: response.razorpay_payment_id,
				signature: response.razorpay_signature,
			});
			toast.success(`${order.credits.toLocaleString()} credits added to your account.`);
			return data.data;
		} catch {
			// The money was taken, but we couldn't confirm it from the browser. The server also learns about the
			// payment from Razorpay directly, so credits normally still arrive.
			toast.info('Payment received. Your credits may take a minute to show up — refresh if they don’t.');
			return null;
		} finally {
			queryClient.invalidateQueries({ queryKey: ['me'] });
			queryClient.invalidateQueries({ queryKey: ['payments'] });
		}
	}

	async function buy(pkg) {
		setLoadingKey(pkg.key);
		try {
			const { data } = await apiClient.post('/billing/orders', { package: pkg.key });
			const order = data.data;

			const checkoutOptions = {
				key: order.keyId,
				order_id: order.orderId,
				amount: order.amount,
				currency: order.currency,
				name: 'NeoMax',
				description: `${order.credits.toLocaleString()} credits`,
				prefill: { email: me?.email },
				theme: { color: '#8b5cf6' },
			};
			const response = await openCheckout(checkoutOptions, {
				onFailure: (failure) => toast.error(failure?.description || 'That payment didn’t go through. You can try another method.'),
			});
			await confirmPayment(order, response);
		} catch (err) {
			if (err?.dismissed) toast.info('Checkout closed. You haven’t been charged.');
			else toast.error(apiErrorMessage(err, 'Couldn’t start checkout. Please try again.'));
		} finally {
			setLoadingKey(null);
		}
	}

	return (
		<div className="animate-fade-up">
			<header className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Credits</h1>
				<p className="mt-2 text-slate-400">Credits are only spent when you generate. Failed videos are refunded automatically.</p>
			</header>

			<section className="card mb-10 flex flex-wrap items-center justify-between gap-4 p-6" aria-label="Current balance">
				<div className="flex items-center gap-4">
					<span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
						<Icon name="coins" className="h-6 w-6" />
					</span>
					<div>
						<p className="text-sm text-slate-400">Current balance</p>
						{me ? (
							<p className="text-3xl font-bold tabular-nums">
								{me.credits} <span className="text-base font-medium text-slate-500">credits</span>
							</p>
						) : (
							<div className="skeleton mt-1 h-8 w-28 rounded" />
						)}
					</div>
				</div>
				{me && <p className="text-sm text-slate-400">≈ {formatSeconds(me.credits, creditsPerSecond)} of video</p>}
			</section>

			<h2 className="mb-4 text-lg font-semibold">Get more credits</h2>

			{catalog && !enabled && (
				<p role="status" className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					Buying credits isn’t available yet. Check back soon.
				</p>
			)}

			{packagesError && (
				<div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
					<p className="font-semibold">We couldn’t load the credit packs</p>
					<button type="button" onClick={() => refetch()} className="btn-ghost mt-4">
						Try again
					</button>
				</div>
			)}

			<div className="grid gap-5 md:grid-cols-3">
				{packagesLoading &&
					Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-64 rounded-2xl" aria-hidden="true" />)}

				{catalog?.packages.map((pkg) => {
					const popular = pkg.key === POPULAR;
					const loading = loadingKey === pkg.key;
					return (
						<div key={pkg.key} className={`card relative flex flex-col p-6 ${popular ? 'border-violet-400/50 shadow-xl shadow-violet-500/10' : ''}`}>
							{popular && (
								<span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold">
									Most popular
								</span>
							)}
							<p className="font-semibold">{pkg.name}</p>
							<p className="text-sm text-slate-500">{BLURBS[pkg.key]}</p>
							<p className="mt-5 text-4xl font-extrabold tabular-nums">{pkg.credits.toLocaleString()}</p>
							<p className="text-sm text-slate-400">credits · ≈ {formatSeconds(pkg.credits, creditsPerSecond)} of video</p>
							<p className="mt-3 text-lg font-semibold text-slate-200">{formatMoney(pkg.amount, pkg.currency)}</p>
							<button
								type="button"
								onClick={() => buy(pkg)}
								disabled={!enabled || loadingKey !== null}
								className={`${popular ? 'btn-primary' : 'btn-ghost'} mt-5 w-full`}
							>
								{loading ? <Spinner className="h-4 w-4" /> : <Icon name="zap" className="h-4 w-4" />}
								{loading ? 'Opening checkout…' : 'Buy now'}
							</button>
						</div>
					);
				})}
			</div>
			<p className="mt-6 text-xs text-slate-500">Payments are processed securely by Razorpay. We never see or store your card details.</p>

			{payments?.length > 0 && (
				<section className="mt-12" aria-labelledby="history">
					<h2 id="history" className="mb-4 text-lg font-semibold">
						Purchase history
					</h2>
					<ul className="card divide-y divide-white/10">
						{payments.map((payment) => (
							<li key={payment._id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
								<div>
									<p className="font-medium">{payment.credits.toLocaleString()} credits</p>
									<p className="text-xs text-slate-500">{new Date(payment.paidAt).toLocaleString()}</p>
								</div>
								<span className="tabular-nums text-slate-300">{formatMoney(payment.amount, payment.currency)}</span>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
