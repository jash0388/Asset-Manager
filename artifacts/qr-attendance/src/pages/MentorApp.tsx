import { useEffect, useState } from "react";
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
  Download,
  X,
  Search,
  AlertTriangle,
  Lock,
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
  section: string;
  scannedGate: boolean;
  gateEntryTime: string | null;
  markedPresent: boolean;
  markedByTeacher: boolean;
  scannedQr: boolean;
  warningNotScanned: boolean;
};

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export default function MentorApp() {
  const { mentor, role, logout } = useAuth();
  const [, navigate] = useLocation();
  
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<ScheduleStudent[]>([]);
  const [serverTime, setServerTime] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { canInstall, install } = usePwaInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  useEffect(() => {
    if (role !== "mentor") {
      navigate("/login");
    }
  }, [role, navigate]);

  const loadActiveSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current active schedule
      const res = await customFetch<{ activeSchedule: Schedule | null; session: Session | null; serverTime: any }>("/api/mentor/active-schedule");
      setActiveSchedule(res.activeSchedule);
      setSession(res.session);
      setServerTime(res.serverTime);

      if (res.activeSchedule) {
        // 2. Start a session if not already started
        let currentSession = res.session;
        if (!currentSession) {
          currentSession = await customFetch<Session>("/api/mentor/start-session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ scheduleId: res.activeSchedule.id }),
          });
          setSession(currentSession);
        }

        // 3. Fetch student list for this schedule
        const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${res.activeSchedule.id}`);
        
        // Auto-check students who already scanned at the gate on first load
        const mappedStudents = studentData.map(s => {
          if (!s.markedByTeacher && s.scannedGate) {
            return { ...s, markedPresent: true };
          }
          return s;
        });

        setStudents(mappedStudents);
      }
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load active schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "mentor") loadActiveSchedule();
  }, [role]);  const handleSetAttendance = (studentId: number, isPresent: boolean) => {
    if (isLocked) return;
    
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            markedPresent: isPresent,
            warningNotScanned: isPresent && !s.scannedGate
          };
        }
        return s;
      })
    );
  };

  const handleSubmitAttendance = async () => {
    if (!activeSchedule || isLocked) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        markedPresent: s.markedPresent
      }));

      const res = await customFetch<{ message: string; presentCount: number }>("/api/mentor/submit-attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scheduleId: activeSchedule.id,
          students: records
        })
      });

      setSuccess(`Attendance submitted successfully! ${res.presentCount} students present.`);
      // Refresh to lock state
      await loadActiveSchedule();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to determine if the class hour has passed
  const isTimePast = () => {
    if (!activeSchedule) return false;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    return timeStr > activeSchedule.end_time;
  };

  const isLocked = !!(session?.ended_at || isTimePast());

  if (role !== "mentor") return null;

  // Filtered and sorted students:
  // Show warnings/flags, and allow filtering via search query
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter((s) => s.markedPresent).length;
  const warningsCount = students.filter((s) => s.warningNotScanned).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-350 font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-850 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shadow-md shadow-green-600/10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-200 truncate">Mentor Hourly App</h1>
            <p className="text-xs text-slate-400 truncate">{mentor?.name} · {mentor?.email}</p>
          </div>
          <button
            data-testid="mentor-logout"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-red-900/20 text-slate-300 hover:text-red-600 border border-slate-800 text-xs font-semibold transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      {canInstall && showInstallBanner && (
        <div className="bg-green-600 text-white px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Install Mentor App</p>
              <p className="text-xs text-green-100 mt-0.5">Add to your home screen for quick access — works offline too!</p>
            </div>
            <button
              onClick={install}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-green-700 text-xs font-bold hover:bg-green-50 transition-colors active:scale-[0.97]"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto p-4">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/30 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-900/30 border border-green-800 text-green-200 text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : !activeSchedule ? (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-8 text-center shadow-sm">
            <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-200 text-base font-bold">No active class scheduled at this time.</p>
            <p className="text-slate-400 text-xs mt-2">
              Timetable classes run Monday to Saturday. Check your class schedule in the timetable.
            </p>
            <button
              onClick={loadActiveSchedule}
              className="mt-6 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-white text-sm font-semibold border border-slate-700"
            >
              Refresh Time Check
            </button>
          </div>
        ) : (
          <>
            {/* Active Class Header Info */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 mb-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 text-xs font-bold border border-purple-800">
                    {activeSchedule.year} Yr - Section {activeSchedule.section}
                  </span>
                  <h2 className="text-lg font-black text-slate-100 mt-2">
                    {activeSchedule.subject || "Lecture Class"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Lecture hour: <span className="text-slate-200 font-semibold">{activeSchedule.start_time.slice(0,5)} - {activeSchedule.end_time.slice(0,5)}</span>
                  </p>
                </div>
                {isLocked ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950 border border-red-800 text-red-400 text-xs font-bold">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-950 border border-green-800 text-green-400 text-xs font-bold animate-pulse">
                    ● Active Now
                  </span>
                )}
              </div>

              {isLocked && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs">
                  ⚠️ Attendance session for this lecture hour is locked. You cannot modify or submit attendance now.
                </div>
              )}
            </div>

            {/* Attendance stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Class</p>
                <p className="text-xl font-black text-slate-200 mt-1">{students.length}</p>
              </div>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</p>
                <p className="text-xl font-black text-green-500 mt-1">{presentCount}</p>
              </div>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Gate Scan</p>
                <p className={`text-xl font-black mt-1 ${warningsCount > 0 ? "text-amber-500" : "text-slate-400"}`}>
                  {warningsCount}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-250"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Student List */}
            {filteredStudents.length === 0 ? (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-8 text-center">
                <p className="text-slate-450 text-sm">No students matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-xl divide-y divide-slate-850 overflow-hidden shadow-sm mb-6">
                {filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-900/20 transition-colors"
                  >
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-200 truncate">{s.name}</p>
                        {s.scannedGate ? (
                          <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-400 text-[9px] font-bold border border-green-800">
                            Gate Scanned
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-450 text-[9px] border border-slate-800">
                            No Gate Scan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{s.uniqueId}</p>
                    </div>

                    {/* Warning Flag */}
                    {s.warningNotScanned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 text-[9px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Not scanned the QR code
                      </span>
                    )}

                    {/* Present / Absent Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isLocked}
                        onClick={() => handleSetAttendance(s.id, true)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          s.markedPresent
                            ? "bg-green-600 border-green-500 text-white shadow-sm shadow-green-600/10"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        disabled={isLocked}
                        onClick={() => handleSetAttendance(s.id, false)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          !s.markedPresent
                            ? "bg-red-900/65 border-red-800 text-red-200 shadow-sm shadow-red-900/10"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submission Button */}
            {!isLocked && (
              <button
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Hourly Attendance"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
