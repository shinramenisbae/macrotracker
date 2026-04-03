import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'macrotracker.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: InstanceType<typeof Database> = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      calories    REAL NOT NULL DEFAULT 0,
      protein_g   REAL NOT NULL DEFAULT 0,
      carbs_g     REAL NOT NULL DEFAULT 0,
      fat_g       REAL NOT NULL DEFAULT 0,
      serving_size TEXT,
      meal        TEXT DEFAULT 'other',
      source      TEXT DEFAULT 'manual',
      barcode     TEXT,
      image_path  TEXT,
      logged_at   TEXT NOT NULL DEFAULT (datetime('now')),
      date        TEXT NOT NULL DEFAULT (date('now')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_date ON food_entries(date);

    CREATE TABLE IF NOT EXISTS daily_goals (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      calories    REAL NOT NULL DEFAULT 2000,
      protein_g   REAL NOT NULL DEFAULT 150,
      carbs_g     REAL NOT NULL DEFAULT 250,
      fat_g       REAL NOT NULL DEFAULT 65,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO daily_goals (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS weight_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      weight_kg   REAL NOT NULL,
      date        TEXT NOT NULL UNIQUE DEFAULT (date('now')),
      notes       TEXT,
      photo_path  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_log(date);

    CREATE TABLE IF NOT EXISTS barcode_cache (
      barcode     TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      calories    REAL,
      protein_g   REAL,
      carbs_g     REAL,
      fat_g       REAL,
      serving_size TEXT,
      raw_json    TEXT,
      cached_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add photo_path to weight_log if missing
  const cols = db.pragma('table_info(weight_log)') as any[];
  if (!cols.find((c: any) => c.name === 'photo_path')) {
    db.exec('ALTER TABLE weight_log ADD COLUMN photo_path TEXT');
    console.log('Migrated: added photo_path to weight_log');
  }

  console.log('Database initialized successfully');
}

export default db;
