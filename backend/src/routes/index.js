import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { generateRouter } from './generate.routes.js';
import { billingRouter } from './billing.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/generate', generateRouter);
apiRouter.use('/billing', billingRouter);
