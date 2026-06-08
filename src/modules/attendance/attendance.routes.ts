import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Attendance } from '../../models/Attendance.model';
import { Employee } from '../../models/Employee.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

const WORK_START_HOUR = 9; // 9:00 AM
const WORK_HOURS = 8;

router.post('/check-in', asyncHandler(async (req: AuthRequest, res) => {
  const employee = await Employee.findOne({ user: req.user!.userId });
  if (!employee) throw ApiError.notFound('Employee record not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ employee: employee._id, date: today });
  if (existing?.checkIn) throw ApiError.conflict('Already checked in today');

  const now = new Date();
  const expectedStart = new Date(today);
  expectedStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const lateMinutes = Math.max(0, Math.floor((now.getTime() - expectedStart.getTime()) / 60000));

  const attendance = existing || new Attendance({ employee: employee._id, date: today });
  attendance.checkIn = now;
  attendance.isLate = lateMinutes > 0;
  attendance.lateMinutes = lateMinutes;
  attendance.status = lateMinutes > 0 ? 'late' : 'present';
  await attendance.save();

  sendSuccess(res, attendance, 'Checked in successfully');
}));

router.post('/check-out', asyncHandler(async (req: AuthRequest, res) => {
  const employee = await Employee.findOne({ user: req.user!.userId });
  if (!employee) throw ApiError.notFound('Employee record not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ employee: employee._id, date: today });
  if (!attendance?.checkIn) throw ApiError.badRequest('No check-in found for today');
  if (attendance.checkOut) throw ApiError.conflict('Already checked out today');

  const now = new Date();
  const totalHours = (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
  const overtime = Math.max(0, totalHours - WORK_HOURS);

  attendance.checkOut = now;
  attendance.totalHours = parseFloat(totalHours.toFixed(2));
  attendance.overtime = parseFloat(overtime.toFixed(2));
  await attendance.save();

  sendSuccess(res, attendance, 'Checked out successfully');
}));

router.get('/', requirePermission('attendance:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.date) filter.date = new Date(req.query.date as string);
  if (req.query.month && req.query.year) {
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    filter.date = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter).populate('employee', 'firstName lastName employeeId').sort(sort).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);
  sendSuccess(res, records, 'Attendance fetched', 200, paginate(total, page, limit));
}));

router.put('/:id', requirePermission('attendance:update'), asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndUpdate(
    req.params.id,
    { ...req.body, adjustedBy: (req as AuthRequest).user!.userId },
    { new: true },
  );
  if (!record) throw ApiError.notFound('Attendance record not found');
  sendSuccess(res, record, 'Attendance updated');
}));

export default router;
