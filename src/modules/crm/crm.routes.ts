import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Customer } from '../../models/Customer.model';
import { Lead } from '../../models/Lead.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination, buildSearchQuery } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Leads
router.get('/leads', requirePermission('crm:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['name', 'email', 'company']));
  if (req.query.status) filter.status = req.query.status;

  const [leads, total] = await Promise.all([
    Lead.find(filter).populate('assignedTo', 'name email').sort(sort).skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);
  sendSuccess(res, leads, 'Leads fetched', 200, paginate(total, page, limit));
}));

router.post('/leads', requirePermission('crm:create'), asyncHandler(async (req: AuthRequest, res) => {
  const lead = await Lead.create({ ...req.body, createdBy: req.user!.userId });
  sendSuccess(res, lead, 'Lead created', 201);
}));

router.get('/leads/:id', requirePermission('crm:read'), asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate('assignedTo createdBy', 'name email');
  if (!lead) throw ApiError.notFound('Lead not found');
  sendSuccess(res, lead);
}));

router.put('/leads/:id', requirePermission('crm:update'), asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) throw ApiError.notFound('Lead not found');
  sendSuccess(res, lead, 'Lead updated');
}));

router.delete('/leads/:id', requirePermission('crm:delete'), asyncHandler(async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  sendSuccess(res, null, 'Lead deleted');
}));

router.post('/leads/:id/convert', requirePermission('crm:update'), asyncHandler(async (req: AuthRequest, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound('Lead not found');
  const customer = await Customer.create({
    name: lead.name, email: lead.email, phone: lead.phone, company: lead.company,
    createdBy: req.user!.userId,
  });
  lead.status = 'won';
  lead.convertedAt = new Date();
  lead.convertedTo = customer._id;
  await lead.save();
  sendSuccess(res, customer, 'Lead converted to customer');
}));

router.post('/leads/:id/activities', requirePermission('crm:update'), asyncHandler(async (req: AuthRequest, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound('Lead not found');
  lead.activities.push({ ...req.body, createdBy: req.user!.userId as any, createdAt: new Date() });
  await lead.save();
  sendSuccess(res, lead.activities, 'Activity logged');
}));

// Customers
router.get('/customers', requirePermission('crm:read'), asyncHandler(async (req, res) => {
  const { page, limit, skip, sort, search } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (search) Object.assign(filter, buildSearchQuery(search, ['name', 'email', 'company']));

  const [customers, total] = await Promise.all([
    Customer.find(filter).populate('assignedTo', 'name').sort(sort).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);
  sendSuccess(res, customers, 'Customers fetched', 200, paginate(total, page, limit));
}));

router.get('/customers/:id', requirePermission('crm:read'), asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  sendSuccess(res, customer);
}));

router.post('/customers', requirePermission('crm:create'), asyncHandler(async (req: AuthRequest, res) => {
  const customer = await Customer.create({ ...req.body, createdBy: req.user!.userId });
  sendSuccess(res, customer, 'Customer created', 201);
}));

router.put('/customers/:id', requirePermission('crm:update'), asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) throw ApiError.notFound('Customer not found');
  sendSuccess(res, customer, 'Customer updated');
}));

router.post('/customers/:id/notes', requirePermission('crm:update'), asyncHandler(async (req: AuthRequest, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  customer.notes.push({ content: req.body.content, createdBy: req.user!.userId as any, createdAt: new Date() });
  await customer.save();
  sendSuccess(res, customer.notes, 'Note added');
}));

export default router;
