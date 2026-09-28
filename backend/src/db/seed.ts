import { db, initDb } from './database';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../infrastructure.db');

db.exec('PRAGMA foreign_keys = OFF;');
['audit_logs', 'work_orders', 'inspections', 'lifecycle_events', 'assets', 'users'].forEach(t => db.exec(`DROP TABLE IF EXISTS ${t}`));
db.exec('PRAGMA foreign_keys = ON;');
initDb();
const newDb = db;

console.log('Seeding Database...');

// 1. Create Users
const insertUser = newDb.prepare(`INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)`);

// Passwords in MVP are mock, we use a simple string 'password'
const users = [
  { name: 'John Inspector', email: 'inspector@city.gov', role: 'Inspector' },
  { name: 'Sarah Manager', email: 'manager@city.gov', role: 'Manager' },
  { name: 'Alice Auditor', email: 'auditor@city.gov', role: 'Auditor' }
];

const userIds: Record<string, number> = {};
users.forEach(u => {
  const result = insertUser.run(u.name, u.email, u.role, 'password');
  userIds[u.role] = result.lastInsertRowid as number;
});

// Helper for random choice
const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const Wards = ['Navrangpura', 'Paldi', 'Ellisbridge', 'Thaltej', 'Bodakdev', 'Vastrapur', 'Bopal', 'Gota', 'Chandkheda', 'Maninagar'];

