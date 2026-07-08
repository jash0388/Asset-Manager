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
  History as HistoryIcon,
  ArrowLeft,
  Loader2,
  Download,
  X,
} from "lucide-react";

type MentorStudent = {
  user: {
    id: number;
    name: string;
    uniqueId: string;
    role: string;
    mentorId: number | null;
  };
  attendanceToday: {
    id: number;
    entryTime: string | null;
    exitTime: string | null;
    status: "inside" | "left" | "present";
  } | null;
  cameToday: boolean;
};

type AttendanceHistory = {
  user: { id: number; name: string; uniqueId: string };
  records: Array<{
    id: number;
    date: string;
    entryTime: string | null;
    exitTime: string | null;
    durationMinutes: number | null;
    status: "inside" | "left" | "present";
  }>;
  summary: {
    totalDaysPresent: number;
    averageMinutesSpent: number;
    lateEntriesCount: number;
    totalDaysChecked: number;
  };
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MentorApp() {
  const { mentor, role, logout } = useAuth();
  const [, navigate] = useLocation();
  const [students, setStudents] = useState<MentorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<MentorStudent | null>(null);
  const [history, setHistory] = useState<AttendanceHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { canInstall, install } = usePwaInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  useEffect(() => {
    if (role !== "mentor") {
      navigate("/login");
    }
  }, [role, navigate]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = mentor?.section 
        ? `/api/mentor/students?section=${encodeURIComponent(mentor.section)}`
        : "/api/mentor/students";
      const data = await customFetch<MentorStudent[]>(url);
      setStudents(data);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "mentor") loadStudents();
  }, [role]);

  const openHistory = async (s: MentorStudent) => {
    setHistoryFor(s);
    setHistory(null);
    setHistoryLoading(true);
    try {
      const data = await customFetch<AttendanceHistory>(`/api/mentor/attendance/${s.user.id}`);
      setHistory(data);
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  if (role !== "mentor") return null;

  const cameCount = students.filter((s) => s.cameToday).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-350 font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-850 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shadow-md shadow-green-600/10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-300 truncate">Mentor Dashboard</h1>
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
        {/* Today summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
            <p className="text-2xl font-black text-slate-300 mt-1">{students.length}</p>
          </div>
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Came Today</p>
            <p className="text-2xl font-black text-green-600 mt-1">{cameCount}</p>
          </div>
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-black text-red-600 mt-1">{students.length - cameCount}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-8 text-center shadow-sm">
            <p className="text-slate-300 text-sm font-bold">No students assigned yet.</p>
            <p className="text-slate-400 text-xs mt-2">
              Ask the admin to assign students to your account.
            </p>
          </div>
        ) : (
          <div data-testid="mentor-students" className="bg-slate-950 border border-slate-850 rounded-xl divide-y divide-slate-850 overflow-hidden shadow-sm">
            {students.map((s) => (
              <div key={s.user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
                  {s.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-300 truncate">{s.user.name}</p>
                  <p className="text-xs text-slate-450 font-medium truncate mt-0.5">
                    {s.user.uniqueId}
                    {s.attendanceToday?.entryTime && ` · In ${formatTime(s.attendanceToday.entryTime)}`}
                    {s.attendanceToday?.exitTime && ` · Out ${formatTime(s.attendanceToday.exitTime)}`}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    s.cameToday 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {s.cameToday ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Came
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Absent
                    </>
                  )}
                </span>
                <button
                  data-testid={`mentor-history-${s.user.id}`}
                  onClick={() => openHistory(s)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
                  title="History"
                >
                  <HistoryIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History modal */}
      {historyFor && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg sm:rounded-2xl bg-slate-950 border-t sm:border border-slate-850 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-850">
              <button
                data-testid="close-mentor-history"
                onClick={() => { setHistoryFor(null); setHistory(null); }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-300">{historyFor.user.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{historyFor.user.uniqueId}</p>
              </div>
            </div>
            {historyLoading || !history ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-850 text-center bg-slate-900/50">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days</p>
                    <p className="text-lg font-extrabold text-slate-300 mt-0.5">{history.summary.totalDaysPresent}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg min</p>
                    <p className="text-lg font-extrabold text-slate-300 mt-0.5">{history.summary.averageMinutesSpent}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Late</p>
                    <p className="text-lg font-extrabold text-slate-300 mt-0.5">{history.summary.lateEntriesCount}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
                  {history.records.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500 font-medium">No attendance records yet</div>
                  ) : (
                    history.records.map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-300 w-24 flex-shrink-0">{r.date}</div>
                        <div className="text-xs text-slate-450 flex-1">
                          In {formatTime(r.entryTime)} · Out {formatTime(r.exitTime)}
                          {r.durationMinutes !== null && ` · ${r.durationMinutes}m`}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === "inside"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}
                        >
                          {r.status === "inside" ? "In Campus" : "Left Campus"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
