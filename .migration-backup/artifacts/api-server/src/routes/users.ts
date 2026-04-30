import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { CreateUserBody, GetUserParams, DeleteUserParams, ListUsersQueryParams } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth.js";
import QRCode from "qrcode";

const router = Router();

function generateUniqueId(): string {
  return "UID" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

router.get("/users", authMiddleware, async (req, res) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const role = parsed.success ? parsed.data.role : undefined;
  try {
    let query = db.select().from(usersTable);
    if (role) {
      const results = await db.select().from(usersTable).where(eq(usersTable.role, role));
      res.json(results.map(formatUser));
      return;
    }
    const results = await query;
    res.json(results.map(formatUser));
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", authMiddleware, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
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
  try {
    const inserted = await db.insert(usersTable).values({ name, uniqueId: uid, role }).returning();
    res.status(201).json(formatUser(inserted[0]));
  } catch (err: any) {
    const pgCode = err?.code ?? err?.cause?.code ?? err?.original?.code;
    const msg = String(err?.message ?? "") + " " + String(err?.cause?.message ?? "");
    if (pgCode === "23505" || msg.includes("duplicate key") || msg.includes("unique constraint")) {
      res.status(400).json({ error: `Unique ID "${uid}" already exists. Try a different one.` });
      return;
    }
    req.log.error({ err }, "Create user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", authMiddleware, async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const results = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id)).limit(1);
    if (!results[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(results[0]));
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", authMiddleware, async (req, res) => {
  const parsed = DeleteUserParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const deleted = await db.delete(usersTable).where(eq(usersTable.id, parsed.data.id)).returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/qrcode/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const results = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!results[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const qrCodeDataUrl = await QRCode.toDataURL(results[0].uniqueId, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ userId, uniqueId: results[0].uniqueId, qrCodeDataUrl });
  } catch (err) {
    req.log.error({ err }, "QR code error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/search", authMiddleware, async (req, res) => {
  const query = (req.query.query as string) || "";
  const role = req.query.role as string | undefined;
  if (!query) {
    res.status(400).json({ error: "Query parameter required" });
    return;
  }
  try {
    let results;
    if (role) {
      results = await db
        .select()
        .from(usersTable)
        .where(
          or(
            ilike(usersTable.name, `%${query}%`),
            ilike(usersTable.uniqueId, `%${query}%`)
          )
        );
      results = results.filter((u) => u.role === role);
    } else {
      results = await db
        .select()
        .from(usersTable)
        .where(
          or(
            ilike(usersTable.name, `%${query}%`),
            ilike(usersTable.uniqueId, `%${query}%`)
          )
        );
    }
    res.json(results.map(formatUser));
  } catch (err) {
    req.log.error({ err }, "Search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    uniqueId: u.uniqueId,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

export default router;
