import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.message || 'Internal Server Error');
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong on our end' });
}
