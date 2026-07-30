import Stripe from 'stripe';
import { config } from '../config/index.js';
import { addCredits } from '../services/credits.service.js';

const stripe = new Stripe(config.stripe.secretKey);

// TODO: replace with real Stripe Price IDs created in the dashboard, one per credit package.
const CREDIT_PACKAGES = {
	small: { priceId: 'price_TODO_small', credits: 500 },
	medium: { priceId: 'price_TODO_medium', credits: 2000 },
	large: { priceId: 'price_TODO_large', credits: 6000 },
};

export async function createCheckoutSession(req, res, next) {
	try {
		const packageKey = req.body.package;
		const pkg = CREDIT_PACKAGES[packageKey];
		if (!pkg) return res.status(400).json({ success: false, error: { message: 'Unknown credit package' } });

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: [{ price: pkg.priceId, quantity: 1 }],
			success_url: `${config.frontendUrl}/billing?success=1`,
			cancel_url: `${config.frontendUrl}/billing?canceled=1`,
			client_reference_id: req.user._id.toString(),
			metadata: { credits: String(pkg.credits) },
		});

		res.json({ success: true, data: { url: session.url } });
	} catch (err) {
		next(err);
	}
}

// Mounted with express.raw() — do not put this route behind the global JSON body parser,
// Stripe's signature verification needs the raw payload bytes.
export async function handleWebhook(req, res) {
	let event;
	try {
		event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripe.webhookSecret);
	} catch (err) {
		return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const userId = session.client_reference_id;
		const credits = Number(session.metadata?.credits || 0);
		if (userId && credits > 0) {
			await addCredits(userId, credits);
		}
	}

	res.json({ received: true });
}
