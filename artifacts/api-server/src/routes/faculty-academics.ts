import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";

const router = Router();

// GET /faculty/courses — Full course load derived from real qr_schedules
router.get("/faculty/courses", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  try {
    // Derive courses from real qr_schedules
    const { data: schedules } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("mentor_id", mentorId);

    const schedList = schedules || [];
    const grouped = new Map<string, any>();

    schedList.forEach((s: any) => {
      const subjectClean = (s.subject || "").toUpperCase().trim();
      // Skip non-academic entries
      if (["SPORTS", "LIBRARY", "COUNSELLING", "CLUB ACTIVITIES", "SPORTS/LIBRARY", "APTITUDE"].includes(subjectClean)) return;

      const key = `${subjectClean}_${s.section}_${s.year}`;
      if (!grouped.has(key)) {
        const isLab = subjectClean.includes("LAB");
        const sectionLabel = `DS ${s.year === "II" ? "2" : s.year === "III" ? "3" : "4"}${s.section === "A" ? "A" : s.section === "B" ? "B" : "C"}`;

        // Count students in this section from qr_users
        const yearNum = s.year === "II" ? "II" : s.year === "III" ? "III" : "IV";
        const sectionPattern = `DS ${yearNum}/I/${s.section}`;

        grouped.set(key, {
          id: String(s.id),
          code: subjectClean.replace(/\s+/g, ""),
          name: s.subject || "Course",
          type: isLab ? "Practical" as const : "Theory" as const,
          program: "CSE-DS",
          section: sectionLabel,
          room: isLab ? "Lab" : "Hall",
          batch: "Regular",
          addedBy: "HOD (Data Science)",
          strength: 55,
          coInstructors: [],
          _sectionPattern: sectionPattern,
        });
      }
    });

    // Fetch actual student counts per section
    const courses = Array.from(grouped.values());
    for (const c of courses) {
      const { count } = await supabase
        .from("qr_users")
        .select("*", { count: "exact", head: true })
        .like("section", `%${c._sectionPattern}%`);
      c.strength = count || c.strength;
      delete c._sectionPattern;
    }

    res.json(courses);
  } catch (err: any) {
    req.log?.error?.({ err }, "Get faculty courses error");
    res.json([]);
  }
});

// GET /faculty/attendance-history — Real attendance records for faculty's courses
router.get("/faculty/attendance-history", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const { from, to } = req.query as Record<string, string>;

  try {
    let query = supabase
      .from("qr_mentor_sessions")
      .select("*, qr_schedules(day_of_week, start_time, end_time, section, subject, year)")
      .eq("mentor_id", mentorId)
      .order("date", { ascending: false });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const { data: sessions, error } = await query.limit(100);

    if (error) {
      res.json([]);
      return;
    }

    const records = (sessions || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      studentCount: s.student_count,
      schedule: s.qr_schedules ? {
        day: s.qr_schedules.day_of_week,
        startTime: s.qr_schedules.start_time,
        endTime: s.qr_schedules.end_time,
        section: s.qr_schedules.section,
        subject: s.qr_schedules.subject,
        year: s.qr_schedules.year,
      } : null,
    }));

    res.json(records);
  } catch (err: any) {
    req.log?.error?.({ err }, "Get attendance history error");
    res.json([]);
  }
});

export default router;
