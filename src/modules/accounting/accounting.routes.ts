import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Account } from '../../models/Account.model';
import { JournalEntry } from '../../models/JournalEntry.model';
import { sendSuccess, paginate } from '../../utils/ApiResponse';
import { getPagination } from '../../utils/pagination';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requirePermission('accounting:read'));

// Chart of Accounts
router.get('/accounts', asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.type) filter.type = req.query.type;
  sendSuccess(res, await Account.find(filter).sort({ code: 1 }));
}));

router.post('/accounts', requirePermission('accounting:manage'), asyncHandler(async (req, res) => {
  sendSuccess(res, await Account.create(req.body), 'Account created', 201);
}));

router.put('/accounts/:id', requirePermission('accounting:manage'), asyncHandler(async (req, res) => {
  const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!account) throw ApiError.notFound('Account not found');
  sendSuccess(res, account, 'Account updated');
}));

// Journal Entries
router.get('/journal', asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).populate('lines.account', 'name code').sort(sort).skip(skip).limit(limit),
    JournalEntry.countDocuments(filter),
  ]);
  sendSuccess(res, entries, 'Journal entries fetched', 200, paginate(total, page, limit));
}));

router.post('/journal', requirePermission('accounting:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const count = await JournalEntry.countDocuments();
  const reference = `JE-${String(count + 1).padStart(5, '0')}`;
  const entry = await JournalEntry.create({ ...req.body, reference, createdBy: req.user!.userId });
  sendSuccess(res, entry, 'Journal entry created', 201);
}));

router.put('/journal/:id/post', requirePermission('accounting:manage'), asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findById(req.params.id).populate('lines.account');
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status === 'posted') throw ApiError.badRequest('Already posted');

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) throw ApiError.badRequest('Debits must equal credits');

  for (const line of entry.lines) {
    const account = line.account as any;
    const isDebitNormal = ['asset', 'expense'].includes(account.type);
    const change = isDebitNormal ? line.debit - line.credit : line.credit - line.debit;
    await Account.findByIdAndUpdate(account._id, { $inc: { balance: change } });
  }

  entry.status = 'posted';
  await entry.save();
  sendSuccess(res, entry, 'Journal entry posted');
}));

// Reports
router.get('/reports/trial-balance', asyncHandler(async (_req, res) => {
  const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
  const trialBalance = accounts.map((a) => ({
    code: a.code, name: a.name, type: a.type,
    debit: ['asset', 'expense'].includes(a.type) && a.balance > 0 ? a.balance : 0,
    credit: ['liability', 'equity', 'revenue'].includes(a.type) && a.balance > 0 ? a.balance : 0,
  }));
  sendSuccess(res, trialBalance);
}));

router.get('/reports/balance-sheet', asyncHandler(async (_req, res) => {
  const [assets, liabilities, equity] = await Promise.all([
    Account.find({ type: 'asset', isActive: true }),
    Account.find({ type: 'liability', isActive: true }),
    Account.find({ type: 'equity', isActive: true }),
  ]);
  sendSuccess(res, {
    assets: { items: assets, total: assets.reduce((s, a) => s + a.balance, 0) },
    liabilities: { items: liabilities, total: liabilities.reduce((s, a) => s + a.balance, 0) },
    equity: { items: equity, total: equity.reduce((s, a) => s + a.balance, 0) },
  });
}));

router.get('/reports/profit-loss', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = startDate && endDate
    ? { date: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } }
    : {};

  const [revenues, expenses] = await Promise.all([
    Account.find({ type: 'revenue', isActive: true }),
    Account.find({ type: 'expense', isActive: true }),
  ]);
  const totalRevenue = revenues.reduce((s, a) => s + a.balance, 0);
  const totalExpense = expenses.reduce((s, a) => s + a.balance, 0);
  sendSuccess(res, { revenues, expenses, totalRevenue, totalExpense, netProfit: totalRevenue - totalExpense });
}));

export default router;
