import { Router } from 'express';
import { createGeneration, extendJob, exportSceneVideo, getJob, getScene, listJobs, listScenes, getPricing } from '../controllers/generate.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const generateRouter = Router();

generateRouter.use(requireAuth);
generateRouter.get('/pricing', getPricing);
generateRouter.post('/', createGeneration);
generateRouter.get('/scenes', listScenes);
generateRouter.get('/scenes/:sceneId', getScene);
generateRouter.post('/scenes/:sceneId/export', exportSceneVideo);
generateRouter.post('/:id/extend', extendJob);
generateRouter.get('/jobs', listJobs);
generateRouter.get('/jobs/:id', getJob);
