import { Router, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Employee } from '../../models/Employee.model';
import { Customer } from '../../models/Customer.model';
import { Product } from '../../models/Product.model';
import { Invoice } from '../../models/Invoice.model';
import { Lead } from '../../models/Lead.model';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      throw ApiError.badRequest('Query must be at least 2 characters');
    }

    const regex = new RegExp(q, 'i');
    const limit = 5;

    const [employees, customers, products, invoices, leads] = await Promise.all([
      Employee.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { employeeId: regex }],
      })
        .select('firstName lastName email employeeId department')
        .populate('department', 'name')
        .limit(limit)
        .lean(),

      Customer.find({
        $or: [{ name: regex }, { email: regex }, { company: regex }],
      })
        .select('name email company phone')
        .limit(limit)
        .lean(),

      Product.find({
        $or: [{ name: regex }, { sku: regex }],
      })
        .select('name sku price stock')
        .limit(limit)
        .lean(),

      Invoice.find({
        $or: [{ invoiceNumber: regex }],
      })
        .select('invoiceNumber totalAmount status dueDate customer')
        .populate('customer', 'name')
        .limit(limit)
        .lean(),

      Lead.find({
        $or: [{ title: regex }, { contactName: regex }, { contactEmail: regex }, { company: regex }],
      })
        .select('title contactName company stage value')
        .limit(limit)
        .lean(),
    ]);

    const results = {
      employees: employees.map((e: any) => ({
        _id: e._id,
        type: 'employee',
        title: `${e.firstName} ${e.lastName}`,
        subtitle: e.email,
        meta: (e.department as any)?.name ?? '',
        href: '/employees',
      })),
      customers: customers.map((c: any) => ({
        _id: c._id,
        type: 'customer',
        title: c.name,
        subtitle: c.email,
        meta: c.company ?? '',
        href: '/crm/customers',
      })),
      products: products.map((p: any) => ({
        _id: p._id,
        type: 'product',
        title: p.name,
        subtitle: `SKU: ${p.sku}`,
        meta: `Stock: ${p.stock}`,
        href: '/inventory/products',
      })),
      invoices: invoices.map((i: any) => ({
        _id: i._id,
        type: 'invoice',
        title: i.invoiceNumber,
        subtitle: (i.customer as any)?.name ?? '',
        meta: i.status,
        href: '/sales/invoices',
      })),
      leads: leads.map((l: any) => ({
        _id: l._id,
        type: 'lead',
        title: l.title,
        subtitle: l.contactName,
        meta: l.stage,
        href: '/crm/leads',
      })),
    };

    const total =
      results.employees.length +
      results.customers.length +
      results.products.length +
      results.invoices.length +
      results.leads.length;

    sendSuccess(res, { ...results, total }, `Found ${total} results`);
  }),
);

export default router;
