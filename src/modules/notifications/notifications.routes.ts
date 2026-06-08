import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { Notification } from '../../models/Notification.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter = { recipient: req.user!.userId };
  if (req.query.unread === 'true') Object.assign(filter, { isRead: false });

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  const unreadCount = await Notification.countDocuments({ recipient: req.user!.userId, isRead: false });
  sendSuccess(res, { notifications, unreadCount }, 'Notifications fetched', 200, paginate(total, page, limit));
}));

router.put('/:id/read', asyncHandler(async (req: AuthRequest, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user!.userId },
    { isRead: true, readAt: new Date() },
  );
  sendSuccess(res, null, 'Marked as read');
}));

router.put('/read-all', asyncHandler(async (req: AuthRequest, res) => {
  await Notification.updateMany({ recipient: req.user!.userId, isRead: false }, { isRead: true, readAt: new Date() });
  sendSuccess(res, null, 'All marked as read');
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user!.userId });
  sendSuccess(res, null, 'Notification deleted');
}));

export const createNotification = async (
  recipient: string, title: string, message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  module = 'system', resourceId?: string,
) => Notification.create({ recipient, title, message, type, module, resourceId });

export default router;
