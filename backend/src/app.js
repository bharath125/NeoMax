import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { handleWebhook } from './controllers/billing.controller.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(morgan('dev'));

// Razorpay needs the raw body to verify the webhook signature, so this must be mounted
// before express.json() and outside the versioned api router.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use(errorMiddleware);
