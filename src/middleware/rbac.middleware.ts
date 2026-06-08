import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';

export const requirePermission =
  (...permissions: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());

    const userPerms = req.user.permissions;
    const hasAll = permissions.every((p) => userPerms.includes(p) || userPerms.includes('*'));

    if (!hasAll) {
      return next(ApiError.forbidden(`Missing permissions: ${permissions.join(', ')}`));
    }
    next();
  };

export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());

    const hasRole = roles.some((r) => req.user!.roles.includes(r) || req.user!.roles.includes('SuperAdmin'));
    if (!hasRole) {
      return next(ApiError.forbidden(`Required role: ${roles.join(' or ')}`));
    }
    next();
  };
