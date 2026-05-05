import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { ScanQrBody } from "@workspace/api-zod";
import { authMiddleware, adminOnly } from "../middlewares/auth.js";

const router = Router();

const DUPLICATE_SCAN_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes to prevent accidental double clicks

async function getCurrentStatus(userId: number): Promise<"inside" | "left"> {
  const { data: latestRecords } = await supabase
    .from("qr_attendance")
    .select("entry_time, exit_time")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("last_scan_at", { ascending: false })
    .limit(1);

  if (!latestRecords?.[0]) {
    // No records ever -> Default to inside for hostel
    return "inside";
  }

  const latest = latestRecords[0];
  const entryTime = latest.entry_time ? new Date(latest.entry_time).getTime() : 0;
  const exitTime = latest.exit_time ? new Date(latest.exit_time).getTime() : 0;

  // If entry exists after exit, we are currently inside
  // Default to inside if times are ambiguous
  return entryTime >= exitTime ? "inside" : "left";
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function formatRecord(record: any, user?: any) {
  const durationMinutes =
    record.entry_time && record.exit_time
      ? Math.floor(Math.abs(new Date(record.entry_time).getTime() - new Date(record.exit_time).getTime()) / 60000)
      : null;

  let status: "inside" | "left" = "inside";
  if (record.exit_time && !record.entry_time) {
    status = "left";
  } else if (record.exit_time && record.entry_time) {
    status = new Date(record.entry_time).getTime() > new Date(record.exit_time).getTime() ? "inside" : "left";
  } else if (!record.exit_time && record.entry_time) {
    status = "inside";
  }

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
  const batchStatusCache = new Map<number, "inside" | "left">();

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
      const date = scannedAt.toISOString().split("T")[0];
      const ts = scannedAt.toISOString();

      // Use cached status if we already processed this user in this batch
      let currentStatus: "inside" | "left";
      if (batchStatusCache.has(user.id)) {
        currentStatus = batchStatusCache.get(user.id)!;
      } else {
        currentStatus = await getCurrentStatus(user.id);
      }

      const { data: existingRecords } = await supabase
        .from("qr_attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .limit(1);

      if (!existingRecords?.[0]) {
        const insertData: any = { user_id: user.id, date, scan_count: 1, last_scan_at: ts };
        let action = "";
        
        if (currentStatus === "inside") {
          insertData.exit_time = ts;
          action = "exit";
          batchStatusCache.set(user.id, "left");
        } else {
          insertData.entry_time = ts;
          action = "entry";
          batchStatusCache.set(user.id, "inside");
        }

        const { data: inserted, error: insertError } = await supabase
          .from("qr_attendance")
          .insert(insertData)
          .select()
          .single();
        if (insertError) throw insertError;
        results.push({
          clientScanId,
          status: "ok",
          action,
          user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
          recordId: inserted.id,
        });
        continue;
      }

      const record = existingRecords[0];
      
      let updateData: any = { scan_count: record.scan_count + 1, last_scan_at: ts };
      let action = "";

      if (currentStatus === "inside") {
        updateData.exit_time = ts;
        action = "exit";
        batchStatusCache.set(user.id, "left");
      } else {
        updateData.entry_time = ts;
        action = "entry";
        batchStatusCache.set(user.id, "inside");
      }

      const { data: updated, error: updateError } = await supabase
        .from("qr_attendance")
        .update(updateData)
        .eq("id", record.id)
        .select()
        .single();
      if (updateError) throw updateError;
      results.push({
        clientScanId,
        status: "ok",
        action,
        user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
        recordId: updated.id,
      });
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
    const date = getTodayDate();
    const now = new Date().toISOString();
    
    const currentStatus = await getCurrentStatus(user.id);
    req.log.info({ userId: user.id, name: user.name, currentStatus }, "Determined current status for scan");

    const { data: existingRecords } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .limit(1);

    if (!existingRecords?.[0]) {
      const insertData: any = { user_id: user.id, date, scan_count: 1, last_scan_at: now };
      let action = "";
      let message = "";

      if (currentStatus === "inside") {
        insertData.exit_time = now;
        action = "exit";
        message = `Goodbye ${user.name}! You have LEFT (Outside).`;
      } else {
        insertData.entry_time = now;
        action = "entry";
        message = `Welcome back ${user.name}! You are now INSIDE.`;
      }

      req.log.info({ userId: user.id, action }, "Recording first scan of the day");
      const { data: inserted, error: insertError } = await supabase
        .from("qr_attendance")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      return res.json({
        success: true,
        action,
        message,
        user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
        recordId: inserted.id,
      });
    }

    const record = existingRecords[0];
    const lastAt = record.last_scan_at ? new Date(record.last_scan_at).getTime() : 0;
    
    const nowTime = new Date(now).getTime();
    if (nowTime - lastAt < DUPLICATE_SCAN_COOLDOWN_MS) {
      const remainingMins = Math.ceil((DUPLICATE_SCAN_COOLDOWN_MS - (nowTime - lastAt)) / 60000);
      return res.json({
        success: false,
        action: "ignored",
        message: `Cooldown: ${user.name} already scanned. Wait ${remainingMins}m.`,
        user: { id: user.id, name: user.name, uniqueId: user.unique_id, role: user.role },
      });
    }

    let updateData: any = { scan_count: record.scan_count + 1, last_scan_at: now };
    let action = "";
    let message = "";

    if (currentStatus === "inside") {
      updateData.exit_time = now;
      action = "exit";
      message = `Goodbye ${user.name}! You have LEFT (Outside).`;
    } else {
      updateData.entry_time = now;
      action = "entry";
      message = `Welcome back ${user.name}! You are now INSIDE.`;
    }

    req.log.info({ userId: user.id, action }, "Updating existing record for today");
    const { data: updated, error: updateError } = await supabase
      .from("qr_attendance")
      .update(updateData)
      .eq("id", record.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      action,
      message,
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
  try {
    // 1. Get ALL users (handle pagination)
    let allUsers: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from("qr_users").select("*").range(from, from + step - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allUsers = allUsers.concat(data);
      if (data.length < step) break;
      from += step;
    }

    req.log.info({ totalUsers: allUsers.length }, "Fetched all users for currently-inside");

    // 2. Get latest records for ALL users who have ever scanned
    // We order by date and scan time to get the absolute latest status
    const { data: latestRecords, error: recordError } = await supabase
      .from("qr_attendance")
      .select("*")
      .order("date", { ascending: false })
      .order("last_scan_at", { ascending: false });
    
    if (recordError) throw recordError;

    // Group by user_id to get the single latest record for each user
    const latestByUser = new Map<number, any>();
    for (const r of latestRecords) {
      if (!latestByUser.has(r.user_id)) {
        latestByUser.set(r.user_id, r);
      }
    }

    const insideRecords = allUsers.map(u => {
      const latest = latestByUser.get(u.id);
      
      let isInside = true; // Default
      if (latest) {
        const entryTime = latest.entry_time ? new Date(latest.entry_time).getTime() : 0;
        const exitTime = latest.exit_time ? new Date(latest.exit_time).getTime() : 0;
        isInside = entryTime >= exitTime;
      }

      if (!isInside) return null;

      // Return consistent record shape
      if (latest) {
        return formatRecord(latest, u);
      } else {
        return {
          id: -u.id,
          userId: u.id,
          date: new Date().toISOString().split("T")[0],
          entryTime: null,
          exitTime: null,
          scanCount: 0,
          durationMinutes: null,
          status: "inside",
          user: { id: u.id, name: u.name, uniqueId: u.unique_id, role: u.role, createdAt: u.created_at }
        };
      }
    }).filter(Boolean);

    req.log.info({ insideCount: insideRecords.length }, "Calculated currently-inside");
    res.json(insideRecords);
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
      { data: todayRecords },
      { data: recentResult }
    ] = await Promise.all([
      supabase.from("qr_users").select("*", { count: "exact", head: true }),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("qr_users").select("*", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("qr_attendance").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("qr_attendance").select("entry_time, exit_time").eq("date", today),
      supabase.from("qr_attendance").select("*, qr_users(*)").eq("date", today).order("last_scan_at", { ascending: false, nullsFirst: false }).limit(10),
    ]);

    // Calculate currentlyInsideCount using the exact same logic as the list
    let allUsers: any[] = [];
    let from = 0;
    while (true) {
      const { data } = await supabase.from("qr_users").select("id, role").range(from, from + 999);
      if (!data || data.length === 0) break;
      allUsers = allUsers.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }

    const { data: latestRecords } = await supabase
      .from("qr_attendance")
      .select("user_id, entry_time, exit_time")
      .order("date", { ascending: false })
      .order("last_scan_at", { ascending: false });

    const latestByUser = new Map<number, any>();
    if (latestRecords) {
      for (const r of latestRecords) {
        if (!latestByUser.has(r.user_id)) {
          latestByUser.set(r.user_id, r);
        }
      }
    }

    let insideCount = 0;
    for (const u of allUsers) {
      const latest = latestByUser.get(u.id);
      if (!latest) {
        insideCount++; // Default inside
      } else {
        const entry = latest.entry_time ? new Date(latest.entry_time).getTime() : 0;
        const exit = latest.exit_time ? new Date(latest.exit_time).getTime() : 0;
        if (entry >= exit) insideCount++;
      }
    }

    res.json({
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalStaff: totalStaff || 0,
      todayAttendanceCount: todayAttendanceCount || 0,
      currentlyInsideCount: insideCount,
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
