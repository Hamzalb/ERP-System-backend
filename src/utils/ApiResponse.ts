import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

export const sendError = (res: Response, statusCode: number, message: string, errors?: string[]) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors?.length && { errors }),
  });
};

export const paginate = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});
