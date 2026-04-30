import { useState } from "react";
import { useListAttendance, getListAttendanceQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { Download, Filter } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    inside: "bg-green-900/40 text-green-400",
    left: "bg-slate-700 text-slate-300",
    present: "bg-blue-900/40 text-blue-400",
  };
  const labels: Record<string, string> = { inside: "Inside", left: "Left", present: "Present" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {labels[status] ?? status}
    </span>
  );
}

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

export default function Attendance() {
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [role, setRole] = useState<"" | "student" | "staff">("");
  const [applied, setApplied] = useState({ from: today, to: today, role: "" });

  const { data: records = [], isLoading } = useListAttendance(
    { from: applied.from, to: applied.to, ...(applied.role ? { role: applied.role as any } : {}) },
    {
      query: {
        queryKey: getListAttendanceQueryKey({ from: applied.from, to: applied.to, ...(applied.role ? { role: applied.role as any } : {}) }),
      }
    }
  );

  const applyFilters = () => setApplied({ from, to, role });

  const exportCsv = () => {
    const headers = ["Name", "ID", "Role", "Date", "Entry", "Exit", "Duration", "Status"];
    const rows = records.map((r) => [
      r.user?.name ?? "",
      r.user?.uniqueId ?? "",
      r.user?.role ?? "",
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
    a.download = `attendance-${applied.from}-to-${applied.to}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance Records</h1>
            <p className="text-sm text-slate-400 mt-1">{records.length} records found</p>
          </div>
          <button
            data-testid="export-csv"
            onClick={exportCsv}
            disabled={!records.length}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Filters</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From date</label>
              <input
                data-testid="filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To date</label>
              <input
                data-testid="filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <select
                data-testid="filter-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "" | "student" | "staff")}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All roles</option>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                data-testid="apply-filters"
                onClick={applyFilters}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-testid="attendance-table" className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Entry</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Exit</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Duration</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-4 bg-slate-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !records.length ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                      No records found for this period
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                            {rec.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{rec.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-sm text-slate-400">{rec.user?.uniqueId}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.user?.role === "student" ? "bg-blue-900/40 text-blue-400" : "bg-purple-900/40 text-purple-400"}`}>
                          {rec.user?.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-300">{rec.date}</td>
                      <td className="px-5 py-3 text-sm text-slate-300">{formatTime(rec.entryTime)}</td>
                      <td className="px-5 py-3 text-sm text-slate-300">{formatTime(rec.exitTime)}</td>
                      <td className="px-5 py-3 text-sm text-slate-300">{formatDuration(rec.durationMinutes)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
