/**
 * Rate Limiter Middleware
 *
 * TODO: Implement three rate limiters using express-rate-limit:
 *
 * 1. apiLimiter — General API limit
 *    - 100 requests per 15-minute window
 *    - Return standard rate limit headers
 *    - Message: "Too many requests, please try again later."
 *
 * 2. authLimiter — Strict limit for auth endpoints
 *    - 10 requests per 15-minute window
 *    - Message: "Too many authentication attempts, please try again later."
 *
 * 3. uploadLimiter — File upload limit
 *    - 20 requests per 15-minute window
 *    - Message: "Too many upload requests, please try again later."
 */
import rateLimit from 'express-rate-limit';

// TODO: Create apiLimiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // TODO: configure properly
});

// TODO: Create authLimiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // TODO: configure properly
});

// TODO: Create uploadLimiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // TODO: configure properly
});
