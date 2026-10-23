import rateLimit from 'express-rate-limit';

const fifteenMinutes = 15 * 60 * 1000;

export const otpLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 5,
  message: { error: 'Too many OTP requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 5,
  message: { error: 'Too many OTP attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 300,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const profileLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 100,
  message: { error: 'Too many profile requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
