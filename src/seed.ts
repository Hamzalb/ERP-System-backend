import mongoose from 'mongoose';
import { env } from './config/env';
import { Permission } from './models/Permission.model';
import { Role } from './models/Role.model';
import { User } from './models/User.model';

const PERMISSIONS = [
  // Employees
  { key: 'employees:read', name: 'Read Employees', module: 'employees' },
  { key: 'employees:create', name: 'Create Employees', module: 'employees' },
  { key: 'employees:update', name: 'Update Employees', module: 'employees' },
  { key: 'employees:delete', name: 'Delete Employees', module: 'employees' },
  // Attendance
  { key: 'attendance:read', name: 'Read Attendance', module: 'attendance' },
  { key: 'attendance:create', name: 'Create Attendance', module: 'attendance' },
  { key: 'attendance:update', name: 'Update Attendance', module: 'attendance' },
  // Leave
  { key: 'leave:read', name: 'Read Leave', module: 'leave' },
  { key: 'leave:create', name: 'Create Leave', module: 'leave' },
  { key: 'leave:approve', name: 'Approve Leave', module: 'leave' },
  // Payroll
  { key: 'payroll:read', name: 'Read Payroll', module: 'payroll' },
  { key: 'payroll:generate', name: 'Generate Payroll', module: 'payroll' },
  { key: 'payroll:approve', name: 'Approve Payroll', module: 'payroll' },
  // CRM
  { key: 'crm:read', name: 'Read CRM', module: 'crm' },
  { key: 'crm:create', name: 'Create CRM', module: 'crm' },
  { key: 'crm:update', name: 'Update CRM', module: 'crm' },
  { key: 'crm:delete', name: 'Delete CRM', module: 'crm' },
  // Sales
  { key: 'sales:read', name: 'Read Sales', module: 'sales' },
  { key: 'sales:create', name: 'Create Sales', module: 'sales' },
  { key: 'sales:update', name: 'Update Sales', module: 'sales' },
  { key: 'sales:delete', name: 'Delete Sales', module: 'sales' },
  // Purchases
  { key: 'purchases:read', name: 'Read Purchases', module: 'purchases' },
  { key: 'purchases:create', name: 'Create Purchases', module: 'purchases' },
  { key: 'purchases:approve', name: 'Approve Purchases', module: 'purchases' },
  // Inventory
  { key: 'inventory:read', name: 'Read Inventory', module: 'inventory' },
  { key: 'inventory:create', name: 'Create Inventory', module: 'inventory' },
  { key: 'inventory:update', name: 'Update Inventory', module: 'inventory' },
  // Accounting
  { key: 'accounting:read', name: 'Read Accounting', module: 'accounting' },
  { key: 'accounting:create', name: 'Create Accounting', module: 'accounting' },
  { key: 'accounting:post', name: 'Post Journal Entries', module: 'accounting' },
  // Projects
  { key: 'projects:read', name: 'Read Projects', module: 'projects' },
  { key: 'projects:create', name: 'Create Projects', module: 'projects' },
  { key: 'projects:update', name: 'Update Projects', module: 'projects' },
  // Reports
  { key: 'reports:read', name: 'Read Reports', module: 'reports' },
  // Users
  { key: 'users:read', name: 'Read Users', module: 'users' },
  { key: 'users:create', name: 'Create Users', module: 'users' },
  { key: 'users:update', name: 'Update Users', module: 'users' },
  { key: 'users:delete', name: 'Delete Users', module: 'users' },
  // Roles
  { key: 'roles:read', name: 'Read Roles', module: 'roles' },
  { key: 'roles:create', name: 'Create Roles', module: 'roles' },
  { key: 'roles:update', name: 'Update Roles', module: 'roles' },
  { key: 'roles:delete', name: 'Delete Roles', module: 'roles' },
  // Audit
  { key: 'audit:read', name: 'Read Audit Logs', module: 'audit' },
  // Company
  { key: 'company:read', name: 'Read Company', module: 'company' },
  { key: 'company:update', name: 'Update Company', module: 'company' },
  // Files
  { key: 'files:read', name: 'Read Files', module: 'files' },
  { key: 'files:upload', name: 'Upload Files', module: 'files' },
  { key: 'files:delete', name: 'Delete Files', module: 'files' },
];

const ROLES_SEED = [
  {
    name: 'SuperAdmin',
    description: 'Full system access',
    isSystem: true,
    permissionKeys: ['*'],
  },
  {
    name: 'HR Manager',
    description: 'Manage employees, attendance, leave, and payroll',
    isSystem: false,
    permissionKeys: [
      'employees:read', 'employees:create', 'employees:update',
      'attendance:read', 'attendance:create', 'attendance:update',
      'leave:read', 'leave:create', 'leave:approve',
      'payroll:read', 'payroll:generate', 'payroll:approve',
      'reports:read', 'files:read', 'files:upload',
    ],
  },
  {
    name: 'Accountant',
    description: 'Sales, purchases, accounting, and financial reports',
    isSystem: false,
    permissionKeys: [
      'sales:read', 'purchases:read',
      'accounting:read', 'accounting:create', 'accounting:post',
      'inventory:read', 'reports:read', 'files:read',
    ],
  },
  {
    name: 'Sales Manager',
    description: 'CRM, leads, customers, and sales invoices',
    isSystem: false,
    permissionKeys: [
      'crm:read', 'crm:create', 'crm:update',
      'sales:read', 'sales:create', 'sales:update',
      'inventory:read', 'reports:read',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access across all modules',
    isSystem: true,
    permissionKeys: [
      'employees:read', 'attendance:read', 'leave:read',
      'crm:read', 'sales:read', 'purchases:read',
      'inventory:read', 'accounting:read', 'projects:read',
      'reports:read', 'files:read',
    ],
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.');

  // Upsert permissions
  console.log('Seeding permissions...');
  const permMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const p of PERMISSIONS) {
    const doc = await Permission.findOneAndUpdate(
      { key: p.key },
      { $set: { name: p.name, module: p.module, description: p.name } },
      { upsert: true, new: true },
    );
    permMap[p.key] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`  ${PERMISSIONS.length} permissions upserted.`);

  // Upsert roles
  console.log('Seeding roles...');
  const roleMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const r of ROLES_SEED) {
    const permIds = r.permissionKeys[0] === '*'
      ? Object.values(permMap)
      : r.permissionKeys.map((k) => permMap[k]).filter(Boolean);

    const doc = await Role.findOneAndUpdate(
      { name: r.name },
      { $set: { description: r.description, isSystem: r.isSystem, permissions: permIds } },
      { upsert: true, new: true },
    );
    roleMap[r.name] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`  ${ROLES_SEED.length} roles upserted.`);

  // Create or reset admin user
  console.log('Seeding admin user...');
  const superAdminRole = roleMap['SuperAdmin'];
  const existingAdmin = await User.findOne({ email: 'admin@erp.com' }).select('+password');
  if (!existingAdmin) {
    // Pass plain password — pre-save hook hashes it
    await User.create({
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'Admin@12345',
      roles: [superAdminRole],
      status: 'active',
      isEmailVerified: true,
    });
    console.log('  Admin user created: admin@erp.com / Admin@12345');
  } else {
    // Force-reset password via save so the pre-save hook rehashes correctly
    existingAdmin.password = 'Admin@12345';
    existingAdmin.roles = [superAdminRole];
    existingAdmin.status = 'active';
    await existingAdmin.save();
    console.log('  Admin user password reset: admin@erp.com / Admin@12345');
  }

  console.log('\nSeed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
