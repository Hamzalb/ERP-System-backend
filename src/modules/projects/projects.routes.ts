import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Project, Task } from '../../models/Project.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Projects
router.get('/', requirePermission('projects:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [projects, total] = await Promise.all([
    Project.find(filter).populate('manager members', 'name email avatar').sort(sort).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  sendSuccess(res, projects, 'Projects fetched', 200, paginate(total, page, limit));
}));

router.get('/:id', requirePermission('projects:read'), asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('manager members', 'name email avatar');
  if (!project) throw ApiError.notFound('Project not found');
  sendSuccess(res, project);
}));

router.post('/', requirePermission('projects:create'), asyncHandler(async (req: AuthRequest, res) => {
  const project = await Project.create({ ...req.body, createdBy: req.user!.userId, manager: req.user!.userId });
  sendSuccess(res, project, 'Project created', 201);
}));

router.put('/:id', requirePermission('projects:update'), asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!project) throw ApiError.notFound('Project not found');
  sendSuccess(res, project, 'Project updated');
}));

router.delete('/:id', requirePermission('projects:delete'), asyncHandler(async (req, res) => {
  await Project.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  sendSuccess(res, null, 'Project cancelled');
}));

// Tasks (Kanban)
router.get('/:id/tasks', requirePermission('projects:read'), asyncHandler(async (req, res) => {
  const tasks = await Task.find({ project: req.params.id }).populate('assignedTo', 'name avatar').sort({ order: 1 });
  const kanban = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };
  sendSuccess(res, kanban);
}));

router.post('/:id/tasks', requirePermission('projects:update'), asyncHandler(async (req, res) => {
  const count = await Task.countDocuments({ project: req.params.id, status: req.body.status || 'todo' });
  const task = await Task.create({ ...req.body, project: req.params.id, order: count });
  sendSuccess(res, task, 'Task created', 201);
}));

router.put('/tasks/:taskId', requirePermission('projects:update'), asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
  if (!task) throw ApiError.notFound('Task not found');

  const totalTasks = await Task.countDocuments({ project: task.project });
  const doneTasks = await Task.countDocuments({ project: task.project, status: 'done' });
  if (totalTasks > 0) {
    await Project.findByIdAndUpdate(task.project, { progress: Math.round((doneTasks / totalTasks) * 100) });
  }
  sendSuccess(res, task, 'Task updated');
}));

router.delete('/tasks/:taskId', requirePermission('projects:update'), asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.taskId);
  sendSuccess(res, null, 'Task deleted');
}));

export default router;
