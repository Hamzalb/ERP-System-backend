/**
 * Full ERP test data seed
 * Run: npm run seed:full
 */
import mongoose from 'mongoose';
import { env } from './config/env';
import { Permission } from './models/Permission.model';
import { Role } from './models/Role.model';
import { User } from './models/User.model';

/* ── helpers ── */
const log = (msg: string) => console.log(msg);

/* ── main ── */
async function seedFull() {
  log('\n🌱  Connecting to MongoDB Atlas...');
  await mongoose.connect(env.mongoUri);
  log('✓  Connected.\n');

  /* 1. Permissions */
  log('── Permissions');
  const permDefs = [
    { key: 'employees:read',    name: 'Read Employees',       module: 'employees' },
    { key: 'employees:create',  name: 'Create Employees',     module: 'employees' },
    { key: 'employees:update',  name: 'Update Employees',     module: 'employees' },
    { key: 'employees:delete',  name: 'Delete Employees',     module: 'employees' },
    { key: 'attendance:read',   name: 'Read Attendance',      module: 'attendance' },
    { key: 'attendance:create', name: 'Create Attendance',    module: 'attendance' },
    { key: 'attendance:update', name: 'Update Attendance',    module: 'attendance' },
    { key: 'leave:read',        name: 'Read Leave',           module: 'leave' },
    { key: 'leave:create',      name: 'Create Leave',         module: 'leave' },
    { key: 'leave:approve',     name: 'Approve Leave',        module: 'leave' },
    { key: 'payroll:read',      name: 'Read Payroll',         module: 'payroll' },
    { key: 'payroll:generate',  name: 'Generate Payroll',     module: 'payroll' },
    { key: 'payroll:approve',   name: 'Approve Payroll',      module: 'payroll' },
    { key: 'crm:read',          name: 'Read CRM',             module: 'crm' },
    { key: 'crm:create',        name: 'Create CRM',           module: 'crm' },
    { key: 'crm:update',        name: 'Update CRM',           module: 'crm' },
    { key: 'crm:delete',        name: 'Delete CRM',           module: 'crm' },
    { key: 'sales:read',        name: 'Read Sales',           module: 'sales' },
    { key: 'sales:create',      name: 'Create Sales',         module: 'sales' },
    { key: 'sales:update',      name: 'Update Sales',         module: 'sales' },
    { key: 'sales:delete',      name: 'Delete Sales',         module: 'sales' },
    { key: 'purchases:read',    name: 'Read Purchases',       module: 'purchases' },
    { key: 'purchases:create',  name: 'Create Purchases',     module: 'purchases' },
    { key: 'purchases:approve', name: 'Approve Purchases',    module: 'purchases' },
    { key: 'inventory:read',    name: 'Read Inventory',       module: 'inventory' },
    { key: 'inventory:create',  name: 'Create Inventory',     module: 'inventory' },
    { key: 'inventory:update',  name: 'Update Inventory',     module: 'inventory' },
    { key: 'accounting:read',   name: 'Read Accounting',      module: 'accounting' },
    { key: 'accounting:create', name: 'Create Accounting',    module: 'accounting' },
    { key: 'accounting:post',   name: 'Post Journal Entries', module: 'accounting' },
    { key: 'projects:read',     name: 'Read Projects',        module: 'projects' },
    { key: 'projects:create',   name: 'Create Projects',      module: 'projects' },
    { key: 'projects:update',   name: 'Update Projects',      module: 'projects' },
    { key: 'reports:read',      name: 'Read Reports',         module: 'reports' },
    { key: 'users:read',        name: 'Read Users',           module: 'users' },
    { key: 'users:create',      name: 'Create Users',         module: 'users' },
    { key: 'users:update',      name: 'Update Users',         module: 'users' },
    { key: 'users:delete',      name: 'Delete Users',         module: 'users' },
    { key: 'roles:read',        name: 'Read Roles',           module: 'roles' },
    { key: 'roles:create',      name: 'Create Roles',         module: 'roles' },
    { key: 'roles:update',      name: 'Update Roles',         module: 'roles' },
    { key: 'roles:delete',      name: 'Delete Roles',         module: 'roles' },
    { key: 'audit:read',        name: 'Read Audit Logs',      module: 'audit' },
    { key: 'company:read',      name: 'Read Company',         module: 'company' },
    { key: 'company:update',    name: 'Update Company',       module: 'company' },
    { key: 'files:read',        name: 'Read Files',           module: 'files' },
    { key: 'files:upload',      name: 'Upload Files',         module: 'files' },
    { key: 'files:delete',      name: 'Delete Files',         module: 'files' },
  ];

  const permMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const p of permDefs) {
    const doc = await Permission.findOneAndUpdate(
      { key: p.key },
      { $set: { name: p.name, module: p.module, description: p.name } },
      { upsert: true, new: true },
    );
    permMap[p.key] = doc._id as mongoose.Types.ObjectId;
  }
  log(`   ✓ ${permDefs.length} permissions`);

  /* 2. Roles */
  log('── Roles');
  const allPermIds = Object.values(permMap);
  const roleDefs = [
    { name: 'SuperAdmin',    description: 'Full system access',          isSystem: true,  keys: ['*'] },
    { name: 'HR Manager',    description: 'HR, attendance, leave, payroll', isSystem: false, keys: ['employees:read','employees:create','employees:update','attendance:read','attendance:create','attendance:update','leave:read','leave:create','leave:approve','payroll:read','payroll:generate','payroll:approve','reports:read','files:read','files:upload'] },
    { name: 'Accountant',    description: 'Finance & accounting',        isSystem: false, keys: ['sales:read','purchases:read','accounting:read','accounting:create','accounting:post','inventory:read','reports:read','files:read'] },
    { name: 'Sales Manager', description: 'CRM, leads, invoices',        isSystem: false, keys: ['crm:read','crm:create','crm:update','sales:read','sales:create','sales:update','inventory:read','reports:read'] },
    { name: 'Viewer',        description: 'Read-only across all modules',isSystem: true,  keys: ['employees:read','attendance:read','leave:read','crm:read','sales:read','purchases:read','inventory:read','accounting:read','projects:read','reports:read','files:read'] },
  ];

  const roleMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const r of roleDefs) {
    const permIds = r.keys[0] === '*' ? allPermIds : r.keys.map(k => permMap[k]).filter(Boolean);
    const doc = await Role.findOneAndUpdate(
      { name: r.name },
      { $set: { description: r.description, isSystem: r.isSystem, permissions: permIds } },
      { upsert: true, new: true },
    );
    roleMap[r.name] = doc._id as mongoose.Types.ObjectId;
  }
  log(`   ✓ ${roleDefs.length} roles`);

  /* 3. Users — plain passwords, pre-save hook hashes them */
  log('── Users');
  const userDefs = [
    { name: 'Admin User',    email: 'admin@erp.com',    role: 'SuperAdmin',    dept: 'IT',         title: 'System Administrator' },
    { name: 'Sarah Johnson', email: 'sarah@erp.com',    role: 'HR Manager',    dept: 'HR',         title: 'HR Manager' },
    { name: 'Michael Chen',  email: 'michael@erp.com',  role: 'Accountant',    dept: 'Finance',    title: 'Senior Accountant' },
    { name: 'Emma Davis',    email: 'emma@erp.com',     role: 'Sales Manager', dept: 'Sales',      title: 'Sales Manager' },
    { name: 'James Wilson',  email: 'james@erp.com',    role: 'Viewer',        dept: 'Operations', title: 'Operations Analyst' },
  ];

  for (const u of userDefs) {
    const existing = await User.findOne({ email: u.email }).select('+password');
    if (existing) {
      existing.name   = u.name;
      existing.roles  = [roleMap[u.role]];
      existing.status = 'active';
      existing.isEmailVerified = true;
      existing.password = 'Admin@12345';   // pre-save hook rehashes
      await existing.save();
      log(`   ↺  ${u.email} — password reset`);
    } else {
      await User.create({
        name: u.name, email: u.email,
        password: 'Admin@12345',           // pre-save hook hashes
        roles: [roleMap[u.role]],
        status: 'active', isEmailVerified: true,
      });
      log(`   +  ${u.email} — created`);
    }
  }

  /* 4. Employees */
  log('── Employees');
  const db = mongoose.connection.db!;
  await db.collection('employees').deleteMany({});
  await db.collection('employees').insertMany([
    { employeeId:'EMP-001', firstName:'John',     lastName:'Smith',     email:'john.smith@company.com',   phone:'+1-555-0101', department:'Engineering',  position:'Senior Developer',     salary:95000, status:'active',   hireDate:new Date('2022-01-15'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-002', firstName:'Maria',    lastName:'Garcia',    email:'maria.garcia@company.com', phone:'+1-555-0102', department:'Marketing',    position:'Marketing Manager',    salary:78000, status:'active',   hireDate:new Date('2021-06-01'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-003', firstName:'David',    lastName:'Lee',       email:'david.lee@company.com',    phone:'+1-555-0103', department:'Finance',      position:'Financial Analyst',    salary:72000, status:'active',   hireDate:new Date('2023-03-10'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-004', firstName:'Linda',    lastName:'Martinez',  email:'linda.m@company.com',      phone:'+1-555-0104', department:'HR',           position:'HR Specialist',        salary:65000, status:'active',   hireDate:new Date('2022-09-20'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-005', firstName:'Robert',   lastName:'Brown',     email:'robert.b@company.com',     phone:'+1-555-0105', department:'Sales',        position:'Sales Representative', salary:58000, status:'active',   hireDate:new Date('2023-01-05'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-006', firstName:'Jennifer', lastName:'Wilson',    email:'jennifer.w@company.com',   phone:'+1-555-0106', department:'Engineering',  position:'QA Engineer',          salary:82000, status:'active',   hireDate:new Date('2021-11-15'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-007', firstName:'Thomas',   lastName:'Taylor',    email:'thomas.t@company.com',     phone:'+1-555-0107', department:'Operations',   position:'Operations Manager',   salary:88000, status:'active',   hireDate:new Date('2020-07-01'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-008', firstName:'Patricia', lastName:'Anderson',  email:'patricia.a@company.com',   phone:'+1-555-0108', department:'Engineering',  position:'DevOps Engineer',      salary:91000, status:'on-leave', hireDate:new Date('2022-04-18'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-009', firstName:'Carlos',   lastName:'Rodriguez', email:'carlos.r@company.com',     phone:'+1-555-0109', department:'Sales',        position:'Key Account Manager',  salary:76000, status:'active',   hireDate:new Date('2021-02-28'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-010', firstName:'Nancy',    lastName:'Harris',    email:'nancy.h@company.com',      phone:'+1-555-0110', department:'Finance',      position:'Accountant',           salary:68000, status:'active',   hireDate:new Date('2023-07-01'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-011', firstName:'Kevin',    lastName:'Clark',     email:'kevin.c@company.com',      phone:'+1-555-0111', department:'Engineering',  position:'Backend Developer',    salary:87000, status:'active',   hireDate:new Date('2022-08-15'), gender:'male',   createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-012', firstName:'Betty',    lastName:'Lewis',     email:'betty.l@company.com',      phone:'+1-555-0112', department:'Marketing',    position:'Content Strategist',   salary:62000, status:'inactive', hireDate:new Date('2021-05-10'), gender:'female', createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 12 employees`);

  /* 5. CRM Leads */
  log('── Leads');
  await db.collection('leads').deleteMany({});
  await db.collection('leads').insertMany([
    { name:'TechVentures Inc',     email:'contact@techventures.com', phone:'+1-555-1001', company:'TechVentures Inc',   source:'website',    status:'qualified', estimatedValue:45000,  assignedTo:'Emma Davis', notes:'Interested in Enterprise plan', createdAt:new Date('2026-05-01'), updatedAt:new Date() },
    { name:'Global Solutions Ltd', email:'info@globalsolutions.com', phone:'+1-555-1002', company:'Global Solutions',   source:'referral',   status:'proposal',  estimatedValue:120000, assignedTo:'Emma Davis', notes:'Demo scheduled next week',      createdAt:new Date('2026-05-10'), updatedAt:new Date() },
    { name:'StartupHub',           email:'hello@startuphub.io',      phone:'+1-555-1003', company:'StartupHub',         source:'linkedin',   status:'new',       estimatedValue:18000,  assignedTo:'Carlos',     notes:'Early stage startup',           createdAt:new Date('2026-05-20'), updatedAt:new Date() },
    { name:'MediaCorp',            email:'sales@mediacorp.com',      phone:'+1-555-1004', company:'MediaCorp',          source:'cold-call',  status:'contacted', estimatedValue:32000,  assignedTo:'Emma Davis', notes:'Follow up required',            createdAt:new Date('2026-06-01'), updatedAt:new Date() },
    { name:'FinanceFirst',         email:'cto@financefirst.com',     phone:'+1-555-1005', company:'FinanceFirst',       source:'website',    status:'won',       estimatedValue:85000,  assignedTo:'Carlos',     notes:'Contract signed',               createdAt:new Date('2026-04-15'), updatedAt:new Date() },
    { name:'RetailChain Corp',     email:'buying@retailchain.com',   phone:'+1-555-1006', company:'RetailChain',        source:'trade-show', status:'lost',      estimatedValue:55000,  assignedTo:'Emma Davis', notes:'Went with competitor',          createdAt:new Date('2026-04-01'), updatedAt:new Date() },
  ]);
  log(`   ✓ 6 leads`);

  /* 6. Customers */
  log('── Customers');
  await db.collection('customers').deleteMany({});
  await db.collection('customers').insertMany([
    { name:'TechCorp Ltd',    email:'accounts@techcorp.com',     phone:'+1-555-2001', company:'TechCorp Ltd',    segment:'enterprise', totalRevenue:248000, status:'active',   country:'USA',     createdAt:new Date('2024-01-10'), updatedAt:new Date() },
    { name:'Alpha Solutions', email:'billing@alphasolutions.com',phone:'+1-555-2002', company:'Alpha Solutions', segment:'mid-market', totalRevenue:92000,  status:'active',   country:'Canada',  createdAt:new Date('2024-03-15'), updatedAt:new Date() },
    { name:'Beta Industries', email:'finance@betaind.com',       phone:'+1-555-2003', company:'Beta Industries', segment:'enterprise', totalRevenue:175000, status:'active',   country:'UK',      createdAt:new Date('2023-11-20'), updatedAt:new Date() },
    { name:'Gamma Corp',      email:'ap@gammacorp.com',          phone:'+1-555-2004', company:'Gamma Corp',      segment:'smb',        totalRevenue:38000,  status:'inactive', country:'USA',     createdAt:new Date('2024-06-01'), updatedAt:new Date() },
    { name:'Delta Systems',   email:'accounts@deltasys.com',     phone:'+1-555-2005', company:'Delta Systems',   segment:'mid-market', totalRevenue:115000, status:'active',   country:'Germany', createdAt:new Date('2024-02-28'), updatedAt:new Date() },
    { name:'Omega Retail',    email:'billing@omegaretail.com',   phone:'+1-555-2006', company:'Omega Retail',    segment:'smb',        totalRevenue:24000,  status:'active',   country:'France',  createdAt:new Date('2025-01-05'), updatedAt:new Date() },
  ]);
  log(`   ✓ 6 customers`);

  /* 7. Products */
  log('── Products');
  await db.collection('products').deleteMany({});
  await db.collection('products').insertMany([
    { sku:'PRD-001', name:'Laptop Pro 15"',        category:'Electronics', price:1299.99, cost:820.00, stock:48,  unit:'unit',    status:'active',    description:'High-performance business laptop', createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-002', name:'Wireless Mouse',         category:'Electronics', price:49.99,  cost:18.00,  stock:210, unit:'unit',    status:'active',    description:'Ergonomic wireless mouse',         createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-003', name:'Office Chair Executive', category:'Furniture',   price:599.00, cost:310.00, stock:15,  unit:'unit',    status:'active',    description:'Premium ergonomic office chair',   createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-004', name:'Standing Desk 160cm',    category:'Furniture',   price:849.00, cost:440.00, stock:8,   unit:'unit',    status:'active',    description:'Electric height-adjustable desk',  createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-005', name:'USB-C Hub 7-in-1',       category:'Electronics', price:79.99,  cost:32.00,  stock:135, unit:'unit',    status:'active',    description:'Multi-port USB-C hub',             createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-006', name:'Printer Paper A4',       category:'Consumables', price:8.99,   cost:4.20,   stock:520, unit:'ream',    status:'active',    description:'80gsm premium A4 paper',           createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-007', name:'Monitor 27" 4K',         category:'Electronics', price:699.99, cost:420.00, stock:23,  unit:'unit',    status:'active',    description:'27-inch 4K IPS monitor',           createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-008', name:'Network Switch 24-port', category:'Networking',  price:349.99, cost:180.00, stock:12,  unit:'unit',    status:'active',    description:'Managed 24-port Gigabit switch',   createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-009', name:'SaaS CRM License',       category:'Software',    price:299.00, cost:0,      stock:999, unit:'license', status:'active',    description:'Annual CRM software license',      createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-010', name:'Ink Cartridge Black',    category:'Consumables', price:24.99,  cost:8.50,   stock:85,  unit:'unit',    status:'active',    description:'High-yield black ink cartridge',   createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-011', name:'Webcam HD 1080p',        category:'Electronics', price:89.99,  cost:38.00,  stock:67,  unit:'unit',    status:'active',    description:'Full HD USB webcam',               createdAt:new Date(), updatedAt:new Date() },
    { sku:'PRD-012', name:'Keyboard Mechanical',    category:'Electronics', price:149.99, cost:62.00,  stock:44,  unit:'unit',    status:'low-stock', description:'TKL mechanical keyboard',          createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 12 products`);

  /* 8. Invoices */
  log('── Invoices');
  await db.collection('invoices').deleteMany({});
  await db.collection('invoices').insertMany([
    { invoiceNumber:'INV-2026-001', customer:'TechCorp Ltd',   status:'paid',    dueDate:new Date('2026-05-31'), issueDate:new Date('2026-05-01'), items:[{description:'Laptop Pro 15"',qty:5,unitPrice:1299.99,total:6499.95},{description:'Monitor 27" 4K',qty:5,unitPrice:699.99,total:3499.95}], subtotal:9999.90, tax:1099.99, total:11099.89, createdAt:new Date(), updatedAt:new Date() },
    { invoiceNumber:'INV-2026-002', customer:'Alpha Solutions', status:'partial', dueDate:new Date('2026-06-15'), issueDate:new Date('2026-05-15'), items:[{description:'SaaS CRM License',qty:10,unitPrice:299.00,total:2990.00}], subtotal:2990.00, tax:299.00, total:3289.00, createdAt:new Date(), updatedAt:new Date() },
    { invoiceNumber:'INV-2026-003', customer:'Beta Industries', status:'pending', dueDate:new Date('2026-06-30'), issueDate:new Date('2026-06-01'), items:[{description:'Standing Desk 160cm',qty:8,unitPrice:849.00,total:6792.00},{description:'Office Chair Executive',qty:8,unitPrice:599.00,total:4792.00}], subtotal:11584.00, tax:1274.24, total:12858.24, createdAt:new Date(), updatedAt:new Date() },
    { invoiceNumber:'INV-2026-004', customer:'Delta Systems',   status:'overdue', dueDate:new Date('2026-05-15'), issueDate:new Date('2026-04-15'), items:[{description:'Network Switch 24-port',qty:4,unitPrice:349.99,total:1399.96}], subtotal:1399.96, tax:154.00, total:1553.96, createdAt:new Date(), updatedAt:new Date() },
    { invoiceNumber:'INV-2026-005', customer:'Omega Retail',    status:'draft',   dueDate:new Date('2026-07-15'), issueDate:new Date('2026-06-08'), items:[{description:'USB-C Hub 7-in-1',qty:20,unitPrice:79.99,total:1599.80},{description:'Webcam HD 1080p',qty:10,unitPrice:89.99,total:899.90}], subtotal:2499.70, tax:274.97, total:2774.67, createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 5 invoices`);

  /* 9. Purchase Orders */
  log('── Purchase Orders');
  await db.collection('purchaseorders').deleteMany({});
  await db.collection('purchaseorders').insertMany([
    { poNumber:'PO-2026-001', supplier:'Dell Technologies', status:'received', orderDate:new Date('2026-05-01'), expectedDate:new Date('2026-05-15'), items:[{description:'Laptop Pro 15"',qty:10,unitPrice:820.00,total:8200.00}], total:8200.00, createdAt:new Date(), updatedAt:new Date() },
    { poNumber:'PO-2026-002', supplier:'Herman Miller',     status:'approved', orderDate:new Date('2026-06-01'), expectedDate:new Date('2026-06-20'), items:[{description:'Office Chair Executive',qty:5,unitPrice:310.00,total:1550.00}], total:1550.00, createdAt:new Date(), updatedAt:new Date() },
    { poNumber:'PO-2026-003', supplier:'Cisco Systems',     status:'pending',  orderDate:new Date('2026-06-05'), expectedDate:new Date('2026-06-25'), items:[{description:'Network Switch 24-port',qty:3,unitPrice:180.00,total:540.00}], total:540.00, createdAt:new Date(), updatedAt:new Date() },
    { poNumber:'PO-2026-004', supplier:'3M Office',         status:'draft',    orderDate:new Date('2026-06-08'), expectedDate:new Date('2026-06-15'), items:[{description:'Printer Paper A4',qty:100,unitPrice:4.20,total:420.00},{description:'Ink Cartridge Black',qty:30,unitPrice:8.50,total:255.00}], total:675.00, createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 4 purchase orders`);

  /* 10. Projects */
  log('── Projects');
  await db.collection('projects').deleteMany({});
  await db.collection('projects').insertMany([
    { name:'ERP Implementation Phase 2', status:'in-progress', priority:'high',   startDate:new Date('2026-04-01'), endDate:new Date('2026-08-31'), budget:120000, spent:45000,  progress:40,  manager:'Thomas Taylor', description:'Full ERP rollout to all departments', createdAt:new Date(), updatedAt:new Date() },
    { name:'Website Redesign',           status:'planning',    priority:'medium',  startDate:new Date('2026-07-01'), endDate:new Date('2026-09-30'), budget:35000,  spent:0,      progress:5,   manager:'Maria Garcia',  description:'Complete corporate website overhaul',  createdAt:new Date(), updatedAt:new Date() },
    { name:'Mobile App v2.0',            status:'in-progress', priority:'high',    startDate:new Date('2026-03-01'), endDate:new Date('2026-07-31'), budget:80000,  spent:52000,  progress:65,  manager:'John Smith',    description:'Native mobile app for field staff',     createdAt:new Date(), updatedAt:new Date() },
    { name:'Data Warehouse Setup',       status:'completed',   priority:'high',    startDate:new Date('2026-01-01'), endDate:new Date('2026-05-31'), budget:45000,  spent:43200,  progress:100, manager:'Kevin Clark',   description:'Enterprise data warehouse migration',   createdAt:new Date(), updatedAt:new Date() },
    { name:'ISO 27001 Certification',    status:'on-hold',     priority:'low',     startDate:new Date('2026-06-01'), endDate:new Date('2026-12-31'), budget:25000,  spent:2500,   progress:10,  manager:'Admin User',    description:'Security certification project',        createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 5 projects`);

  /* 11. Leave Requests */
  log('── Leave Requests');
  await db.collection('leaverequests').deleteMany({});
  await db.collection('leaverequests').insertMany([
    { employeeId:'EMP-001', type:'annual',    startDate:new Date('2026-06-20'), endDate:new Date('2026-06-24'), days:5,  status:'approved', reason:'Family vacation',      createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-002', type:'sick',      startDate:new Date('2026-06-10'), endDate:new Date('2026-06-11'), days:2,  status:'approved', reason:'Medical appointment',  createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-003', type:'annual',    startDate:new Date('2026-07-01'), endDate:new Date('2026-07-05'), days:5,  status:'pending',  reason:'Personal travel',      createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-004', type:'personal',  startDate:new Date('2026-06-15'), endDate:new Date('2026-06-15'), days:1,  status:'rejected', reason:'Personal matter',      createdAt:new Date(), updatedAt:new Date() },
    { employeeId:'EMP-008', type:'maternity', startDate:new Date('2026-04-01'), endDate:new Date('2026-07-01'), days:91, status:'approved', reason:'Maternity leave',      createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 5 leave requests`);

  /* 12. Notifications */
  log('── Notifications');
  await db.collection('notifications').deleteMany({});
  await db.collection('notifications').insertMany([
    { title:'Invoice Overdue',           message:'INV-2026-004 from Delta Systems is 24 days overdue ($1,553.96)', type:'warning', isRead:false, createdAt:new Date(), updatedAt:new Date() },
    { title:'Low Stock Alert',           message:'Keyboard Mechanical (PRD-012) — only 44 units remaining',        type:'warning', isRead:false, createdAt:new Date(), updatedAt:new Date() },
    { title:'Leave Request Pending',     message:'EMP-003 David Lee requested 5 days annual leave (Jul 1–5)',      type:'info',    isRead:false, createdAt:new Date(), updatedAt:new Date() },
    { title:'PO Approved',               message:'Purchase Order PO-2026-002 from Herman Miller approved',         type:'success', isRead:true,  createdAt:new Date(), updatedAt:new Date() },
    { title:'New Lead Assigned',         message:'New lead "MediaCorp" assigned to Emma Davis',                   type:'info',    isRead:true,  createdAt:new Date(), updatedAt:new Date() },
    { title:'Project Milestone Reached', message:'Mobile App v2.0 has reached 65% completion',                   type:'success', isRead:true,  createdAt:new Date(), updatedAt:new Date() },
  ]);
  log(`   ✓ 6 notifications`);

  /* ── Summary ── */
  log('\n╔══════════════════════════════════════════╗');
  log('║   ERP Full Seed Complete! ✅              ║');
  log('╠══════════════════════════════════════════╣');
  log(`║  users       : ${await User.countDocuments()}                         ║`);
  log('╠══════════════════════════════════════════╣');
  log('║  All passwords: Admin@12345              ║');
  log('║  admin@erp.com     → SuperAdmin          ║');
  log('║  sarah@erp.com     → HR Manager          ║');
  log('║  michael@erp.com   → Accountant          ║');
  log('║  emma@erp.com      → Sales Manager       ║');
  log('║  james@erp.com     → Viewer              ║');
  log('╚══════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedFull().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
