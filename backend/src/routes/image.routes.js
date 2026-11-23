import { Router } from 'express';
import { create, list } from '../controllers/image.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const imageRouter = Router();

imageRouter.use(requireAuth);
imageRouter.post('/', create);
imageRouter.get('/', list);
