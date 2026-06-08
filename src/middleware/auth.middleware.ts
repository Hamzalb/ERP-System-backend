import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    roles: string[];
    permissions: string[];
  };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // ignore — treat as unauthenticated
    }
  }
  next();
};
