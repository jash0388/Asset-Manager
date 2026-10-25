import { useMemo, useState } from "react";
import { useListAttendance, getListAttendanceQueryKey, customFetch } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { Download, Filter, Trash2, AlertTriangle, XCircle } from "lucide-react";

function StatusBadge({ status, exitOver }: { status: string; exitOver?: boolean }) {
  const map: Record<string, string> = {
    inside: "border-emerald-300 bg-emerald-50 text-emerald-800",
    left: "border-slate-300 bg-slate-50 text-slate-600",
    present: "border-blue-300 bg-blue-50 text-blue-800",
  };
  const labels: Record<string, string> = {
    inside: exitOver ? "Present" : "On Campus",
    left: "Left",
    present: "Present",
  };
  return (
    <span className={`stamp ${map[status] ?? "border-slate-300 bg-slate-50 text-slate-600"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status}
    </span>
  );
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
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

export default function Attendance() {
  // Default the filter to the IST day — the server files records by IST date.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [role, setRole] = useState<"" | "student" | "staff">("");
  const [applied, setApplied] = useState({ from: today, to: today, role: "" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const queryClient = useQueryClient();
  const queryKey = getListAttendanceQueryKey({ from: applied.from, to: applied.to, ...(applied.role ? { role: applied.role as any } : {}) });

  const { data: records = [], isLoading } = useListAttendance(
    { from: applied.from, to: applied.to, ...(applied.role ? { role: applied.role as any } : {}) },
    { query: { queryKey } }
  );

  const allIds = useMemo(() => records.map((r: any) => r.id as number), [records]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
      });
  };
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return customFetch<{ deletedCount: number }>("/api/attendance/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => {
      setSelected(new Set());
      setConfirmOpen(false);
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      setErrorMsg(err?.data?.error ?? err?.message ?? "Failed to delete records");
    },
  });

  const handleConfirmDelete = () => {
    if (selected.size === 0) return;
    setErrorMsg("");
    deleteMutation.mutate(Array.from(selected));
  };

  const applyFilters = () => {
    setApplied({ from, to, role });
    setSelected(new Set());
  };

  const exportCsv = () => {
    const headers = ["Name", "ID", "Role", "Date", "Entry", "Exit", "Duration", "Status"];
    const rows = records.map((r: any) => [
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <BackButton />
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 flex-wrap pb-4 border-b border-slate-300/70">
          <div>
            <p className="eyebrow text-slate-500">Attendance Ledger</p>
            <h1
              className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5"
              style={{ fontFamily: "var(--app-font-display)" }}
            >
              Attendance Records
            </h1>
            <p className="text-[11px] font-mono text-slate-500 mt-1">{records.length} records found</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="delete-selected"
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0 || deleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <button
              data-testid="export-csv"
              onClick={exportCsv}
              disabled={!records.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 disabled:opacity-50 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-slate-300/70 rounded-lg p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <h2 className="eyebrow text-slate-500">Filters</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="eyebrow block text-slate-500 mb-1.5">From date</label>
              <input
                data-testid="filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow block text-slate-500 mb-1.5">To date</label>
              <input
                data-testid="filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
              />
            </div>
            <div>
              <label className="eyebrow block text-slate-500 mb-1.5">Role</label>
              <select
                data-testid="filter-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "" | "student" | "staff")}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
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
                className="w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-slate-300/70 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto scroll-smooth scrollbar-thin">
            <table data-testid="attendance-table" className="w-full relative">
              <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-300/70">
                <tr className="eyebrow text-slate-500">
                  <th className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      data-testid="select-all"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={!records.length}
                      className="h-3.5 w-3.5 rounded bg-white border-slate-300 accent-emerald-600 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-left px-4 py-2.5">ID</th>
                  <th className="text-left px-4 py-2.5">Role</th>
                  <th className="text-left px-4 py-2.5">Date</th>
                  <th className="text-left px-4 py-2.5">Entry</th>
                  <th className="text-left px-4 py-2.5">Exit</th>
                  <th className="text-left px-4 py-2.5">Duration</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-2.5">
                          <div className="h-3 bg-slate-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !records.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <XCircle className="w-6 h-6 text-slate-400" />
                        <p className="text-[13px] text-slate-600 font-medium">No records found for this period</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50 transition-colors ${selected.has(rec.id) ? "bg-emerald-50/60" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          data-testid={`select-row-${rec.id}`}
                          checked={selected.has(rec.id)}
                          onChange={() => toggleOne(rec.id)}
                          className="h-3.5 w-3.5 rounded bg-white border-slate-300 accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0 font-mono">
                            {rec.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-950">{rec.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 font-semibold">{rec.user?.uniqueId}</td>
                      <td className="px-4 py-2.5">
                        <span className={`stamp ${rec.user?.role === "student" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-purple-300 bg-purple-50 text-purple-800"}`}>
                          {rec.user?.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700 font-medium">{rec.date}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{formatTime(rec.entryTime)}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">
                        {isExitTimeOver(rec.date, rec.exitTime) ? (
                          <span className="text-slate-400 text-xs font-medium">—</span>
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

      {/* Confirm delete modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !deleteMutation.isPending && setConfirmOpen(false)}
        >
          <div
            className="bg-white border border-slate-300 rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-md bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>
                  Delete attendance records?
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  This will permanently remove <span className="font-bold text-slate-900 font-mono">{selected.size}</span> record{selected.size === 1 ? "" : "s"}. This action cannot be undone.
                </p>
              </div>
            </div>
            {errorMsg && (
              <div className="mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-300 text-red-800 text-sm font-medium">
                {errorMsg}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
