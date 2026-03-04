import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rate-limiter.js';

export const authRouter = Router();

// Auth endpoints get stricter rate limiting
authRouter.post('/register', authLimiter, authController.registerHandler);
authRouter.post('/login', authLimiter, authController.loginHandler);
