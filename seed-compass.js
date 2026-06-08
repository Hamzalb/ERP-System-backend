// ============================================================
//  ERP SYSTEM — Full Test Data Seed
//  Run this in MongoDB Compass > Open MongoDB Shell
//  Switch to the erp database first: use erp
// ============================================================

use('erp');

// ── 1. PERMISSIONS ──────────────────────────────────────────
const permDefs = [
  // employees
  { key:'employees:read',    name:'Read Employees',        module:'employees' },
  { key:'employees:create',  name:'Create Employees',      module:'employees' },
  { key:'employees:update',  name:'Update Employees',      module:'employees' },
  { key:'employees:delete',  name:'Delete Employees',      module:'employees' },
  // attendance
  { key:'attendance:read',   name:'Read Attendance',       module:'attendance' },
  { key:'attendance:create', name:'Create Attendance',     module:'attendance' },
  { key:'attendance:update', name:'Update Attendance',     module:'attendance' },
  // leave
  { key:'leave:read',        name:'Read Leave',            module:'leave' },
  { key:'leave:create',      name:'Create Leave',          module:'leave' },
  { key:'leave:approve',     name:'Approve Leave',         module:'leave' },
  // payroll
  { key:'payroll:read',      name:'Read Payroll',          module:'payroll' },
  { key:'payroll:generate',  name:'Generate Payroll',      module:'payroll' },
  { key:'payroll:approve',   name:'Approve Payroll',       module:'payroll' },
  // crm
  { key:'crm:read',          name:'Read CRM',              module:'crm' },
  { key:'crm:create',        name:'Create CRM',            module:'crm' },
  { key:'crm:update',        name:'Update CRM',            module:'crm' },
  { key:'crm:delete',        name:'Delete CRM',            module:'crm' },
  // sales
  { key:'sales:read',        name:'Read Sales',            module:'sales' },
  { key:'sales:create',      name:'Create Sales',          module:'sales' },
  { key:'sales:update',      name:'Update Sales',          module:'sales' },
  { key:'sales:delete',      name:'Delete Sales',          module:'sales' },
  // purchases
  { key:'purchases:read',    name:'Read Purchases',        module:'purchases' },
  { key:'purchases:create',  name:'Create Purchases',      module:'purchases' },
  { key:'purchases:approve', name:'Approve Purchases',     module:'purchases' },
  // inventory
  { key:'inventory:read',    name:'Read Inventory',        module:'inventory' },
  { key:'inventory:create',  name:'Create Inventory',      module:'inventory' },
  { key:'inventory:update',  name:'Update Inventory',      module:'inventory' },
  // accounting
  { key:'accounting:read',   name:'Read Accounting',       module:'accounting' },
  { key:'accounting:create', name:'Create Accounting',     module:'accounting' },
  { key:'accounting:post',   name:'Post Journal Entries',  module:'accounting' },
  // projects
  { key:'projects:read',     name:'Read Projects',         module:'projects' },
  { key:'projects:create',   name:'Create Projects',       module:'projects' },
  { key:'projects:update',   name:'Update Projects',       module:'projects' },
  // reports / admin
  { key:'reports:read',      name:'Read Reports',          module:'reports' },
  { key:'users:read',        name:'Read Users',            module:'users' },
  { key:'users:create',      name:'Create Users',          module:'users' },
  { key:'users:update',      name:'Update Users',          module:'users' },
  { key:'users:delete',      name:'Delete Users',          module:'users' },
  { key:'roles:read',        name:'Read Roles',            module:'roles' },
  { key:'roles:create',      name:'Create Roles',          module:'roles' },
  { key:'roles:update',      name:'Update Roles',          module:'roles' },
  { key:'roles:delete',      name:'Delete Roles',          module:'roles' },
  { key:'audit:read',        name:'Read Audit Logs',       module:'audit' },
  { key:'company:read',      name:'Read Company',          module:'company' },
  { key:'company:update',    name:'Update Company',        module:'company' },
  { key:'files:read',        name:'Read Files',            module:'files' },
  { key:'files:upload',      name:'Upload Files',          module:'files' },
  { key:'files:delete',      name:'Delete Files',          module:'files' },
];

