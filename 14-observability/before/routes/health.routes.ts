import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';

export const healthRouter = Router();

// TODO: Wire up health check routes
healthRouter.get('/', healthController.livenessHandler);
healthRouter.get('/ready', healthController.readinessHandler);
healthRouter.get('/metrics', healthController.metricsHandler);
