import { afterEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_TTL,
  OTP_TTL_SECONDS,
  generateNumericOtp,
  getJwtSecret,
  otpMatches,
  shouldExposeDebugOtp,
  signAccessToken,
  tokenFromAuthorizationHeader,
  verifyAccessToken,
} from '../auth';

const TEST_SECRET = 'unit-test-jwt-secret';
const ORIGINAL_SECRET = process.env.JWT_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  }
});

describe('authorization header', () => {
  it('reads the credential after the scheme and ignores a missing header', () => {
    expect(tokenFromAuthorizationHeader(undefined)).toBeNull();
    expect(tokenFromAuthorizationHeader('')).toBeNull();
    expect(tokenFromAuthorizationHeader('Bearer')).toBeNull();
    expect(tokenFromAuthorizationHeader('Bearer access-token')).toBe('access-token');
    expect(tokenFromAuthorizationHeader('Token access-token')).toBe('access-token');
  });
});

describe('one-time passcodes', () => {
  it('stores codes for five minutes', () => {
    expect(OTP_TTL_SECONDS).toBe(300);
  });

  it('formats the generated code from the inclusive lower bound used by crypto.randomInt', () => {
    const code = generateNumericOtp((min, max) => {
      expect(min).toBe(100000);
      expect(max).toBe(999999);
      return 123456;
    });
    expect(code).toBe('123456');
  });

  it('matches a stored code and rejects a missing, mistyped, or different-length code', () => {
    expect(otpMatches('123456', '123456')).toBe(true);
    expect(otpMatches('123456', '654321')).toBe(false);
    expect(otpMatches('123456', '12345')).toBe(false);
    expect(otpMatches(null, '123456')).toBe(false);
    expect(otpMatches(undefined, '123456')).toBe(false);
  });

  it('returns the debug code only for local development', () => {
    expect(shouldExposeDebugOtp(undefined)).toBe(true);
    expect(shouldExposeDebugOtp('')).toBe(true);
    expect(shouldExposeDebugOtp('development')).toBe(true);
    expect(shouldExposeDebugOtp('test')).toBe(false);
    expect(shouldExposeDebugOtp('production')).toBe(false);
  });
});

describe('access tokens', () => {
  const member = { id: 'user-1', role: 'MEMBER', phoneNumber: '+27821234567' };

  it('signs a seven-day token and verifies the member claims', () => {
    const token = signAccessToken(member, TEST_SECRET);
    const claims = verifyAccessToken(token, TEST_SECRET);
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect(claims).toMatchObject({
      userId: 'user-1',
      role: 'MEMBER',
      phoneNumber: '+27821234567',
    });
    expect(ACCESS_TOKEN_TTL).toBe('7d');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 6 * 24 * 60 * 60);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken(member, TEST_SECRET);
    expect(() => verifyAccessToken(token, 'another-secret')).toThrow();
  });

  it('uses JWT_SECRET from the environment when one is set', () => {
    process.env.JWT_SECRET = TEST_SECRET;
    expect(getJwtSecret()).toBe(TEST_SECRET);

    const token = signAccessToken(member);
    expect(verifyAccessToken(token).userId).toBe('user-1');
  });

  it('falls back to a local demo secret when JWT_SECRET is unset', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).not.toBe('');
  });
});
