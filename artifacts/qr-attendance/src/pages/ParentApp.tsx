import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  User, Calendar, Clock, CheckCircle2, XCircle, Search, ShieldCheck,
  BookOpen, AlertTriangle, ArrowLeft, RefreshCw, GraduationCap, Download
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

type ParentReportData = {
  student: {
    id: number;
    name: string;
    uniqueId: string;
    section: string;
    role: string;
  };
  today: {
    date: string;
    day: string;
    entryTime: string | null;
    exitTime: string | null;
    gateStatus: "PRESENT" | "LEFT" | "MISSED_EXIT" | "ABSENT";
    scannedGate: boolean;
  };
  todaySchedule: Array<{
    id: number;
    subject: string;
    startTime: string;
    endTime: string;
    teacherName: string;
    markedPresent: boolean | null;
    status: "PRESENT" | "ABSENT" | "PENDING";
  }>;
  summary: {
    totalDaysPresent: number;
  };
  history: Array<{
    date: string;
    entry_time: string | null;
    exit_time: string | null;
  }>;
};

function formatTime(isoStr: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "—";
  }
}

export default function ParentApp() {
  const [, match] = useRoute("/parent/:uniqueId");
  const [, navigate] = useLocation();

  const queryParams = new URLSearchParams(window.location.search);
  const rollFromUrl = match?.uniqueId || queryParams.get("rollNumber") || queryParams.get("uid") || "";

  const [rollInput, setRollInput] = useState(rollFromUrl);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ParentReportData | null>(null);
  const [error, setError] = useState("");

  const LOCAL_VERSION_CODE = 1;
  const LOCAL_VERSION_NAME = "1.0.0";
  const [updateInfo, setUpdateInfo] = useState<{
    latestVersionCode: number;
    latestVersionName: string;
    downloadUrl: string;
    forceUpdate: boolean;
    releaseNotes: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ver = await customFetch<any>("/api/parent-version");
        if (ver && ver.latestVersionCode > LOCAL_VERSION_CODE) {
          setUpdateInfo(ver);
        }
      } catch {}
    })();
  }, []);

  const fetchReport = async (roll: string) => {
    const clean = roll.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError("");
    try {
      const res = await customFetch<ParentReportData>(`/api/parent/student-report?rollNumber=${encodeURIComponent(clean)}`);
      setData(res);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || `No student found matching Roll Number '${clean}'. Please check the roll number and try again.`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rollFromUrl) {
      fetchReport(rollFromUrl);
    }
  }, [rollFromUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollInput.trim()) return;
    fetchReport(rollInput);
  };

  const directApkUrl = "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/ParentApp.apk";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Auto-Update Top Banner */}
      {updateInfo && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-blue-400/50 p-3.5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              🚀
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider block text-yellow-300">
                New Parent App Update (v{updateInfo.latestVersionName}) Available!
              </span>
              <span className="text-[11px] font-medium text-blue-100 block mt-0.5">{updateInfo.releaseNotes}</span>
            </div>
          </div>
          <a
            href={directApkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download APK Update
          </a>
        </div>
      )}

      {/* Modern High-Contrast Safe-Area Header */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 pt-6 pb-3 sm:pt-4 sm:pb-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white shadow-md shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">Parent Attendance App</h1>
              <p className="text-[11px] font-bold text-slate-400">Sphoorthy Engineering College • v{LOCAL_VERSION_NAME}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-1 sm:mt-0">
            <a
              href={directApkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 border border-blue-400/40 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Get App (APK)
            </a>

            {data && (
              <button
                onClick={() => fetchReport(data.student.uniqueId)}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Mobile-Friendly Search Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <label className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            Search Student by Roll Number / Student ID
          </label>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 24N81A6758"
              value={rollInput}
              onChange={(e) => setRollInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-base tracking-widest uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:font-sans placeholder:font-semibold placeholder:text-slate-500 placeholder:text-sm"
            />
            <button
              type="submit"
              disabled={loading || !rollInput.trim()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Check Attendance"}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Report Content */}
        {data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Student Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner">
                    {data.student.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-wide">{data.student.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 font-mono font-bold text-xs">
                        {data.student.uniqueId}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-extrabold text-xs">
                        {data.student.section}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Campus Days</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{data.summary.totalDaysPresent} Days</span>
                </div>
              </div>
            </div>

            {/* Gate Attendance Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Today's Campus Gate Entry/Exit ({data.today.date})
                </h3>
                <span className="text-xs font-bold text-slate-400 font-mono">{data.today.day}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gate Status */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Campus Status</span>
                  <div className="mt-2">
                    {data.today.gateStatus === "PRESENT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Campus
                      </span>
                    ) : data.today.gateStatus === "LEFT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-extrabold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Exited Campus
                      </span>
                    ) : data.today.gateStatus === "MISSED_EXIT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Not Scanned Exit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold text-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        No Gate Scan Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Gate Entry Time */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gate Entry Time</span>
                  <span className="text-base font-black text-white mt-1 font-mono">
                    {formatTime(data.today.entryTime)}
                  </span>
                </div>

                {/* Gate Exit Time */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gate Exit Time</span>
                  <span className="text-base font-black text-white mt-1 font-mono">
                    {data.today.gateStatus === "MISSED_EXIT" ? (
                      <span className="text-amber-400 text-xs font-sans font-bold">⚠️ Missed Exit Scan</span>
                    ) : (
                      formatTime(data.today.exitTime)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Class Schedule & Hourly Subject Attendance */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Today's Class Timetable & Subject Attendance
                </h3>
                <span className="text-xs font-bold text-slate-400">{data.todaySchedule.length} Classes Today</span>
              </div>

              {data.todaySchedule.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold">
                  No classes scheduled for {data.student.section} today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.todaySchedule.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-white">{slot.subject}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">Faculty: {slot.teacherName}</p>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Class Attendance:</span>
                        {slot.status === "PRESENT" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Present in Class
                          </span>
                        ) : slot.status === "ABSENT" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Absent in Class
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800">
                            Upcoming Class
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gate Attendance History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Recent Gate Attendance History Log
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Gate Entry Time</th>
                      <th className="py-3 px-4">Gate Exit Time</th>
                      <th className="py-3 px-4 text-right">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {data.history.map((h, i) => {
                      const hasEntry = h.entry_time;
                      const hasExit = h.exit_time;
                      const status = hasEntry && hasExit ? "Left Campus" : hasEntry ? "In Campus / Missed Exit" : "Absent";
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 text-xs font-semibold text-slate-200">
                          <td className="py-3 px-4 font-mono text-white font-bold">{h.date}</td>
                          <td className="py-3 px-4 font-mono">{formatTime(h.entry_time)}</td>
                          <td className="py-3 px-4 font-mono">{formatTime(h.exit_time)}</td>
                          <td className="py-3 px-4 text-right font-extrabold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              hasEntry && hasExit ? "bg-blue-500/20 text-blue-300" : hasEntry ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