print('Seeding permissions...');
const permMap = {};
for (const p of permDefs) {
  const res = db.permissions.findOneAndUpdate(
    { key: p.key },
    { $set: { ...p, description: p.name, createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );
  permMap[p.key] = res._id;
}
print(`  ✓ ${permDefs.length} permissions`);

// ── 2. ROLES ────────────────────────────────────────────────
print('Seeding roles...');
const allPermIds = Object.values(permMap);
const roleDefs = [
  { name:'SuperAdmin',    description:'Full system access',                        isSystem:true,  permKeys:['*'] },
  { name:'HR Manager',    description:'HR, attendance, leave, payroll',            isSystem:false, permKeys:['employees:read','employees:create','employees:update','attendance:read','attendance:create','attendance:update','leave:read','leave:create','leave:approve','payroll:read','payroll:generate','payroll:approve','reports:read','files:read','files:upload'] },
  { name:'Accountant',    description:'Sales, purchases, accounting, reports',     isSystem:false, permKeys:['sales:read','purchases:read','accounting:read','accounting:create','accounting:post','inventory:read','reports:read','files:read'] },
  { name:'Sales Manager', description:'CRM, leads, customers, invoices',           isSystem:false, permKeys:['crm:read','crm:create','crm:update','sales:read','sales:create','sales:update','inventory:read','reports:read'] },
  { name:'Viewer',        description:'Read-only across all modules',              isSystem:true,  permKeys:['employees:read','attendance:read','leave:read','crm:read','sales:read','purchases:read','inventory:read','accounting:read','projects:read','reports:read','files:read'] },
];

const roleMap = {};
for (const r of roleDefs) {
  const permIds = r.permKeys[0] === '*' ? allPermIds : r.permKeys.map(k => permMap[k]).filter(Boolean);
  const res = db.roles.findOneAndUpdate(
    { name: r.name },
    { $set: { description: r.description, isSystem: r.isSystem, permissions: permIds, createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );
  roleMap[r.name] = res._id;
}
print(`  ✓ ${roleDefs.length} roles`);

// ── 3. USERS ────────────────────────────────────────────────
// Passwords are bcrypt hashes of "Admin@12345" (cost 12)
const HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFQFD6.a9.O6eS6';
print('Seeding users...');
const users = [
  { name:'Admin User',       email:'admin@erp.com',       roleName:'SuperAdmin',    department:'IT',        title:'System Administrator', status:'active' },
  { name:'Sarah Johnson',    email:'sarah@erp.com',        roleName:'HR Manager',    department:'HR',        title:'HR Manager',          status:'active' },
  { name:'Michael Chen',     email:'michael@erp.com',      roleName:'Accountant',    department:'Finance',   title:'Senior Accountant',   status:'active' },
  { name:'Emma Davis',       email:'emma@erp.com',         roleName:'Sales Manager', department:'Sales',     title:'Sales Manager',       status:'active' },
  { name:'James Wilson',     email:'james@erp.com',        roleName:'Viewer',        department:'Operations',title:'Operations Analyst',  status:'active' },
];
const userMap = {};
for (const u of users) {
  const res = db.users.findOneAndUpdate(
    { email: u.email },
    { $set: { name: u.name, email: u.email, password: HASH, roles: [roleMap[u.roleName]], department: u.department, title: u.title, status: u.status, isEmailVerified: true, loginAttempts: 0, refreshTokens: [], createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );
  userMap[u.email] = res._id;
}
print(`  ✓ ${users.length} users (password: Admin@12345)`);

// ── 4. EMPLOYEES ────────────────────────────────────────────
print('Seeding employees...');
db.employees.deleteMany({});
const employees = [
  { employeeId:'EMP-001', firstName:'John',     lastName:'Smith',    email:'john.smith@company.com',    phone:'+1-555-0101', department:'Engineering',  position:'Senior Developer',    salary:95000, status:'active',   hireDate:new Date('2022-01-15'), gender:'male' },
  { employeeId:'EMP-002', firstName:'Maria',    lastName:'Garcia',   email:'maria.garcia@company.com',  phone:'+1-555-0102', department:'Marketing',    position:'Marketing Manager',   salary:78000, status:'active',   hireDate:new Date('2021-06-01'), gender:'female' },
  { employeeId:'EMP-003', firstName:'David',    lastName:'Lee',      email:'david.lee@company.com',     phone:'+1-555-0103', department:'Finance',      position:'Financial Analyst',   salary:72000, status:'active',   hireDate:new Date('2023-03-10'), gender:'male' },
  { employeeId:'EMP-004', firstName:'Linda',    lastName:'Martinez', email:'linda.m@company.com',       phone:'+1-555-0104', department:'HR',           position:'HR Specialist',       salary:65000, status:'active',   hireDate:new Date('2022-09-20'), gender:'female' },
  { employeeId:'EMP-005', firstName:'Robert',   lastName:'Brown',    email:'robert.b@company.com',      phone:'+1-555-0105', department:'Sales',        position:'Sales Representative',salary:58000, status:'active',   hireDate:new Date('2023-01-05'), gender:'male' },
  { employeeId:'EMP-006', firstName:'Jennifer', lastName:'Wilson',   email:'jennifer.w@company.com',    phone:'+1-555-0106', department:'Engineering',  position:'QA Engineer',         salary:82000, status:'active',   hireDate:new Date('2021-11-15'), gender:'female' },
  { employeeId:'EMP-007', firstName:'Thomas',   lastName:'Taylor',   email:'thomas.t@company.com',      phone:'+1-555-0107', department:'Operations',   position:'Operations Manager',  salary:88000, status:'active',   hireDate:new Date('2020-07-01'), gender:'male' },
  { employeeId:'EMP-008', firstName:'Patricia', lastName:'Anderson', email:'patricia.a@company.com',    phone:'+1-555-0108', department:'Engineering',  position:'DevOps Engineer',     salary:91000, status:'on-leave', hireDate:new Date('2022-04-18'), gender:'female' },
  { employeeId:'EMP-009', firstName:'Carlos',   lastName:'Rodriguez',email:'carlos.r@company.com',      phone:'+1-555-0109', department:'Sales',        position:'Key Account Manager', salary:76000, status:'active',   hireDate:new Date('2021-02-28'), gender:'male' },
  { employeeId:'EMP-010', firstName:'Nancy',    lastName:'Harris',   email:'nancy.h@company.com',       phone:'+1-555-0110', department:'Finance',      position:'Accountant',          salary:68000, status:'active',   hireDate:new Date('2023-07-01'), gender:'female' },
  { employeeId:'EMP-011', firstName:'Kevin',    lastName:'Clark',    email:'kevin.c@company.com',       phone:'+1-555-0111', department:'Engineering',  position:'Backend Developer',   salary:87000, status:'active',   hireDate:new Date('2022-08-15'), gender:'male' },
  { employeeId:'EMP-012', firstName:'Betty',    lastName:'Lewis',    email:'betty.l@company.com',       phone:'+1-555-0112', department:'Marketing',    position:'Content Strategist',  salary:62000, status:'inactive', hireDate:new Date('2021-05-10'), gender:'female' },
];
employees.forEach(e => { e.createdAt = new Date(); e.updatedAt = new Date(); });
db.employees.insertMany(employees);
print(`  ✓ ${employees.length} employees`);

// ── 5. CRM LEADS ────────────────────────────────────────────
print('Seeding CRM leads...');
db.leads.deleteMany({});
const leads = [
  { name:'TechVentures Inc',      email:'contact@techventures.com',  phone:'+1-555-1001', company:'TechVentures Inc', source:'website',   status:'qualified',   estimatedValue:45000, assignedTo:'Emma Davis', notes:'Interested in Enterprise plan', createdAt:new Date('2026-05-01') },
  { name:'Global Solutions Ltd',  email:'info@globalsolutions.com',   phone:'+1-555-1002', company:'Global Solutions', source:'referral',  status:'proposal',    estimatedValue:120000,assignedTo:'Emma Davis', notes:'Demo scheduled for next week',   createdAt:new Date('2026-05-10') },
  { name:'StartupHub',            email:'hello@startuphub.io',        phone:'+1-555-1003', company:'StartupHub',       source:'linkedin',  status:'new',         estimatedValue:18000, assignedTo:'Carlos',     notes:'Early stage startup',            createdAt:new Date('2026-05-20') },
  { name:'MediaCorp',             email:'sales@mediacorp.com',        phone:'+1-555-1004', company:'MediaCorp',        source:'cold-call', status:'contacted',   estimatedValue:32000, assignedTo:'Emma Davis', notes:'Follow up required',             createdAt:new Date('2026-06-01') },
  { name:'FinanceFirst',          email:'cto@financefirst.com',       phone:'+1-555-1005', company:'FinanceFirst',     source:'website',   status:'won',         estimatedValue:85000, assignedTo:'Carlos',     notes:'Contract signed',                createdAt:new Date('2026-04-15') },
  { name:'RetailChain Corp',      email:'buying@retailchain.com',     phone:'+1-555-1006', company:'RetailChain',      source:'trade-show',status:'lost',        estimatedValue:55000, assignedTo:'Emma Davis', notes:'Went with competitor',           createdAt:new Date('2026-04-01') },
];
leads.forEach(l => { l.updatedAt = new Date(); });
db.leads.insertMany(leads);
print(`  ✓ ${leads.length} leads`);

// ── 6. CRM CUSTOMERS ────────────────────────────────────────
print('Seeding customers...');
db.customers.deleteMany({});
const customers = [
  { name:'TechCorp Ltd',      email:'accounts@techcorp.com',     phone:'+1-555-2001', company:'TechCorp Ltd',      segment:'enterprise',   totalRevenue:248000, status:'active',   country:'USA',    createdAt:new Date('2024-01-10') },
  { name:'Alpha Solutions',   email:'billing@alphasolutions.com', phone:'+1-555-2002', company:'Alpha Solutions',   segment:'mid-market',   totalRevenue:92000,  status:'active',   country:'Canada', createdAt:new Date('2024-03-15') },
  { name:'Beta Industries',   email:'finance@betaind.com',        phone:'+1-555-2003', company:'Beta Industries',   segment:'enterprise',   totalRevenue:175000, status:'active',   country:'UK',     createdAt:new Date('2023-11-20') },
  { name:'Gamma Corp',        email:'ap@gammacorp.com',           phone:'+1-555-2004', company:'Gamma Corp',        segment:'smb',          totalRevenue:38000,  status:'inactive', country:'USA',    createdAt:new Date('2024-06-01') },
  { name:'Delta Systems',     email:'accounts@deltasys.com',      phone:'+1-555-2005', company:'Delta Systems',     segment:'mid-market',   totalRevenue:115000, status:'active',   country:'Germany',createdAt:new Date('2024-02-28') },
  { name:'Omega Retail',      email:'billing@omegaretail.com',    phone:'+1-555-2006', company:'Omega Retail',      segment:'smb',          totalRevenue:24000,  status:'active',   country:'France', createdAt:new Date('2025-01-05') },
];
customers.forEach(c => { c.updatedAt = new Date(); });
db.customers.insertMany(customers);
print(`  ✓ ${customers.length} customers`);

// ── 7. PRODUCTS / INVENTORY ─────────────────────────────────
print('Seeding products...');
db.products.deleteMany({});
const products = [
  { sku:'PRD-001', name:'Laptop Pro 15"',         category:'Electronics',   price:1299.99, cost:820.00, stock:48,  unit:'unit',    status:'active',  description:'High-performance business laptop' },
  { sku:'PRD-002', name:'Wireless Mouse',          category:'Electronics',   price:49.99,  cost:18.00,  stock:210, unit:'unit',    status:'active',  description:'Ergonomic wireless mouse' },
  { sku:'PRD-003', name:'Office Chair Executive',  category:'Furniture',     price:599.00, cost:310.00, stock:15,  unit:'unit',    status:'active',  description:'Premium ergonomic office chair' },
  { sku:'PRD-004', name:'Standing Desk 160cm',     category:'Furniture',     price:849.00, cost:440.00, stock:8,   unit:'unit',    status:'active',  description:'Electric height-adjustable desk' },
  { sku:'PRD-005', name:'USB-C Hub 7-in-1',        category:'Electronics',   price:79.99,  cost:32.00,  stock:135, unit:'unit',    status:'active',  description:'Multi-port USB-C hub' },
  { sku:'PRD-006', name:'Printer Paper A4',        category:'Consumables',   price:8.99,   cost:4.20,   stock:520, unit:'ream',    status:'active',  description:'80gsm premium A4 paper' },
  { sku:'PRD-007', name:'Monitor 27" 4K',          category:'Electronics',   price:699.99, cost:420.00, stock:23,  unit:'unit',    status:'active',  description:'27-inch 4K IPS monitor' },
  { sku:'PRD-008', name:'Network Switch 24-port',  category:'Networking',    price:349.99, cost:180.00, stock:12,  unit:'unit',    status:'active',  description:'Managed 24-port Gigabit switch' },
  { sku:'PRD-009', name:'SaaS CRM License',        category:'Software',      price:299.00, cost:0,      stock:999, unit:'license', status:'active',  description:'Annual CRM software license' },
  { sku:'PRD-010', name:'Ink Cartridge Black',     category:'Consumables',   price:24.99,  cost:8.50,   stock:85,  unit:'unit',    status:'active',  description:'High-yield black ink cartridge' },
  { sku:'PRD-011', name:'Webcam HD 1080p',         category:'Electronics',   price:89.99,  cost:38.00,  stock:67,  unit:'unit',    status:'active',  description:'Full HD USB webcam' },
  { sku:'PRD-012', name:'Keyboard Mechanical',     category:'Electronics',   price:149.99, cost:62.00,  stock:44,  unit:'unit',    status:'low-stock',description:'TKL mechanical keyboard' },
];
products.forEach(p => { p.createdAt = new Date(); p.updatedAt = new Date(); });
db.products.insertMany(products);
print(`  ✓ ${products.length} products`);

// ── 8. SALES INVOICES ───────────────────────────────────────
print('Seeding invoices...');
db.invoices.deleteMany({});
const invoices = [
  { invoiceNumber:'INV-2026-001', customer:'TechCorp Ltd',   status:'paid',     dueDate:new Date('2026-05-31'), issueDate:new Date('2026-05-01'), items:[{description:'Laptop Pro 15"',qty:5,unitPrice:1299.99,total:6499.95},{description:'Monitor 27" 4K',qty:5,unitPrice:699.99,total:3499.95}], subtotal:9999.90, tax:1099.99, total:11099.89, notes:'Net 30 terms' },
  { invoiceNumber:'INV-2026-002', customer:'Alpha Solutions', status:'partial',  dueDate:new Date('2026-06-15'), issueDate:new Date('2026-05-15'), items:[{description:'SaaS CRM License',qty:10,unitPrice:299.00,total:2990.00}], subtotal:2990.00, tax:299.00, total:3289.00, notes:'' },
  { invoiceNumber:'INV-2026-003', customer:'Beta Industries', status:'pending',  dueDate:new Date('2026-06-30'), issueDate:new Date('2026-06-01'), items:[{description:'Standing Desk 160cm',qty:8,unitPrice:849.00,total:6792.00},{description:'Office Chair Executive',qty:8,unitPrice:599.00,total:4792.00}], subtotal:11584.00, tax:1274.24, total:12858.24 },
  { invoiceNumber:'INV-2026-004', customer:'Delta Systems',   status:'overdue',  dueDate:new Date('2026-05-15'), issueDate:new Date('2026-04-15'), items:[{description:'Network Switch 24-port',qty:4,unitPrice:349.99,total:1399.96}], subtotal:1399.96, tax:154.00, total:1553.96 },
  { invoiceNumber:'INV-2026-005', customer:'Omega Retail',    status:'draft',    dueDate:new Date('2026-07-15'), issueDate:new Date('2026-06-08'), items:[{description:'USB-C Hub 7-in-1',qty:20,unitPrice:79.99,total:1599.80},{description:'Webcam HD 1080p',qty:10,unitPrice:89.99,total:899.90}], subtotal:2499.70, tax:274.97, total:2774.67 },
];
invoices.forEach(i => { i.createdAt = new Date(); i.updatedAt = new Date(); });
db.invoices.insertMany(invoices);
print(`  ✓ ${invoices.length} invoices`);

// ── 9. PURCHASE ORDERS ──────────────────────────────────────
print('Seeding purchase orders...');
db.purchaseorders.deleteMany({});
const orders = [
  { poNumber:'PO-2026-001', supplier:'Dell Technologies',  status:'received',  orderDate:new Date('2026-05-01'), expectedDate:new Date('2026-05-15'), items:[{description:'Laptop Pro 15"',qty:10,unitPrice:820.00,total:8200.00}], total:8200.00 },
  { poNumber:'PO-2026-002', supplier:'Herman Miller',      status:'approved',  orderDate:new Date('2026-06-01'), expectedDate:new Date('2026-06-20'), items:[{description:'Office Chair Executive',qty:5,unitPrice:310.00,total:1550.00}], total:1550.00 },
  { poNumber:'PO-2026-003', supplier:'Cisco Systems',      status:'pending',   orderDate:new Date('2026-06-05'), expectedDate:new Date('2026-06-25'), items:[{description:'Network Switch 24-port',qty:3,unitPrice:180.00,total:540.00}], total:540.00 },
  { poNumber:'PO-2026-004', supplier:'3M Office',          status:'draft',     orderDate:new Date('2026-06-08'), expectedDate:new Date('2026-06-15'), items:[{description:'Printer Paper A4',qty:100,unitPrice:4.20,total:420.00},{description:'Ink Cartridge Black',qty:30,unitPrice:8.50,total:255.00}], total:675.00 },
];
orders.forEach(o => { o.createdAt = new Date(); o.updatedAt = new Date(); });
db.purchaseorders.insertMany(orders);
print(`  ✓ ${orders.length} purchase orders`);

// ── 10. ATTENDANCE ──────────────────────────────────────────
print('Seeding attendance records...');
db.attendances.deleteMany({});
const today = new Date();
const attendances = [];
const empIds = ['EMP-001','EMP-002','EMP-003','EMP-004','EMP-005'];
for (let d = 6; d >= 0; d--) {
  const date = new Date(today); date.setDate(date.getDate() - d);
  if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
  for (const empId of empIds) {
    attendances.push({
      employeeId: empId, date, status: d === 0 ? 'present' : (Math.random() > 0.9 ? 'absent' : 'present'),
      checkIn: new Date(date.setHours(8, Math.floor(Math.random()*30), 0)),
      checkOut: new Date(date.setHours(17, Math.floor(Math.random()*30), 0)),
      workHours: 8 + Math.random(), createdAt: new Date(), updatedAt: new Date(),
    });
  }
}
db.attendances.insertMany(attendances);
print(`  ✓ ${attendances.length} attendance records`);

// ── 11. LEAVE REQUESTS ──────────────────────────────────────
print('Seeding leave requests...');
db.leaverequests.deleteMany({});
const leaves = [
  { employeeId:'EMP-001', type:'annual',   startDate:new Date('2026-06-20'), endDate:new Date('2026-06-24'), days:5, status:'approved',  reason:'Family vacation',       createdAt:new Date() },
  { employeeId:'EMP-002', type:'sick',     startDate:new Date('2026-06-10'), endDate:new Date('2026-06-11'), days:2, status:'approved',  reason:'Medical appointment',   createdAt:new Date() },
  { employeeId:'EMP-003', type:'annual',   startDate:new Date('2026-07-01'), endDate:new Date('2026-07-05'), days:5, status:'pending',   reason:'Personal travel',       createdAt:new Date() },
  { employeeId:'EMP-004', type:'personal', startDate:new Date('2026-06-15'), endDate:new Date('2026-06-15'), days:1, status:'rejected',  reason:'Personal matter',       createdAt:new Date() },
  { employeeId:'EMP-008', type:'maternity',startDate:new Date('2026-04-01'), endDate:new Date('2026-07-01'), days:91,status:'approved',  reason:'Maternity leave',       createdAt:new Date() },
];
leaves.forEach(l => { l.updatedAt = new Date(); });
db.leaverequests.insertMany(leaves);
print(`  ✓ ${leaves.length} leave requests`);

// ── 12. ACCOUNTING / JOURNAL ENTRIES ────────────────────────
print('Seeding journal entries...');
db.journalentries.deleteMany({});
const journals = [
  { entryNumber:'JE-2026-001', date:new Date('2026-06-01'), description:'Office supplies purchase', status:'posted', lines:[{account:'6100 - Office Supplies',type:'debit',amount:675.00},{account:'2000 - Accounts Payable',type:'credit',amount:675.00}], total:675.00 },
  { entryNumber:'JE-2026-002', date:new Date('2026-06-01'), description:'Revenue - TechCorp invoice', status:'posted', lines:[{account:'1200 - Accounts Receivable',type:'debit',amount:11099.89},{account:'4000 - Sales Revenue',type:'credit',amount:11099.89}], total:11099.89 },
  { entryNumber:'JE-2026-003', date:new Date('2026-06-05'), description:'Payroll June 2026', status:'draft', lines:[{account:'6200 - Salaries Expense',type:'debit',amount:85000.00},{account:'1000 - Cash',type:'credit',amount:85000.00}], total:85000.00 },
  { entryNumber:'JE-2026-004', date:new Date('2026-06-08'), description:'Equipment purchase - Dell laptops', status:'posted', lines:[{account:'1500 - Equipment',type:'debit',amount:8200.00},{account:'1000 - Cash',type:'credit',amount:8200.00}], total:8200.00 },
];
journals.forEach(j => { j.createdAt = new Date(); j.updatedAt = new Date(); });
db.journalentries.insertMany(journals);
print(`  ✓ ${journals.length} journal entries`);

// ── 13. PROJECTS ────────────────────────────────────────────
print('Seeding projects...');
db.projects.deleteMany({});
const projects = [
  { name:'ERP Implementation Phase 2', status:'in-progress', priority:'high',   startDate:new Date('2026-04-01'), endDate:new Date('2026-08-31'), budget:120000, spent:45000,  progress:40, manager:'Thomas Taylor', team:['EMP-001','EMP-006','EMP-011'], description:'Full ERP rollout to all departments' },
  { name:'Website Redesign',           status:'planning',    priority:'medium',  startDate:new Date('2026-07-01'), endDate:new Date('2026-09-30'), budget:35000,  spent:0,      progress:5,  manager:'Maria Garcia',  team:['EMP-002'], description:'Complete corporate website overhaul' },
  { name:'Mobile App v2.0',            status:'in-progress', priority:'high',    startDate:new Date('2026-03-01'), endDate:new Date('2026-07-31'), budget:80000,  spent:52000,  progress:65, manager:'John Smith',    team:['EMP-001','EMP-011'], description:'Native mobile app for field staff' },
  { name:'Data Warehouse Setup',       status:'completed',   priority:'high',    startDate:new Date('2026-01-01'), endDate:new Date('2026-05-31'), budget:45000,  spent:43200,  progress:100,manager:'Kevin Clark',   team:['EMP-003','EMP-011'], description:'Enterprise data warehouse migration' },
  { name:'ISO 27001 Certification',    status:'on-hold',     priority:'low',     startDate:new Date('2026-06-01'), endDate:new Date('2026-12-31'), budget:25000,  spent:2500,   progress:10, manager:'Admin User',    team:['EMP-007'], description:'Security certification project' },
];
projects.forEach(p => { p.createdAt = new Date(); p.updatedAt = new Date(); });
db.projects.insertMany(projects);
print(`  ✓ ${projects.length} projects`);

// ── 14. NOTIFICATIONS ───────────────────────────────────────
print('Seeding notifications...');
db.notifications.deleteMany({});
const notifs = [
  { title:'Invoice Overdue',          message:'INV-2026-004 from Delta Systems is 24 days overdue ($1,553.96)', type:'warning',  isRead:false, createdAt:new Date() },
  { title:'Low Stock Alert',          message:'Keyboard Mechanical (PRD-012) is running low — only 44 units remaining', type:'warning',  isRead:false, createdAt:new Date() },
  { title:'Leave Request Pending',    message:'EMP-003 David Lee has requested 5 days annual leave (Jul 1-5)', type:'info',     isRead:false, createdAt:new Date() },
  { title:'PO Approved',              message:'Purchase Order PO-2026-002 from Herman Miller has been approved', type:'success',  isRead:true,  createdAt:new Date() },
  { title:'New Lead Assigned',        message:'New lead "MediaCorp" has been assigned to Emma Davis', type:'info',     isRead:true,  createdAt:new Date() },
  { title:'Project Milestone Reached',message:'Mobile App v2.0 has reached 65% completion', type:'success',  isRead:true,  createdAt:new Date() },
];
notifs.forEach(n => { n.updatedAt = new Date(); });
db.notifications.insertMany(notifs);
print(`  ✓ ${notifs.length} notifications`);

// ── SUMMARY ─────────────────────────────────────────────────
print('\n╔═══════════════════════════════════════════╗');
print('║      ERP Seed Complete! 🎉                ║');
print('╠═══════════════════════════════════════════╣');
print('║  permissions  : ' + db.permissions.countDocuments()    + '              ║');
print('║  roles        : ' + db.roles.countDocuments()          + '                ║');
print('║  users        : ' + db.users.countDocuments()          + '                ║');
print('║  employees    : ' + db.employees.countDocuments()      + '               ║');
print('║  leads        : ' + db.leads.countDocuments()          + '                ║');
print('║  customers    : ' + db.customers.countDocuments()      + '                ║');
print('║  products     : ' + db.products.countDocuments()       + '               ║');
print('║  invoices     : ' + db.invoices.countDocuments()       + '                ║');
print('║  purchaseorders: '+ db.purchaseorders.countDocuments() + '               ║');
print('║  attendance   : ' + db.attendances.countDocuments()    + '               ║');
print('║  leave        : ' + db.leaverequests.countDocuments()  + '                ║');
print('║  journals     : ' + db.journalentries.countDocuments() + '                ║');
print('║  projects     : ' + db.projects.countDocuments()       + '                ║');
print('║  notifications: ' + db.notifications.countDocuments()  + '                ║');
print('╠═══════════════════════════════════════════╣');
print('║  Admin login:  admin@erp.com              ║');
print('║  Password:     Admin@12345                ║');
print('╚═══════════════════════════════════════════╝');
