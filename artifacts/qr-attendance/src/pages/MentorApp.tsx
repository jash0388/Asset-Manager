import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  XCircle,
  History as HistoryIcon,
  ArrowLeft,
  Loader2,
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

  useEffect(() => {
    if (role !== "mentor") {
      navigate("/login");
    }
  }, [role, navigate]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customFetch<MentorStudent[]>("/api/mentor/students");
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">Mentor Dashboard</h1>
            <p className="text-xs text-slate-400 truncate">{mentor?.name} · {mentor?.email}</p>
          </div>
          <button
            data-testid="mentor-logout"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {/* Today summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Assigned</p>
            <p className="text-2xl font-bold mt-1">{students.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Came Today</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{cameCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Absent</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{students.length - cameCount}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">No students assigned yet.</p>
            <p className="text-slate-500 text-xs mt-2">
              Ask the admin to assign students to your account.
            </p>
          </div>
        ) : (
          <div data-testid="mentor-students" className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
            {students.map((s) => (
              <div key={s.user.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200 flex-shrink-0">
                  {s.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {s.user.uniqueId}
                    {s.attendanceToday?.entryTime && ` · in ${formatTime(s.attendanceToday.entryTime)}`}
                    {s.attendanceToday?.exitTime && ` · out ${formatTime(s.attendanceToday.exitTime)}`}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    s.cameToday ? "bg-green-900/40 text-green-300" : "bg-red-900/30 text-red-300"
                  }`}
                >
                  {s.cameToday ? (
                    <>
                      <CheckCircle className="w-3 h-3" /> Came
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Absent
                    </>
                  )}
                </span>
                <button
                  data-testid={`mentor-history-${s.user.id}`}
                  onClick={() => openHistory(s)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg sm:rounded-2xl bg-slate-900 border-t sm:border border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <button
                data-testid="close-mentor-history"
                onClick={() => { setHistoryFor(null); setHistory(null); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-white">{historyFor.user.name}</h2>
                <p className="text-xs text-slate-400">{historyFor.user.uniqueId}</p>
              </div>
            </div>
            {historyLoading || !history ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-800 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Days</p>
                    <p className="text-lg font-bold">{history.summary.totalDaysPresent}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Avg min</p>
                    <p className="text-lg font-bold">{history.summary.averageMinutesSpent}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Late</p>
                    <p className="text-lg font-bold">{history.summary.lateEntriesCount}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
                  {history.records.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">No attendance records</div>
                  ) : (
                    history.records.map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="text-sm text-slate-300 w-24 flex-shrink-0">{r.date}</div>
                        <div className="text-xs text-slate-400 flex-1">
                          In {formatTime(r.entryTime)} · Out {formatTime(r.exitTime)}
                          {r.durationMinutes !== null && ` · ${r.durationMinutes}m`}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "inside"
                              ? "bg-green-900/40 text-green-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {r.status === "inside" ? "Inside" : "Left"}
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
