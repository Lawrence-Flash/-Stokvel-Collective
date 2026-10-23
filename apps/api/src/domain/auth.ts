import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const OTP_TTL_SECONDS = 300;
export const ACCESS_TOKEN_TTL = '7d';

// Documented local-demo fallback. Set JWT_SECRET outside local development.
const DEV_JWT_FALLBACK = 'stokvel_jwt_secret_key_2026_super_safe';

export interface AccessTokenClaims {
  userId: string;
  role: string;
  phoneNumber: string;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEV_JWT_FALLBACK;
}

export function tokenFromAuthorizationHeader(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const token = authorizationHeader.split(' ')[1];
  return token || null;
}

export function generateNumericOtp(
  randomInt: (min: number, max: number) => number = (min, max) => crypto.randomInt(min, max),
): string {
  return randomInt(100000, 999999).toString();
}

export function otpMatches(storedOtp: string | null | undefined, code: string): boolean {
  if (!storedOtp) {
    return false;
  }
  const stored = Buffer.from(storedOtp);
  const provided = Buffer.from(code);
  if (stored.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(stored, provided);
}

export function shouldExposeDebugOtp(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'development' || !nodeEnv;
}

export function signAccessToken(
  user: { id: string; role: string; phoneNumber: string },
  secret: string = getJwtSecret(),
): string {
  const claims: AccessTokenClaims = {
    userId: user.id,
    role: user.role,
    phoneNumber: user.phoneNumber,
  };
  return jwt.sign(claims, secret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string, secret: string = getJwtSecret()): AccessTokenClaims {
  return jwt.verify(token, secret) as AccessTokenClaims;
}
