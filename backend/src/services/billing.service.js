import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { addCredits } from './credits.service.js';
import { getCreditPackage } from '../config/creditPackages.js';
import { getPaymentProvider } from './payments/index.js';
import { logger } from '../utils/logger.js';

export class PaymentsNotConfiguredError extends Error {
	constructor() {
		super('Payments are not enabled yet');
		this.statusCode = 503;
	}
}

export async function createOrder(user, packageKey) {
	const pkg = getCreditPackage(packageKey);
	if (!pkg) {
		const err = new Error('Unknown credit package');
		err.statusCode = 400;
		throw err;
	}

	const provider = getPaymentProvider();
	if (!provider.isConfigured()) throw new PaymentsNotConfiguredError();

	// Pre-generate the id so the provider order can reference it as the receipt before the row exists.
	const paymentId = new mongoose.Types.ObjectId();
	const { orderId } = await provider.createOrder({
		amount: pkg.amount,
		currency: pkg.currency,
		receipt: paymentId.toString(),
		notes: { userId: user._id.toString(), packageKey: pkg.key, credits: String(pkg.credits) },
	});

	await Payment.create({
		_id: paymentId,
		user: user._id,
		provider: provider.name,
		providerOrderId: orderId,
		packageKey: pkg.key,
		credits: pkg.credits,
		amount: pkg.amount,
		currency: pkg.currency,
	});

	return { orderId, amount: pkg.amount, currency: pkg.currency, credits: pkg.credits, packageKey: pkg.key, ...provider.publicConfig() };
}

// Flips creditsGranted false -> true atomically, so exactly one caller adds the credits even when the checkout
// callback and webhook (or webhook retries) arrive at the same time. If adding fails the flag is released so a
// retry can grant again.
async function grantCredits(payment) {
	const claimed = await Payment.findOneAndUpdate({ _id: payment._id, creditsGranted: false }, { $set: { creditsGranted: true } });
	if (!claimed) return false;

	try {
		await addCredits(payment.user, payment.credits, payment._id);
		return true;
	} catch (err) {
		await Payment.updateOne({ _id: payment._id }, { $set: { creditsGranted: false } });
		throw err;
	}
}

// Idempotent: safe to call any number of times for the same order. Pass userId to restrict to the caller's own
// orders (checkout callback); omit it for provider webhooks.
export async function fulfillOrder({ providerName, orderId, paymentId, amount, currency, userId }) {
	const scope = { provider: providerName, providerOrderId: orderId, ...(userId && { user: userId }) };

	const existing = await Payment.findOne(scope);
	if (!existing) return { payment: null, granted: false };

	// Webhook payloads carry what was actually paid; it must match the order we created.
	if ((amount !== undefined && amount !== existing.amount) || (currency && currency !== existing.currency)) {
		logger.error(`Payment amount mismatch for order ${orderId}: expected ${existing.amount} ${existing.currency}, got ${amount} ${currency}`);
		return { payment: existing, granted: false, mismatch: true };
	}

	await Payment.updateOne({ ...scope, status: 'created' }, { $set: { status: 'paid', providerPaymentId: paymentId, paidAt: new Date() } });
	const payment = await Payment.findOne(scope);
	const granted = await grantCredits(payment);
	return { payment, granted };
}
