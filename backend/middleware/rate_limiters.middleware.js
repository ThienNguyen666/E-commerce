const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints (login/register).
 * Very strict limits to prevent brute force attacks.
 * 5 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: 429,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sensitive actions (e.g., placing orders, password resets, OTP).
 * Strict limits to protect against abuse.
 * 10 requests per 15 minutes per IP.
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: 429,
    message: 'Too many requests for this action. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for public read APIs (e.g., product listings, searches, reviews).
 * Moderate limits to allow reasonable access while preventing abuse.
 * 200 requests per 15 minutes per IP.
 */
const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    status: 429,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for internal/admin APIs (e.g., creating products, viewing analytics).
 * Flexible but still protected limits for administrative actions.
 * 50 requests per 15 minutes per IP.
 */
const flexibleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    status: 429,
    message: 'Too many administrative requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  strictLimiter,
  moderateLimiter,
  flexibleLimiter,
};