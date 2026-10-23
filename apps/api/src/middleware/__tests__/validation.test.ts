import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import {
  orderPayloadSchema,
  redeemPayloadSchema,
  requestOtpSchema,
  validate,
  verifyOtpSchema,
} from '../validation';

const POOL_ID = '11111111-1111-4111-8111-111111111111';

function runValidate(schema: Parameters<typeof validate>[0], body: unknown) {
  const req = { body } as Request;
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  const next = vi.fn() as unknown as NextFunction;
  validate(schema)(req, res as unknown as Response, next);
  return { res, next };
}

describe('order validation', () => {
  it('accepts a pool id and a positive whole quantity', () => {
    const parsed = orderPayloadSchema.parse({ poolId: POOL_ID, quantity: 1 });
    expect(parsed).toEqual({ poolId: POOL_ID, quantity: 1 });
  });

  it('rejects a missing pool, a bad id, and a quantity below one', () => {
    expect(orderPayloadSchema.safeParse({ quantity: 1 }).success).toBe(false);
    expect(orderPayloadSchema.safeParse({ poolId: 'pool-1', quantity: 1 }).success).toBe(false);
    expect(orderPayloadSchema.safeParse({ poolId: POOL_ID, quantity: 0 }).success).toBe(false);
    expect(orderPayloadSchema.safeParse({ poolId: POOL_ID, quantity: -3 }).success).toBe(false);
    expect(orderPayloadSchema.safeParse({ poolId: POOL_ID, quantity: 1.5 }).success).toBe(false);
    expect(orderPayloadSchema.safeParse({ poolId: POOL_ID, quantity: '2' }).success).toBe(false);
  });
});

describe('auth validation', () => {
  it('requires a phone number of at least 10 characters', () => {
    expect(requestOtpSchema.safeParse({ phoneNumber: '0821234567' }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ phoneNumber: '+27821234567' }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ phoneNumber: '123456789' }).success).toBe(false);
  });

  it('requires a 6-digit OTP', () => {
    expect(verifyOtpSchema.safeParse({ phoneNumber: '+27821234567', code: '123456' }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ phoneNumber: '+27821234567', code: '12345' }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ phoneNumber: '+27821234567', code: '1234567' }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ phoneNumber: '+27821234567', code: '12ab56' }).success).toBe(false);
  });
});

describe('redemption validation', () => {
  it('requires a collection code of at least 5 characters', () => {
    expect(redeemPayloadSchema.safeParse({ collectionOtp: '849 204' }).success).toBe(true);
    expect(redeemPayloadSchema.safeParse({ collectionOtp: '12345' }).success).toBe(true);
    expect(redeemPayloadSchema.safeParse({ collectionOtp: '1234' }).success).toBe(false);
    expect(redeemPayloadSchema.safeParse({}).success).toBe(false);
  });
});

describe('validate middleware', () => {
  it('calls next when the body matches the schema', () => {
    const { res, next } = runValidate(orderPayloadSchema, { poolId: POOL_ID, quantity: 2 });
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 with the schema errors when the body is invalid', () => {
    const { res, next } = runValidate(orderPayloadSchema, { poolId: POOL_ID, quantity: 0 });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: expect.arrayContaining([
        expect.objectContaining({ message: 'Quantity must be at least 1' }),
      ]),
    });
  });
});
