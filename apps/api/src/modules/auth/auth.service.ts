import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { prisma } from '@stokvel/database';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
redis.connect().catch((err) => console.warn('Redis auth connect warning:', err.message));

const JWT_SECRET = process.env.JWT_SECRET || 'stokvel_jwt_secret_key_2026_super_safe';

export class AuthService {
  static async requestOtp(phoneNumber: string): Promise<{ message: string; debugOtp?: string }> {
    const otp = crypto.randomInt(100000, 999999).toString();
    // Store in Redis with 5 minute expiration (300 seconds)
    await redis.set(`otp:${phoneNumber}`, otp, 'EX', 300);

    // Console log for local development execution
    console.log(`[SMS GATEWAY] OTP for ${phoneNumber} is ${otp}`);

    return {
      message: 'OTP dispatched successfully',
      debugOtp: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? otp : undefined,
    };
  }

  static async verifyOtp(phoneNumber: string, code: string) {
    const storedOtp = await redis.get(`otp:${phoneNumber}`);
    if (!storedOtp || storedOtp !== code) {
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  }
}
