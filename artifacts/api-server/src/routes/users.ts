import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { CreateUserBody, GetUserParams, DeleteUserParams, ListUsersQueryParams } from "@workspace/api-zod";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";
import QRCode from "qrcode";

const router = Router();

function generateUniqueId(): string {
  return "UID" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

router.get("/users", authMiddleware, async (req: any, res: any) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const role = parsed.success ? parsed.data.role : undefined;
  const mentorIdRaw = req.query.mentorId;
  const mentorId =
    typeof mentorIdRaw === "string" && /^\d+$/.test(mentorIdRaw)
      ? Number(mentorIdRaw)
      : undefined;
  try {
    let query = supabase.from("qr_users").select("*");
    if (role) {
      query = query.eq("role", role);
    }
    const { data: results, error } = await query;
    if (error) throw error;
    res.json(results.map(formatUser));
  } catch (err: any) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", authMiddleware, adminOnly, async (req: any, res: any) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i: any) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    res.status(400).json({ error: `Invalid input - ${issues || "missing fields"}` });
    return;
  }
  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "Name cannot be empty" });
    return;
  }
  const role = parsed.data.role;
  const uid = (parsed.data.uniqueId || "").trim() || generateUniqueId();
  const mentorId = parsed.data.mentorId ?? null;
  try {
    // The mentor_id column is optional on older databases — if it is missing
    // (42703), retry without it so user creation keeps working.
    let inserted, error;
    {
      const attempt = await supabase
        .from("qr_users")
        .insert(mentorId != null ? { name, unique_id: uid, role, mentor_id: mentorId } : { name, unique_id: uid, role })
        .select()
        .single();
      if (attempt.error?.code === "42703" || attempt.error?.code === "PGRST204") {
        const retry = await supabase.from("qr_users").insert({ name, unique_id: uid, role }).select().single();
        inserted = retry.data; error = retry.error;
      } else {
        inserted = attempt.data; error = attempt.error;
      }
    }

    if (error) {
      if (error.code === "23505") {
        res.status(400).json({ error: "Unique ID already exists" });
        return;
      }
      throw error;
    }
    res.status(201).json(formatUser(inserted));
  } catch (err: any) {
    req.log.error({ err }, "Create user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const { data: user, error } = await supabase
      .from("qr_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      throw error;
    }
    res.json(formatUser(user));
  } catch (err: any) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Assign / clear a student's mentor. Mentors.tsx calls PATCH /users/:id with
// { mentorId } — previously unimplemented, so the assign button failed.
router.patch("/users/:id", authMiddleware, adminOnly, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const mentorId = req.body?.mentorId;
  if (mentorId !== null && !Number.isFinite(Number(mentorId))) {
    res.status(400).json({ error: "mentorId must be a number or null" });
    return;
  }
  try {
    if (mentorId !== null) {
      const { data: mentor } = await supabase
        .from("qr_mentors")
        .select("id")
        .eq("id", Number(mentorId))
        .limit(1);
      if (!mentor || mentor.length === 0) {
        res.status(404).json({ error: "Mentor not found" });
        return;
      }
    }
    const { data: user, error } = await supabase
      .from("qr_users")
      .update({ mentor_id: mentorId === null ? null : Number(mentorId) })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (error.code === "42703" || error.code === "PGRST204" || /mentor_id/.test(String(error.message || ""))) {
        res.status(400).json({
          error: "Mentor assignment is not configured on this database yet — run: ALTER TABLE qr_users ADD COLUMN mentor_id integer;",
        });
        return;
      }
      throw error;
    }
    res.json(formatUser(user));
  } catch (err: any) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", authMiddleware, adminOnly, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const { data: deleted, error } = await supabase
      .from("qr_users")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      throw error;
    }
    res.json({ message: "User deleted successfully" });
  } catch (err: any) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/qrcode/:userId", authMiddleware, async (req: any, res: any) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const { data: user, error } = await supabase
      .from("qr_users")
      .select("unique_id")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      throw error;
    }
    const qrCodeDataUrl = await QRCode.toDataURL(user.unique_id, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ userId, uniqueId: user.unique_id, qrCodeDataUrl });
  } catch (err: any) {
    req.log.error({ err }, "QR code error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/search", authMiddleware, async (req: any, res: any) => {
  const query = (req.query.query as string) || "";
  const role = req.query.role as string | undefined;
  if (!query) {
    res.status(400).json({ error: "Query parameter required" });
    return;
  }
  try {
    let supabaseQuery = supabase
      .from("qr_users")
      .select("*")
      .or(`name.ilike.%${query}%,unique_id.ilike.%${query}%`);

    if (role) {
      supabaseQuery = supabaseQuery.eq("role", role);
    }

    const { data: results, error } = await supabaseQuery;
    if (error) throw error;
    res.json(results.map(formatUser));
  } catch (err: any) {
    req.log.error({ err }, "Search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    uniqueId: u.unique_id,
    role: u.role,
    createdAt: u.created_at,
    section: u.section,
    batch: u.batch,
    mentorId: u.mentor_id,
  };
}

export default router;
