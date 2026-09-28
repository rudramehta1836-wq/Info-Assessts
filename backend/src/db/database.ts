import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

import type { Database as BetterSqlite3Database } from 'better-sqlite3';

const dbPath = path.resolve(__dirname, '../../infrastructure.db');

export const db: BetterSqlite3Database = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL, -- 'Inspector', 'Manager', 'Auditor'
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY, -- e.g. SL-001
      category TEXT NOT NULL, -- 'Streetlight', 'RoadSegment'
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      ward TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT,
      install_date TEXT NOT NULL,
      cost REAL NOT NULL,
      vendor TEXT,
      expected_useful_life_years INTEGER NOT NULL,
      condition_score INTEGER NOT NULL CHECK(condition_score >= 1 AND condition_score <= 5),
      status TEXT NOT NULL, -- 'Planned', 'Procured', 'Commissioned', 'In Service', 'Under Maintenance', 'Decommissioned', 'Disposed'
      criticality INTEGER NOT NULL DEFAULT 3 CHECK(criticality >= 1 AND criticality <= 5)
    );

    CREATE TABLE IF NOT EXISTS lifecycle_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT NOT NULL,
      reason TEXT,
      changed_by_user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(asset_id) REFERENCES assets(id),
      FOREIGN KEY(changed_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      inspector_id INTEGER NOT NULL,
      condition_score INTEGER NOT NULL CHECK(condition_score >= 1 AND condition_score <= 5),
      notes TEXT,
      photo_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(asset_id) REFERENCES assets(id),
      FOREIGN KEY(inspector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      reported_by INTEGER NOT NULL,
      assigned_to INTEGER,
      status TEXT NOT NULL, -- 'Open', 'Assigned', 'Done'
      priority TEXT NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
      description TEXT NOT NULL,
      cost REAL DEFAULT 0,
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(asset_id) REFERENCES assets(id),
      FOREIGN KEY(reported_by) REFERENCES users(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- 'Asset', 'WorkOrder', 'User'
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'Create', 'Update', 'Delete', 'Transition'
      changes TEXT, -- JSON payload of changes
      user_id INTEGER NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS citizen_reports (
      id TEXT PRIMARY KEY,
      issue_type TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL, -- 'New', 'Triaged', 'In Progress', 'Resolved'
      linked_asset_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'LifecycleTransition', 'WorkOrder'
      reference_id TEXT NOT NULL,
      payload TEXT NOT NULL, -- JSON
      requested_by INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'Pending', 'Approved', 'Rejected'
      comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requested_by) REFERENCES users(id)
    );
  `;
  db.exec(schema);

  // Run migrations
  try {
    db.prepare('SELECT criticality FROM assets LIMIT 1').get();
  } catch (e) {
    db.exec('ALTER TABLE assets ADD COLUMN criticality INTEGER NOT NULL DEFAULT 3 CHECK(criticality >= 1 AND criticality <= 5)');
  }
  
  try {
    db.prepare('SELECT description FROM assets LIMIT 1').get();
  } catch (e) {
    db.exec('ALTER TABLE assets ADD COLUMN description TEXT');
  }
  
  try {
    db.prepare('SELECT id FROM citizen_reports LIMIT 1').get();
  } catch (e) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS citizen_reports (
        id TEXT PRIMARY KEY,
        issue_type TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        linked_asset_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        requested_by INTEGER NOT NULL,
        status TEXT NOT NULL,
        comments TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(requested_by) REFERENCES users(id)
      );
    `);
  }
}

// Ensure the db is initialized when imported
initDb();
