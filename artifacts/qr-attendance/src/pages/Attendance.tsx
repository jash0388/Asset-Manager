import { useMemo, useState } from "react";
import { useListAttendance, getListAttendanceQueryKey, customFetch } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { Download, Filter, Trash2, AlertTriangle, XCircle } from "lucide-react";

function StatusBadge({ status, exitOver }: { status: string; exitOver?: boolean }) {
  const map: Record<string, string> = {
    inside: "bg-blue-100 text-blue-900 border-2 border-blue-400 font-black",
    left: "bg-slate-100 text-slate-700 border border-slate-300 font-bold",
    present: "bg-blue-100 text-blue-900 border-2 border-blue-400 font-black",
  };
  const labels: Record<string, string> = {
    inside: exitOver ? "Present" : "On Campus",
    left: "Left",
    present: "Present",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] ${map[status] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>
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
  const today = new Date().toISOString().split("T")[0];
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
      <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-3">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Attendance Records</h1>
            <p className="text-xs text-gray-500 mt-0.5">{records.length} records found</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="delete-selected"
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0 || deleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <button
              data-testid="export-csv"
              onClick={exportCsv}
              disabled={!records.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-xs font-bold transition-colors border border-gray-200 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <h2 className="text-xs font-bold text-gray-700">Filters</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">From date</label>
              <input
                data-testid="filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">To date</label>
              <input
                data-testid="filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Role</label>
              <select
                data-testid="filter-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "" | "student" | "staff")}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-blue-500"
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
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto scroll-smooth scrollbar-thin">
            <table data-testid="attendance-table" className="w-full relative">
              <thead className="sticky top-0 z-20 bg-gray-50/95 border-b border-gray-100">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2 w-10">
                    <input
                      type="checkbox"
                      data-testid="select-all"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={!records.length}
                      className="h-3.5 w-3.5 rounded bg-gray-100 border-gray-300 accent-blue-600"
                    />
                  </th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Entry</th>
                  <th className="text-left px-4 py-2">Exit</th>
                  <th className="text-left px-4 py-2">Duration</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-2.5">
                          <div className="h-3 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !records.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-gray-400 font-medium">
                      No records found for this period
                    </td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr
                      key={rec.id}
                      className={`hover:bg-gray-50 transition-colors ${selected.has(rec.id) ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          data-testid={`select-row-${rec.id}`}
                          checked={selected.has(rec.id)}
                          onChange={() => toggleOne(rec.id)}
                          className="h-3.5 w-3.5 rounded bg-gray-100 border-gray-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                            {rec.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-gray-900">{rec.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-gray-600 font-semibold">{rec.user?.uniqueId}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.user?.role === "student" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-purple-100 text-purple-800 border border-purple-200"}`}>
                          {rec.user?.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700 font-medium">{rec.date}</td>
                      <td className="px-4 py-2 text-gray-700 font-mono text-[11px]">{formatTime(rec.entryTime)}</td>
                      <td className="px-4 py-2 text-gray-700 font-mono text-[11px]">
                        {isExitTimeOver(rec.date, rec.exitTime) ? (
                          <span className="text-gray-400 text-xs font-medium">—</span>
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

      {/* Confirm delete modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !deleteMutation.isPending && setConfirmOpen(false)}
        >
          <div
            className="bg-white border border-gray-300 rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete attendance records?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will permanently remove <span className="font-bold text-gray-900">{selected.size}</span> record{selected.size === 1 ? "" : "s"}. This action cannot be undone.
                </p>
              </div>
            </div>
            {errorMsg && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
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
