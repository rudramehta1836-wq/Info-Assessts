import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { db } from './db/database';
import { calculateRiskScore, getPredictiveMaintenance, calculateLifecycleCost, calculateCapitalPlan } from './services/intelligence';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-demo-key';

// -- Authentication --
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password_hash = ?').get(email, password) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

// Middleware for RBAC
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of ${roles.join(', ')}` });
    }
    next();
  };
};

const logAudit = (entity_type: string, entity_id: string, action: string, changes: any, user_id: number) => {
  const insertAudit = db.prepare(`INSERT INTO audit_logs (entity_type, entity_id, action, changes, user_id) VALUES (?, ?, ?, ?, ?)`);
  insertAudit.run(entity_type, entity_id, action, JSON.stringify(changes), user_id);
};

// -- Assets Endpoints --
app.get('/assets', authenticate, (req, res) => {
  const assets = db.prepare('SELECT * FROM assets').all();
  res.json(assets);
});

app.post('/assets', authenticate, requireRole(['Manager', 'Inspector']), (req: any, res: any) => {
  const { id, category, description, lat, lng, ward, address, install_date, cost, vendor, expected_useful_life_years } = req.body;
  
  if (!id || !category || !lat || !lng || !ward || !address || !install_date || expected_useful_life_years === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO assets (id, category, description, lat, lng, ward, address, install_date, cost, vendor, expected_useful_life_years, condition_score, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 'Planned')
      `).run(id, category, description || '', lat, lng, ward, address, install_date, cost || 0, vendor, expected_useful_life_years);
      
      db.prepare(`
        INSERT INTO lifecycle_events (asset_id, from_state, to_state, reason, changed_by_user_id)
        VALUES (?, NULL, 'Planned', 'Asset Created', ?)
      `).run(id, req.user.id);
      
      logAudit('Asset', id, 'Create', { category, ward }, req.user.id);
    })();
    res.json({ success: true, message: 'Asset created' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Asset ID already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.get('/assets/:id', authenticate, (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  
  const history = db.prepare('SELECT l.*, u.name as changed_by_name FROM lifecycle_events l JOIN users u ON l.changed_by_user_id = u.id WHERE l.asset_id = ? ORDER BY l.created_at DESC').all(req.params.id);
  const workOrders = db.prepare('SELECT * FROM work_orders WHERE asset_id = ?').all(req.params.id);
  
  res.json({ ...asset, history, workOrders });
});

app.get('/assets/:id/intelligence', authenticate, (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  
  const workOrders = db.prepare('SELECT * FROM work_orders WHERE asset_id = ?').all(asset.id);
  
  const risk = calculateRiskScore(asset, workOrders);
  const predictive = getPredictiveMaintenance(asset, risk.score);
  const lifecycleCost = calculateLifecycleCost(asset, workOrders);
  
  res.json({ risk, predictive, lifecycleCost });
});

// Valid Transitions State Machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Planned': ['Procured', 'Decommissioned'],
  'Procured': ['Commissioned', 'Disposed'],
  'Commissioned': ['In Service', 'Decommissioned'],
  'In Service': ['Under Maintenance', 'Decommissioned'],
  'Under Maintenance': ['In Service', 'Decommissioned'],
  'Decommissioned': ['Disposed'],
  'Disposed': []
};

app.post('/assets/:id/transition', authenticate, requireRole(['Manager', 'Inspector']), (req: any, res: any) => {
  const { to_state, reason } = req.body;
  const asset_id = req.params.id;
  
  const asset = db.prepare('SELECT status FROM assets WHERE id = ?').get(asset_id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  
  const from_state = asset.status;
  const allowed = VALID_TRANSITIONS[from_state] || [];
  
  if (!allowed.includes(to_state)) {
     return res.status(400).json({ error: `Invalid transition from ${from_state} to ${to_state}` });
  }

  // Role Enforcement per transition type (simplified for demo)
  if (to_state === 'Disposed' && req.user.role !== 'Manager') {
    return res.status(403).json({ error: 'Only Managers can mark an asset as Disposed' });
  }

  db.transaction(() => {
    db.prepare('UPDATE assets SET status = ? WHERE id = ?').run(to_state, asset_id);
    db.prepare('INSERT INTO lifecycle_events (asset_id, from_state, to_state, reason, changed_by_user_id) VALUES (?, ?, ?, ?, ?)').run(asset_id, from_state, to_state, reason || 'Manual transition', req.user.id);
    logAudit('Asset', asset_id, 'Transition', { from_state, to_state, reason }, req.user.id);
  })();

  res.json({ success: true, message: `Transitioned to ${to_state}` });
});

app.put('/assets/:id', authenticate, requireRole(['Manager']), (req: any, res: any) => {
  const { category, description, ward, address, condition_score, cost, vendor } = req.body;
  const id = req.params.id;
  try {
    db.prepare(`
      UPDATE assets SET category = ?, description = ?, ward = ?, address = ?, condition_score = ?, cost = ?, vendor = ?
      WHERE id = ?
    `).run(category, description || '', ward, address, condition_score, cost, vendor, id);
    logAudit('Asset', id, 'Update', { category, condition_score }, req.user.id);
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/assets/:id', authenticate, requireRole(['Manager']), (req: any, res: any) => {
  const id = req.params.id;
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM lifecycle_events WHERE asset_id = ?').run(id);
      db.prepare('DELETE FROM work_orders WHERE asset_id = ?').run(id);
      db.prepare('DELETE FROM inspections WHERE asset_id = ?').run(id);
      db.prepare('DELETE FROM assets WHERE id = ?').run(id);
      logAudit('Asset', id, 'Delete', {}, req.user.id);
    })();
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -- Work Orders --
app.get('/work-orders', authenticate, (req, res) => {
  const wo = db.prepare('SELECT w.*, a.status as asset_status FROM work_orders w JOIN assets a ON w.asset_id = a.id ORDER BY w.created_at DESC').all();
  res.json(wo);
});

app.post('/work-orders', authenticate, requireRole(['Inspector', 'Manager', 'Auditor']), (req: any, res: any) => {
  const { asset_id, priority, description } = req.body;
  const result = db.prepare('INSERT INTO work_orders (asset_id, reported_by, status, priority, description) VALUES (?, ?, ?, ?, ?)').run(asset_id, req.user.id, 'Open', priority, description);
  logAudit('WorkOrder', asset_id, 'Create', { priority, status: 'Open' }, req.user.id);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/work-orders/:id', authenticate, requireRole(['Manager', 'Inspector']), (req: any, res: any) => {
  const { status, cost } = req.body; // e.g. transition to 'Assigned' or 'Done'
  const id = req.params.id;
  const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as any;
  if (!wo) return res.status(404).json({ error: 'Not found' });
  
  if (status === 'Done' && req.user.role === 'Inspector' && wo.assigned_to !== req.user.id) {
     // Optional: Only assigned inspector can close it, or Manager. But we will just let anyone close for demo or enforce.
  }

  let completedAt = status === 'Done' ? new Date().toISOString() : null;
  db.prepare('UPDATE work_orders SET status = ?, cost = ?, completed_at = ? WHERE id = ?').run(status, cost || 0, completedAt, id);
  logAudit('WorkOrder', wo.asset_id, 'Update', { status }, req.user.id);
  res.json({ success: true });
});

app.delete('/work-orders/:id', authenticate, requireRole(['Manager']), (req: any, res: any) => {
  const id = req.params.id;
  try {
    const wo = db.prepare('SELECT asset_id FROM work_orders WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM work_orders WHERE id = ?').run(id);
    if (wo) logAudit('WorkOrder', wo.asset_id, 'Delete', { id }, req.user.id);
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -- Citizen Reports --
app.post('/citizen-reports', (req, res) => {
  // Public endpoint - no auth required!
  const { issue_type, lat, lng, description } = req.body;
  const id = `REP-${Math.floor(Math.random() * 90000) + 10000}`;
  db.prepare(`
    INSERT INTO citizen_reports (id, issue_type, lat, lng, description, status) 
    VALUES (?, ?, ?, ?, ?, 'New')
  `).run(id, issue_type, lat, lng, description);
  res.json({ tracking_id: id });
});

app.get('/citizen-reports', authenticate, requireRole(['Manager']), (req, res) => {
  const reports = db.prepare('SELECT * FROM citizen_reports ORDER BY created_at DESC').all();
  res.json(reports);
});

app.put('/citizen-reports/:id', authenticate, requireRole(['Manager']), (req, res) => {
  const { status, linked_asset_id } = req.body;
  db.prepare('UPDATE citizen_reports SET status = ?, linked_asset_id = ? WHERE id = ?').run(status, linked_asset_id, req.params.id);
  res.json({ success: true });
});

// -- Approvals --
app.get('/approvals', authenticate, requireRole(['Manager']), (req, res) => {
  const approvals = db.prepare(`
    SELECT a.*, u.name as requester_name 
    FROM approvals a JOIN users u ON a.requested_by = u.id 
    WHERE a.status = 'Pending' ORDER BY a.created_at ASC
  `).all();
  res.json(approvals);
});

app.post('/approvals/:id/decide', authenticate, requireRole(['Manager']), (req, res) => {
  const { decision, comments } = req.body; // 'Approved', 'Rejected'
  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id) as any;
  if (!approval) return res.status(404).json({ error: 'Not found' });
  
  db.prepare('UPDATE approvals SET status = ?, comments = ? WHERE id = ?').run(decision, comments, req.params.id);
  
  // If approved, apply the payload
  if (decision === 'Approved') {
    const payload = JSON.parse(approval.payload);
    if (approval.type === 'LifecycleTransition') {
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run(payload.to_state, approval.reference_id);
      db.prepare(`INSERT INTO lifecycle_events (asset_id, from_state, to_state, reason, changed_by_user_id) VALUES (?, ?, ?, ?, ?)`).run(
        approval.reference_id, payload.from_state, payload.to_state, payload.reason || 'Manager Approved', approval.requested_by
      );
      logAudit('Asset', approval.reference_id, 'Transition', { from: payload.from_state, to: payload.to_state, approved_by: (req as any).user.id }, approval.requested_by);
    }
  }
  res.json({ success: true });
});

// -- Inspections --
app.get('/inspections', authenticate, (req, res) => {
  const data = db.prepare('SELECT i.*, u.name as inspector_name FROM inspections i JOIN users u ON i.inspector_id = u.id ORDER BY i.created_at DESC').all();
  res.json(data);
});

app.post('/inspections', authenticate, requireRole(['Inspector', 'Manager']), (req: any, res: any) => {
  const { asset_id, condition_score, notes, photo_url } = req.body;
  try {
    db.transaction(() => {
      db.prepare('INSERT INTO inspections (asset_id, inspector_id, condition_score, notes, photo_url) VALUES (?, ?, ?, ?, ?)').run(asset_id, req.user.id, condition_score, notes, photo_url);
      db.prepare('UPDATE assets SET condition_score = ? WHERE id = ?').run(condition_score, asset_id);
      logAudit('Asset', asset_id, 'Inspection', { condition_score, notes }, req.user.id);
    })();
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -- Audit Logs --
app.get('/audit-logs', authenticate, requireRole(['Manager', 'Auditor']), (req, res) => {
  const data = db.prepare('SELECT a.*, u.name as user_name FROM audit_logs a JOIN users u ON a.user_id = u.id ORDER BY timestamp DESC LIMIT 200').all();
  res.json(data);
});

// -- Dashboard Analytics --
app.get('/dashboard/stats', authenticate, (req, res) => {
  const totalAssets = (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
  const statusCounts = db.prepare('SELECT status, COUNT(*) as count FROM assets GROUP BY status').all();
  const conditionAvg = (db.prepare('SELECT AVG(condition_score) as avg FROM assets').get() as any).avg;
  const openWorkOrders = (db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status != 'Done'").get() as any).count;
  
  // Predictive Flagging: Count assets where expected useful life has passed
  const atRiskCount = (db.prepare(`
      SELECT COUNT(*) as count FROM assets 
      WHERE expected_useful_life_years < (cast(strftime('%Y', 'now') as integer) - cast(strftime('%Y', install_date) as integer))
      OR condition_score <= 2
  `).get() as any).count;

  res.json({ totalAssets, statusCounts, conditionAvg, openWorkOrders, atRiskCount });
});

app.get('/analytics/capital-plan', authenticate, requireRole(['Manager', 'Auditor']), (req, res) => {
  const budgetCap = parseInt(req.query.budgetCap as string) || 500000;
  const assets = db.prepare('SELECT * FROM assets').all();
  const plan = calculateCapitalPlan(assets, budgetCap);
  res.json(plan);
});

// -- Audit Logs --
app.get('/audit-logs', authenticate, requireRole(['Auditor']), (req, res) => {
  const logs = db.prepare('SELECT a.*, u.name as user_name, u.role as user_role FROM audit_logs a JOIN users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT 100').all();
  res.json(logs);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
