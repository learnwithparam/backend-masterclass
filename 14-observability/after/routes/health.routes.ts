import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';

export const healthRouter = Router();

// Liveness — "Is the process alive?"
healthRouter.get('/', healthController.livenessHandler);

// Readiness — "Can it serve traffic?"
healthRouter.get('/ready', healthController.readinessHandler);

// Metrics — request counts, response times, error rates
healthRouter.get('/metrics', healthController.metricsHandler);
