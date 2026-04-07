/**
 * Rate Limiter Middleware
 *
 * KEY CONCEPT: Rate limiting protects your API from abuse. Without it,
 * a single client can exhaust your server resources, denying service
 * to legitimate users (DoS attack).
 *
 * We use a sliding window approach: each client gets N requests per
 * time window. After that, they get 429 Too Many Requests until the
 * window resets.
 *
 * In production with multiple server instances, you'd use a Redis
 * store so the rate limit is shared across all instances. Here we
 * use the default in-memory store for simplicity.
 */
import rateLimit from 'express-rate-limit';

// General API rate limit: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

// Strict limit for auth endpoints: 10 requests per 15 minutes
// Why stricter? Brute-force login attempts need to be throttled aggressively.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

// Upload limit: 20 requests per 15 minutes
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many upload requests, please try again later.',
  },
});
