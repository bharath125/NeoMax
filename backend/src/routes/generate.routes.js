import { Router } from 'express';
import { createGeneration, getJob, listJobs } from '../controllers/generate.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const generateRouter = Router();

generateRouter.use(requireAuth);
generateRouter.post('/', createGeneration);
generateRouter.get('/jobs', listJobs);
generateRouter.get('/jobs/:id', getJob);
