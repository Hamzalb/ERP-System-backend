import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/ApiResponse';
import { logger } from '../config/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });

  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendError(res, 400, 'Validation failed', errors);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, `Invalid ${err.path}: ${err.value}`);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    sendError(res, 400, 'Validation failed', errors);
    return;
  }

  if ((err as any).code === 11000) {
    sendError(res, 409, 'Duplicate key error — resource already exists');
    return;
  }

  sendError(res, 500, 'Internal server error');
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
};
