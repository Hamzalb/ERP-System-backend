import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { AuditLog } from '../../models/AuditLog.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';

const router = Router();
router.use(authenticate, requirePermission('audit:read'));

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resource) filter.resource = req.query.resource;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('actor', 'name email').sort(sort).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  sendSuccess(res, logs, 'Audit logs fetched', 200, paginate(total, page, limit));
}));

router.get('/stats', asyncHandler(async (_req, res) => {
  const stats = await AuditLog.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  sendSuccess(res, stats);
}));

export default router;