// 2. Create Assets
const insertAsset = newDb.prepare(`
  INSERT INTO assets (id, category, lat, lng, ward, address, description, install_date, cost, vendor, expected_useful_life_years, condition_score, status, criticality)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLifecycle = newDb.prepare(`
  INSERT INTO lifecycle_events (asset_id, from_state, to_state, reason, changed_by_user_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertAudit = newDb.prepare(`
  INSERT INTO audit_logs (entity_type, entity_id, action, changes, user_id, timestamp)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const assetIds: string[] = [];

function generateAsset(index: number, category: string, isHero: boolean = false) {
  const prefix = category.substring(0, 2).toUpperCase();
  const id = isHero ? 'HERO-001' : `${prefix}-${index.toString().padStart(4, '0')}`;
  
  // Base location (roughly around Ahmedabad 23.0225, 72.5714)
  const lat = 23.0225 + randomFloat(-0.05, 0.05);
  const lng = 72.5714 + randomFloat(-0.05, 0.05);
  const ward = randomChoice(Wards);
  
  const yearsAgo = randomInt(1, 15);
  const installDate = new Date();
  installDate.setFullYear(installDate.getFullYear() - yearsAgo);
  
  const expectedLife = category === 'Streetlight' ? randomInt(10, 15) : category === 'Bridge' ? randomInt(50, 70) : randomInt(15, 25);
  
  // Condition degrades with age
  let condition = 5 - Math.floor(yearsAgo / 4);
  if (condition < 1) condition = 1;
  if (condition > 5) condition = 5;

  const cost = category === 'Streetlight' ? randomInt(800, 2500) : category === 'Bridge' ? randomInt(500000, 2000000) : randomInt(10000, 50000);
  const vendor = randomChoice(['CityLights Co', 'Global Infra', 'Metro Build', 'Acme Solutions', 'RiverWorks']);
  
  // Assign criticality (Bridges/Roads are higher)
  let criticality = category === 'Bridge' || category === 'Water Main' ? randomInt(4, 5) : randomInt(1, 3);
  if (isHero) criticality = 5;

  // Assign realistic statuses based on age
  let status = 'In Service';
  if (isHero) status = 'Under Maintenance';
  else if (yearsAgo > expectedLife) status = randomChoice(['In Service', 'Under Maintenance', 'Decommissioned']);
  else if (yearsAgo < 2) status = randomChoice(['Planned', 'Procured', 'Commissioned', 'In Service']);
  
  if (status === 'Planned' || status === 'Procured') {
    condition = 5;
  }
  
  const description = `This is a highly critical ${category.toLowerCase()} infrastructure asset located in ${ward}. It requires regular monitoring and was supplied by ${vendor}.`;

  insertAsset.run(id, category, lat, lng, ward, `${randomInt(1, 999)} ${ward} St`, description, installDate.toISOString(), cost, vendor, expectedLife, condition, status, criticality);
  assetIds.push(id);

  // Generate lifecycle history
  let currentDate = new Date(installDate);
  const states = ['Planned', 'Procured', 'Commissioned', 'In Service'];
  let currentState = 'Planned';
  
  states.forEach(state => {
    if (state === 'Planned') {
       insertLifecycle.run(id, null, 'Planned', 'Initial identification', userIds['Manager'], currentDate.toISOString());
    } else {
       const nextDate = new Date(currentDate.getTime() + randomInt(10, 60) * 86400000);
       insertLifecycle.run(id, currentState, state, `Transitioned to ${state}`, userIds['Manager'], nextDate.toISOString());
       currentDate = nextDate;
       currentState = state;
    }
  });

  if (isHero) {
      const breakdownDate = new Date(currentDate.getTime() + 100 * 86400000);
      insertLifecycle.run(id, 'In Service', 'Under Maintenance', 'Hero asset broke down', userIds['Manager'], breakdownDate.toISOString());
  } else if (status !== 'In Service') {
      const finalDate = new Date();
      insertLifecycle.run(id, 'In Service', status, `Transitioned to ${status}`, userIds['Manager'], finalDate.toISOString());
  }

  // Generate an audit log
  insertAudit.run('Asset', id, 'Create', JSON.stringify({ category, lat, lng, status }), userIds['Manager'], installDate.toISOString());
}

// Create 1 Hero Asset (Streetlight)
generateAsset(1, 'Streetlight', true);
// Create 80 Streetlights
for (let i = 2; i <= 81; i++) generateAsset(i, 'Streetlight');
// Create 20 Road Segments
for (let i = 1; i <= 20; i++) generateAsset(i, 'Road Segment');
// Create 15 Bridges
for (let i = 1; i <= 15; i++) generateAsset(i, 'Bridge');
// Create 12 Water Mains
for (let i = 1; i <= 12; i++) generateAsset(i, 'Water Main');
// Create 12 Traffic Signals
for (let i = 1; i <= 12; i++) generateAsset(i, 'Traffic Signal');

// 3. Create Inspections & Work Orders
const insertInspection = newDb.prepare(`
  INSERT INTO inspections (asset_id, inspector_id, condition_score, notes, photo_url, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertWorkOrder = newDb.prepare(`
  INSERT INTO work_orders (asset_id, reported_by, assigned_to, status, priority, description, cost, due_date, completed_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < 60; i++) {
  const assetId = randomChoice(assetIds);
  const condition = randomInt(1, 5);
  const date = randomDate(new Date(2023, 0, 1), new Date());
  insertInspection.run(assetId, userIds['Inspector'], condition, `Routine inspection ${i}`, 'https://via.placeholder.com/300', date.toISOString());
}

for (let i = 0; i < 35; i++) {
  const assetId = randomChoice(assetIds);
  const isOverdue = Math.random() > 0.8;
  const isDone = !isOverdue && Math.random() > 0.5;
  const status = isDone ? 'Done' : (Math.random() > 0.5 ? 'Assigned' : 'Open');
  
  const created = randomDate(new Date(2023, 0, 1), new Date());
  const due = new Date(created.getTime() + 7 * 86400000);
  if (isOverdue) due.setFullYear(due.getFullYear() - 1); // Make it overdue

  const completed = isDone ? new Date(due.getTime() - 86400000) : null;
  const cost = isDone ? randomInt(100, 1000) : 0;
  
  const priority = randomChoice(['Low', 'Medium', 'High', 'Critical']);

  insertWorkOrder.run(
    assetId,
    userIds['Inspector'],
    userIds['Inspector'], // Assigned to inspector
    status,
    priority,
    `Fix issue ${i} for asset`,
    cost,
    due.toISOString(),
    completed ? completed.toISOString() : null,
    created.toISOString()
  );

  insertAudit.run('WorkOrder', assetId, 'Create', JSON.stringify({ priority, status }), userIds['Manager'], created.toISOString());
}

// Add a guaranteed Open and Overdue work order to the HERO asset
const heroCreated = new Date();
heroCreated.setDate(heroCreated.getDate() - 20);
const heroDue = new Date();
heroDue.setDate(heroDue.getDate() - 10);

insertWorkOrder.run(
    'HERO-001',
    userIds['Inspector'],
    null,
    'Open',
    'Critical',
    'Hero Asset has completely failed and needs immediate replacement part.',
    0,
    heroDue.toISOString(),
    null,
    heroCreated.toISOString()
);

// 4. Create Citizen Reports
const insertReport = newDb.prepare(`
  INSERT INTO citizen_reports (id, issue_type, lat, lng, description, status, linked_asset_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const reportTypes = ['Pothole', 'Streetlight Out', 'Water Leak', 'Broken Pavement'];
const reportStatuses = ['New', 'Triaged', 'In Progress', 'Resolved'];
for (let i = 1; i <= 40; i++) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(1, 30));
  const status = randomChoice(reportStatuses);
  const type = randomChoice(reportTypes);
  // 50% chance to be linked to a random asset
  const linkedAsset = Math.random() > 0.5 ? randomChoice(assetIds) : null;
  insertReport.run(
    `REP-${Math.floor(Math.random() * 90000) + 10000}`,
    type,
    23.0225 + (Math.random() - 0.5) * 0.1,
    72.5714 + (Math.random() - 0.5) * 0.1,
    `Citizen reported a ${type.toLowerCase()} in the area.`,
    status,
    linkedAsset,
    d.toISOString()
  );
}

// 5. Create Pending Approvals
const insertApproval = newDb.prepare(`
  INSERT INTO approvals (type, reference_id, payload, requested_by, status, created_at)
  VALUES (?, ?, ?, ?, 'Pending', ?)
`);
for (let i = 0; i < 5; i++) {
  const assetId = randomChoice(assetIds);
  const d = new Date();
  d.setDate(d.getDate() - randomInt(1, 5));
  insertApproval.run(
    'LifecycleTransition',
    assetId,
    JSON.stringify({ from_state: 'In Service', to_state: 'Decommissioned', reason: 'End of useful life' }),
    userIds['Inspector'],
    d.toISOString()
  );
}

console.log('Seed complete! Credentials for testing:');
console.table(users);
