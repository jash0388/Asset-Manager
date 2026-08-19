import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";
import {
  getTrainingSessions,
  getTrainingSessionById,
  getTrainingSessionByTrainerKey,
  saveTrainingSession,
  deleteTrainingSession,
  addTrainerKeyToSession,
  markTrainingAttendance,
  getTrainingAttendanceForDate,
  getPresentUserIdsInTrainingForDate
} from "../services/trainingStore.js";


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

router.get("/mentor/app-version", (_req: any, res: any) => {
  res.json({
    latestVersionCode: 2,
    latestVersionName: "1.1.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Visual Tick/Cross attendance buttons & roll number sorting!"
  });
});

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

function getCurrentISTDateTime(): { day: string; time: string; date: string } {
  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  const hours = String(istTime.getUTCHours()).padStart(2, "0");
  const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istTime.getUTCSeconds()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}:${seconds}`;

  const days = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];
  const day = days[istTime.getUTCDay()];

  const y = istTime.getUTCFullYear();
  const m = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const d = String(istTime.getUTCDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  return { day, time: timeStr, date: dateStr };
}

function getBufferedTime(timeStr: string, offsetMinutes: number): string {
  try {
    const [h, m, s] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m + offsetMinutes, s || 0, 0);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return timeStr;
  }
}

// Store HOD Schedule Overrides: Key: `${schedule_id}_${date}` -> { isUnlocked: boolean, extendedMinutes: number }
export const scheduleOverridesMap = new Map<string, { isUnlocked: boolean; extendedMinutes: number }>();

// 1. Get active schedule for currently logged in mentor
router.get("/mentor/active-schedule", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  try {
    const { day, time, date } = getCurrentISTDateTime();

    // --- TRAINING TRAINER EARLY RETURN ---
    // Training trainers have mentorId < -9000 (e.g., -9001 for training #1)
    if (mentorId <= -9000) {
      const trainingId = Math.abs(mentorId) - 9000;
      const training = getTrainingSessionById(trainingId);
      if (!training) {
        res.status(404).json({ error: "Training session not found" });
        return;
      }

      // Fetch existing training attendance for today to determine session status
      const todayAttendance = getTrainingAttendanceForDate(date, trainingId);
      const isSubmitted = todayAttendance.length > 0;

      const virtualScheduleId = -(9000 + trainingId);
      const virtualSchedule = {
        id: virtualScheduleId,
        mentor_id: mentorId,
        day_of_week: day,
        start_time: "08:00:00",
        end_time: "17:00:00",
        section: "ALL",
        subject: training.name,
        year: "TRAINING",
        isTraining: true,
        trainingId,
        trainingName: training.name,
        trainingCompany: training.company,
        status: isSubmitted ? "submitted" : "active",
        isLocked: false,
        isCurrentTimeSlot: true,
        isUnlockedByHod: true,
        extraBufferMins: 0,
        session: isSubmitted ? { ended_at: todayAttendance[0]?.markedAt } : null
      };

      res.setHeader("x-app-version", "4.0.0");
      res.json({
        activeSchedule: virtualSchedule,
        session: isSubmitted ? { ended_at: todayAttendance[0]?.markedAt, started_at: todayAttendance[0]?.markedAt } : null,
        todaySchedules: [virtualSchedule],
        serverTime: { day, time, date },
        appVersion: {
          latestVersionCode: 7,
          latestVersionName: "1.7.0",
          downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
          forceUpdate: false,
          releaseNotes: "Training Session Mode Active!"
        }
      });
      return;
    }
    // --- END TRAINING TRAINER ---

    // Fetch all schedules for this mentor for the current day
    const { data: todaySchedules, error: schedulesErr } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("day_of_week", day)
      .order("start_time");

    if (schedulesErr) throw schedulesErr;

    // Fetch all sessions for this mentor for today
    const { data: sessions, error: sessionErr } = await supabase
      .from("qr_mentor_sessions")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("date", date);

    if (sessionErr) throw sessionErr;

    const sessionMap = new Map();
    (sessions || []).forEach((s: any) => {
      sessionMap.set(s.schedule_id, s);
    });

    // Find the currently active schedule (where start_time - 10m <= time <= end_time + 10m + extraBuffer OR isUnlockedByHod)
    const activeSchedule = (todaySchedules || []).find(s => {
      const key = `${s.id}_${date}`;
      const override = scheduleOverridesMap.get(key);
      const isUnlockedByHod = override ? override.isUnlocked : false;
      const extraBufferMins = override ? override.extendedMinutes : 0;

      const startTimeWithBuffer = getBufferedTime(s.start_time, -10);
      const endTimeWithBuffer = getBufferedTime(s.end_time, 10 + extraBufferMins);
      return (time >= startTimeWithBuffer && time <= endTimeWithBuffer) || isUnlockedByHod;
    }) || null;

    const activeSession = activeSchedule ? sessionMap.get(activeSchedule.id) || null : null;

    // Map today's schedules with their session status and time locking
    const mappedTodaySchedules = (todaySchedules || []).map((s: any) => {
      const session = sessionMap.get(s.id);
      const key = `${s.id}_${date}`;
      const override = scheduleOverridesMap.get(key);
      const isUnlockedByHod = override ? override.isUnlocked : false;
      const extraBufferMins = override ? override.extendedMinutes : 0;

      const startTimeWithBuffer = getBufferedTime(s.start_time, -10);
      const endTimeWithBuffer = getBufferedTime(s.end_time, 10 + extraBufferMins);

      const isCurrentTimeSlot = (time >= startTimeWithBuffer && time <= endTimeWithBuffer) || isUnlockedByHod;
      const isSubmitted = Boolean(session && session.ended_at);
      const isStarted = Boolean(session && !session.ended_at);

      let status = "pending";
      if (isSubmitted) {
        status = "submitted";
      } else if (isStarted) {
        status = "started";
      } else if (!isCurrentTimeSlot && mentorId !== -3) {
        status = "locked";
      }

      return {
        ...s,
        session: session || null,
        status,
        isUnlockedByHod,
        extraBufferMins,
        isLocked: status === "locked",
        isCurrentTimeSlot
      };
    });

    res.setHeader("x-app-version", "4.0.0");
    res.json({
      activeSchedule,
      session: activeSession,
      todaySchedules: mappedTodaySchedules,
      serverTime: { day, time, date },
      appVersion: {
        latestVersionCode: 7,
        latestVersionName: "1.7.0",
        downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
        forceUpdate: false,
        releaseNotes: "New Update: Settings & Logout button, Locked class badges, smoother scrolling!"
      }
    });
  } catch (err: any) {
    req.log.error({ err }, "Get active schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Get students assigned to active schedule's section
router.get("/mentor/students-by-schedule", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const scheduleIdRaw = req.query.scheduleId;
  const scheduleId = parseInt(scheduleIdRaw);
  if (isNaN(scheduleId)) {
    res.status(400).json({ error: "Invalid schedule ID" });
    return;
  }

  try {
    const { date } = getCurrentISTDateTime();

    // --- TRAINING VIRTUAL SCHEDULE ---
    if (scheduleId < 0) {
      const trainingId = Math.abs(scheduleId) - 9000;
      const training = getTrainingSessionById(trainingId);
      if (!training) {
        res.status(404).json({ error: "Training session not found" });
        return;
      }

      // Fetch enrolled students for this training session
      let studentQuery = supabase.from("qr_users").select("*").eq("role", "student").order("unique_id", { ascending: true });
      if (training.studentIds && training.studentIds.length > 0) {
        studentQuery = studentQuery.in("id", training.studentIds);
      }
      const { data: students } = await studentQuery;

      const todayAttendance = getTrainingAttendanceForDate(date, trainingId);
      const attendanceMap = new Map<number, any>();
      todayAttendance.forEach(a => attendanceMap.set(a.userId, a));

      const result = (students || []).map((s: any) => {
        const att = attendanceMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          uniqueId: s.unique_id,
          section: s.section,
          scannedGate: false,
          gateEntryTime: null,
          markedPresent: att ? att.markedPresent : false,
          markedByTeacher: !!att,
          scannedQr: false,
          warningNotScanned: false,
          isTraining: true
        };
      });

      res.json(result);
      return;
    }
    // --- END TRAINING ---

    // Fetch schedule to get the section
    const { data: schedules, error: scheduleErr } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("id", scheduleId)
      .limit(1);

    if (scheduleErr) throw scheduleErr;
    const schedule = schedules?.[0];
    if (!schedule || (mentorId !== -3 && schedule.mentor_id !== mentorId)) {
      res.status(404).json({ error: "Schedule not found or access denied" });
      return;
    }

    // Map year & section (e.g. 'II', 'A' -> 'DS II/I/A')
    const dbSection = `DS ${schedule.year}/I/${schedule.section}`;

    // Fetch students in this section or fallback to all students
    let { data: students, error: studentErr } = await supabase
      .from("qr_users")
      .select("*")
      .eq("role", "student")
      .eq("section", dbSection)
      .order("unique_id", { ascending: true });

    if (!students || students.length === 0) {
      const { data: fallbackStudents } = await supabase
        .from("qr_users")
        .select("*")
        .eq("role", "student")
        .order("unique_id", { ascending: true })
        .limit(50);
      students = fallbackStudents || [];
    }

    if (studentErr && (!students || students.length === 0)) throw studentErr;

    if (!students || students.length === 0) {
      res.json([]);
      return;
    }

    const studentIds = students.map((s: any) => s.id);

    // Fetch daily gate attendance status
    const { data: gateAttendance, error: gateErr } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("date", date)
      .in("user_id", studentIds);

    if (gateErr) throw gateErr;

    // Fetch hourly attendance logs for this schedule today
    const { data: hourlyAttendance, error: hourlyErr } = await supabase
      .from("qr_hourly_attendance")
      .select("*")
      .eq("schedule_id", scheduleId)
      .eq("date", date);

    if (hourlyErr) throw hourlyErr;

    const gateMap = new Map<number, any>();
    if (gateAttendance) {
      for (const g of gateAttendance) gateMap.set(g.user_id, g);
    }

    const hourlyMap = new Map<number, any>();
    if (hourlyAttendance) {
      for (const h of hourlyAttendance) hourlyMap.set(h.user_id, h);
    }

    const result = students.map((s: any) => {
      const gate = gateMap.get(s.id);
      const hourly = hourlyMap.get(s.id);

      const hasGateEntry = gate && gate.entry_time && !isSentinel(gate.entry_time);
      const isMarkedPresent = hourly ? hourly.marked_present : false;

      // Warning condition: student present in class but has no gate scan record today
      const warningNotScanned = isMarkedPresent && !hasGateEntry;

      return {
        id: s.id,
        name: s.name,
        uniqueId: s.unique_id,
        section: s.section,
        scannedGate: !!hasGateEntry,
        gateEntryTime: hasGateEntry ? gate.entry_time : null,
        markedPresent: isMarkedPresent,
        markedByTeacher: hourly ? hourly.marked_by_teacher : false,
        scannedQr: hourly ? hourly.scanned_qr : false,
        warningNotScanned
      };
    });

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "Get students by schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Start a new session log
router.post("/mentor/start-session", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const scheduleId = parseInt(req.body.scheduleId);
  if (isNaN(scheduleId)) {
    res.status(400).json({ error: "Invalid schedule ID" });
    return;
  }

  try {
    const { date } = getCurrentISTDateTime();

    // --- TRAINING: return virtual session, don't touch DB ---
    if (scheduleId < 0) {
      const trainingId = Math.abs(scheduleId) - 9000;
      const training = getTrainingSessionById(trainingId);
      if (!training) {
        res.status(404).json({ error: "Training session not found" });
        return;
      }
      res.status(201).json({
        id: scheduleId,
        mentor_id: mentorId,
        schedule_id: scheduleId,
        date,
        started_at: new Date().toISOString(),
        ended_at: null,
        student_count: 0,
        isTraining: true
      });
      return;
    }
    // --- END TRAINING ---

    // Verify schedule belongs to mentor
    const { data: schedules, error: scheduleErr } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("id", scheduleId)
      .limit(1);

    if (scheduleErr) throw scheduleErr;
    const schedule = schedules?.[0];
    if (!schedule || (mentorId !== -3 && schedule.mentor_id !== mentorId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Insert or return existing session
    const { data: existing, error: existErr } = await supabase
      .from("qr_mentor_sessions")
      .select("*")
      .eq("schedule_id", scheduleId)
      .eq("date", date)
      .limit(1);

    if (existErr) throw existErr;

    if (existing && existing.length > 0) {
      res.json(existing[0]);
      return;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("qr_mentor_sessions")
      .insert({
        mentor_id: mentorId,
        schedule_id: scheduleId,
        date: date,
        started_at: new Date().toISOString(),
        student_count: 0
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json(inserted);
  } catch (err: any) {
    req.log.error({ err }, "Start session error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Submit attendance and close session
router.post("/mentor/submit-attendance", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const scheduleId = parseInt(req.body.scheduleId);
  const studentRecords = req.body.students; // array of { studentId: number, markedPresent: boolean }
  if (isNaN(scheduleId) || !Array.isArray(studentRecords)) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const { date } = getCurrentISTDateTime();

    // --- TRAINING: write to trainingStore, NOT to qr_hourly_attendance ---
    if (scheduleId < 0) {
      const trainingId = Math.abs(scheduleId) - 9000;
      const training = getTrainingSessionById(trainingId);
      if (!training) {
        res.status(404).json({ error: "Training session not found" });
        return;
      }
      const toMark = studentRecords.map((r: any) => ({
        trainingId,
        userId: r.studentId,
        date,
        markedPresent: !!r.markedPresent,
        markedBy: "Trainer"
      }));
      markTrainingAttendance(toMark);
      const presentCount = toMark.filter(r => r.markedPresent).length;
      res.json({ message: "Training attendance submitted successfully", presentCount });
      return;
    }
    // --- END TRAINING ---

    // Verify schedule belongs to mentor
    const { data: schedules, error: scheduleErr } = await supabase
      .from("qr_schedules")
      .select("*")
      .eq("id", scheduleId)
      .limit(1);

    if (scheduleErr) throw scheduleErr;
    const schedule = schedules?.[0];
    if (!schedule || (mentorId !== -3 && schedule.mentor_id !== mentorId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Insert or update hourly attendance logs in bulk (40x speedup)
    let presentCount = 0;
    const upsertRecords = studentRecords.map((record) => {
      const isPresent = !!record.markedPresent;
      if (isPresent) presentCount++;
      return {
        schedule_id: scheduleId,
        user_id: record.studentId,
        date: date,
        marked_present: isPresent,
        marked_by_teacher: true,
        scanned_qr: false
      };
    });

    if (upsertRecords.length > 0) {
      const { error: upsertErr } = await supabase
        .from("qr_hourly_attendance")
        .upsert(upsertRecords, {
          onConflict: "schedule_id,user_id,date"
        });
      if (upsertErr) throw upsertErr;
    }

    // Update session end time and student count
    const { data: sessionRes, error: sessionErr } = await supabase
      .from("qr_mentor_sessions")
      .update({
        ended_at: new Date().toISOString(),
        student_count: presentCount
      })
      .eq("schedule_id", scheduleId)
      .eq("date", date)
      .select();

    if (sessionErr) throw sessionErr;

    res.json({ message: "Attendance submitted successfully", presentCount });
  } catch (err: any) {
    req.log.error({ err }, "Submit attendance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/app-version", (_req: any, res: any) => {
  res.json({
    latestVersionCode: 2,
    latestVersionName: "1.1.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Visual Tick/Cross attendance buttons & roll number sorting!"
  });
});

// 5. Admin Endpoint: Fetch all mentors and their sessions
router.get("/admin/mentors-tracking", authMiddleware, async (req: any, res: any) => {
  try {
    // Fetch all mentors
    const { data: mentors, error: mentorErr } = await supabase
      .from("qr_mentors")
      .select("*")
      .order("name");

    if (mentorErr) throw mentorErr;

    // Fetch all sessions
    const { data: sessions, error: sessionErr } = await supabase
      .from("qr_mentor_sessions")
      .select("*, qr_schedules(day_of_week, start_time, end_time, section, subject)");

    if (sessionErr) throw sessionErr;

    const result = mentors.map((m: any) => {
      const mentorSessions = (sessions || []).filter((s: any) => s.mentor_id === m.id);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        key: m.key,
        sessions: mentorSessions.map((s: any) => ({
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
            subject: s.qr_schedules.subject
          } : null
        }))
      };
    });

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "Get admin mentors tracking error");
    res.status(500).json({ error: "Internal server error" });
  }
});
const SECURE_FACULTY_KEYS = [
  { id: 1, name: "Mrs A Sravanthi", email: "mrsasravanthi@gmail.com", key: "109", inchargeKey: "4011", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 3, name: "Mr T Shravan Kumar", email: "mrtshravankumar@gmail.com", key: "106", inchargeKey: "3012", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 2, name: "Mrs K Sneha", email: "mrsksneha@gmail.com", key: "110", inchargeKey: "4012", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", rollRange: "23N81A6788 TO 23N81A67C8 + LE-3, LE-4", count: 39 },
  { id: 4, name: "Mrs G Sushma", email: "mrsgsushma@gmail.com", key: "108", inchargeKey: "3011", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 15, name: "Ms. Priyusha", email: "msspriyusha@gmail.com", key: "115", inchargeKey: null, role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6732 TO 24N81A6752 + LE-3 to LE-8", count: 26 },
  { id: 6, name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com", key: "101", inchargeKey: null, role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6753 TO 24N81A6779 + RA-33, A9", count: 26 },
  { id: 8, name: "Mr Miskeen Ali", email: "mrmiskeenali@gmail.com", key: "103", inchargeKey: null, role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 5, name: "Mr M Yadaiah", email: "mrmyadaiah@gmail.com", key: "104", inchargeKey: "3013", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 9, name: "Mrs. Swetha", email: "mrsswetha@gmail.com", key: "102", inchargeKey: null, role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },
  { id: 10, name: "Mrs B Gayathri", email: "mrsbgayathri@gmail.com", key: "111", inchargeKey: "2011", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 13, name: "Mrs Ch Vijaya Lakshmi", email: "mrschvijayalakshmi@gmail.com", key: "113", inchargeKey: null, role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 11, name: "Mrs K Ramya", email: "mrskramya@gmail.com", key: "112", inchargeKey: "2012", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 14, name: "Mr M Srinivasulu", email: "mrmsrinivasulu@gmail.com", key: "105", inchargeKey: null, role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
  { id: 12, name: "Mrs K Srinija", email: "mrsksrinija@gmail.com", key: "114", inchargeKey: null, role: "Faculty Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67B4 TO 25N81A67D9", count: 26 },
  { id: 7, name: "Mr K Bikshapathi", email: "mrkbikshapathi@gmail.com", key: "107", inchargeKey: "2013", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67E0 TO 25N81A67G0", count: 19 }
];

router.get("/admin/faculty-keys", authMiddleware, async (_req: any, res: any) => {
  res.json(SECURE_FACULTY_KEYS);
});
// 6. Admin Endpoint: Manage Schedules
router.get("/admin/schedules", authMiddleware, async (req: any, res: any) => {
  try {
    const { data: schedules, error } = await supabase
      .from("qr_schedules")
      .select("*, qr_mentors(name, email)")
      .order("day_of_week")
      .order("start_time");

    if (error) throw error;
    res.json(schedules);
  } catch (err: any) {
    req.log.error({ err }, "Get admin schedules error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/schedules", authMiddleware, async (req: any, res: any) => {
  const { mentorId, dayOfWeek, startTime, endTime, section, subject, year } = req.body;
  if (!mentorId || !dayOfWeek || !startTime || !endTime || !section) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const { data: inserted, error } = await supabase
      .from("qr_schedules")
      .insert({
        mentor_id: mentorId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        section,
        subject,
        year
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(inserted);
  } catch (err: any) {
    req.log.error({ err }, "Create admin schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/schedules/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid schedule ID" });
    return;
  }
  const { mentorId, dayOfWeek, startTime, endTime, section, subject, year } = req.body;
  try {
    const updatePayload: any = {};
    if (mentorId !== undefined) updatePayload.mentor_id = mentorId;
    if (dayOfWeek !== undefined) updatePayload.day_of_week = dayOfWeek;
    if (startTime !== undefined) updatePayload.start_time = startTime;
    if (endTime !== undefined) updatePayload.end_time = endTime;
    if (section !== undefined) updatePayload.section = section;
    if (subject !== undefined) updatePayload.subject = subject;
    if (year !== undefined) updatePayload.year = year;

    const { data: updated, error } = await supabase
      .from("qr_schedules")
      .update(updatePayload)
      .eq("id", id)
      .select("*, qr_mentors(*)")
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err: any) {
    req.log.error({ err }, "Update admin schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/schedules/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid schedule ID" });
    return;
  }
  try {
    const { error } = await supabase
      .from("qr_schedules")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Schedule deleted successfully" });
  } catch (err: any) {
    req.log.error({ err }, "Delete admin schedule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/schedules-with-status", authMiddleware, async (req: any, res: any) => {
  const date = req.query.date as string;
  if (!date) {
    res.status(400).json({ error: "Date parameter is required" });
    return;
  }

  try {
    // 1. Fetch all schedules
    const { data: schedules, error: scheduleErr } = await supabase
      .from("qr_schedules")
      .select("*, qr_mentors(*)")
      .order("start_time", { ascending: true });

    if (scheduleErr) throw scheduleErr;

    // 2. Fetch all sessions and hourly attendance for this date
    const { data: sessions, error: sessionErr } = await supabase
      .from("qr_mentor_sessions")
      .select("*")
      .eq("date", date);

    if (sessionErr) throw sessionErr;

    const { data: hourlyRecs, error: hourlyErr } = await supabase
      .from("qr_hourly_attendance")
      .select("schedule_id, marked_present")
      .eq("date", date);

    if (hourlyErr) throw hourlyErr;

    // Map schedule status
    const sessionMap = new Map();
    (sessions || []).forEach((s: any) => {
      sessionMap.set(s.schedule_id, s);
    });

    const hourlyMap = new Map();
    (hourlyRecs || []).forEach((r: any) => {
      if (!hourlyMap.has(r.schedule_id)) {
        hourlyMap.set(r.schedule_id, { count: 0, presentCount: 0 });
      }
      const info = hourlyMap.get(r.schedule_id);
      info.count++;
      if (r.marked_present) info.presentCount++;
    });

    const mapped = (schedules || []).map((s: any) => {
      const session = sessionMap.get(s.id);
      const hourly = hourlyMap.get(s.id);

      const isSubmitted = Boolean((session && session.ended_at) || (hourly && hourly.count > 0));
      const isStarted = Boolean(session && !session.ended_at && (!hourly || hourly.count === 0));

      const status = isSubmitted ? "submitted" : isStarted ? "started" : "pending";
      const studentCount = hourly ? hourly.presentCount : (session ? session.student_count : 0);

      return {
        ...s,
        status,
        studentCount
      };
    });

    res.json(mapped);
  } catch (err: any) {
    req.log.error({ err }, "Fetch schedules with status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/hourly-attendance-submissions", authMiddleware, async (req: any, res: any) => {
  const scheduleId = parseInt(req.query.scheduleId);
  if (isNaN(scheduleId)) {
    res.status(400).json({ error: "Invalid schedule ID" });
    return;
  }
  const dateParam = req.query.date as string | undefined;

  try {
    // 1. Get all unique dates when attendance was submitted for this schedule
    const { data: datesRes, error: datesErr } = await supabase
      .from("qr_hourly_attendance")
      .select("date")
      .eq("schedule_id", scheduleId);

    if (datesErr) throw datesErr;

    const uniqueDates = Array.from(new Set((datesRes || []).map((d: any) => d.date))).sort().reverse();

    const targetDate = dateParam || (uniqueDates.length > 0 ? uniqueDates[0] : null);

    if (!targetDate || (dateParam && !uniqueDates.includes(dateParam))) {
      res.json({ dates: uniqueDates, date: dateParam || targetDate, records: [] });
      return;
    }

    const date = targetDate;

    // 2. Fetch the hourly attendance records for this date and schedule
    const { data: records, error: recordsErr } = await supabase
      .from("qr_hourly_attendance")
      .select("*, qr_users(*)")
      .eq("schedule_id", scheduleId)
      .eq("date", date);

    if (recordsErr) throw recordsErr;

    // 3. Fetch gate scan records for this date to display gate status
    const { data: gateScans, error: gateErr } = await supabase
      .from("qr_attendance")
      .select("user_id, entry_time")
      .eq("date", date);

    const gateScannedUserIds = new Set((gateScans || []).map((g: any) => g.user_id));

    const formattedRecords = (records || []).map((r: any) => {
      const u = r.qr_users;
      return {
        id: r.id,
        studentId: r.user_id,
        name: u ? u.name : "Unknown Student",
        uniqueId: u ? u.unique_id : "—",
        markedPresent: r.marked_present,
        scannedGate: u ? gateScannedUserIds.has(u.id) : false
      };
    });

    res.json({
      dates: uniqueDates,
      date,
      records: formattedRecords
    });
  } catch (err: any) {
    req.log.error({ err }, "Fetch hourly submissions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5b. HOD Schedule Override Endpoints (Master Unlock & Time Extension)
router.post("/admin/schedule-override", authMiddleware, async (req: any, res: any) => {
  const scheduleId = parseInt(req.body.scheduleId);
  if (isNaN(scheduleId)) {
    res.status(400).json({ error: "Schedule ID is required" });
    return;
  }
  const dateParam = (req.body.date || "").toString().trim() || getCurrentISTHoursMinutes().todayDate;
  const isUnlocked = Boolean(req.body.isUnlocked);
  const extendedMinutes = parseInt(req.body.extendedMinutes) || 0;

  const key = `${scheduleId}_${dateParam}`;
  const overrideData = { isUnlocked, extendedMinutes };
  scheduleOverridesMap.set(key, overrideData);

  res.json({
    status: "ok",
    key,
    override: overrideData
  });
});

router.get("/admin/schedule-overrides", authMiddleware, async (req: any, res: any) => {
  const dateParam = (req.query.date || "").toString().trim() || getCurrentISTHoursMinutes().todayDate;
  const list: any[] = [];
  scheduleOverridesMap.forEach((val, key) => {
    if (key.endsWith(`_${dateParam}`)) {
      const scheduleId = parseInt(key.split("_")[0]);
      list.push({ scheduleId, date: dateParam, ...val });
    }
  });
  res.json(list);
});

// 5c. Fetch class presence logs for date (students marked present in hourly classes + training)
router.get("/admin/today-class-presence", authMiddleware, async (req: any, res: any) => {
  const dateParam = (req.query.date || "").toString().trim() || getCurrentISTHoursMinutes().todayDate;
  try {
    const { data: records, error } = await supabase
      .from("qr_hourly_attendance")
      .select("user_id, schedule_id, marked_present, date")
      .eq("date", dateParam)
      .eq("marked_present", true);

    if (error) throw error;

    // Also include students marked present in ANY training session today
    const trainingPresentUserIds = getPresentUserIdsInTrainingForDate(dateParam);
    const trainingRecords = trainingPresentUserIds.map(uid => ({
      user_id: uid,
      schedule_id: null,
      marked_present: true,
      date: dateParam,
      isTraining: true
    }));

    // Merge: existing DB records + training records (deduplicate by user_id)
    const merged = [...(records || [])];
    const existingUserIds = new Set((records || []).map((r: any) => r.user_id));
    trainingRecords.forEach(tr => {
      if (!existingUserIds.has(tr.user_id)) {
        merged.push(tr);
      }
    });

    res.json(merged);
  } catch (err: any) {
    req.log.error({ err }, "Error fetching today class presence");
    res.status(500).json({ error: "Internal server error" });
  }
});


function getCurrentISTHoursMinutes(): { todayDate: string; isPast430PM: boolean } {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const todayDate = istTime.toISOString().split("T")[0];
  const isPast430PM = hours > 16 || (hours === 16 && minutes >= 30);
  return { todayDate, isPast430PM };
}

// 6. Public Parent API: Fetch comprehensive student report for parents
router.get("/parent/student-report", async (req: any, res: any) => {
  const rollNumberRaw = (req.query.rollNumber || req.query.uniqueId || "").toString().trim();
  if (!rollNumberRaw) {
    res.status(400).json({ error: "Roll number / Student ID is required" });
    return;
  }

  try {
    const { date, day } = getCurrentISTDateTime();
    const cleanRoll = rollNumberRaw.replace(/\s+/g, "").trim().toUpperCase();

    // 1. Fetch student profile
    let { data: students, error: studentErr } = await supabase
      .from("qr_users")
      .select("*")
      .ilike("unique_id", cleanRoll)
      .limit(1);

    if (studentErr) throw studentErr;

    if (!students || students.length === 0) {
      const { data: altStudents } = await supabase
        .from("qr_users")
        .select("*")
        .ilike("unique_id", `%${cleanRoll}%`)
        .limit(1);
      students = altStudents || [];
    }

    const student = students?.[0];
    if (!student) {
      res.status(404).json({ error: `No student found matching Roll Number '${cleanRoll}'` });
      return;
    }

    // 2. Fetch today's gate attendance record
    const { data: gateRecords, error: gateErr } = await supabase
      .from("qr_attendance")
      .select("*")
      .eq("user_id", student.id)
      .eq("date", date)
      .order("last_scan_at", { ascending: false })
      .limit(1);

    if (gateErr) throw gateErr;
    const gateRecord = gateRecords?.[0] || null;

    // Determine gate status
    let gateStatus: "PRESENT" | "LEFT" | "MISSED_EXIT" | "ABSENT" = "ABSENT";
    let entryTime: string | null = null;
    let exitTime: string | null = null;

    if (gateRecord) {
      const hasEntry = gateRecord.entry_time && !isSentinel(gateRecord.entry_time);
      const hasExit = gateRecord.exit_time && !isSentinel(gateRecord.exit_time);
      entryTime = hasEntry ? gateRecord.entry_time : null;
      exitTime = hasExit ? gateRecord.exit_time : null;

      if (hasEntry && hasExit) {
        gateStatus = "LEFT";
      } else if (hasEntry && !hasExit) {
        const { isPast430PM } = getCurrentISTHoursMinutes();
        gateStatus = isPast430PM ? "MISSED_EXIT" : "PRESENT";
      }
    }

    // 3. Fetch today's class schedule for student's section
    let todaySchedule: any[] = [];
    if (student.section) {
      const { data: schedules } = await supabase
        .from("qr_schedules")
        .select("*")
        .eq("section", student.section)
        .eq("day_of_week", day)
        .order("start_time");

      if (schedules && schedules.length > 0) {
        const { data: mentorsList } = await supabase
          .from("qr_mentors")
          .select("id, name");
        const mentorMap = new Map<number, string>();
        (mentorsList || []).forEach(m => mentorMap.set(m.id, m.name));

        const scheduleIds = schedules.map(s => s.id);
        const { data: hourlyAtt } = await supabase
          .from("qr_hourly_attendance")
          .select("*")
          .eq("user_id", student.id)
          .eq("date", date)
          .in("schedule_id", scheduleIds);

        const hourlyMap = new Map<number, any>();
        (hourlyAtt || []).forEach(h => hourlyMap.set(h.schedule_id, h));

        todaySchedule = schedules.map(s => {
          const h = hourlyMap.get(s.id);
          let status: "PRESENT" | "ABSENT" | "PENDING" = "PENDING";
          if (h) {
            status = h.marked_present ? "PRESENT" : "ABSENT";
          }
          return {
            id: s.id,
            subject: s.subject || "Lecture Hour",
            startTime: (s.start_time || "00:00").slice(0, 5),
            endTime: (s.end_time || "00:00").slice(0, 5),
            teacherName: mentorMap.get(s.mentor_id) || "Faculty",
            markedPresent: h ? Boolean(h.marked_present) : null,
            status
          };
        });
      }
    }

    // 4. Fetch overall gate attendance statistics for summary (past 60 days)
    const { data: pastGateRecords } = await supabase
      .from("qr_attendance")
      .select("date, entry_time, exit_time")
      .eq("user_id", student.id)
      .order("date", { ascending: false })
      .limit(60);

    const totalDaysPresent = (pastGateRecords || []).filter(r => r.entry_time && !isSentinel(r.entry_time)).length;

    res.json({
      student: {
        id: student.id,
        name: student.name,
        uniqueId: student.unique_id,
        section: student.section || "—",
        role: student.role
      },
      today: {
        date,
        day,
        entryTime,
        exitTime,
        gateStatus,
        scannedGate: Boolean(entryTime)
      },
      todaySchedule,
      summary: {
        totalDaysPresent,
      },
      history: (pastGateRecords || []).slice(0, 14)
    });
  } catch (err: any) {
    req.log.error({ err }, "Parent student report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. Public Parent App Version Check Endpoint
router.get("/parent/app-version", (_req: any, res: any) => {
  res.json({
    latestVersionCode: 1,
    latestVersionName: "1.0.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/ParentApp.apk",
    forceUpdate: false,
    releaseNotes: "Official Parent App Release: Live Gate Attendance & Hourly Subject Schedule Tracking!"
  });
});

// ============================================================
// TRAINING SESSIONS APIs
// ============================================================

// GET all training sessions
router.get("/admin/training-sessions", authMiddleware, async (_req: any, res: any) => {
  res.json(getTrainingSessions());
});

// GET one training session by ID
router.get("/admin/training-sessions/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const session = getTrainingSessionById(id);
  if (!session) {
    res.status(404).json({ error: "Training session not found" });
    return;
  }
  res.json(session);
});

// POST create new training session
router.post("/admin/training-sessions", authMiddleware, async (req: any, res: any) => {
  const { name, company, description, studentIds } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Training session name is required" });
    return;
  }
  const created = saveTrainingSession({ name: name.trim(), company: company || "Corporate", description: description || "", studentIds: studentIds || [] });
  res.status(201).json(created);
});

// PUT update training session
router.put("/admin/training-sessions/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const existing = getTrainingSessionById(id);
  if (!existing) {
    res.status(404).json({ error: "Training session not found" });
    return;
  }
  const { name, company, description, studentIds } = req.body;
  const updated = saveTrainingSession({
    ...existing,
    name: name?.trim() || existing.name,
    company: company || existing.company,
    description: description !== undefined ? description : existing.description,
    studentIds: Array.isArray(studentIds) ? studentIds : existing.studentIds
  });
  res.json(updated);
});

// DELETE training session
router.delete("/admin/training-sessions/:id", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const deleted = deleteTrainingSession(id);
  if (!deleted) {
    res.status(404).json({ error: "Training session not found" });
    return;
  }
  res.json({ message: "Training session deleted successfully" });
});

// POST add trainer key to a training session
router.post("/admin/training-sessions/:id/trainer-key", authMiddleware, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  const { name, email, key } = req.body;
  if (!name || !key) {
    res.status(400).json({ error: "Trainer name and key are required" });
    return;
  }
  const updated = addTrainerKeyToSession(id, { name, email: email || `trainer@sphoorthyengg.ac.in`, key: String(key).trim() });
  if (!updated) {
    res.status(404).json({ error: "Training session not found" });
    return;
  }
  res.json(updated);
});

// GET training attendance for a date
router.get("/admin/training-attendance", authMiddleware, async (req: any, res: any) => {
  const dateParam = (req.query.date || "").toString().trim() || getCurrentISTHoursMinutes().todayDate;
  const trainingIdParam = req.query.trainingId ? parseInt(req.query.trainingId as string) : undefined;
  const records = getTrainingAttendanceForDate(dateParam, trainingIdParam);

  // Enrich with student info
  const userIds = [...new Set(records.map(r => r.userId))];
  if (userIds.length === 0) {
    res.json([]);
    return;
  }

  const { data: students } = await supabase.from("qr_users").select("id, name, unique_id, section").in("id", userIds);
  const studentMap = new Map((students || []).map((s: any) => [s.id, s]));

  const enriched = records.map(r => {
    const s = studentMap.get(r.userId);
    return {
      ...r,
      name: s?.name || "Unknown",
      uniqueId: s?.unique_id || "—",
      section: s?.section || "—"
    };
  });

  res.json(enriched);
});

// POST mark/update training attendance from HOD dashboard
router.post("/admin/training-attendance", authMiddleware, async (req: any, res: any) => {
  const { trainingId, userId, date, markedPresent } = req.body;
  if (!trainingId || !userId || !date) {
    res.status(400).json({ error: "trainingId, userId, and date are required" });
    return;
  }
  markTrainingAttendance([{ trainingId: Number(trainingId), userId: Number(userId), date, markedPresent: !!markedPresent, markedBy: "HOD" }]);
  res.json({ message: "Training attendance updated" });
});

export default router;
