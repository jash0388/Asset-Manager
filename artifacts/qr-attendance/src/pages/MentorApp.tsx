import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
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
  Calendar,
  Layers,
  Check,
  X as XIcon,
  Settings,
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

export const OFFICIAL_FACULTY_LIST = [
  // IV Year
  { id: 1, name: "Mrs A Sravanthi", email: "mrsasravanthi@gmail.com", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 3, name: "Mr T Shravan Kumar", email: "mrtshravankumar@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 2, name: "Mrs K Sneha", email: "mrsksneha@gmail.com", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", rollRange: "23N81A6788 TO 23N81A67C8 + LE-3, LE-4", count: 39 },

  // III Year
  { id: 4, name: "Mrs G Sushma", email: "mrsgsushma@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 15, name: "Ms. Priyusha", email: "msspriyusha@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6732 TO 24N81A6752 + LE-3 to LE-8", count: 26 },
  { id: 6, name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6753 TO 24N81A6779 + RA-33, A9", count: 26 },
  { id: 8, name: "Mr Miskeen Ali", email: "mrmiskeenali@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 5, name: "Mr M Yadaiah", email: "mrmyadaiah@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 9, name: "Mrs. Swetha", email: "mrsswetha@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },

  // II Year
  { id: 10, name: "Mrs B Gayathri", email: "mrsbgayathri@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 13, name: "Mrs Ch Vijaya Lakshmi", email: "mrschvijayalakshmi@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 11, name: "Mrs K Ramya", email: "mrskramya@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 14, name: "Mr M Srinivasulu", email: "mrmsrinivasulu@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
  { id: 12, name: "Mrs K Srinija", email: "mrsksrinija@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67B4 TO 25N81A67D9", count: 26 },
  { id: 7, name: "Mr K Bikshapathi", email: "mrkbikshapathi@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67E0 TO 25N81A67G0", count: 19 }
];

export default function MentorApp() {
  const { mentor, role, logout, loginMentorKey } = useAuth();
  const [, navigate] = useLocation();

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [passkey, setPasskey] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  useEffect(() => {
    if (role === "mentor") {
      loadActiveSchedule();
    }
  }, [role]);

  // Resolve current faculty profile from official dataset
  const activeFaculty = useMemo(() => {
    if (!mentor) return null;
    return OFFICIAL_FACULTY_LIST.find(
      (f) =>
        f.email === mentor.email ||
        f.section.toLowerCase() === (mentor.section || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
        (mentor.section && mentor.section.includes(f.section))
    ) || {
      name: mentor.name || "Faculty Teacher",
      role: "Subject Faculty",
      yearLabel: "CSE Data Science",
      section: mentor.section || "DS",
    };
  }, [mentor]);

  const handleKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const typed = passkey.trim();
    if (!typed) return;
    setKeySubmitting(true);
    setError(null);
    try {
      await loginMentorKey(typed);
    } catch (err: any) {
      setError(err?.message || "Invalid subject access key");
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
          scheduleId: activeSchedule.id,
          students: students.map((s) => ({
            studentId: s.id,
            markedPresent: s.markedPresent,
          })),
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
      <div style={{ backgroundColor: "#f8fafc", color: "#0f172a" }} className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative">
        <div style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }} className="w-full max-w-md border-2 rounded-[2rem] p-8 shadow-xl relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div style={{ backgroundColor: "#2563eb" }} className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 style={{ color: "#0f172a" }} className="text-2xl font-black tracking-tight">
              Hourly Attendance Portal
            </h1>
            <p style={{ color: "#475569" }} className="text-xs font-bold mt-2 max-w-xs leading-relaxed">
              Enter your Subject Access Key to launch period attendance & QR scanner.
            </p>
          </div>

          <form onSubmit={handleKeyLogin} className="space-y-5">
            {error && (
              <div style={{ backgroundColor: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" }} className="px-4 py-3 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2 text-center">
              <label style={{ color: "#0f172a" }} className="text-xs font-black uppercase tracking-wider">
                Subject Access Key
              </label>
              <input
                required
                type="text"
                placeholder="e.g. DS-2A"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                style={{ backgroundColor: "#f8fafc", borderColor: "#2563eb", color: "#0f172a" }}
                className="w-full px-4 py-4 rounded-2xl border-2 text-3xl font-mono font-black tracking-widest text-center focus:outline-none shadow-inner"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={keySubmitting}
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              className="w-full py-4 rounded-2xl disabled:opacity-50 font-black text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer hover:bg-blue-700"
            >
              {keySubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" /> Accessing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white" /> Launch Class Attendance
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Logged-in Hourly Attendance Scanner ----------
  return (
    <div style={{ backgroundColor: "#f8fafc", color: "#0f172a" }} className="min-h-screen flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-40 shadow-xs gap-4 sm:gap-0">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div style={{ backgroundColor: "#2563eb" }} className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* EXPLICIT 100% PITCH BLACK FACULTY NAME */}
              <h1 style={{ color: "#0f172a" }} className="text-base sm:text-lg font-black tracking-tight">
                {activeFaculty?.name}
              </h1>
              <span style={{ backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0">
                {activeFaculty?.section} Faculty
              </span>
            </div>
            <p style={{ color: "#1e40af" }} className="text-[10px] sm:text-xs font-bold mt-0.5">
              Hourly Attendance Scanner • Department of CSE - DS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeFaculty?.role?.includes("In-charge") && (
            <button
              onClick={() => navigate("/incharge-dashboard")}
              style={{ backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb" }}
              className="px-3 py-2 rounded-xl font-bold text-[10px] sm:text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 flex-1 sm:flex-none justify-center"
            >
              <Users className="w-3.5 h-3.5 text-white" />
              Incharge Dashboard
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            style={{ backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" }}
            className="p-2.5 rounded-xl font-bold text-xs border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Settings & Profile"
          >
            <Settings className="w-4.5 h-4.5 text-slate-700" />
          </button>

          <button
            onClick={logout}
            style={{ backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" }}
            className="px-3 py-2 rounded-xl font-bold text-[10px] sm:text-xs border flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Switcher Tabs */}
        <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border p-2 rounded-2xl flex flex-wrap gap-2 shadow-xs mb-2">
          <button
            onClick={() => navigate("/incharge-dashboard")}
            style={{ backgroundColor: "#f1f5f9", color: "#334155" }}
            className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-gray-200"
          >
            <Users className="w-3.5 h-3.5 text-slate-550" />
            Class Incharge Portal
          </button>
          <button
            onClick={() => navigate("/mentor")}
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            Take Class Attendance
          </button>
        </div>

        {loading ? (
          <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center shadow-xs">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p style={{ color: "#475569" }} className="text-sm font-bold">Loading active classroom timetable & session...</p>
          </div>
        ) : !activeSchedule ? (
          <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div style={{ backgroundColor: "#eff6ff", color: "#2563eb" }} className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 style={{ color: "#0f172a" }} className="text-xl font-black">No Active Classroom Session Right Now</h3>
            <p style={{ color: "#475569" }} className="text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
              Attendance opens during class hours (with 10m buffer window). Please view today's schedule below:
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-3xl p-6 shadow-xs space-y-5">
            <div style={{ borderColor: "#f1f5f9" }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <span style={{ backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border">
                  Active Period Class
                </span>
                <h2 style={{ color: "#0f172a" }} className="text-xl font-black mt-1">
                  {activeSchedule.subject} ({activeSchedule.year} Yr - Section {activeSchedule.section})
                </h2>
                <p style={{ color: "#64748b" }} className="text-xs font-bold mt-0.5">
                  Scheduled Time: {activeSchedule.start_time} - {activeSchedule.end_time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }} className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs border">
                  {presentCount} / {students.length} Marked Present
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1", color: "#0f172a" }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
              />
            </div>

            {/* Student Roster List */}
            <div style={{ borderColor: "#f1f5f9" }} className="divide-y max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar contain-paint touch-pan-y">
              {filteredStudents.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p style={{ color: "#0f172a" }} className="text-sm font-black">{s.name}</p>
                    <p style={{ color: "#059669" }} className="text-xs font-mono font-bold mt-0.5">{s.uniqueId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isLocked}
                      onClick={() => handleSetAttendance(s.id, true)}
                      style={{
                        backgroundColor: s.markedPresent ? "#059669" : "#f1f5f9",
                        color: s.markedPresent ? "#ffffff" : "#334155",
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Present
                    </button>
                    <button
                      disabled={isLocked}
                      onClick={() => handleSetAttendance(s.id, false)}
                      style={{
                        backgroundColor: !s.markedPresent ? "#e11d48" : "#f1f5f9",
                        color: !s.markedPresent ? "#ffffff" : "#334155",
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
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
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="w-full py-4 rounded-xl font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide hover:bg-blue-700"
              >
                {submitting ? "Submitting..." : `Submit Class Attendance (${presentCount} Present)`}
              </button>
            )}
          </div>
        )}

        {/* Today's Timetable Schedules Cards List */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-gray-900">Today's Class Timetable</h3>
            </div>
            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              {todaySchedules.length} Periods Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium text-center py-6">No scheduled classes for today</p>
            ) : (
              todaySchedules.map((s) => {
                const isCurrent = s.isCurrentTimeSlot || s.id === activeSchedule?.id;
                const isSubmitted = s.status === "submitted";
                const isLocked = s.status === "locked" && !isCurrent;

                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? "bg-blue-50/80 border-blue-300 shadow-xs"
                        : isSubmitted
                        ? "bg-emerald-50/60 border-emerald-200"
                        : "bg-gray-50/70 border-gray-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-blue-800 text-[10px] font-black uppercase">
                          {s.year} Yr - {s.section}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-gray-900">{s.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSubmitted ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          ✓ Submitted ({s.session?.student_count || 0} Present)
                        </span>
                      ) : isCurrent ? (
                        <button
                          onClick={() => setActiveSchedule(s)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                          Take Attendance
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-600 border border-gray-300 flex items-center gap-1.5 cursor-not-allowed opacity-85"
                        >
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                          Locked (Starts at {s.start_time.slice(0, 5)})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Faculty Settings & Profile Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-gray-900">Faculty Settings & Profile</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm transition-colors">✕</button>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div>
                <p className="text-gray-400 font-medium">Logged in as</p>
                <p className="text-sm font-black text-gray-900">{activeFaculty?.name}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Role / Department</p>
                <p className="text-xs font-bold text-blue-800">{activeFaculty?.section} Faculty • CSE Data Science</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">App Build Version</p>
                <p className="text-xs font-mono font-bold text-gray-700">v1.7.0 (Latest Release)</p>
              </div>
            </div>

            <button
              onClick={() => { setShowSettingsModal(false); logout(); }}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4 text-white" />
              Logout from Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
