import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { LeaveType, LeaveRequest } from '../../models/Leave.model';
import { Employee } from '../../models/Employee.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Leave Types
router.get('/types', asyncHandler(async (_req, res) => {
  sendSuccess(res, await LeaveType.find());
}));
router.post('/types', requirePermission('leave:manage'), asyncHandler(async (req, res) => {
  sendSuccess(res, await LeaveType.create(req.body), 'Leave type created', 201);
}));
router.put('/types/:id', requirePermission('leave:manage'), asyncHandler(async (req, res) => {
  const lt = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, lt, 'Leave type updated');
}));
router.delete('/types/:id', requirePermission('leave:manage'), asyncHandler(async (req, res) => {
  await LeaveType.findByIdAndDelete(req.params.id);
  sendSuccess(res, null, 'Leave type deleted');
}));

// Leave Requests
router.get('/', requirePermission('leave:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.status) filter.status = req.query.status;

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('leaveType', 'name color')
      .sort(sort).skip(skip).limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);
  sendSuccess(res, requests, 'Leave requests fetched', 200, paginate(total, page, limit));
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const employee = await Employee.findOne({ user: req.user!.userId });
  if (!employee) throw ApiError.notFound('Employee record not found');

  const { leaveTypeId, startDate, endDate, reason } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const request = await LeaveRequest.create({
    employee: employee._id,
    leaveType: leaveTypeId,
    startDate: start,
    endDate: end,
    days,
    reason,
  });
  sendSuccess(res, request, 'Leave request submitted', 201);
}));

router.put('/:id/approve', requirePermission('leave:approve'), asyncHandler(async (req: AuthRequest, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Leave request not found');
  if (request.status !== 'pending') throw ApiError.badRequest('Request is not pending');

  request.status = 'approved';
  request.approvedBy = req.user!.userId as any;
  request.approvedAt = new Date();
  await request.save();
  sendSuccess(res, request, 'Leave approved');
}));

router.put('/:id/reject', requirePermission('leave:approve'), asyncHandler(async (req: AuthRequest, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Leave request not found');
  request.status = 'rejected';
  request.rejectionReason = req.body.reason;
  await request.save();
  sendSuccess(res, request, 'Leave rejected');
}));

router.get('/balance/:employeeId', asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const types = await LeaveType.find();
  const balance = await Promise.all(
    types.map(async (lt) => {
      const used = await LeaveRequest.aggregate([
        { $match: { employee: req.params.employeeId as any, leaveType: lt._id, status: 'approved', startDate: { $gte: new Date(year, 0, 1) } } },
        { $group: { _id: null, total: { $sum: '$days' } } },
      ]);
      return { type: lt.name, color: lt.color, max: lt.maxDaysPerYear, used: used[0]?.total || 0 };
    }),
  );
  sendSuccess(res, balance);
}));

export default router;
