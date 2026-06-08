import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Company } from '../../models/Company.model';
import { sendSuccess } from '../../utils/ApiResponse';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/company',
  filename: (_req, file, cb) => cb(null, `logo${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (_req, res) => {
  const company = await Company.findOne() || {};
  sendSuccess(res, company);
}));

router.put('/', requirePermission('company:manage'), asyncHandler(async (req, res) => {
  const company = await Company.findOneAndUpdate({}, req.body, { new: true, upsert: true });
  sendSuccess(res, company, 'Company settings updated');
}));

router.post('/logo', requirePermission('company:manage'), upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) { sendSuccess(res, null, 'No file'); return; }
  const logo = `/uploads/company/${req.file.filename}`;
  const company = await Company.findOneAndUpdate({}, { logo }, { new: true, upsert: true });
  sendSuccess(res, { logo: company?.logo }, 'Logo updated');
}));

export default router;
