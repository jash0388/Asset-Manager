import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  User, Calendar, Clock, CheckCircle2, XCircle, Search, ShieldCheck,
  BookOpen, AlertTriangle, ArrowLeft, RefreshCw, GraduationCap, Download, Rocket
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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Auto-Update Top Banner */}
      {updateInfo && (
        <div className="bg-blue-50 border-b border-blue-300 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <span className="eyebrow block text-blue-800">
                New Parent App Update (v{updateInfo.latestVersionName}) Available!
              </span>
              <span className="text-[11px] font-medium text-blue-900 block mt-0.5">{updateInfo.releaseNotes}</span>
            </div>
          </div>
          <a
            href={directApkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider shadow-xs shrink-0 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download APK Update
          </a>
        </div>
      )}

      {/* Safe-Area Header */}
      <header className="bg-white border-b border-slate-300/70 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-base font-bold text-slate-950 leading-tight tracking-tight"
                style={{ fontFamily: "var(--app-font-display)" }}
              >
                Parent Attendance App
              </h1>
              <p className="text-[11px] font-mono text-slate-500">Sphoorthy Engineering College · v{LOCAL_VERSION_NAME}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-1 sm:mt-0">
            <a
              href={directApkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Get App (APK)
            </a>

            {data && (
              <button
                onClick={() => fetchReport(data.student.uniqueId)}
                disabled={loading}
                className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-5">
        {/* Mobile-Friendly Search Card */}
        <div className="bg-card border border-slate-300/70 rounded-lg p-5 shadow-xs space-y-3">
          <label className="eyebrow text-slate-500 flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Search Student by Roll Number / Student ID
          </label>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 24N81A6758"
              value={rollInput}
              onChange={(e) => setRollInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-md bg-white border border-slate-300 text-slate-950 font-mono font-semibold text-base tracking-widest uppercase focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={loading || !rollInput.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Check Attendance"}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-md bg-red-50 border border-red-300 text-red-800 text-xs font-medium flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Report Content */}
        {data && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Student Profile Card */}
            <div className="bg-card border border-slate-300/70 rounded-lg p-5 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-slate-100 border border-slate-200 text-xl font-bold text-slate-800 flex items-center justify-center shrink-0 font-mono">
                    {data.student.name.charAt(0)}
                  </div>
                  <div>
                    <h2
                      className="text-xl font-bold text-slate-950 tracking-tight"
                      style={{ fontFamily: "var(--app-font-display)" }}
                    >
                      {data.student.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="stamp border-blue-300 bg-blue-50 text-blue-800">{data.student.uniqueId}</span>
                      <span className="stamp border-slate-300 bg-slate-50 text-slate-700">{data.student.section}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-md text-left sm:text-right shrink-0">
                  <span className="eyebrow text-slate-500 block">Total Campus Days</span>
                  <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1.5 block">
                    {data.summary.totalDaysPresent} Days
                  </span>
                </div>
              </div>
            </div>

            {/* Gate Attendance Status Card */}
            <div className="bg-card border border-slate-300/70 rounded-lg shadow-xs overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
                <h3
                  className="text-[13px] font-bold text-slate-950 flex items-center gap-2"
                  style={{ fontFamily: "var(--app-font-display)" }}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Today's Campus Gate Entry/Exit ({data.today.date})
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{data.today.day}</span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gate Status */}
                <div className="p-4 rounded-md bg-white border border-slate-200 flex flex-col justify-between">
                  <span className="eyebrow text-slate-500">Campus Status</span>
                  <div className="mt-2.5">
                    {data.today.gateStatus === "PRESENT" ? (
                      <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        In Campus
                      </span>
                    ) : data.today.gateStatus === "LEFT" ? (
                      <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Exited Campus
                      </span>
                    ) : data.today.gateStatus === "MISSED_EXIT" ? (
                      <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        Not Scanned Exit
                      </span>
                    ) : (
                      <span className="stamp border-red-300 bg-red-50 text-red-800">
                        <XCircle className="w-3 h-3" />
                        No Gate Scan Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Gate Entry Time */}
                <div className="p-4 rounded-md bg-white border border-slate-200 flex flex-col justify-between">
                  <span className="eyebrow text-slate-500">Gate Entry Time</span>
                  <span className="text-lg font-bold text-slate-950 mt-2.5 font-mono tabular-nums">
                    {formatTime(data.today.entryTime)}
                  </span>
                </div>

                {/* Gate Exit Time */}
                <div className="p-4 rounded-md bg-white border border-slate-200 flex flex-col justify-between">
                  <span className="eyebrow text-slate-500">Gate Exit Time</span>
                  <span className="text-lg font-bold text-slate-950 mt-2.5 font-mono tabular-nums">
                    {data.today.gateStatus === "MISSED_EXIT" ? (
                      <span className="text-amber-700 text-xs font-sans font-bold inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Missed Exit Scan
                      </span>
                    ) : (
                      formatTime(data.today.exitTime)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Class Schedule & Hourly Subject Attendance */}
            <div className="bg-card border border-slate-300/70 rounded-lg shadow-xs overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
                <h3
                  className="text-[13px] font-bold text-slate-950 flex items-center gap-2"
                  style={{ fontFamily: "var(--app-font-display)" }}
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Today's Class Timetable &amp; Subject Attendance
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{data.todaySchedule.length} Classes Today</span>
              </div>

              <div className="p-5">
              {data.todaySchedule.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-md border border-slate-200 text-slate-600 text-[13px] font-medium">
                  No classes scheduled for {data.student.section} today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.todaySchedule.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-md bg-white border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-950">{slot.subject}</h4>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Faculty: {slot.teacherName}</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                        <span className="eyebrow text-slate-500">Class Attendance</span>
                        {slot.status === "PRESENT" ? (
                          <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Present in Class
                          </span>
                        ) : slot.status === "ABSENT" ? (
                          <span className="stamp border-red-300 bg-red-50 text-red-800">
                            <XCircle className="w-3 h-3" /> Absent in Class
                          </span>
                        ) : (
                          <span className="stamp border-slate-300 bg-slate-50 text-slate-500">
                            Upcoming Class
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>

            {/* Gate Attendance History */}
            <div className="bg-card border border-slate-300/70 rounded-lg shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
                <h3
                  className="text-[13px] font-bold text-slate-950 flex items-center gap-2"
                  style={{ fontFamily: "var(--app-font-display)" }}
                >
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Recent Gate Attendance History Log
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300/70">
                    <tr className="eyebrow text-slate-500">
                      <th className="py-2.5 px-5 text-left">Date</th>
                      <th className="py-2.5 px-5 text-left">Gate Entry Time</th>
                      <th className="py-2.5 px-5 text-left">Gate Exit Time</th>
                      <th className="py-2.5 px-5 text-right">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.history.map((h, i) => {
                      const hasEntry = h.entry_time;
                      const hasExit = h.exit_time;
                      const status = hasEntry && hasExit ? "Left Campus" : hasEntry ? "In Campus / Missed Exit" : "Absent";
                      return (
                        <tr key={i} className="hover:bg-slate-50 text-xs">
                          <td className="py-3 px-5 font-mono text-[11px] font-semibold text-slate-950">{h.date}</td>
                          <td className="py-3 px-5 font-mono text-[11px] text-slate-700">{formatTime(h.entry_time)}</td>
                          <td className="py-3 px-5 font-mono text-[11px] text-slate-700">{formatTime(h.exit_time)}</td>
                          <td className="py-3 px-5 text-right">
                            <span className={`stamp ${
                              hasEntry && hasExit ? "border-blue-300 bg-blue-50 text-blue-800" : hasEntry ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"
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
