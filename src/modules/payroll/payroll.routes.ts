import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Payroll } from '../../models/Payroll.model';
import { Employee } from '../../models/Employee.model';
import { Attendance } from '../../models/Attendance.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requirePermission('payroll:read'));

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.month) filter['period.month'] = parseInt(req.query.month as string);
  if (req.query.year) filter['period.year'] = parseInt(req.query.year as string);
  if (req.query.status) filter.status = req.query.status;

  const [records, total] = await Promise.all([
    Payroll.find(filter).populate('employee', 'firstName lastName employeeId').sort(sort).skip(skip).limit(limit),
    Payroll.countDocuments(filter),
  ]);
  sendSuccess(res, records, 'Payroll fetched', 200, paginate(total, page, limit));
}));

router.post('/generate', requirePermission('payroll:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { month, year, employeeIds } = req.body;
  const employees = employeeIds?.length
    ? await Employee.find({ _id: { $in: employeeIds }, status: 'active' })
    : await Employee.find({ status: 'active' });

  const TAX_RATE = 0.15;
  const results = await Promise.all(
    employees.map(async (emp) => {
      const existing = await Payroll.findOne({ employee: emp._id, 'period.month': month, 'period.year': year });
      if (existing) return existing;

      const attendanceDays = await Attendance.countDocuments({
        employee: emp._id,
        date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
        status: { $in: ['present', 'late'] },
      });

      const baseSalary = emp.salary.amount;
      const tax = baseSalary * TAX_RATE;
      const netSalary = baseSalary - tax;

      return Payroll.create({
        employee: emp._id,
        period: { month, year },
        baseSalary,
        bonuses: [],
        deductions: [{ label: 'Tax', amount: tax }],
        tax,
        netSalary,
        currency: emp.salary.currency,
        generatedBy: req.user!.userId,
      });
    }),
  );
  sendSuccess(res, results, `Generated ${results.length} payroll records`, 201);
}));

router.put('/:id', requirePermission('payroll:manage'), asyncHandler(async (req, res) => {
  const record = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) throw ApiError.notFound('Payroll record not found');
  sendSuccess(res, record, 'Payroll updated');
}));

router.put('/:id/approve', requirePermission('payroll:approve'), asyncHandler(async (req, res) => {
  const record = await Payroll.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  sendSuccess(res, record, 'Payroll approved');
}));

router.put('/:id/pay', requirePermission('payroll:approve'), asyncHandler(async (req, res) => {
  const record = await Payroll.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date() }, { new: true });
  sendSuccess(res, record, 'Payroll marked as paid');
}));

export default router;
