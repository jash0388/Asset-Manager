import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Search,
  AlertTriangle,
  Lock,
  Sparkles,
  UserCheck,
  RefreshCw,
  Users,
  ChevronRight,
  Smartphone,
  Share2,
  Clock,
  BookOpen,
  Flag,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Layers
} from "lucide-react";

type Schedule = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  section: string;
  subject: string;
  year: string;
};

type Session = {
  id: number;
  started_at: string;
  ended_at: string | null;
  student_count: number;
};

type ScheduleStudent = {
  id: number;
  name: string;
  uniqueId: string;
  unique_id?: string;
  section: string;
  scannedGate: boolean;
  gateEntryTime: string | null;
  markedPresent: boolean;
  markedByTeacher: boolean;
  scannedQr: boolean;
  warningNotScanned: boolean;
};

type StudentUser = {
  id: number;
  name: string;
  uniqueId: string;
  unique_id?: string;
  role: string;
  section?: string;
};

type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  durationMinutes: number | null;
  status: "inside" | "exited";
  user?: StudentUser;
};

// Official Faculty Mentors & Class Incharges Master List
export const OFFICIAL_FACULTY_LIST = [
  { id: 1, name: "Mrs. A. Sravanthi", email: "sravanthi.ds@sphoorthyengg.ac.in", key: "key-4a", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 2, name: "Mrs. K. Sneha", email: "sneha.ds@sphoorthyengg.ac.in", key: "key-4b", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", rollRange: "23N81A6788 TO 23N81A67C8 + LE", count: 39 },
  { id: 3, name: "Mr. T. Shravan Kumar", email: "shravan.ds@sphoorthyengg.ac.in", key: "key-3b", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 4, name: "Mrs. G. Sushma", email: "sushma.ds@sphoorthyengg.ac.in", key: "key-3a", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 5, name: "Mr. M. Yadaiah", email: "yadaiah.ds@sphoorthyengg.ac.in", key: "key-3c", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 6, name: "Ms. Priyusha", email: "priyusha.ds@sphoorthyengg.ac.in", key: "priyusha3a", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6732 TO 24N81A6752 + LE", count: 26 },
  { id: 7, name: "Mrs. CH. Naga Rohini", email: "rohini.ds@sphoorthyengg.ac.in", key: "rohini3b", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6753 TO 24N81A6779 + RA", count: 26 },
  { id: 8, name: "Mr. Miskeen Ali", email: "miskeen.ds@sphoorthyengg.ac.in", key: "miskeen3b", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 9, name: "Mrs. Swetha", email: "swetha.ds@sphoorthyengg.ac.in", key: "swetha3c", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },
  { id: 10, name: "Mrs. B. Gayathri", email: "gayathri.ds@sphoorthyengg.ac.in", key: "key-2a", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 11, name: "Mrs. K. Ramya", email: "ramya.ds@sphoorthyengg.ac.in", key: "key-2b", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 12, name: "Mr. K. Bikshapathi", email: "bikshapathi.ds@sphoorthyengg.ac.in", key: "key-2c", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "Section 2C Allocation", count: 27 },
  { id: 13, name: "Mrs. CH. Vijaya Lakshmi", email: "vijayalaksmi.ds@sphoorthyengg.ac.in", key: "vijaya2a", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 14, name: "Mr. M. Srinivasulu", email: "srinivasulu.ds@sphoorthyengg.ac.in", key: "srinivasulu2b", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
];

function getSectionDisplayName(sectionCode?: string): { name: string; yearLabel: string; yearNum: string } {
  if (!sectionCode) return { name: "Other", yearLabel: "Department", yearNum: "Other" };
  const str = sectionCode.trim();
  const parts = str.split("/");
  const sectionLetter = (parts[parts.length - 1] || "A").trim().toUpperCase();

  if (str.includes("IV") || str.includes("4")) {
    return { name: `4${sectionLetter}`, yearLabel: "4th Year", yearNum: "4" };
  }
  if (str.includes("III") || str.includes("3")) {
    return { name: `3${sectionLetter}`, yearLabel: "3rd Year", yearNum: "3" };
  }
  if (str.includes("II") || str.includes("2")) {
    return { name: `2${sectionLetter}`, yearLabel: "2nd Year", yearNum: "2" };
  }
  return { name: sectionCode, yearLabel: "Department", yearNum: "Other" };
}

export default function MentorApp() {
  const { mentor, role, logout, loginMentorKey } = useAuth();
  const [, navigate] = useLocation();

  const [portalTab, setPortalTab] = useState<"session" | "analytics">("session");

  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<ScheduleStudent[]>([]);
  const [serverTime, setServerTime] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<(Schedule & { status: "pending" | "started" | "submitted"; session: Session | null })[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { canInstall, install } = usePwaInstall();
  const [showInstallHelpModal, setShowInstallHelpModal] = useState(false);

  const [passkey, setPasskey] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  // Analytics tab state
  const [riskFlagFilter, setRiskFlagFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [riskSectionFilter, setRiskSectionFilter] = useState<string>("ALL");
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [studentModalMonth, setStudentModalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (role === "mentor") {
      loadActiveSchedule();
    }
  }, [role]);

  const handleKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setKeySubmitting(true);
    setError(null);
    try {
      await loginMentorKey(passkey.trim());
    } catch (err: any) {
      setError(err?.data?.error ?? "Invalid faculty passkey");
    } finally {
      setKeySubmitting(false);
    }
  };

  const loadActiveSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customFetch<{
        activeSchedule: Schedule | null;
        session: Session | null;
        todaySchedules: (Schedule & { status: "pending" | "started" | "submitted"; session: Session | null })[];
        serverTime: any;
      }>("/api/mentor/active-schedule");

      setActiveSchedule(res.activeSchedule);
      setSession(res.session);
      setTodaySchedules(res.todaySchedules || []);
      setServerTime(res.serverTime);

      if (res.activeSchedule) {
        let currentSession = res.session;
        if (!currentSession) {
          currentSession = await customFetch<Session>("/api/mentor/start-session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ scheduleId: res.activeSchedule.id }),
          });
          setSession(currentSession);
        }

        const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${res.activeSchedule.id}`);
        const mappedStudents = studentData.map(s => {
          if (!s.markedByTeacher && s.scannedGate) {
            return { ...s, markedPresent: true };
          }
          return s;
        });

        setStudents(mappedStudents);
      }
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load active class schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchedule = async (sched: Schedule & { status: "pending" | "started" | "submitted"; session: Session | null }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      setActiveSchedule(sched);
      let currentSession = sched.session;
      if (!currentSession) {
        currentSession = await customFetch<Session>("/api/mentor/start-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduleId: sched.id }),
        });
        setSession(currentSession);
      } else {
        setSession(currentSession);
      }

      const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${sched.id}`);
      const mappedStudents = studentData.map(s => {
        if (!s.markedByTeacher && s.scannedGate) {
          return { ...s, markedPresent: true };
        }
        return s;
      });

      setStudents(mappedStudents);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load selected schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAttendance = (studentId: number, markedPresent: boolean) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, markedPresent, markedByTeacher: true } : s))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!session || !activeSchedule) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const records = students.map((s) => ({
        userId: s.id,
        status: s.markedPresent ? ("present" as const) : ("absent" as const),
      }));

      await customFetch("/api/mentor/submit-attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          records,
        }),
      });

      setSuccess("Attendance submitted successfully!");
      setTodaySchedules(prev => prev.map(item => item.id === activeSchedule.id ? { ...item, status: "submitted" } : item));
      setSession(prev => prev ? { ...prev, ended_at: new Date().toISOString() } : null);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch all students for Faculty Analytics
  const { data: allUsers = [] } = useQuery<StudentUser[]>({
    queryKey: ["mentor-users"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
    enabled: role === "mentor"
  });

  const monthForFlags = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const { data: monthlyAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["mentor-monthly-attendance", monthForFlags],
    queryFn: async () => {
      const [yearStr, monthStr] = monthForFlags.split("-");
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const fromStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
      const toStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      return customFetch<AttendanceRecord[]>(`/api/attendance?from=${fromStr}&to=${toStr}`);
    },
    enabled: role === "mentor"
  });

  const totalMonthWorkingDays = useMemo(() => {
    const [yStr, mStr] = monthForFlags.split("-");
    const y = parseInt(yStr);
    const m = parseInt(mStr);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    let working = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dObj = new Date(y, m - 1, day, 12, 0, 0);
      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dStr > todayStr) break;
      if (dObj.getDay() !== 0) working++;
    }
    return Math.max(1, working);
  }, [monthForFlags]);

  const studentPresentCounts = useMemo(() => {
    const map = new Map<number, number>();
    (monthlyAttendance || []).forEach((r: any) => {
      const uid = r.userId || r.user_id || r.user?.id;
      if (uid) map.set(uid, (map.get(uid) || 0) + 1);
    });
    return map;
  }, [monthlyAttendance]);

  // Analytics Student List with Risk Flags
  const mentorStudentAnalyticsList = useMemo(() => {
    const studentList = allUsers.filter((u) => u.role === "student");
    return studentList.map((student) => {
      const presentDays = studentPresentCounts.get(student.id) || 0;
      const calcWorking = totalMonthWorkingDays > 0 ? totalMonthWorkingDays : 1;
      const percent = Math.min(100, Math.floor((presentDays / calcWorking) * 100));

      const classesNeededFor75 = Math.max(0, 3 * totalMonthWorkingDays - 4 * presentDays);
      const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalMonthWorkingDays - presentDays) / 0.35));

      let flag: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let label = "Safe Zone";
      let badgeColor = "bg-emerald-500 text-slate-950 font-black border border-emerald-400";
      let cardBorder = "border-l-4 border-l-emerald-500 border-slate-200";
      let bannerBg = "bg-slate-50 border-emerald-300 text-slate-800";
      let dotColor = "🟢";
      let tip = "Good Standing (≥ 75%). Attendance target met!";

      if (percent < 65) {
        flag = "RED";
        label = "Critical Risk (< 65%)";
        badgeColor = "bg-rose-600 text-white font-extrabold border border-rose-400 shadow-xs";
        cardBorder = "border-l-4 border-l-rose-500 border-slate-200";
        bannerBg = "bg-rose-50 border-rose-200 text-slate-800";
        dotColor = "🔴";
        tip = `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Warning (Recoverable)";
        badgeColor = "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs";
        cardBorder = "border-l-4 border-l-amber-400 border-slate-200";
        bannerBg = "bg-amber-50 border-amber-200 text-slate-800";
        dotColor = "🟡";
        tip = `Needs to attend next ${classesNeededFor75} consecutive classes to reach 75% safe threshold. Can improve by attending regularly!`;
      }

      const secInfo = getSectionDisplayName(student.section);
      return {
        student,
        presentDays,
        totalWorkingDays: totalMonthWorkingDays,
        percent,
        flag,
        label,
        badgeColor,
        cardBorder,
        bannerBg,
        dotColor,
        tip,
        classesNeededFor75,
        classesNeededFor65,
        secInfo,
      };
    });
  }, [allUsers, studentPresentCounts, totalMonthWorkingDays]);

  const filteredMentorAnalyticsList = useMemo(() => {
    return mentorStudentAnalyticsList.filter((item) => {
      const q = riskSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.student.name.toLowerCase().includes(q) ||
        (item.student.uniqueId || item.student.unique_id || "").toLowerCase().includes(q);

      const matchesFlag = riskFlagFilter === "ALL" || item.flag === riskFlagFilter;
      const matchesSection = riskSectionFilter === "ALL" || item.secInfo.name === riskSectionFilter;

      return matchesSearch && matchesFlag && matchesSection;
    });
  }, [mentorStudentAnalyticsList, riskSearchQuery, riskFlagFilter, riskSectionFilter]);

  const redCount = mentorStudentAnalyticsList.filter((s) => s.flag === "RED").length;
  const yellowCount = mentorStudentAnalyticsList.filter((s) => s.flag === "YELLOW").length;
  const greenCount = mentorStudentAnalyticsList.filter((s) => s.flag === "GREEN").length;

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.uniqueId.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const presentCount = useMemo(
    () => students.filter((s) => s.markedPresent).length,
    [students]
  );

  const getCurrentISTTimeStr = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const isTimePast = () => {
    if (!activeSchedule) return false;
    const currentStr = getCurrentISTTimeStr();
    return currentStr > activeSchedule.end_time;
  };

  const isLocked = !!(session?.ended_at || isTimePast());

  // ---------- Passkey Lock Screen ----------
  if (role !== "mentor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-xl shadow-purple-600/30 mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              Faculty & Mentor Portal
            </h1>
            <p className="text-sm font-bold mt-1.5 max-w-xs" style={{ color: "#475569" }}>
              Enter your Faculty Passkey to access class timetables, student risk flags & attendance registers.
            </p>
          </div>

          <form onSubmit={handleKeyLogin} className="mt-7 flex flex-col gap-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-center" style={{ color: "#1e293b" }}>
                Faculty Passkey (Key)
              </label>
              <input
                required
                type="text"
                placeholder="e.g. KEY-4A or SRAVANTHI04"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                className="px-4 py-4 rounded-2xl border-2 border-purple-500 text-2xl font-mono font-black tracking-widest text-center focus:outline-none focus:ring-4 focus:ring-purple-600/20 shadow-inner"
                style={{ color: "#0f172a", backgroundColor: "#f8fafc" }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={keySubmitting}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider mt-1"
            >
              {keySubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" /> Unlocking...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white" /> Unlock Faculty Portal
                </>
              )}
            </button>
          </form>

          {/* Quick Passkeys Reference */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sample Passkeys</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-slate-600">
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-4A</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-4B</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-3A</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-3B</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-3C</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-2A</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-2B</span>
              <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">KEY-2C</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Logged-in Faculty Portal ----------
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-600/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
              {mentor?.name || "Faculty Portal"}
            </h1>
            <p className="text-xs text-purple-300 font-medium">
              Department of CSE - Data Science (DS) • Sphoorthy Engineering College
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="flex bg-white border-2 border-slate-200 p-1.5 rounded-2xl w-fit shadow-md">
          <button
            onClick={() => setPortalTab("session")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              portalTab === "session"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            Class Session & Scanner
          </button>
          <button
            onClick={() => setPortalTab("analytics")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              portalTab === "analytics"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Flag className="w-4 h-4 text-amber-500" />
            Student Risk & Attendance Analytics
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
              🔴 {redCount} | 🟡 {yellowCount}
            </span>
          </button>
        </div>

        {portalTab === "analytics" ? (
          /* FACULTY STUDENT RISK & ATTENDANCE ANALYTICS VIEW */
          <div className="space-y-5">
            {/* Risk Flag Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setRiskFlagFilter("RED")}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-md ${
                  riskFlagFilter === "RED" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    🔴 Red Flag (&lt; 65%)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    Critical
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{redCount} Students</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Shortage Risk • Requires Condonation / Parent Notice</p>
              </button>

              <button
                onClick={() => setRiskFlagFilter("YELLOW")}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-md ${
                  riskFlagFilter === "YELLOW" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    🟡 Yellow Flag (65%–74%)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                    Warning
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{yellowCount} Students</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
              </button>

              <button
                onClick={() => setRiskFlagFilter("GREEN")}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-md ${
                  riskFlagFilter === "GREEN" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    🟢 Green Flag (≥ 75%)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                    Safe
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{greenCount} Students</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Good Standing • Attendance Target Met</p>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student name or roll number..."
                    value={riskSearchQuery}
                    onChange={(e) => setRiskSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={riskFlagFilter}
                    onChange={(e: any) => setRiskFlagFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Risk Flags (🔴 🟡 🟢)</option>
                    <option value="RED">🔴 Red Flag (&lt; 65%)</option>
                    <option value="YELLOW">🟡 Yellow Flag (65%–74%)</option>
                    <option value="GREEN">🟢 Green Flag (≥ 75%)</option>
                  </select>

                  <select
                    value={riskSectionFilter}
                    onChange={(e) => setRiskSectionFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Sections</option>
                    <option value="2A">Section 2A</option>
                    <option value="2B">Section 2B</option>
                    <option value="2C">Section 2C</option>
                    <option value="3A">Section 3A</option>
                    <option value="3B">Section 3B</option>
                    <option value="3C">Section 3C</option>
                    <option value="4A">Section 4A</option>
                    <option value="4B">Section 4B</option>
                  </select>
                </div>
              </div>

              {/* Student Flag Cards Container with Inner Scroll */}
              <div className="space-y-3 pt-2 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar contain-paint">
                {filteredMentorAnalyticsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-bold">
                    No students found matching current risk filter.
                  </div>
                ) : (
                  filteredMentorAnalyticsList.map((item) => (
                    <div
                      key={item.student.id}
                      onClick={() => setSelectedStudentForDetails(item.student)}
                      className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer space-y-3 group shadow-sm hover:shadow-md ${item.cardBorder}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-base">
                            {item.dotColor}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                              {item.student.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-mono font-bold">
                              <span>Roll: <strong className="text-emerald-700 font-extrabold">{item.student.uniqueId || item.student.unique_id || "N/A"}</strong></span>
                              <span>•</span>
                              <span>Year: <strong className="text-slate-800">{item.secInfo.yearLabel}</strong></span>
                              <span>•</span>
                              <span>Sec: <strong className="text-purple-700 font-extrabold">{item.secInfo.name}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs inline-block ${item.badgeColor}`}>
                              {item.label} ({item.percent}%)
                            </span>
                            <p className="text-xs text-slate-600 font-bold mt-1">
                              {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recovery Math Banner */}
                      <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.bannerBg}`}>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 shrink-0 text-slate-700" />
                          <span className="font-bold text-slate-800">{item.tip}</span>
                        </div>

                        {item.classesNeededFor75 > 0 ? (
                          <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white shrink-0 shadow-xs">
                            Target +{item.classesNeededFor75} Classes Needed
                          </span>
                        ) : (
                          <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-emerald-600 border border-emerald-500 text-white shrink-0 shadow-xs">
                            ✓ Target Met
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CLASS SESSION & SCANNER VIEW */
          <>
            {loading ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center shadow-md">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <p className="text-sm font-bold text-slate-600">Loading active classroom timetable & session...</p>
              </div>
            ) : !activeSchedule ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No Active Classroom Session Scheduled</h3>
                <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                  There are no ongoing timetable classes for your faculty profile at this exact time. Switch to the <strong>Student Risk & Attendance Analytics</strong> tab above to view section rosters & attendance flags!
                </p>
              </div>
            ) : (
              <>
                {/* Active Session Banner */}
                <div className="bg-white border-2 border-purple-200 rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 uppercase tracking-wider">
                        Active Class Session
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-1">
                        {activeSchedule.subject} ({activeSchedule.year} Yr - Section {activeSchedule.section})
                      </h2>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Schedule Time: {activeSchedule.start_time} - {activeSchedule.end_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
                        {presentCount} / {students.length} Marked Present
                      </span>
                    </div>
                  </div>

                  {/* Student Search & List */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredStudents.map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{s.name}</p>
                          <p className="text-[11px] font-mono font-bold text-slate-500">{s.uniqueId}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, true)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                              s.markedPresent ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, false)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                              !s.markedPresent ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isLocked && (
                    <button
                      onClick={handleSubmitAttendance}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      {submitting ? "Submitting..." : `Submit Attendance (${presentCount} Present)`}
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Student Monthly Attendance Register Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedStudentForDetails.name}</h3>
                <p className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                  Roll: {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id} • Sec {getSectionDisplayName(selectedStudentForDetails.section).name}
                </p>
              </div>
              <button onClick={() => setSelectedStudentForDetails(null)} className="text-slate-400 hover:text-slate-800">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-600">
              Department of CSE Data Science • Sphoorthy Engineering College
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudentForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
