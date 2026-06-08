import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Employee } from '../../models/Employee.model';
import { Department } from '../../models/Department.model';
import { Position } from '../../models/Position.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';

const router = Router();
router.use(authenticate);

// Departments
router.get('/departments', asyncHandler(async (_req, res) => {
  const depts = await Department.find().populate('manager', 'firstName lastName');
  sendSuccess(res, depts);
}));
router.post('/departments', requirePermission('employees:create'), asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  sendSuccess(res, dept, 'Department created', 201);
}));
router.put('/departments/:id', requirePermission('employees:update'), asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, dept, 'Department updated');
}));
router.delete('/departments/:id', requirePermission('employees:delete'), asyncHandler(async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  sendSuccess(res, null, 'Department deleted');
}));

// Positions
router.get('/positions', asyncHandler(async (_req, res) => {
  const positions = await Position.find().populate('department', 'name');
  sendSuccess(res, positions);
}));
router.post('/positions', requirePermission('employees:create'), asyncHandler(async (req, res) => {
  const pos = await Position.create(req.body);
  sendSuccess(res, pos, 'Position created', 201);
}));

// Employees CRUD
router.get('/', requirePermission('employees:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['firstName', 'lastName', 'email', 'employeeId']));
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status) filter.status = req.query.status;

  const [employees, total] = await Promise.all([
    Employee.find(filter).populate('department position manager', 'name title firstName lastName').sort(sort).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);
  sendSuccess(res, employees, 'Employees fetched', 200, paginate(total, page, limit));
}));

router.get('/:id', requirePermission('employees:read'), asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id).populate('department position manager', 'name title firstName lastName');
  if (!emp) throw ApiError.notFound('Employee not found');
  sendSuccess(res, emp);
}));

router.post('/', requirePermission('employees:create'), asyncHandler(async (req, res) => {
  const count = await Employee.countDocuments();
  const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  const emp = await Employee.create({ ...req.body, employeeId });
  sendSuccess(res, emp, 'Employee created', 201);
}));

router.put('/:id', requirePermission('employees:update'), asyncHandler(async (req, res) => {
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!emp) throw ApiError.notFound('Employee not found');
  sendSuccess(res, emp, 'Employee updated');
}));

router.delete('/:id', requirePermission('employees:delete'), asyncHandler(async (req, res) => {
  await Employee.findByIdAndUpdate(req.params.id, { status: 'terminated' });
  sendSuccess(res, null, 'Employee terminated');
}));

// Notes
router.post('/:id/notes', requirePermission('employees:update'), asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) throw ApiError.notFound('Employee not found');
  emp.notes.push({ content: req.body.content, createdBy: (req as any).user.userId, createdAt: new Date() });
  await emp.save();
  sendSuccess(res, emp.notes, 'Note added');
}));

export default router;
