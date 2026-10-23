import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, type AuthenticatedRequest } from '../auth';

const TEST_SECRET = 'unit-test-jwt-secret';
const ORIGINAL_SECRET = process.env.JWT_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  }
});

function callMiddleware(authorization?: string, secret = TEST_SECRET) {
  process.env.JWT_SECRET = secret;
  const req = { headers: authorization === undefined ? {} : { authorization } } as AuthenticatedRequest;
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
  authenticateToken(req, res as unknown as Response, next);
  return { req, res, next };
}

describe('authenticateToken', () => {
  it('requires an access token', () => {
    const missing = callMiddleware();
    expect(missing.res.statusCode).toBe(401);
    expect(missing.res.body).toEqual({ error: 'Access token required' });
    expect(missing.next).not.toHaveBeenCalled();

    const blank = callMiddleware('Bearer');
    expect(blank.res.statusCode).toBe(401);
    expect(blank.next).not.toHaveBeenCalled();
  });

  it('attaches the member claims and continues for a valid token', () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'HUB_MANAGER', phoneNumber: '+27821234567' },
      TEST_SECRET,
      { expiresIn: '1h' },
    );
    const { req, res, next } = callMiddleware(`Bearer ${token}`);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(req.user).toMatchObject({
      userId: 'user-1',
      role: 'HUB_MANAGER',
      phoneNumber: '+27821234567',
    });
  });

  it('rejects a token signed with another secret', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'MEMBER', phoneNumber: '+27820000000' }, 'other-secret');
    const { res, next } = callMiddleware(`Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'MEMBER', phoneNumber: '+27820000000', exp: Math.floor(Date.now() / 1000) - 10 },
      TEST_SECRET,
    );
    const { res, next } = callMiddleware(`Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
