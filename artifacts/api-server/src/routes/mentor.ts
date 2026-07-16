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

function isSentinel(ts: string | null | undefined): boolean {
  if (!ts) return true;
  return ts.startsWith("9999") || ts.startsWith("1970");
}

function formatRecord(record: any, user?: any) {
  const hasEntry = record.entry_time && !isSentinel(record.entry_time);
  const hasExit = record.exit_time && !isSentinel(record.exit_time);
  const durationMinutes =
    hasEntry && hasExit
      ? Math.floor(Math.abs(new Date(record.exit_time).getTime() - new Date(record.entry_time).getTime()) / 60000)
      : null;
  
  let status: "present" | "left" | "inside" = "inside";
  if (hasExit && !hasEntry) {
    status = "left";
  } else if (hasEntry) {
    // If has entry but no exit, student is inside
    status = hasExit ? "left" : "inside";
  }

  return {
    id: record.id,
    userId: record.user_id,
    date: record.date,
    entryTime: hasEntry ? record.entry_time : null,
    exitTime: hasExit ? record.exit_time : null,
    scanCount: record.scan_count,
    durationMinutes,
    status,
    ...(user ? { user: formatUser(user) } : {}),
  };
}

router.get("/mentor/students", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const today = getTodayDate();
  const section = req.query.section as string | undefined;
  try {
    let query = supabase.from("qr_users").select("*");
    if (mentorId === -3 && section) {
      query = query.eq("section", section);
    } else {
      query = query.eq("mentor_id", mentorId);
    }
    const { data: students, error: studentError } = await query.order("name");

    if (studentError) throw studentError;

    if (!students || students.length === 0) {
      res.json([]);
      return;
    }

    const studentIds = students.map((s: any) => s.id);
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

    const result = students.map((s: any) => {
      const rec = recordsByUser.get(s.id);
      return {
        user: formatUser(s),
        attendanceToday: rec ? formatRecord(rec, s) : null,
        cameToday: !!(rec && rec.entry_time),
      };
    });
    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "Mentor students error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mentor/attendance/:userId", authMiddleware, mentorOnly, async (req: any, res: any) => {
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
    if (mentorId !== -3 && user.mentor_id !== mentorId) {
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
        const hasEntry = r.entry_time && !isSentinel(r.entry_time);
        const hasExit = r.exit_time && !isSentinel(r.exit_time);
        if (hasEntry && hasExit) {
          const dur = new Date(r.exit_time).getTime() - new Date(r.entry_time).getTime();
          totalDuration += dur;
          durationCount++;
        }
        if (hasEntry && new Date(r.entry_time).getHours() >= lateHour) {
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
      records: records ? records.map((r: any) => formatRecord(r, user)) : [],
      summary,
    });
  } catch (err: any) {
    req.log.error({ err }, "Mentor user attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
