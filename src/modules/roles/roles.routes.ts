import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Role } from '../../models/Role.model';
import { Permission } from '../../models/Permission.model';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

router.get('/permissions', requirePermission('roles:read'), asyncHandler(async (_req, res) => {
  const permissions = await Permission.find().sort({ module: 1, key: 1 });
  sendSuccess(res, permissions);
}));

router.get('/', requirePermission('roles:read'), asyncHandler(async (_req, res) => {
  const roles = await Role.find().populate('permissions', 'key name module');
  sendSuccess(res, roles);
}));

router.get('/:id', requirePermission('roles:read'), asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).populate('permissions');
  if (!role) throw ApiError.notFound('Role not found');
  sendSuccess(res, role);
}));

router.post('/', requirePermission('roles:create'), asyncHandler(async (req, res) => {
  const input = roleSchema.parse(req.body);
  const role = await Role.create(input);
  sendSuccess(res, role, 'Role created', 201);
}));

router.put('/:id', requirePermission('roles:update'), asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('Cannot modify system roles');
  Object.assign(role, roleSchema.parse(req.body));
  await role.save();
  sendSuccess(res, role, 'Role updated');
}));

router.delete('/:id', requirePermission('roles:delete'), asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('Cannot delete system roles');
  await role.deleteOne();
  sendSuccess(res, null, 'Role deleted');
}));

export default router;
