import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const orderPayloadSchema = z.object({
  poolId: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const requestOtpSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid phone number required'),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const redeemPayloadSchema = z.object({
  collectionOtp: z.string().min(5, 'Valid collection OTP required'),
});

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (e: any) {
      return res.status(400).json({ error: e.errors || 'Validation error' });
    }
  };
