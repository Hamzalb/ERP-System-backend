import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Invoice } from '../../models/Invoice.model';
import { Employee } from '../../models/Employee.model';
import { Attendance } from '../../models/Attendance.model';
import { Payroll } from '../../models/Payroll.model';
import { Customer } from '../../models/Customer.model';
import { Product } from '../../models/Product.model';
import { sendSuccess } from '../../utils/ApiResponse';

const router = Router();
router.use(authenticate, requirePermission('reports:read'));

const dateRange = (req: any) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  return { startDate, endDate };
};

router.get('/revenue', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRange(req);
  const data = await Invoice.aggregate([
    { $match: { type: 'invoice', status: 'paid', paidAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  sendSuccess(res, data);
}));

router.get('/expenses', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRange(req);
  const data = await Payroll.aggregate([
    { $match: { status: 'paid', 'period.year': { $gte: startDate.getFullYear() } } },
    { $group: { _id: { month: '$period.month', year: '$period.year' }, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  sendSuccess(res, data);
}));

router.get('/employees', asyncHandler(async (req, res) => {
  const [byDept, byStatus, total] = await Promise.all([
    Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $project: { dept: { $arrayElemAt: ['$dept.name', 0] }, count: 1 } },
    ]),
    Employee.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Employee.countDocuments(),
  ]);
  sendSuccess(res, { byDept, byStatus, total });
}));

router.get('/attendance', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRange(req);
  const data = await Attendance.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$status', count: { $sum: 1 }, avgHours: { $avg: '$totalHours' } } },
  ]);
  sendSuccess(res, data);
}));

router.get('/inventory', asyncHandler(async (_req, res) => {
  const [byCategory, lowStock, totalValue] = await Promise.all([
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    ]),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
    Product.aggregate([{ $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$costPrice'] } } } }]),
  ]);
  sendSuccess(res, { byCategory, lowStock, totalValue: totalValue[0]?.value || 0 });
}));

router.get('/customers', asyncHandler(async (_req, res) => {
  const [total, byType, topCustomers] = await Promise.all([
    Customer.countDocuments(),
    Customer.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$customer', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }, { $limit: 10 },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $project: { customer: { $arrayElemAt: ['$customer.name', 0] }, total: 1, count: 1 } },
    ]),
  ]);
  sendSuccess(res, { total, byType, topCustomers });
}));

router.get('/sales', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRange(req);
  const [monthly, byStatus, top] = await Promise.all([
    Invoice.aggregate([
      { $match: { type: 'invoice', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 }, total: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Invoice.aggregate([{ $match: { type: 'invoice' } }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
    Invoice.find({ type: 'invoice', status: 'paid' }).sort({ total: -1 }).limit(5).populate('customer', 'name'),
  ]);
  sendSuccess(res, { monthly, byStatus, top });
}));

export default router;
