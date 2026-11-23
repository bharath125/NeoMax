import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';

// Reference-image jobs run on a pricier model, so they cost more per second.
export function creditRate(referenceCount = 0) {
	return referenceCount > 0 ? config.creditCostPerSecondReference : config.creditCostPerSecond;
}

export function estimateCost(durationSeconds, referenceCount = 0) {
	return Math.ceil(durationSeconds * creditRate(referenceCount));
}

export class InsufficientCreditsError extends Error {
	constructor() {
		super('Insufficient credits');
		this.statusCode = 402;
	}
}

// Atomic decrement — only succeeds if the user still has enough balance, so concurrent
// requests can't push a user's credits negative.
export async function reserveCredits(userId, amount) {
	const user = await User.findOneAndUpdate(
		{ _id: userId, credits: { $gte: amount } },
		{ $inc: { credits: -amount } },
		{ new: true },
	);
	if (!user) throw new InsufficientCreditsError();

	await CreditTransaction.create({ user: userId, amount: -amount, type: 'reserve' });
	return user.credits;
}

export async function refundCredits(userId, amount, jobId) {
	await User.findByIdAndUpdate(userId, { $inc: { credits: amount } });
	await CreditTransaction.create({ user: userId, amount, type: 'refund', job: jobId });
}

export async function addCredits(userId, amount, paymentId) {
	await User.findByIdAndUpdate(userId, { $inc: { credits: amount } });
	await CreditTransaction.create({ user: userId, amount, type: 'topup', payment: paymentId });
}
