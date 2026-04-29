import { Router } from "express";
import { db, usersTable, attendanceTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

const DUPLICATE_SCAN_COOLDOWN_MS = 30 * 1000;

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    uniqueId: u.uniqueId,
    role: u.role,
    mentorId: u.mentorId ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

function formatRecord(record: typeof attendanceTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  const durationMinutes =
    record.entryTime && record.exitTime
      ? Math.floor((new Date(record.exitTime).getTime() - new Date(record.entryTime).getTime()) / 60000)
      : null;

  let status: "present" | "left" | "inside" = "inside";
  if (record.exitTime) status = "left";
  else if (record.entryTime) status = "inside";

  return {
    id: record.id,
    userId: record.userId,
    date: record.date,
    entryTime: record.entryTime ? record.entryTime.toISOString() : null,
    exitTime: record.exitTime ? record.exitTime.toISOString() : null,
    scanCount: record.scanCount,
    durationMinutes,
    status,
    ...(user ? { user: formatUser(user) } : {}),
  };
}

function extractUniqueId(body: any): string | null {
  if (!body) return null;

  // Direct shape: { uniqueId: "..." }
  if (typeof body.uniqueId === "string" && body.uniqueId.trim()) {
    return body.uniqueId.trim();
  }
  // Some clients send { qrText } or { code } or { id }
  for (const key of ["qrText", "code", "id", "data", "value", "text"]) {
    const v = body[key];
    if (typeof v === "string" && v.trim()) {
      return tryExtractFromString(v.trim());
    }
  }
  // Body is itself a raw string (sometimes happens with text/plain)
  if (typeof body === "string") {
    return tryExtractFromString(body.trim());
  }
  return null;
}

function tryExtractFromString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // If it looks like JSON, try to parse and pick uniqueId
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === "object" && typeof (obj as any).uniqueId === "string") {
        return (obj as any).uniqueId.trim();
      }
    } catch {
      /* fall through */
    }
  }
  // If it looks like a URL, try to extract a uniqueId path/query param
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const q = u.searchParams.get("uniqueId") || u.searchParams.get("uid");
      if (q) return q.trim();
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) return decodeURIComponent(last).trim();
    } catch {
      /* fall through */
    }
  }
  return trimmed;
}

