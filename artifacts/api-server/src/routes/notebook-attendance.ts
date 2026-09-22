import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../lib/supabase.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to structured notebook attendance JSON
const dataFilePath = path.resolve(__dirname, "../data/notebook_attendance.json");

function loadNotebookData() {
  if (fs.existsSync(dataFilePath)) {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
  }
  return [];
}

/**
 * GET /api/notebook-attendance/summary
 * Returns overall date-wise summaries, section counts, and comparison with database
 */
router.get("/api/notebook-attendance/summary", async (req: Request, res: Response) => {
  try {
    const data = loadNotebookData();
    const summaries = data.map((d: any) => {
      let totalPresent = 0;
      let totalAbsent = 0;
      const sectionSummaries = d.sections.map((s: any) => {
        totalPresent += s.presentCount;
        totalAbsent += s.absentCount;
        return {
          section: s.sectionName,
          period: s.period,
          type: s.type,
          presentCount: s.presentCount,
          absentCount: s.absentCount,
          totalStudents: s.totalStudents,
          unresolvedCount: (s.notFoundTokens || []).length,
          unresolvedTokens: s.notFoundTokens || []
        };
      });

      return {
        date: d.date,
        rawDate: d.rawDate,
        dayOfWeek: d.dayOfWeek,
        totalPresent,
        totalAbsent,
        sectionsCount: d.sections.length,
        sections: sectionSummaries
      };
    });

    res.json({
      success: true,
      totalDates: summaries.length,
      summaries
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notebook-attendance/date/:date
 * Returns complete attendance rosters (present & absent) for a specific date
 */
router.get("/api/notebook-attendance/date/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const data = loadNotebookData();
    const day = data.find((d: any) => d.date === date || d.rawDate === date);

    if (!day) {
      res.status(404).json({ error: `No notebook attendance found for date '${date}'` });
      return;
    }

    res.json({
      success: true,
      day
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notebook-attendance/apply
 * Applies notebook attendance to qr_attendance (daily gate) and/or qr_hourly_attendance
 * Body parameters:
 *  - dates: string[] (optional, list of dates to apply; defaults to all)
 *  - applyToGate: boolean (default true)
 *  - overwriteExisting: boolean (default false, strictly follows Rule 9)
 */
router.post("/api/notebook-attendance/apply", async (req: Request, res: Response) => {
  try {
    const { dates, applyToGate = true, overwriteExisting = false } = req.body;
    const data = loadNotebookData();

    const targetDays = dates && Array.isArray(dates)
      ? data.filter((d: any) => dates.includes(d.date) || dates.includes(d.rawDate))
      : data;

    let totalGateInserted = 0;
    let totalGateSkipped = 0;
    const dateLogs: any[] = [];

    for (const day of targetDays) {
      const presentUserIds = new Set<number>();
      for (const sec of day.sections) {
        for (const p of sec.present) {
          presentUserIds.add(p.id);
        }
      }

      const uids = Array.from(presentUserIds);
      let insertedForDate = 0;
      let skippedForDate = 0;

      if (applyToGate && uids.length > 0) {
        // Fetch existing gate attendance for this date
        const { data: existingGate } = await supabase
          .from("qr_attendance")
          .select("user_id")
          .eq("date", day.date)
          .in("user_id", uids);

        const existingUserIds = new Set((existingGate || []).map((g: any) => g.user_id));

        const toInsert: any[] = [];
        for (const uid of uids) {
          if (existingUserIds.has(uid) && !overwriteExisting) {
            skippedForDate++;
            continue;
          }

          toInsert.push({
            user_id: uid,
            date: day.date,
            entry_time: `${day.date}T03:30:00.000Z`, // 9:00 AM IST punctual entry
            exit_time: null,
            scan_count: 1,
            last_scan_at: `${day.date}T03:30:00.000Z`
          });
        }

        // Insert in batches of 50
        for (let i = 0; i < toInsert.length; i += 50) {
          const chunk = toInsert.slice(i, i + 50);
          const { error } = await supabase.from("qr_attendance").insert(chunk);
          if (error) throw error;
          insertedForDate += chunk.length;
        }
      }

      totalGateInserted += insertedForDate;
      totalGateSkipped += skippedForDate;

      dateLogs.push({
        date: day.date,
        totalPresentInNotebook: uids.length,
        gateInserted: insertedForDate,
        gateSkippedExisting: skippedForDate
      });
    }

    res.json({
      success: true,
      message: `Notebook attendance applied. Inserted ${totalGateInserted} gate records; skipped ${totalGateSkipped} existing records.`,
      dateLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
