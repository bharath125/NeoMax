import { Router } from 'express';
import { register, login, me, authConfig, googleLogin } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/config', authConfig);
authRouter.post('/google', googleLogin);
authRouter.get('/me', requireAuth, me);
