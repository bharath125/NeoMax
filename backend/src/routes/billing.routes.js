import { Router } from 'express';
import { listPackages, createOrderHandler, verifyPayment, listPayments } from '../controllers/billing.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

// Note: the payment webhook route is NOT here — it needs express.raw() and is mounted
// directly in app.js, before the global JSON body parser.
export const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.get('/packages', listPackages);
billingRouter.get('/payments', listPayments);
billingRouter.post('/orders', createOrderHandler);
billingRouter.post('/verify', verifyPayment);
