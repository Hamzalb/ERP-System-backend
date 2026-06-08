import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { env } from './config/env';
import { morganStream } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import roleRoutes from './modules/roles/roles.routes';
import employeeRoutes from './modules/employee/employee.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import crmRoutes from './modules/crm/crm.routes';
import salesRoutes from './modules/sales/sales.routes';
import purchasesRoutes from './modules/purchases/purchases.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import accountingRoutes from './modules/accounting/accounting.routes';
import projectsRoutes from './modules/projects/projects.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import filesRoutes from './modules/files/files.routes';
import companyRoutes from './modules/company/company.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';
import searchRoutes from './modules/search/search.routes';

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Rate limiting
app.use('/api', rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit on auth endpoints (relaxed in dev)
const isDev = env.nodeEnv === 'development';
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: isDev ? 1000 : 10 }));
app.use('/api/v1/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: isDev ? 100 : 5 }));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID
app.use((req, _res, next) => { req.requestId = uuidv4(); next(); });

// HTTP logging
app.use(morgan('combined', { stream: morganStream }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes (v1)
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/users`, userRoutes);
app.use(`${v1}/roles`, roleRoutes);
app.use(`${v1}/employees`, employeeRoutes);
app.use(`${v1}/attendance`, attendanceRoutes);
app.use(`${v1}/leave`, leaveRoutes);
app.use(`${v1}/payroll`, payrollRoutes);
app.use(`${v1}/crm`, crmRoutes);
app.use(`${v1}/sales`, salesRoutes);
app.use(`${v1}/purchases`, purchasesRoutes);
app.use(`${v1}/inventory`, inventoryRoutes);
app.use(`${v1}/accounting`, accountingRoutes);
app.use(`${v1}/projects`, projectsRoutes);
app.use(`${v1}/notifications`, notificationsRoutes);
app.use(`${v1}/files`, filesRoutes);
app.use(`${v1}/company`, companyRoutes);
app.use(`${v1}/reports`, reportsRoutes);
app.use(`${v1}/audit`, auditRoutes);
app.use(`${v1}/search`, searchRoutes);

// 404 + Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