router.post("/scan", async (req, res) => {
  const uniqueId = extractUniqueId(req.body);
  if (!uniqueId) {
    res.status(400).json({ error: "Invalid QR code — missing identifier" });
    return;
  }
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.uniqueId, uniqueId))
      .limit(1);
    if (!users[0]) {
      res.status(404).json({ error: "Invalid QR code — user not found" });
      return;
    }
    const user = users[0];
    const today = getTodayDate();
    const existingRecords = await db
      .select()
      .from(attendanceTable)
      .where(and(eq(attendanceTable.userId, user.id), eq(attendanceTable.date, today)))
      .limit(1);

    const now = new Date();

    if (!existingRecords[0]) {
      const inserted = await db
        .insert(attendanceTable)
        .values({ userId: user.id, date: today, entryTime: now, scanCount: 1, lastScanAt: now })
        .returning();
      res.json({
        action: "entry",
        message: `Welcome ${user.name}! Entry recorded.`,
        user: formatUser(user),
        attendance: formatRecord(inserted[0], user),
      });
      return;
    }

    const record = existingRecords[0];

    if (record.lastScanAt && now.getTime() - new Date(record.lastScanAt).getTime() < DUPLICATE_SCAN_COOLDOWN_MS) {
      res.status(400).json({ error: "Duplicate scan — please wait 30 seconds" });
      return;
    }

    if (record.scanCount >= 2) {
      res.status(400).json({ error: "Maximum scans for today reached" });
      return;
    }

    const updated = await db
      .update(attendanceTable)
      .set({ exitTime: now, scanCount: record.scanCount + 1, lastScanAt: now })
      .where(eq(attendanceTable.id, record.id))
      .returning();

    res.json({
      action: "exit",
      message: `Goodbye ${user.name}! Exit recorded.`,
      user: formatUser(user),
      attendance: formatRecord(updated[0], user),
    });
  } catch (err) {
    req.log.error({ err }, "Scan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/recent", async (req, res) => {
  const limitRaw = req.query.limit as string | undefined;
  const limit = limitRaw && /^\d+$/.test(limitRaw) ? Math.min(Number(limitRaw), 100) : 30;
  try {
    const records = await db
      .select({ record: attendanceTable, user: usersTable })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
      .orderBy(sql`COALESCE(${attendanceTable.lastScanAt}, ${attendanceTable.entryTime}) DESC`)
      .limit(limit);
    res.json(records.map((r) => formatRecord(r.record, r.user)));
  } catch (err) {
    req.log.error({ err }, "Recent scans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/today", authMiddleware, async (req, res) => {
  const today = getTodayDate();
  try {
    const records = await db
      .select({ record: attendanceTable, user: usersTable })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
      .where(eq(attendanceTable.date, today))
      .orderBy(sql`${attendanceTable.entryTime} DESC`);
    res.json(records.map((r) => formatRecord(r.record, r.user)));
  } catch (err) {
    req.log.error({ err }, "Today attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/currently-inside", authMiddleware, async (req, res) => {
  const today = getTodayDate();
  try {
    const records = await db
      .select({ record: attendanceTable, user: usersTable })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
      .where(and(eq(attendanceTable.date, today), sql`${attendanceTable.exitTime} IS NULL`, sql`${attendanceTable.entryTime} IS NOT NULL`));
    res.json(records.map((r) => formatRecord(r.record, r.user)));
  } catch (err) {
    req.log.error({ err }, "Currently inside error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/dashboard-stats", authMiddleware, async (req, res) => {
  const today = getTodayDate();
  try {
    const [totalUsersResult, studentsResult, staffResult, todayResult, insideResult, recentResult] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(usersTable),
      db.select({ count: sql<number>`COUNT(*)` }).from(usersTable).where(eq(usersTable.role, "student")),
      db.select({ count: sql<number>`COUNT(*)` }).from(usersTable).where(eq(usersTable.role, "staff")),
      db.select({ count: sql<number>`COUNT(*)` }).from(attendanceTable).where(eq(attendanceTable.date, today)),
      db.select({ count: sql<number>`COUNT(*)` }).from(attendanceTable).where(and(eq(attendanceTable.date, today), sql`${attendanceTable.exitTime} IS NULL`, sql`${attendanceTable.entryTime} IS NOT NULL`)),
      db.select({ record: attendanceTable, user: usersTable })
        .from(attendanceTable)
        .innerJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
        .where(eq(attendanceTable.date, today))
        .orderBy(sql`${attendanceTable.entryTime} DESC`)
        .limit(10),
    ]);
    res.json({
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      totalStudents: Number(studentsResult[0]?.count ?? 0),
      totalStaff: Number(staffResult[0]?.count ?? 0),
      todayAttendanceCount: Number(todayResult[0]?.count ?? 0),
      currentlyInsideCount: Number(insideResult[0]?.count ?? 0),
      recentActivity: recentResult.map((r) => formatRecord(r.record, r.user)),
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/user/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { from, to, month } = req.query as Record<string, string>;
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!users[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = users[0];
    let conditions = [eq(attendanceTable.userId, userId)];
    if (from) conditions.push(gte(attendanceTable.date, from));
    if (to) conditions.push(lte(attendanceTable.date, to));
    if (month) {
      const [year, mon] = month.split("-");
      const start = `${year}-${mon}-01`;
      const endDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      const end = `${year}-${mon}-${String(endDay).padStart(2, "0")}`;
      conditions.push(gte(attendanceTable.date, start));
      conditions.push(lte(attendanceTable.date, end));
    }
    const records = await db
      .select()
      .from(attendanceTable)
      .where(and(...conditions))
      .orderBy(sql`${attendanceTable.date} DESC`);

    const lateHour = 9;
    let totalDuration = 0;
    let durationCount = 0;
    let lateCount = 0;
    for (const r of records) {
      if (r.entryTime && r.exitTime) {
        const dur = new Date(r.exitTime).getTime() - new Date(r.entryTime).getTime();
        totalDuration += dur;
        durationCount++;
      }
      if (r.entryTime && new Date(r.entryTime).getHours() >= lateHour) {
        lateCount++;
      }
    }
    const summary = {
      totalDaysPresent: records.length,
      averageMinutesSpent: durationCount > 0 ? Math.floor(totalDuration / durationCount / 60000) : 0,
      lateEntriesCount: lateCount,
      totalDaysChecked: records.length,
    };
    res.json({
      user: formatUser(user),
      records: records.map((r) => formatRecord(r, user)),
      summary,
    });
  } catch (err) {
    req.log.error({ err }, "User attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance", authMiddleware, async (req, res) => {
  const { from, to, role, month } = req.query as Record<string, string>;
  try {
    let query = db
      .select({ record: attendanceTable, user: usersTable })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(attendanceTable.userId, usersTable.id));

    let dateConditions = [];
    if (from) dateConditions.push(gte(attendanceTable.date, from));
    if (to) dateConditions.push(lte(attendanceTable.date, to));
    if (month) {
      const [year, mon] = month.split("-");
      const start = `${year}-${mon}-01`;
      const endDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      const end = `${year}-${mon}-${String(endDay).padStart(2, "0")}`;
      dateConditions.push(gte(attendanceTable.date, start));
      dateConditions.push(lte(attendanceTable.date, end));
    }

    let results;
    if (dateConditions.length > 0) {
      results = await query.where(and(...dateConditions)).orderBy(sql`${attendanceTable.date} DESC, ${attendanceTable.entryTime} DESC`);
    } else {
      results = await query.orderBy(sql`${attendanceTable.date} DESC, ${attendanceTable.entryTime} DESC`);
    }

    let filtered = results;
    if (role) {
      filtered = results.filter((r) => r.user.role === role);
    }
    res.json(filtered.map((r) => formatRecord(r.record, r.user)));
  } catch (err) {
    req.log.error({ err }, "List attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
