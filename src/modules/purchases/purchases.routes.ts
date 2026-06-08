import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Supplier } from '../../models/Supplier.model';
import { PurchaseOrder } from '../../models/PurchaseOrder.model';
import { Product } from '../../models/Product.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Suppliers
router.get('/suppliers', requirePermission('purchases:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['name', 'email']));

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort(sort).skip(skip).limit(limit),
    Supplier.countDocuments(filter),
  ]);
  sendSuccess(res, suppliers, 'Suppliers fetched', 200, paginate(total, page, limit));
}));

router.post('/suppliers', requirePermission('purchases:create'), asyncHandler(async (req: AuthRequest, res) => {
  const supplier = await Supplier.create({ ...req.body, createdBy: req.user!.userId });
  sendSuccess(res, supplier, 'Supplier created', 201);
}));

router.put('/suppliers/:id', requirePermission('purchases:update'), asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, supplier, 'Supplier updated');
}));

router.delete('/suppliers/:id', requirePermission('purchases:delete'), asyncHandler(async (req, res) => {
  await Supplier.findByIdAndUpdate(req.params.id, { status: 'inactive' });
  sendSuccess(res, null, 'Supplier deactivated');
}));

// Purchase Orders
router.get('/orders', requirePermission('purchases:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.supplier) filter.supplier = req.query.supplier;

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter).populate('supplier', 'name').sort(sort).skip(skip).limit(limit),
    PurchaseOrder.countDocuments(filter),
  ]);
  sendSuccess(res, orders, 'Purchase orders fetched', 200, paginate(total, page, limit));
}));

router.post('/orders', requirePermission('purchases:create'), asyncHandler(async (req: AuthRequest, res) => {
  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${String(count + 1).padStart(5, '0')}`;

  const items = req.body.items.map((item: any) => ({ ...item, total: item.quantity * item.unitCost }));
  const subtotal = items.reduce((s: number, i: any) => s + i.total, 0);
  const tax = (subtotal * (req.body.taxRate || 0)) / 100;

  const order = await PurchaseOrder.create({
    ...req.body, poNumber, items, subtotal, tax, total: subtotal + tax,
    createdBy: req.user!.userId,
  });
  sendSuccess(res, order, 'Purchase order created', 201);
}));

router.put('/orders/:id/receive', requirePermission('purchases:update'), asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) throw ApiError.notFound('Purchase order not found');

  order.status = 'received';
  order.receivedDate = new Date();
  await order.save();

  // Update stock
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }),
    ),
  );
  sendSuccess(res, order, 'Order marked as received and stock updated');
}));

export default router;
