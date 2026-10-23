import { Redis } from 'ioredis';
import { prisma } from '@stokvel/database';
import {
  OTP_TTL_SECONDS,
  generateNumericOtp,
  getJwtSecret,
  otpMatches,
  shouldExposeDebugOtp,
  signAccessToken,
} from '../../domain/auth';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
redis.connect().catch((err) => console.warn('Redis auth connect warning:', err.message));

export class AuthService {
  static async requestOtp(phoneNumber: string): Promise<{ message: string; debugOtp?: string }> {
    const otp = generateNumericOtp();
    await redis.set(`otp:${phoneNumber}`, otp, 'EX', OTP_TTL_SECONDS);

    console.log(`[SMS GATEWAY] OTP for ${phoneNumber} is ${otp}`);

    return {
      message: 'OTP dispatched successfully',
      debugOtp: shouldExposeDebugOtp(process.env.NODE_ENV) ? otp : undefined,
    };
  }

  static async verifyOtp(phoneNumber: string, code: string) {
    const storedOtp = await redis.get(`otp:${phoneNumber}`);
    if (!otpMatches(storedOtp, code)) {
      throw new Error('Invalid or expired OTP code');
    }
    await redis.del(`otp:${phoneNumber}`);

    let user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          fullName: 'New Stokvel Member',
        },
      });
    }

    const token = signAccessToken(user, getJwtSecret());

    return { token, user };
  }
}
