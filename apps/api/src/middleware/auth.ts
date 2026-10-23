import { Request, Response, NextFunction } from 'express';
import { tokenFromAuthorizationHeader, verifyAccessToken, type AccessTokenClaims } from '../domain/auth';

export type AuthenticatedUser = AccessTokenClaims;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = tokenFromAuthorizationHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
