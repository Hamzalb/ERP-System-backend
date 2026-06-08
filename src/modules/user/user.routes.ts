import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { User } from '../../models/User.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  roles: z.array(z.string()).optional(),
});

router.get('/', requirePermission('users:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['name', 'email']));
  if (req.query.status) filter.status = req.query.status;

  const [users, total] = await Promise.all([
    User.find(filter).populate('roles', 'name').select('-sessions').sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, users, 'Users fetched', 200, paginate(total, page, limit));
}));

router.get('/:id', requirePermission('users:read'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('roles', 'name').select('-sessions');
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, user);
}));

router.post('/', requirePermission('users:create'), asyncHandler(async (req, res) => {
  const { name, email, password, roles } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already in use');
  const user = await User.create({ name, email, password, roles, isEmailVerified: true });
  sendSuccess(res, { id: user.id, name: user.name, email: user.email }, 'User created', 201);
}));

router.put('/:id', requirePermission('users:update'), asyncHandler(async (req, res) => {
  const input = updateUserSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, input, { new: true }).populate('roles', 'name');
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, user, 'User updated');
}));

router.delete('/:id', requirePermission('users:delete'), asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { status: 'archived' });
  sendSuccess(res, null, 'User archived');
}));

router.post('/:id/avatar', upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const url = `/uploads/avatars/${req.file.filename}`;
  await User.findByIdAndUpdate(req.params.id, { avatar: url });
  sendSuccess(res, { avatar: url }, 'Avatar updated');
}));

export default router;
