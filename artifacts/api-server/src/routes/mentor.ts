import { Router } from "express";
import { db, usersTable, attendanceTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authMiddleware, mentorOnly, AuthRequest } from "../middlewares/auth.js";

const router = Router();

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

router.get("/mentor/students", authMiddleware, mentorOnly, async (req: AuthRequest, res) => {
  const mentorId = req.mentorId!;
  const today = getTodayDate();
  try {
    const students = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.mentorId, mentorId))
      .orderBy(usersTable.name);

    if (students.length === 0) {
      res.json([]);
      return;
    }

    const studentIds = students.map((s) => s.id);
    const records = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.date, today),
          sql`${attendanceTable.userId} IN (${sql.join(studentIds.map((id) => sql`${id}`), sql`, `)})`
        )
      );

    const recordsByUser = new Map<number, typeof records[number]>();
    for (const r of records) recordsByUser.set(r.userId, r);

    const result = students.map((s) => {
      const rec = recordsByUser.get(s.id);
      return {
        user: formatUser(s),
        attendanceToday: rec ? formatRecord(rec, s) : null,
        cameToday: !!(rec && rec.entryTime),
      };
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Mentor students error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mentor/attendance/:userId", authMiddleware, mentorOnly, async (req: AuthRequest, res) => {
  const mentorId = req.mentorId!;
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { from, to, month } = req.query as Record<string, string>;
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    if (user.mentorId !== mentorId) {
      res.status(403).json({ error: "This student is not assigned to you" });
      return;
    }

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
    req.log.error({ err }, "Mentor user attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
