import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { ScanQrBody } from "@workspace/api-zod";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";

const router = Router();

const DUPLICATE_SCAN_COOLDOWN_MS = 30 * 60 * 1000;

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
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
    ...(user ? {
      user: {
        id: user.id,
        name: user.name,
        uniqueId: user.unique_id,
        role: user.role,
        createdAt: user.created_at,
      }
    } : {}),
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

router.post("/scan", async (req: any, res: any) => {
  const uniqueId = extractUniqueId(req.body);
  if (!uniqueId) {
    res.status(400).json({ error: "Invalid QR code — missing identifier" });
    return;
  }
  try {
    const { data: users, error: userError } = await supabase
      .from("qr_users")
      .select("*")
      .eq("unique_id", uniqueId)
      .limit(1);

    if (userError || !users?.[0]) {
      res.status(404).json({ error: "Invalid QR code — user not found" });
      return;
    }
    const user = users[0];
    const today = getTodayDate();
    
    const { data: existingRecords, error: recordError } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .limit(1);

    const now = new Date().toISOString();

    if (!existingRecords?.[0]) {
      const { data: inserted, error: insertError } = await supabase
        .from("qr_attendance")
        .insert({ user_id: user.id, date: today, entry_time: now, scan_count: 1, last_scan_at: now })
        .select()
        .single();

      if (insertError) throw insertError;

      res.json({
        action: "entry",
        message: `Welcome ${user.name}! Entry recorded.`,
        user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role, createdAt: user.created_at },
        attendance: formatRecord(inserted, user),
      });
      return;
    }

    const record = existingRecords[0];

    if (record.last_scan_at && new Date().getTime() - new Date(record.last_scan_at).getTime() < DUPLICATE_SCAN_COOLDOWN_MS) {
      res.status(400).json({ error: "Duplicate scan — please wait 30 minutes" });
      return;
    }

    if (record.scan_count >= 2) {
      res.status(400).json({ error: "Maximum scans for today reached" });
      return;
    }

    const { data: updated, error: updateError } = await supabase
      .from("qr_attendance")
      .update({ exit_time: now, scan_count: record.scan_count + 1, last_scan_at: now })
      .eq("id", record.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      action: "exit",
      message: `Goodbye ${user.name}! Exit recorded.`,
      user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role, createdAt: user.created_at },
      attendance: formatRecord(updated, user),
    });
  } catch (err: any) {
    req.log.error({ err }, "Scan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/recent", async (req: any, res: any) => {
  const limitRaw = req.query.limit as string | undefined;
  const limit = limitRaw && /^\d+$/.test(limitRaw) ? Math.min(Number(limitRaw), 100) : 30;
  try {
    const { data: records, error } = await supabase
      .from("qr_attendance")
      .select("*, qr_users(*)")
      .order("last_scan_at", { ascending: false, nullsFirst: false })
      .order("entry_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json(records.map((r: any) => formatRecord(r, r.qr_users)));
  } catch (err: any) {
    req.log.error({ err }, "Recent scans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/today", authMiddleware, async (req: any, res: any) => {
  const today = getTodayDate();
  try {
    const { data: records, error } = await supabase
      .from("qr_attendance")
      .select("*, qr_users(*)")
      .eq("date", today)
      .order("entry_time", { ascending: false });

    if (error) throw error;
    res.json(records.map((r: any) => formatRecord(r, r.qr_users)));
  } catch (err: any) {
    req.log.error({ err }, "Today attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/currently-inside", authMiddleware, async (req: any, res: any) => {
  const today = getTodayDate();
  try {
    const { data: records, error } = await supabase
      .from("qr_attendance")
      .select("*, qr_users(*)")
      .eq("date", today)
      .is("exit_time", null)
      .not("entry_time", "is", null);

    if (error) throw error;
    res.json(records.map((r: any) => formatRecord(r, r.qr_users)));
  } catch (err: any) {
    req.log.error({ err }, "Currently inside error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/dashboard-stats", authMiddleware, async (req: any, res: any) => {
  const today = getTodayDate();
  try {
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalStaff },
      { count: todayAttendanceCount },
      { count: currentlyInsideCount },
      { data: recentResult }
    ] = await Promise.all([
      supabase.from("qr_users").select("*", { count: "exact", head: true }),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("qr_attendance").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("qr_attendance").select("*", { count: "exact", head: true }).eq("date", today).is("exit_time", null).not("entry_time", "is", null),
      supabase.from("qr_attendance").select("*, qr_users(*)").eq("date", today).order("entry_time", { ascending: false }).limit(10),
    ]);

    res.json({
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalStaff: totalStaff || 0,
      todayAttendanceCount: todayAttendanceCount || 0,
      currentlyInsideCount: currentlyInsideCount || 0,
      recentActivity: recentResult ? recentResult.map((r: any) => formatRecord(r, r.qr_users)) : [],
    });
  } catch (err: any) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/user/:userId", authMiddleware, async (req: any, res: any) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const { from, to, month } = req.query as Record<string, string>;
  try {
    const { data: user, error: userError } = await supabase
      .from("qr_users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: "User not found" });
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
    const summary = {
      totalDaysPresent: records.length,
      averageMinutesSpent: durationCount > 0 ? Math.floor(totalDuration / durationCount / 60000) : 0,
      lateEntriesCount: lateCount,
      totalDaysChecked: records.length,
    };
    res.json({
      user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role, createdAt: user.created_at },
      records: records.map((r: any) => formatRecord(r, user)),
      summary,
    });
  } catch (err: any) {
    req.log.error({ err }, "User attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/attendance/bulk-delete", authMiddleware, adminOnly, async (req: any, res: any) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids must be a non-empty array" });
    return;
  }
  const numericIds = ids
    .map((v: any) => (typeof v === "number" ? v : parseInt(String(v), 10)))
    .filter((n: number) => Number.isFinite(n));
  if (numericIds.length === 0) {
    res.status(400).json({ error: "ids must contain valid numbers" });
    return;
  }
  try {
    const { error, count } = await supabase
      .from("qr_attendance")
      .delete({ count: "exact" })
      .in("id", numericIds);
    if (error) throw error;
    res.json({ deletedCount: count ?? 0 });
  } catch (err: any) {
    req.log.error({ err }, "Bulk delete attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/attendance/all", authMiddleware, adminOnly, async (req: any, res: any) => {
  const { from, to } = req.query as Record<string, string>;
  try {
    let query = supabase.from("qr_attendance").delete({ count: "exact" }).gte("id", 0);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    const { error, count } = await query;
    if (error) throw error;
    res.json({ deletedCount: count ?? 0 });
  } catch (err: any) {
    req.log.error({ err }, "Delete all attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance", authMiddleware, async (req: any, res: any) => {
  const { from, to, role, month } = req.query as Record<string, string>;
  try {
    let query = supabase.from("qr_attendance").select("*, qr_users(*)");

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (month) {
      const [year, mon] = month.split("-");
      const start = `${year}-${mon}-01`;
      const endDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      const end = `${year}-${mon}-${String(endDay).padStart(2, "0")}`;
      query = query.gte("date", start).lte("date", end);
    }

    if (role) {
      query = query.eq("qr_users.role", role);
    }

    const { data: results, error } = await query.order("date", { ascending: false }).order("entry_time", { ascending: false });
    if (error) throw error;

    // Filter out records where join failed if role was provided
    let filtered = results;
    if (role) {
      filtered = results.filter((r: any) => r.qr_users !== null);
    }

    res.json(filtered.map((r: any) => formatRecord(r, r.qr_users)));
  } catch (err: any) {
    req.log.error({ err }, "List attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
