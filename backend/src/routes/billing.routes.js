import { Router } from 'express';
import { createCheckoutSession } from '../controllers/billing.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

// Note: the Stripe webhook route is NOT here — it needs express.raw() and is mounted
// directly in app.js, before the global JSON body parser.
export const billingRouter = Router();

billingRouter.post('/checkout-session', requireAuth, createCheckoutSession);
