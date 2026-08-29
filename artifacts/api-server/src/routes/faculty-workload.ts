import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";

const router = Router();

// GET /faculty/workload-grid — Structured weekly timetable grid
router.get("/faculty/workload-grid", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  try {
    const { data: schedules } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("mentor_id", mentorId);

    const schedList = schedules || [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap: Record<string, string> = {
      MON: "Monday",
      TUE: "Tuesday",
      WED: "Wednesday",
      THU: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
    };

    const grid = days.map((day) => {
      const daySchedules = schedList.filter((s: any) => {
        const normDay = (s.day_of_week || "").toUpperCase();
        return dayMap[normDay] === day || normDay.startsWith(day.substring(0, 3).toUpperCase());
      });

      return {
        day,
        periods: daySchedules.map((s: any) => ({
          id: s.id,
          slot: `${s.start_time || "09:00"} – ${s.end_time || "10:00"}`,
          subject: s.subject || "Subject",
          section: s.section || "DS-2A",
          room: s.subject?.toLowerCase().includes("lab") ? "Lab-205" : "Hall 402",
        })),
      };
    });

    res.json(grid);
  } catch (err: any) {
    res.json([]);
  }
});

export default router;
