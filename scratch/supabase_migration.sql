
-- QR Attendance System Migration for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create Admins table
CREATE TABLE IF NOT EXISTS qr_admins (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create Users table
CREATE TABLE IF NOT EXISTS qr_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unique_id TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'staff')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create Attendance table
CREATE TABLE IF NOT EXISTS qr_attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES qr_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    scan_count INTEGER DEFAULT 1 NOT NULL,
    last_scan_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_attendance_user_id ON qr_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_attendance_date ON qr_attendance(date);
CREATE INDEX IF NOT EXISTS idx_qr_users_unique_id ON qr_users(unique_id);

-- 5. Seed initial admin (Password: admin123)
-- Hash generated via bcrypt: $2a$10$7q5XUu1Y.g5.f.G.f.G.f.O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0
INSERT INTO qr_admins (email, name, password_hash)
VALUES ('jashwanth038@gmail.com', 'Jashwanth', '$2b$10$srQS94wTwqq9ZI44SxIkQOM5hIH1uEaZcoHod3E.dmX1YBYBmUEiW')
ON CONFLICT (email) DO NOTHING;
