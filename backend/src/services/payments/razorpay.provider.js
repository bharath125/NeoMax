import crypto from 'crypto';
import axios from 'axios';
import { config } from '../../config/index.js';

const API_BASE_URL = 'https://api.razorpay.com/v1';

export const name = 'razorpay';

export function isConfigured() {
	return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}

function safeEqualHex(a, b) {
	if (typeof a !== 'string' || typeof b !== 'string') return false;
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function hmacSha256(secret, payload) {
	return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function unwrapError(err) {
	const description = err.response?.data?.error?.description;
	if (description) throw new Error(`Razorpay API error ${err.response.status}: ${description}`);
	throw err;
}

// Public key id is safe to hand to the browser — it is what Razorpay Checkout needs to open.
export function publicConfig() {
	return { keyId: config.razorpay.keyId };
}

export async function createOrder({ amount, currency, receipt, notes }) {
	try {
		const { data } = await axios.post(
			`${API_BASE_URL}/orders`,
			{ amount, currency, receipt, notes },
			{ auth: { username: config.razorpay.keyId, password: config.razorpay.keySecret } },
		);
		return { orderId: data.id };
	} catch (err) {
		unwrapError(err);
	}
}

// Checkout callback signature: HMAC-SHA256 of "<order_id>|<payment_id>" with the API key secret.
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
	// Never accept a signature made with an empty secret — that would let anyone forge one.
	if (!config.razorpay.keySecret || !orderId || !paymentId || !signature) return false;
	return safeEqualHex(hmacSha256(config.razorpay.keySecret, `${orderId}|${paymentId}`), signature);
}

// Webhook signature: HMAC-SHA256 of the RAW request body with the webhook secret (not the API key secret).
export function verifyWebhookSignature(rawBody, signature) {
	if (!config.razorpay.webhookSecret) return false;
	return safeEqualHex(hmacSha256(config.razorpay.webhookSecret, rawBody), signature);
}

// Reduces Razorpay's event payloads to what billing cares about. Returns null for events we ignore.
export function parseWebhookEvent(event) {
	if (event?.event === 'order.paid') {
		const order = event.payload?.order?.entity;
		const payment = event.payload?.payment?.entity;
		if (!order?.id || !payment?.id) return null;
		return { type: 'payment_succeeded', orderId: order.id, paymentId: payment.id, amount: order.amount_paid, currency: order.currency };
	}
	if (event?.event === 'payment.captured') {
		const payment = event.payload?.payment?.entity;
		if (!payment?.order_id || !payment?.id) return null;
		return { type: 'payment_succeeded', orderId: payment.order_id, paymentId: payment.id, amount: payment.amount, currency: payment.currency };
	}
	return null;
}
