import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const { redisMock, prismaMock } = vi.hoisted(() => {
  const redisMock = {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  };
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return { redisMock, prismaMock };
});

vi.mock('ioredis', () => ({
  Redis: vi.fn().mockImplementation(() => redisMock),
}));

vi.mock('@stokvel/database', () => ({
  prisma: prismaMock,
}));

import { AuthService } from '../auth.service';

const TEST_SECRET = 'unit-test-jwt-secret';
const PHONE = '+27821234567';
const ORIGINAL_SECRET = process.env.JWT_SECRET;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.NODE_ENV = 'test';
    redisMock.set.mockResolvedValue('OK');
    redisMock.del.mockResolvedValue(1);
    redisMock.connect.mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_SECRET;
    }
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    vi.restoreAllMocks();
  });

  it('stores a 6-digit OTP for five minutes and hides it outside development', async () => {
    const result = await AuthService.requestOtp(PHONE);

    expect(redisMock.set).toHaveBeenCalledWith(
      `otp:${PHONE}`,
      expect.stringMatching(/^\d{6}$/),
      'EX',
      300,
    );
    expect(result).toEqual({ message: 'OTP dispatched successfully', debugOtp: undefined });
  });

  it('returns the debug OTP only when the environment is development', async () => {
    process.env.NODE_ENV = 'development';

    const result = await AuthService.requestOtp(PHONE);
    const storedCode = redisMock.set.mock.calls[0][1];

    expect(result.debugOtp).toBe(storedCode);
    expect(storedCode).toMatch(/^\d{6}$/);
  });

  it('rejects a missing or wrong OTP without deleting the stored code', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    await expect(AuthService.verifyOtp(PHONE, '123456')).rejects.toThrow('Invalid or expired OTP code');

    redisMock.get.mockResolvedValueOnce('123456');
    await expect(AuthService.verifyOtp(PHONE, '000000')).rejects.toThrow('Invalid or expired OTP code');
    expect(redisMock.del).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('signs a token for an existing member and consumes the OTP', async () => {
    redisMock.get.mockResolvedValue('123456');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
      phoneNumber: PHONE,
      fullName: 'Existing Member',
    });

    const result = await AuthService.verifyOtp(PHONE, '123456');
    const claims = jwt.verify(result.token, TEST_SECRET) as jwt.JwtPayload;

    expect(redisMock.del).toHaveBeenCalledWith(`otp:${PHONE}`);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(claims).toMatchObject({ userId: 'user-1', role: 'MEMBER', phoneNumber: PHONE });
    expect(result.user).toMatchObject({ id: 'user-1' });
  });

  it('creates a member on first verification and signs their token', async () => {
    redisMock.get.mockResolvedValue('123456');
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-new',
      role: 'MEMBER',
      phoneNumber: PHONE,
      fullName: 'New Stokvel Member',
    });

    const result = await AuthService.verifyOtp(PHONE, '123456');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { phoneNumber: PHONE, fullName: 'New Stokvel Member' },
    });
    const claims = jwt.verify(result.token, TEST_SECRET) as jwt.JwtPayload;
    expect(claims.userId).toBe('user-new');
  });
});
