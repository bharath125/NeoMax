import Joi from 'joi';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { getCreditPackages } from '../config/creditPackages.js';
import { createOrder, fulfillOrder } from '../services/billing.service.js';
import { getPaymentProvider } from '../services/payments/index.js';
import { logger } from '../utils/logger.js';

const createOrderSchema = Joi.object({ package: Joi.string().required() });

const verifySchema = Joi.object({
	orderId: Joi.string().required(),
	paymentId: Joi.string().required(),
	signature: Joi.string().required(),
});

export async function listPackages(req, res, next) {
	try {
		res.json({ success: true, data: { enabled: getPaymentProvider().isConfigured(), packages: getCreditPackages() } });
	} catch (err) {
		next(err);
	}
}

export async function createOrderHandler(req, res, next) {
	try {
		const { error, value } = createOrderSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		res.status(201).json({ success: true, data: await createOrder(req.user, value.package) });
	} catch (err) {
		next(err);
	}
}

// Called by the browser right after Razorpay Checkout succeeds. The signature proves the payment belongs to
// the order; the webhook below is the safety net if this call never arrives (closed tab, network drop).
export async function verifyPayment(req, res, next) {
	try {
		const { error, value } = verifySchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const provider = getPaymentProvider();
		if (!provider.verifyCheckoutSignature(value)) {
			return res.status(400).json({ success: false, error: { message: 'Payment signature verification failed' } });
		}

		const { payment, granted, mismatch } = await fulfillOrder({
			providerName: provider.name,
			orderId: value.orderId,
			paymentId: value.paymentId,
			userId: req.user._id,
		});
		if (!payment) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
		if (mismatch) return res.status(409).json({ success: false, error: { message: 'Payment amount mismatch' } });

		const user = await User.findById(req.user._id).select('credits');
		res.json({ success: true, data: { creditsAdded: granted ? payment.credits : 0, credits: user.credits } });
	} catch (err) {
		next(err);
	}
}

// Mounted with express.raw() in app.js — signature verification needs the exact bytes Razorpay sent.
export async function handleWebhook(req, res) {
	const provider = getPaymentProvider();
	const signature = req.headers['x-razorpay-signature'];

	if (!Buffer.isBuffer(req.body) || !provider.verifyWebhookSignature(req.body, signature)) {
		return res.status(400).send('Invalid webhook signature');
	}

	try {
		const event = provider.parseWebhookEvent(JSON.parse(req.body.toString('utf8')));
		if (event?.type === 'payment_succeeded') {
			await fulfillOrder({
				providerName: provider.name,
				orderId: event.orderId,
				paymentId: event.paymentId,
				amount: event.amount,
				currency: event.currency,
			});
		}
		res.json({ received: true });
	} catch (err) {
		// Non-2xx makes Razorpay retry later, which is what we want for transient failures.
		logger.error(`Webhook processing failed: ${err.stack || err.message}`);
		res.status(500).send('Webhook processing failed');
	}
}

export async function listPayments(req, res, next) {
	try {
		const payments = await Payment.find({ user: req.user._id, status: 'paid' })
			.sort({ paidAt: -1 })
			.limit(20)
			.select('packageKey credits amount currency paidAt');
		res.json({ success: true, data: payments });
	} catch (err) {
		next(err);
	}
}
