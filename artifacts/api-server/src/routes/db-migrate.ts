import { Router, Request, Response } from "express";
import { Client } from "pg";
import { authMiddleware, adminOnly, AuthRequest } from "../middlewares/auth.js";

// One-time, idempotent database self-migration. The live database lacks
// qr_users.mentor_id (mentor↔student assignment), and the Supabase dashboard
// for this project is not reachable by the owner's current login — so the API
// applies the change itself using its own DATABASE_URL.
//
// This endpoint runs ONE fixed, non-destructive, idempotent statement. It does
// not accept arbitrary SQL.

const REQUIRED_SQL = "ALTER TABLE public.qr_users ADD COLUMN IF NOT EXISTS mentor_id integer";

const router = Router();

router.post("/admin/db-migrate", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  if (req.body?.confirm !== "ADD-MENTOR-COLUMN") {
    res.status(400).json({ error: 'Send {"confirm":"ADD-MENTOR-COLUMN"} to run the fixed mentor_id migration.' });
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    res.status(500).json({ error: "DATABASE_URL is not configured in this environment." });
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const before = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='qr_users' AND column_name='mentor_id'"
    );
    const existedBefore = before.rowCount! > 0;

    await client.query(REQUIRED_SQL);

    const after = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='qr_users' AND column_name='mentor_id'"
    );

    res.json({
      ok: true,
      alreadyExisted: existedBefore,
      column: after.rows[0] ?? null,
      applied: existedBefore ? "no-op (column already present)" : REQUIRED_SQL,
    });
  } catch (err: any) {
    console.error("db-migrate error:", err?.message);
    res.status(500).json({ error: `Migration failed: ${err?.message ?? "unknown error"}` });
  } finally {
    try { await client.end(); } catch {}
  }
});

export default router;
