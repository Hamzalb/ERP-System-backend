import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Product } from '../../models/Product.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { Schema, model, Document, Types } from 'mongoose';

// Inline models for Category, Brand, Warehouse
interface ICategory extends Document { name: string; description: string; }
const Category = model<ICategory>('Category', new Schema({ name: { type: String, required: true, unique: true }, description: { type: String, default: '' } }, { timestamps: true }));

interface IBrand extends Document { name: string; }
const Brand = model<IBrand>('Brand', new Schema({ name: { type: String, required: true, unique: true } }, { timestamps: true }));

interface IWarehouse extends Document { name: string; location: string; }
const Warehouse = model<IWarehouse>('Warehouse', new Schema({ name: { type: String, required: true }, location: { type: String, default: '' } }, { timestamps: true }));

// Stock Movement log
interface IStockMovement extends Document { product: Types.ObjectId; type: 'in' | 'out' | 'transfer'; quantity: number; note?: string; createdBy: Types.ObjectId; }
const StockMovement = model<IStockMovement>('StockMovement', new Schema({ product: { type: Schema.Types.ObjectId, ref: 'Product' }, type: { type: String, enum: ['in', 'out', 'transfer'] }, quantity: Number, note: String, createdBy: { type: Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true }));

const router = Router();
router.use(authenticate);

router.get('/categories', asyncHandler(async (_req, res) => sendSuccess(res, await Category.find())));
router.post('/categories', requirePermission('inventory:create'), asyncHandler(async (req, res) => sendSuccess(res, await Category.create(req.body), 'Created', 201)));

router.get('/brands', asyncHandler(async (_req, res) => sendSuccess(res, await Brand.find())));
router.post('/brands', requirePermission('inventory:create'), asyncHandler(async (req, res) => sendSuccess(res, await Brand.create(req.body), 'Created', 201)));

router.get('/warehouses', asyncHandler(async (_req, res) => sendSuccess(res, await Warehouse.find())));
router.post('/warehouses', requirePermission('inventory:create'), asyncHandler(async (req, res) => sendSuccess(res, await Warehouse.create(req.body), 'Created', 201)));

// Products
router.get('/', requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['name', 'sku', 'barcode']));
  if (req.query.category) filter.category = req.query.category;
  if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$stock', '$minStock'] };

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category brand warehouse', 'name').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  sendSuccess(res, products, 'Products fetched', 200, paginate(total, page, limit));
}));

router.get('/:id', requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category brand warehouse', 'name');
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product);
}));

router.post('/', requirePermission('inventory:create'), asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  sendSuccess(res, product, 'Product created', 201);
}));

router.put('/:id', requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product, 'Product updated');
}));

router.delete('/:id', requirePermission('inventory:delete'), asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' });
  sendSuccess(res, null, 'Product deactivated');
}));

router.post('/:id/stock-in', requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { quantity, note } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { stock: quantity } }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  await StockMovement.create({ product: product._id, type: 'in', quantity, note, createdBy: (req as any).user.userId });
  sendSuccess(res, product, `Added ${quantity} units`);
}));

router.post('/:id/stock-out', requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { quantity, note } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.stock < quantity) throw ApiError.badRequest('Insufficient stock');
  product.stock -= quantity;
  await product.save();
  await StockMovement.create({ product: product._id, type: 'out', quantity, note, createdBy: (req as any).user.userId });
  sendSuccess(res, product, `Removed ${quantity} units`);
}));

router.get('/alerts/low-stock', requirePermission('inventory:read'), asyncHandler(async (_req, res) => {
  const products = await Product.find({ $expr: { $lte: ['$stock', '$minStock'] }, status: 'active' }).populate('category', 'name');
  sendSuccess(res, products, `${products.length} low stock items`);
}));

export { Category, Brand, Warehouse };
export default router;
