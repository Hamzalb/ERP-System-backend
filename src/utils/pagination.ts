import { Request } from 'express';

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
  search?: string;
}

export const getPagination = (req: Request): PaginationQuery => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const search = (req.query.search as string) || undefined;

  return { page, limit, skip, sort: { [sortField]: sortOrder }, search };
};

export const buildSearchQuery = (search: string, fields: string[]) => ({
  $or: fields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })),
});
