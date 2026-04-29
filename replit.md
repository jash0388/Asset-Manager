# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: Smart QR Attendance & Access Control System

A mobile-first attendance app for college campuses. Security guards scan student/staff QR codes to mark entry/exit; admins manage users and view reports.

### Artifacts
- **`api-server`** (Express 5, port 8080, mounted at `/api`) — JWT auth (bcrypt + jsonwebtoken), Drizzle ORM, qrcode generation, Pino logging. Auto-seeds on boot.
- **`qr-attendance`** (React + Vite + Tailwind + wouter + shadcn, port 20169, mounted at `/`) — Login, Dashboard, Users (with QR generation/download), Scanner (html5-qrcode + vibration feedback), Attendance table (filters + CSV export), Student History (search + per-user stats).

### Workflows
- `API Server` — `PORT=8080 pnpm --filter @workspace/api-server run dev` (console)
- `Start application` — `PORT=20169 BASE_PATH=/ pnpm --filter @workspace/qr-attendance run dev` (webview)

### Database
PostgreSQL with three tables (admins, users, attendance). Schema in `lib/db/src/schema.ts`. Push changes with `pnpm --filter @workspace/db run push`.

### Default Admin Login
- Email: `admin@college.edu`
- Password: `admin123`
- Seed also creates 5 sample users (3 students, 2 staff) with sample attendance.

### Key Behavior
- `/api/scan` is intentionally unauthenticated so the scanner page is usable without login on shared guard devices.
- Each scan toggles entry → exit for the same user/day with a 30-second cooldown to prevent double-scans.
- All other API routes require a Bearer JWT token (stored in `localStorage` as `qr_token`).
