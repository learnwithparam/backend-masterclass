import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
// TODO: Import authLimiter and apply to auth routes

export const authRouter = Router();

authRouter.post('/register', authController.registerHandler);
authRouter.post('/login', authController.loginHandler);
