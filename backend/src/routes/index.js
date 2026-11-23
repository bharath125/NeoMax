import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { generateRouter } from './generate.routes.js';
import { billingRouter } from './billing.routes.js';
import { imageRouter } from './image.routes.js';
import { uploadRouter } from './upload.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/generate', generateRouter);
apiRouter.use('/billing', billingRouter);
apiRouter.use('/images', imageRouter);
apiRouter.use('/uploads', uploadRouter);
