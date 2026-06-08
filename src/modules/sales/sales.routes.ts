import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Invoice } from '../../models/Invoice.model';
import { Company } from '../../models/Company.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

const calcTotals = (items: any[]) => {
  let subtotal = 0, discountTotal = 0, taxTotal = 0;
  const processed = items.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const disc = (gross * item.discount) / 100;
    const net = gross - disc;
    const tax = (net * item.tax) / 100;
    const total = net + tax;
    subtotal += gross; discountTotal += disc; taxTotal += tax;
    return { ...item, total };
  });
  return { items: processed, subtotal, discountTotal, taxTotal, total: subtotal - discountTotal + taxTotal };
};

router.get('/', requirePermission('sales:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = { type: 'invoice' };
  if (search) Object.assign(filter, buildSearchQuery(search, ['invoiceNumber']));
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter).populate('customer', 'name email').sort(sort).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  sendSuccess(res, invoices, 'Invoices fetched', 200, paginate(total, page, limit));
}));

router.get('/:id', requirePermission('sales:read'), asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('customer createdBy', 'name email');
  if (!invoice) throw ApiError.notFound('Invoice not found');
  sendSuccess(res, invoice);
}));

router.post('/', requirePermission('sales:create'), asyncHandler(async (req: AuthRequest, res) => {
  const company = await Company.findOne();
  const nextNum = company?.invoiceNextNumber || 1;
  const prefix = company?.invoicePrefix || 'INV-';
  const invoiceNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;

  if (company) { company.invoiceNextNumber = nextNum + 1; await company.save(); }

  const { items, ...rest } = req.body;
  const calculated = calcTotals(items);

  const invoice = await Invoice.create({
    ...rest, ...calculated, invoiceNumber,
    createdBy: req.user!.userId,
  });
  sendSuccess(res, invoice, 'Invoice created', 201);
}));

router.put('/:id', requirePermission('sales:update'), asyncHandler(async (req, res) => {
  const { items, ...rest } = req.body;
  const updates = items ? { ...rest, ...calcTotals(items) } : rest;
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  sendSuccess(res, invoice, 'Invoice updated');
}));

router.put('/:id/status', requirePermission('sales:update'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updates: Record<string, unknown> = { status };
  if (status === 'paid') updates.paidAt = new Date();
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, updates, { new: true });
  sendSuccess(res, invoice, 'Status updated');
}));

router.get('/stats/summary', requirePermission('sales:read'), asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, paid, pending, overdue, monthlyRevenue] = await Promise.all([
    Invoice.countDocuments({ type: 'invoice' }),
    Invoice.countDocuments({ type: 'invoice', status: 'paid' }),
    Invoice.countDocuments({ type: 'invoice', status: 'sent' }),
    Invoice.countDocuments({ type: 'invoice', status: 'overdue' }),
    Invoice.aggregate([
      { $match: { type: 'invoice', status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
  ]);
  sendSuccess(res, { total, paid, pending, overdue, monthlyRevenue: monthlyRevenue[0]?.revenue || 0 });
}));

export default router;
