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
    inside: "bg-blue-100 text-blue-900 border-2 border-blue-400 font-black",
    left: "bg-slate-100 text-slate-700 border border-slate-300 font-bold",
    present: "bg-blue-100 text-blue-900 border-2 border-blue-400 font-black",
  };
  const labels: Record<string, string> = {
    inside: exitOver ? "Present" : "Inside",
    left: "Left",
    present: "Present",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${map[status] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>
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
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { user, records, summary } = data;

  return (
    <div className="space-y-3">
      {/* User info */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg font-black text-blue-700 flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {user.role === "student" ? "Student" : "Staff"} · ID: <span className="font-mono font-semibold text-gray-700">{user.uniqueId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: "Days Present", value: summary.totalDaysPresent, icon: Calendar, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Avg Time Spent", value: formatDuration(summary.averageMinutesSpent), icon: Clock, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Late Entries", value: summary.lateEntriesCount, icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
          { label: "Total Records", value: summary.totalDaysChecked, icon: Calendar, color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`bg-white border border-gray-200 rounded-xl p-3 shadow-xs`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setApplied({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Apply
            </button>
            <button
              onClick={exportCsv}
              disabled={!records.length}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-xs font-bold border border-gray-200 shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table data-testid="history-table" className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Entry</th>
                <th className="text-left px-4 py-2">Exit</th>
                <th className="text-left px-4 py-2">Duration</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {!records.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400 font-medium">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-bold text-gray-900">{rec.date}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-700">{formatTime(rec.entryTime)}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-700">
                      {isExitTimeOver(rec.date, rec.exitTime) ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[10px]">
                          <XCircle className="w-3 h-3 text-red-500" />
                          Not Scanned
                        </span>
                      ) : (
                        formatTime(rec.exitTime)
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700 font-medium">{formatDuration(rec.durationMinutes)}</td>
                    <td className="px-4 py-2">
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
      <div className="p-3 sm:p-4 max-w-5xl mx-auto space-y-3">
        <BackButton />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Student History</h1>
          <p className="text-xs text-gray-500 mt-0.5">Search and view complete attendance history</p>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              data-testid="history-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          {query.length >= 2 && (
            <div className="mt-2.5 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md divide-y divide-gray-100">
              {searching ? (
                <div className="px-3 py-2 text-xs text-gray-500 font-medium">Searching...</div>
              ) : !searchResults.length ? (
                <div className="px-3 py-2 text-xs text-gray-500 font-medium">No users found</div>
              ) : (
                searchResults.map((user) => (
                  <button
                    data-testid={`search-result-${user.id}`}
                    key={user.id}
                    onClick={() => { setSelectedUserId(user.id); setQuery(""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{user.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{user.role} · {user.uniqueId}</p>
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-xs font-medium">Search for a student or staff member to view their attendance history</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
