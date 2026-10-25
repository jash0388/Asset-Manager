import { useState } from "react";
import { useParams } from "wouter";
import {
  useSearchUsers,
  useGetUserAttendance,
  getSearchUsersQueryKey,
  getGetUserAttendanceQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { Search, Download, Calendar, Clock, AlertCircle, XCircle } from "lucide-react";

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(mins: number | null | undefined) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isExitTimeOver(logDate: string | null | undefined, exitTime: string | null | undefined) {
  if (exitTime) return false;
  if (!logDate) return false;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    const getPart = (type: string) => parts.find((part) => part.type === type)?.value || "";
    
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = parseInt(getPart("hour"), 10);
    const minute = parseInt(getPart("minute"), 10);
    
    const todayStr = `${year}-${month}-${day}`;
    
    if (logDate < todayStr) {
      return true;
    }
    if (logDate === todayStr) {
      return hour > 16 || (hour === 16 && minute >= 30);
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

function StatusBadge({ status, exitOver }: { status: string; exitOver?: boolean }) {
  const map: Record<string, string> = {
    inside: "border-emerald-300 bg-emerald-50 text-emerald-800",
    left: "border-slate-300 bg-slate-50 text-slate-600",
    present: "border-blue-300 bg-blue-50 text-blue-800",
  };
  const labels: Record<string, string> = {
    inside: exitOver ? "Present" : "Inside",
    left: "Left",
    present: "Present",
  };
  return (
    <span className={`stamp ${map[status] ?? "border-slate-300 bg-slate-50 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function HistoryPanel({ userId }: { userId: number }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState<{ from?: string; to?: string }>({});

  const { data, isLoading } = useGetUserAttendance(userId, applied, {
    query: {
      queryKey: getGetUserAttendanceQueryKey(userId, applied),
      enabled: !!userId,
    }
  });

  const exportCsv = () => {
    if (!data) return;
    const headers = ["Date", "Entry", "Exit", "Duration", "Status"];
    const rows = data.records.map((r) => [
      r.date,
      formatTime(r.entryTime),
      formatTime(r.exitTime),
      formatDuration(r.durationMinutes),
      r.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `history-${data.user.name.replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
        <div className="h-12 bg-slate-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { user, records, summary } = data;

  return (
    <div className="space-y-4">
      {/* User info */}
      <div className="bg-card border border-slate-300/70 rounded-lg p-4 shadow-xs relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-base font-bold text-slate-800 flex-shrink-0 font-mono">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950 tracking-tight" style={{ fontFamily: "var(--app-font-display)" }}>
              {user.name}
            </h2>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              {user.role === "student" ? "Student" : "Staff"} · ID: {user.uniqueId}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Days Present", value: summary.totalDaysPresent, icon: Calendar, color: "bg-blue-600" },
          { label: "Avg Time Spent", value: formatDuration(summary.averageMinutesSpent), icon: Clock, color: "bg-emerald-600" },
          { label: "Late Entries", value: summary.lateEntriesCount, icon: AlertCircle, color: "bg-amber-500" },
          { label: "Total Records", value: summary.totalDaysChecked, icon: Calendar, color: "bg-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-slate-300/70 rounded-lg p-3.5 shadow-xs relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${color}`} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="eyebrow text-slate-500">{label}</p>
                <p className="text-[22px] leading-none font-bold text-slate-950 mt-2 font-mono tabular-nums">{value}</p>
              </div>
              <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <div className="bg-card border border-slate-300/70 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="eyebrow block text-slate-500 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="eyebrow block text-slate-500 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setApplied({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}
              className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Apply
            </button>
            <button
              onClick={exportCsv}
              disabled={!records.length}
              className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 disabled:opacity-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-card border border-slate-300/70 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table data-testid="history-table" className="w-full">
            <thead className="bg-slate-100 border-b border-slate-300/70">
              <tr className="eyebrow text-slate-500">
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-4 py-2.5">Entry</th>
                <th className="text-left px-4 py-2.5">Exit</th>
                <th className="text-left px-4 py-2.5">Duration</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {!records.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                      <p className="text-[13px] text-slate-600 font-medium">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-slate-950">{rec.date}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{formatTime(rec.entryTime)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">
                      {isExitTimeOver(rec.date, rec.exitTime) ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-[10px]">
                          <XCircle className="w-3 h-3 text-red-500" />
                          Not Scanned
                        </span>
                      ) : (
                        formatTime(rec.exitTime)
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700 font-medium">{formatDuration(rec.durationMinutes)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={rec.status} exitOver={isExitTimeOver(rec.date, rec.exitTime)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const params = useParams<{ userId?: string }>();
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(params.userId ? parseInt(params.userId) : null);

  const { data: searchResults = [], isLoading: searching } = useSearchUsers(
    { query: query || " " },
    {
      query: {
        queryKey: getSearchUsersQueryKey({ query: query || " " }),
        enabled: query.length >= 2,
      },
    }
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
        <BackButton />
        {/* Page header */}
        <div className="pb-4 border-b border-slate-300/70">
          <p className="eyebrow text-slate-500">Student Register</p>
          <h1
            className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5"
            style={{ fontFamily: "var(--app-font-display)" }}
          >
            Student History
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">Search and view complete attendance history</p>
        </div>

        {/* Search */}
        <div className="bg-card border border-slate-300/70 rounded-lg p-4 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              data-testid="history-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
            />
          </div>

          {query.length >= 2 && (
            <div className="mt-3 border border-slate-300/70 rounded-md overflow-hidden bg-white shadow-md divide-y divide-slate-200">
              {searching ? (
                <div className="px-3 py-2.5 text-xs text-slate-500 font-medium">Searching...</div>
              ) : !searchResults.length ? (
                <div className="px-3 py-2.5 text-xs text-slate-500 font-medium">No users found</div>
              ) : (
                searchResults.map((user) => (
                  <button
                    data-testid={`search-result-${user.id}`}
                    key={user.id}
                    onClick={() => { setSelectedUserId(user.id); setQuery(""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0 font-mono">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-950">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{user.role} · {user.uniqueId}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* History */}
        {selectedUserId ? (
          <HistoryPanel userId={selectedUserId} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-slate-300/70 rounded-lg shadow-xs">
            <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <p className="eyebrow text-slate-500 mb-1.5">No Record Selected</p>
            <p className="text-slate-600 text-[13px] font-medium max-w-xs">
              Search for a student or staff member to view their attendance history
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
