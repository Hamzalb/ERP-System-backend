import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuditLog } from '../models/AuditLog.model';
import { logger } from '../config/logger';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change' | 'role_change';

export const auditLog = async (
  actor: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  before?: unknown,
  after?: unknown,
  ip?: string,
  userAgent?: string,
): Promise<void> => {
  try {
    await AuditLog.create({ actor, action, resource, resourceId, before, after, ip, userAgent });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
};

export const withAudit =
  (action: AuditAction, resource: string) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    req.auditAction = action;
    req.auditResource = resource;
    next();
  };

declare global {
  namespace Express {
    interface Request {
      auditAction?: AuditAction;
      auditResource?: string;
      requestId?: string;
    }
  }
}
