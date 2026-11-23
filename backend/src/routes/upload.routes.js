import express, { Router } from 'express';
import { config } from '../config/index.js';
import { uploadImage } from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const uploadRouter = Router();

// express.raw only consumes these content types, so anything else reaches the controller with no Buffer body and is
// rejected with a 415. Oversized bodies are rejected by body-parser with a 413 before we ever read them.
uploadRouter.post(
	'/',
	requireAuth,
	express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: config.uploads.maxFileBytes }),
	uploadImage,
);
