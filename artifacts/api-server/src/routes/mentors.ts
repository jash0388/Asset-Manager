import { Router, Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middlewares/auth.js";

// Mentor CRUD for the Mentors management page. The frontend (Mentors.tsx,
// HodDashboard passkey editor) calls /api/mentors and /api/mentors/:id, which
// previously did not exist on the server — those buttons silently failed.
// This router is mounted under /mentors by routes/index.ts.
const router = Router();

router.use(authMiddleware, adminOnly);

// List all mentors (login keys included — admin-only view).
router.get("/mentors", async (req: any, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("qr_mentors")
      .select("id, name, email, key");
    if (error) throw error;
    res.json((data || []).sort((a: any, b: any) => String(a.key).localeCompare(String(b.key))));
  } catch (err: any) {
    req.log?.error?.({ err }, "List mentors error");
    res.status(500).json({ error: "Failed to load mentors" });
  }
});

// Create a mentor. The form sends { name, email, password } — "password" is the
// 3-4 digit login key the faculty will type into the Mentor App.
router.post("/mentors", async (req: Request, res: Response) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const key = String(req.body?.password ?? req.body?.key ?? "").trim();

  if (!name || !email || !key) {
    res.status(400).json({ error: "name, email and password (login key) are required" });
    return;
  }
  if (!/^[0-9]{3,6}$/.test(key)) {
    res.status(400).json({ error: "Login key must be 3-6 digits" });
    return;
  }
  try {
    const { data: existing } = await supabase
      .from("qr_mentors")
      .select("id")
      .eq("key", key)
      .limit(1);
    if (existing && existing.length > 0) {
      res.status(409).json({ error: "That login key is already taken" });
      return;
    }
    const { data, error } = await supabase
      .from("qr_mentors")
      .insert({ name, email, key })
      .select("id, name, email, key")
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A mentor with that login key already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create mentor" });
  }
});

// Update a mentor (currently: login key / passkey from the HOD editor).
router.put("/mentors/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid mentor id" });
    return;
  }
  const key = String(req.body?.key ?? req.body?.passkey ?? "").trim();
  if (!key) {
    res.status(400).json({ error: "key (login passkey) is required" });
    return;
  }
  if (!/^[0-9]{3,6}$/.test(key)) {
    res.status(400).json({ error: "Login key must be 3-6 digits" });
    return;
  }
  try {
    const { data: taken } = await supabase
      .from("qr_mentors")
      .select("id")
      .eq("key", key)
      .neq("id", id)
      .limit(1);
    if (taken && taken.length > 0) {
      res.status(409).json({ error: "That login key is already taken" });
      return;
    }
    const { data, error } = await supabase
      .from("qr_mentors")
      .update({ key })
      .eq("id", id)
      .select("id, name, email, key")
      .single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Mentor not found" });
      return;
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update mentor" });
  }
});

export default router;
