import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
export const authRouter = Router();
authRouter.post('/register', authController.registerHandler);
authRouter.post('/login', authController.loginHandler);
