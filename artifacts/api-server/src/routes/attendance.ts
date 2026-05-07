import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { ScanQrBody } from "@workspace/api-zod";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";

const router = Router();

const HOSTEL_DAY_START_HOUR_IST = 6;

function getHostelDate(baseDate = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(baseDate);

  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");

  const hostelDay = new Date(Date.UTC(year, month - 1, day));
  if (hour < HOSTEL_DAY_START_HOUR_IST) {
    hostelDay.setUTCDate(hostelDay.getUTCDate() - 1);
  }

  return hostelDay.toISOString().slice(0, 10);
}

async function getCurrentStatus(userId: number): Promise<"inside" | "left"> {
  const today = getHostelDate();
  const { data: records } = await supabase
    .from("qr_attendance")
    .select("entry_time, exit_time")
    .eq("user_id", userId)
    .eq("date", today)
    .order("last_scan_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (!records?.[0]) {
    return "inside";
  }

  return getRecordStatus(records[0]);
}

function getRecordStatus(record: any): "inside" | "left" {
  if (!record?.exit_time) return "inside";
  if (!record.entry_time) return "left";

  const entryTime = new Date(record.entry_time).getTime();
  const exitTime = new Date(record.exit_time).getTime();
  return entryTime >= exitTime ? "inside" : "left";
}

function getLatestRecordsByUser(records: any[] = []): Map<number, any> {
  const latestByUserId = new Map<number, any>();
  for (const record of records) {
    if (!latestByUserId.has(record.user_id)) {
      latestByUserId.set(record.user_id, record);
    }
  }
  return latestByUserId;
}

