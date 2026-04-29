import { pool } from "@workspace/db";
import { logger } from "./lib/logger.js";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unique_id TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    scan_count INTEGER NOT NULL DEFAULT 0,
    last_scan_at TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`,
  `CREATE TABLE IF NOT EXISTS mentors (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES mentors(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_users_mentor_id ON users(mentor_id)`,
];

let migrationsRun = false;

export async function runMigrations(): Promise<void> {
  if (migrationsRun) return;
  for (const sql of MIGRATIONS) {
    try {
      await pool.query(sql);
    } catch (err) {
      logger.error({ err, sql: sql.slice(0, 80) }, "Migration step failed");
      throw err;
    }
  }
  migrationsRun = true;
  logger.info("Migrations applied");
}
