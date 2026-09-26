import { Router } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { otpLimiter } from '../middleware/rateLimit';
import { validate, requestOtpSchema, verifyOtpSchema } from '../middleware/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '@stokvel/database';

const router = Router();

router.post(
  '/request-otp',
  otpLimiter,
  validate(requestOtpSchema),
  async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const result = await AuthService.requestOtp(phoneNumber);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to dispatch OTP' });
    }
  }
);

router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      const result = await AuthService.verifyOtp(phoneNumber, code);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'OTP verification failed' });
    }
  }
);

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      include: { memberships: { include: { group: true } } },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