function formatRecord(record: any, user?: any) {
  const durationMinutes =
    record.entry_time && record.exit_time
      ? Math.floor(Math.abs(new Date(record.entry_time).getTime() - new Date(record.exit_time).getTime()) / 60000)
      : null;

  const status = getRecordStatus(record);

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

router.post("/scan/batch", async (req: any, res: any) => {
  const scans = req.body?.scans;
  if (!Array.isArray(scans) || scans.length === 0) {
    res.status(400).json({ error: "scans must be a non-empty array" });
    return;
  }
  if (scans.length > 500) {
    res.status(400).json({ error: "batch too large (max 500)" });
    return;
  }

  const results: any[] = [];
  const batchStatusCache = new Map<number, { status: "inside" | "left"; recordId?: number; scanCount: number }>();

  for (const item of scans) {
    const clientScanId = String(item?.clientScanId ?? "");
    const uniqueId = extractUniqueId(item) ?? (typeof item?.uniqueId === "string" ? item.uniqueId.trim() : null);
    const scannedAtRaw = item?.scannedAt;
    const scannedAt = (() => {
      const d = scannedAtRaw ? new Date(scannedAtRaw) : new Date();
      return isNaN(d.getTime()) ? new Date() : d;
    })();

    if (!uniqueId) {
      results.push({ clientScanId, status: "invalid", error: "Missing uniqueId" });
      continue;
    }

    try {
      const { data: users, error: userError } = await supabase
        .from("qr_users")
        .select("*")
        .eq("unique_id", uniqueId)
        .limit(1);

      if (userError || !users?.[0]) {
        results.push({ clientScanId, status: "user_not_found", error: "Invalid QR code — user not found" });
        continue;
      }
      const user = users[0];
      const date = getHostelDate(scannedAt);
      const ts = scannedAt.toISOString();

      let current: { status: "inside" | "left"; recordId?: number; scanCount: number };
      if (batchStatusCache.has(user.id)) {
        current = batchStatusCache.get(user.id)!;
      } else {
        const { data: existingRecords } = await supabase
          .from("qr_attendance")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", date)
          .order("last_scan_at", { ascending: false, nullsFirst: false })
          .limit(1);
        const existing = existingRecords?.[0];
        current = {
          status: existing ? getRecordStatus(existing) : "inside",
          recordId: existing?.id,
          scanCount: existing?.scan_count ?? 0,
        };
      }

      if (current.status === "inside") {
        const { data: inserted, error: insertError } = await supabase
          .from("qr_attendance")
          .insert({ user_id: user.id, date, exit_time: ts, entry_time: null, scan_count: 1, last_scan_at: ts })
          .select()
          .single();
        if (insertError) throw insertError;
        const recordId = inserted.id;
        batchStatusCache.set(user.id, { status: "left", recordId, scanCount: 1 });
        results.push({
          clientScanId,
          status: "ok",
          action: "exit",
          user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
          recordId,
        });
      } else {
        if (!current.recordId) throw new Error("Missing attendance record for return scan");
        const nextScanCount = current.scanCount + 1;
        const { error: updateError } = await supabase
          .from("qr_attendance")
          .update({ entry_time: ts, scan_count: nextScanCount, last_scan_at: ts })
          .eq("id", current.recordId);
        if (updateError) throw updateError;
        batchStatusCache.set(user.id, { status: "inside", recordId: current.recordId, scanCount: nextScanCount });
        results.push({
          clientScanId,
          status: "ok",
          action: "entry",
          user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
        });
      }
    } catch (err: any) {
      results.push({ clientScanId, status: "error", error: "Server error processing scan" });
    }
  }

  res.json({ results });
});

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
    const date = getHostelDate();
    const now = new Date().toISOString();

    const { data: existingRecords } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("last_scan_at", { ascending: false, nullsFirst: false })
      .limit(1);

    const record = existingRecords?.[0];
    const currentStatus = record ? getRecordStatus(record) : "inside";

    if (currentStatus === "inside") {
      req.log.info({ userId: user.id, name: user.name }, "Student leaving hostel");
      const { data: inserted, error: insertError } = await supabase
        .from("qr_attendance")
        .insert({ user_id: user.id, date, exit_time: now, entry_time: null, scan_count: 1, last_scan_at: now })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.json({
        success: true,
        action: "exit",
        message: `${user.name} has LEFT the Hostel.`,
        user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
        recordId: inserted.id,
      });
    }

    req.log.info({ userId: user.id, name: user.name }, "Student returned to hostel");
    const nextScanCount = (record.scan_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("qr_attendance")
      .update({ entry_time: now, scan_count: nextScanCount, last_scan_at: now })
      .eq("id", record.id);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      action: "entry",
      message: `${user.name} is now INSIDE the Hostel.`,
      user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
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
  const today = getHostelDate();
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
  try {
    const today = getHostelDate();

    // Get all users and today's outing records in parallel
    let allUsers: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase.from("qr_users").select("*").range(from, from + 999);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allUsers = allUsers.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }

    const { data: todayRecords, error: outError } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("date", today)
      .order("last_scan_at", { ascending: false, nullsFirst: false });
    if (outError) throw outError;

    const recordsByUserId = getLatestRecordsByUser(todayRecords ?? []);
    const outUserIds = new Set(
      Array.from(recordsByUserId.values()).filter((r: any) => getRecordStatus(r) === "left").map((r: any) => r.user_id)
    );

    const insideRecords = allUsers
      .filter(u => !outUserIds.has(u.id))
      .map(u => {
        const record = recordsByUserId.get(u.id);
        if (record) return formatRecord(record, u);
        return {
          id: -u.id,
          userId: u.id,
          date: today,
          entryTime: null,
          exitTime: null,
          scanCount: 0,
          durationMinutes: null,
          status: "inside",
          user: { id: u.id, name: u.name, uniqueId: u.unique_id, role: u.role, createdAt: u.created_at }
        };
      });

    req.log.info({ insideCount: insideRecords.length }, "Calculated currently-inside");
    res.json(insideRecords);
  } catch (err: any) {
    req.log.error({ err }, "Currently inside error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/dashboard-stats", authMiddleware, async (req: any, res: any) => {
  const today = getHostelDate();
  try {
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalStaff },
      { data: todayRecords },
      { data: recentResult }
    ] = await Promise.all([
      supabase.from("qr_users").select("*", { count: "exact", head: true }),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("qr_attendance").select("user_id, entry_time, exit_time, last_scan_at").eq("date", today).order("last_scan_at", { ascending: false, nullsFirst: false }),
      supabase.from("qr_attendance").select("*, qr_users(*)").eq("date", today).order("last_scan_at", { ascending: false, nullsFirst: false }).limit(10),
    ]);

    const latestRecordsByUserId = getLatestRecordsByUser(todayRecords ?? []);
    const leftUserIds = new Set(Array.from(latestRecordsByUserId.values()).filter((r: any) => getRecordStatus(r) === "left").map((r: any) => r.user_id));
    const currentlyInsideCount = (totalUsers || 0) - leftUserIds.size;

    res.json({
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalStaff: totalStaff || 0,
      todayAttendanceCount: todayRecords?.length || 0,
      currentlyInsideCount,
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

    const lateHour = 21; // Assuming 9 PM is late for returning to the hostel
    let totalDuration = 0;
    let durationCount = 0;
    let lateCount = 0;
    for (const r of records) {
      if (r.entry_time && r.exit_time) {
        const dur = Math.abs(new Date(r.entry_time).getTime() - new Date(r.exit_time).getTime());
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
