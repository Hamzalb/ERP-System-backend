import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Schema, model, Document, Types } from 'mongoose';

interface IFile extends Document {
  name: string;
  originalName: string;
  url: string;
  mimetype: string;
  size: number;
  folder?: string;
  uploadedBy: Types.ObjectId;
}

const fileSchema = new Schema<IFile>(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    folder: { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);
const File = model<IFile>('File', fileSchema);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/files';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const ALLOWED_MIME = ['image/', 'application/pdf', 'text/', 'application/msword',
  'application/vnd.openxmlformats', 'application/vnd.ms-excel', 'application/zip'];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_MIME.some((m) => file.mimetype.startsWith(m));
    cb(ok ? null : new Error('File type not allowed') as any, ok);
  },
});

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.folder !== undefined) filter.folder = req.query.folder;
  const files = await File.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 });
  sendSuccess(res, files);
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const url = `/uploads/files/${req.file.filename}`;
  const file = await File.create({
    name: req.body.name || req.file.originalname,
    originalName: req.file.originalname,
    url, mimetype: req.file.mimetype, size: req.file.size,
    folder: req.body.folder || '',
    uploadedBy: (req as any).user.userId,
  });
  sendSuccess(res, file, 'File uploaded', 201);
}));

router.put('/:id/rename', asyncHandler(async (req, res) => {
  const file = await File.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  if (!file) throw ApiError.notFound('File not found');
  sendSuccess(res, file, 'File renamed');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) throw ApiError.notFound('File not found');
  const filePath = path.join('uploads/files', path.basename(file.url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await file.deleteOne();
  sendSuccess(res, null, 'File deleted');
}));

export default router;
