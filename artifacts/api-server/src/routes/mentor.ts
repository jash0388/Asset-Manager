import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";

const router = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function formatUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    uniqueId: u.unique_id,
    role: u.role,
    mentorId: u.mentor_id ?? null,
    createdAt: u.created_at,
  };
}

function formatRecord(record: any, user?: any) {
  const durationMinutes =
    record.entry_time && record.exit_time
      ? Math.floor((new Date(record.exit_time).getTime() - new Date(record.entry_time).getTime()) / 60000)
      : null;
  let status: "present" | "left" | "inside" = "inside";
  if (record.exit_time) status = "left";
  else if (record.entry_time) status = "inside";
  return {
    id: record.id,
    userId: record.user_id,
    date: record.date,
    entryTime: record.entry_time,
    exitTime: record.exit_time,
    scanCount: record.scan_count,
    durationMinutes,
    status,
    ...(user ? { user: formatUser(user) } : {}),
  };
}

router.get("/mentor/students", authMiddleware, mentorOnly, async (req: any, res) => {
  const mentorId = req.mentorId!;
  const today = getTodayDate();
  try {
    const { data: students, error: studentError } = await supabase
      .from("qr_users")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("name");

    if (studentError) throw studentError;

    if (!students || students.length === 0) {
      res.json([]);
      return;
    }

    const studentIds = students.map((s) => s.id);
    const { data: records, error: recordError } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("date", today)
      .in("user_id", studentIds);

    if (recordError) throw recordError;

    const recordsByUser = new Map<number, any>();
    if (records) {
      for (const r of records) recordsByUser.set(r.user_id, r);
    }

    const result = students.map((s) => {
      const rec = recordsByUser.get(s.id);
      return {
        user: formatUser(s),
        attendanceToday: rec ? formatRecord(rec, s) : null,
        cameToday: !!(rec && rec.entry_time),
      };
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Mentor students error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mentor/attendance/:userId", authMiddleware, mentorOnly, async (req: any, res) => {
  const mentorId = req.mentorId!;
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { from, to, month } = req.query as Record<string, string>;
  try {
    const { data: users, error: userError } = await supabase
      .from("qr_users")
      .select("*")
      .eq("id", userId)
      .limit(1);

    if (userError) throw userError;
    const user = users?.[0];
    if (!user) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    if (user.mentor_id !== mentorId) {
      res.status(403).json({ error: "This student is not assigned to you" });
      return;
    }

    let query = supabase.from("qr_attendance").select("*").eq("user_id", userId);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (month) {
      const [year, mon] = month.split("-");
      const start = `${year}-${mon}-01`;
      const endDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      const end = `${year}-${mon}-${String(endDay).padStart(2, "0")}`;
      query = query.gte("date", start).lte("date", end);
    }

    const { data: records, error: recordError } = await query.order("date", { ascending: false });
    if (recordError) throw recordError;

    const lateHour = 9;
    let totalDuration = 0;
    let durationCount = 0;
    let lateCount = 0;
    if (records) {
      for (const r of records) {
        if (r.entry_time && r.exit_time) {
          const dur = new Date(r.exit_time).getTime() - new Date(r.entry_time).getTime();
          totalDuration += dur;
          durationCount++;
        }
        if (r.entry_time && new Date(r.entry_time).getHours() >= lateHour) {
          lateCount++;
        }
      }
    }
    const summary = {
      totalDaysPresent: records?.length || 0,
      averageMinutesSpent: durationCount > 0 ? Math.floor(totalDuration / durationCount / 60000) : 0,
      lateEntriesCount: lateCount,
      totalDaysChecked: records?.length || 0,
    };
    res.json({
      user: formatUser(user),
      records: records ? records.map((r) => formatRecord(r, user)) : [],
      summary,
    });
  } catch (err) {
    req.log.error({ err }, "Mentor user attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
