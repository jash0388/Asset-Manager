import React, { useState, useMemo, Component, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Calendar,
  Clock,
  ArrowLeft,
  Plus,
  ChevronRight,
  Loader2,
  Unlock,
  Lock,
  Edit3,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  UserPlus,
  UserCheck,
  Sparkles,
  LayoutList,
  LayoutGrid,
  X,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TrainingSubSession {
  id: number;
  name: string;
  studentIds: number[];
  startTime?: string;
  endTime?: string;
}

interface TrainingSession {
  id: number;
  name: string;
  company: string;
  description: string;
  createdAt: string;
  studentIds: number[];
  subSessions?: TrainingSubSession[];
  trainerKeys?: Array<{ id: number; name: string; email: string; key: string }>;
}

interface Student {
  id: number;
  name: string;
  uniqueId: string;
  section: string;
  role: string;
}

interface TrainingAttendanceRecord {
  trainingId: number;
  subSessionId?: number;
  userId: number;
  date: string;
  markedPresent: boolean;
  markedBy: string;
  markedAt: string;
  name?: string;
  uniqueId?: string;
  section?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("qr_token") || "";
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Error Boundary ─────────────────────────────────────────────────────────
class TrainingErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("TrainingSessions Crash caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="p-6 max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-2xl shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Training Sessions Module Encountered an Issue</h2>
            <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-words">
              {this.state.error}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("qr_cached_students");
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page & Reset Cache</span>
            </button>
          </div>
        </Layout>
      );
    }
    return this.props.children;
  }
}

// ─── Student Profile Modal ───────────────────────────────────────────────────
function StudentProfileModal({ student, trainingStartDate, onClose }: { student: Student; trainingStartDate?: string; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["parent-report", student.uniqueId],
    queryFn: () => apiFetch(`/api/parent/student-report?rollNumber=${encodeURIComponent(student.uniqueId)}`),
    enabled: !!student.uniqueId,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">STUDENT ATTENDANCE PROFILE</span>
            <h2 className="text-lg font-black text-white">{student.name}</h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">{student.uniqueId} • {student.section || "N/A"}</p>
            
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                🏢 Started: {trainingStartDate || "August 19, 2026"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                📱 Attendance: Faculty App
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {isLoading && (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Loading student attendance records...</span>
            </div>
          )}
          {report && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Tracked Days", value: report.stats?.totalDays ?? "—", color: "text-blue-900", bg: "bg-blue-50 border-blue-200" },
                  { label: "Present Days", value: report.stats?.presentDays ?? "—", color: "text-emerald-900", bg: "bg-emerald-50 border-emerald-200" },
                  { label: "Absent Days", value: report.stats?.absentDays ?? "—", color: "text-rose-900", bg: "bg-rose-50 border-rose-200" },
                  { label: "Attendance %", value: report.stats?.attendancePercentage ? `${report.stats.attendancePercentage}%` : "—", color: "text-indigo-900", bg: "bg-indigo-50 border-indigo-200" },
                ].map(stat => (
                  <div key={stat.label} className={`text-center p-2.5 rounded-xl border ${stat.bg}`}>
                    <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-600 font-semibold mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">TODAY'S CAMPUS GATE ENTRY ({report.today?.date || "Today"})</span>
                {report.today?.entryTime ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      🟢 <strong>Entry:</strong> {new Date(report.today.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ⚫ <strong>Exit:</strong> {report.today.exitTime ? new Date(report.today.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Inside Campus"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Status: {report.today.gateStatus || "PRESENT"}
                    </span>
                  </div>
                ) : (
                  <div className="text-rose-700 font-semibold">❌ No gate scan record recorded for today</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manage Sub-Sessions / Batches Modal ──────────────────────────────────────
function ManageSubSessionsModal({ session, allStudents, onClose, onUpdated }: {
  session: TrainingSession;
  allStudents: Student[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [subSessions, setSubSessions] = useState<TrainingSubSession[]>(
    session?.subSessions && session.subSessions.length > 0
      ? [...session.subSessions]
      : [
          { id: 1, name: "Session 1 (Final years)", studentIds: [] },
          { id: 2, name: "Session 2 (Pre Final years)", studentIds: [] }
        ]
  );
  const [newSubName, setNewSubName] = useState("");
  const [subForStudents, setSubForStudents] = useState<TrainingSubSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!newSubName.trim()) return;
    const nextId = subSessions.length > 0 ? Math.max(...subSessions.map(s => s.id)) + 1 : 1;
    setSubSessions(prev => [...prev, { id: nextId, name: newSubName.trim(), studentIds: [] }]);
    setNewSubName("");
  };

  const handleRemove = (id: number) => {
    setSubSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/training-sessions/${session.id}`, {
        method: "PUT",
        body: JSON.stringify({ subSessions })
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save sessions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">TRAINING SESSIONS & BATCHES</span>
            <h2 className="text-sm font-black text-white">Manage Batches for {session?.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          {error && <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{error}</div>}
          <p className="text-xs text-slate-600">
            Allocate students to <strong>Session 1</strong> or <strong>Session 2</strong> below for separate batch attendance in the Faculty App.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {subSessions.map((sub, idx) => (
              <div key={sub.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      value={sub.name}
                      onChange={e => {
                        const val = e.target.value;
                        setSubSessions(prev => prev.map(s => s.id === sub.id ? { ...s, name: val } : s));
                      }}
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 w-full"
                    />
                    <span className="text-[10.5px] text-slate-500 font-medium mt-0.5 block">
                      👥 {sub.studentIds?.length || 0} students assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSubForStudents(sub)}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select Students ({sub.studentIds?.length || 0})
                  </button>
                  <button
                    onClick={() => handleRemove(sub.id)}
                    className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                    title="Remove Batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              value={newSubName}
              onChange={e => setNewSubName(e.target.value)}
              placeholder="e.g. Session 3 (Evening Batch)"
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400"
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              + Add Batch
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSaveAll} disabled={saving} className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs">
              {saving ? "Saving..." : "Save Batches"}
            </button>
          </div>
        </div>
      </div>

      {subForStudents && (
        <ManageStudentsModal
          session={session}
          initialSubSessionId={subForStudents.id}
          allStudents={allStudents}
          onClose={() => setSubForStudents(null)}
          onSaved={() => {
            onUpdated();
            setSubForStudents(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Manage Students Modal ───────────────────────────────────────────────────
function ManageStudentsModal({ session, initialSubSessionId, allStudents, onClose, onSaved }: {
  session: TrainingSession;
  initialSubSessionId?: number | null;
  allStudents: Student[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const subSessions = (session?.subSessions && session.subSessions.length > 0)
    ? session.subSessions
    : [
        { id: 1, name: "Session 1 (Final years)", studentIds: [] },
        { id: 2, name: "Session 2 (Pre Final years)", studentIds: [] }
      ];

  const [activeTabSubId, setActiveTabSubId] = useState<number | null>(
    initialSubSessionId !== undefined ? initialSubSessionId : (subSessions[0]?.id || 1)
  );

  const [subStudentsMap, setSubStudentsMap] = useState<Record<number, number[]>>(() => {
    const map: Record<number, number[]> = {};
    subSessions.forEach(s => { map[s.id] = [...(s.studentIds || [])]; });
    return map;
  });

  const [overallIds, setOverallIds] = useState<number[]>([...(session?.studentIds || [])]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentSelectedIds = activeTabSubId !== null ? (subStudentsMap[activeTabSubId] || []) : overallIds;
  const currentSub = subSessions.find(s => s.id === activeTabSubId);

  const sortedStudents = useMemo(() => {
    return (allStudents || []).slice().sort((a, b) =>
      (a.uniqueId || "").localeCompare(b.uniqueId || "", undefined, { numeric: true, sensitivity: "base" })
    );
  }, [allStudents]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedStudents;
    const q = search.trim().toLowerCase();
    return sortedStudents.filter(s =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.uniqueId || "").toLowerCase().includes(q) ||
      (s.section || "").toLowerCase().includes(q)
    );
  }, [search, sortedStudents]);

  const toggle = (id: number) => {
    if (activeTabSubId !== null) {
      setSubStudentsMap(prev => {
        const curr = prev[activeTabSubId] || [];
        const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
        return { ...prev, [activeTabSubId]: next };
      });
    } else {
      setOverallIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const selectAll = () => {
    const ids = filtered.map(s => s.id);
    if (activeTabSubId !== null) {
      setSubStudentsMap(prev => ({ ...prev, [activeTabSubId]: ids }));
    } else {
      setOverallIds(ids);
    }
  };

  const clearAll = () => {
    if (activeTabSubId !== null) {
      setSubStudentsMap(prev => ({ ...prev, [activeTabSubId]: [] }));
    } else {
      setOverallIds([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSubSessions = subSessions.map(s => ({
        ...s,
        studentIds: subStudentsMap[s.id] || []
      }));

      const allIds = new Set<number>();
      Object.values(subStudentsMap).forEach(arr => arr.forEach(id => allIds.add(id)));
      overallIds.forEach(id => allIds.add(id));

      await apiFetch(`/api/admin/training-sessions/${session.id}`, {
        method: "PUT",
        body: JSON.stringify({
          subSessions: updatedSubSessions,
          studentIds: Array.from(allIds)
        })
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">ROSTER ALLOCATION (ROLL NUMBER ORDER)</span>
            <h2 className="text-sm font-black text-white">{session?.name} — Select Session Students</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {error && <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{error}</div>}

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {subSessions.map(sub => {
              const isSelected = activeTabSubId === sub.id;
              const count = (subStudentsMap[sub.id] || []).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveTabSubId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  📑 {sub.name} ({count})
                </button>
              );
            })}
            <button
              onClick={() => setActiveTabSubId(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSubId === null ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              📋 All Enrolled ({overallIds.length})
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-slate-800">
              {currentSelectedIds.length} students allocated to {currentSub ? currentSub.name : "All Enrolled"}
            </span>
            <div className="flex gap-1.5">
              <button onClick={selectAll} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer">
                Select All
              </button>
              <button onClick={clearAll} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer">
                Clear All
              </button>
            </div>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students by name, roll number, section..."
            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400"
          />

          <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filtered.map(s => {
              const checked = currentSelectedIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    checked ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold block ${checked ? "text-blue-950" : "text-slate-900"}`}>{s.name}</span>
                    <span className="text-[10.5px] font-mono text-slate-500">{s.uniqueId} • {s.section || "N/A"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs">
              {saving ? "Saving..." : "Save Roster"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Session Modal ────────────────────────────────────────────────────
function CreateSessionModal({ onClose, onCreated, allStudents }: { onClose: () => void; onCreated: (s: TrainingSession) => void; allStudents: Student[] }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Training name is required"); return; }
    setSaving(true);
    try {
      const created = await apiFetch("/api/admin/training-sessions", {
        method: "POST",
        body: JSON.stringify({
          name,
          company,
          description,
          studentIds: [],
          subSessions: [
            { id: 1, name: "Session 1 (Final years)", studentIds: [] },
            { id: 2, name: "Session 2 (Pre Final years)", studentIds: [] }
          ]
        })
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message || "Failed to create training session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">NEW PROGRAM</span>
            <h2 className="text-sm font-black text-white">Create Training Program</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          {error && <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Training Program Title *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Next Gen Employability Training"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Sponsor / Company</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. NEXT GEN, Wipro, Infosys"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Curriculum Focus</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Full Stack Employability & Soft Skills"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving} className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs">
              {saving ? "Creating..." : "Create Program"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Trainer Key Modal ───────────────────────────────────────────────────
function AddTrainerKeyModal({ session, onClose, onAdded }: { session: TrainingSession; onClose: () => void; onAdded: () => void }) {
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [trainerKey, setTrainerKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!trainerName.trim() || !trainerKey.trim()) { setError("Trainer name and key are required"); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/admin/training-sessions/${session.id}/trainer-key`, {
        method: "POST",
        body: JSON.stringify({ name: trainerName, email: trainerEmail, key: trainerKey })
      });
      onAdded();
    } catch (e: any) {
      setError(e?.message || "Failed to add trainer key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">TRAINER CREDENTIALS</span>
            <h2 className="text-sm font-black text-white">Add Key for {session?.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          {error && <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{error}</div>}
          <p className="text-xs text-slate-600">
            External trainers use this key in the Faculty Mobile App to mark attendance for <strong>{session?.name}</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trainer Full Name *</label>
            <input
              value={trainerName}
              onChange={e => setTrainerName(e.target.value)}
              placeholder="e.g. Mr. Ravi Kumar"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trainer Email</label>
            <input
              value={trainerEmail}
              onChange={e => setTrainerEmail(e.target.value)}
              placeholder="e.g. trainer@nextgen.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Faculty App Passkey *</label>
            <input
              value={trainerKey}
              onChange={e => setTrainerKey(e.target.value)}
              placeholder="e.g. 802"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold font-mono text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving} className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs">
              {saving ? "Adding..." : "Add Trainer Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inner TrainingSessions Component ────────────────────────────────────────
function TrainingSessionsInner({ trainingId }: { trainingId?: number }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [addKeyFor, setAddKeyFor] = useState<TrainingSession | null>(null);
  const [manageStudentsOpen, setManageStudentsOpen] = useState(false);
  const [manageSubSessionsFor, setManageSubSessionsFor] = useState<TrainingSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubSessionId, setActiveSubSessionId] = useState<number | null>(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "PENDING">("ALL");
  const [revealedTrainerKeys, setRevealedTrainerKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Fetch training sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<TrainingSession[]>({
    queryKey: ["training-sessions"],
    queryFn: () => apiFetch("/api/admin/training-sessions"),
  });

  // Fetch all students
  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ["all-students"],
    queryFn: async () => {
      try {
        const data = await apiFetch("/api/users?role=student");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Failed to fetch students:", err);
        return [];
      }
    },
  });

  const activeSession = useMemo(() => {
    if (trainingId) {
      const match = sessions.find(s => s.id === trainingId);
      if (match) return match;
    }
    return null;
  }, [sessions, trainingId]);

  const subSessions = useMemo(() => {
    if (!activeSession) return [];
    if (activeSession.subSessions && activeSession.subSessions.length > 0) {
      return activeSession.subSessions;
    }
    return [
      { id: 1, name: "Session 1 (Final years)", studentIds: [] },
      { id: 2, name: "Session 2 (Pre Final years)", studentIds: [] }
    ];
  }, [activeSession]);

  const currentSubSession = useMemo(() => {
    if (!activeSubSessionId) return null;
    return subSessions.find(s => s.id === activeSubSessionId) || null;
  }, [subSessions, activeSubSessionId]);

  const studentMap = useMemo(() => {
    const m = new Map<number, Student>();
    (allStudents || []).forEach(s => {
      if (s && s.id !== undefined) m.set(Number(s.id), s);
    });
    return m;
  }, [allStudents]);

  // Enrolled students for active view - strictly sorted ROLL NUMBER / UNIQUE ID WISE
  const enrolledStudents = useMemo(() => {
    if (!activeSession) return [];
    let list: Student[] = [];
    if (currentSubSession) {
      list = (currentSubSession.studentIds || []).map(id => studentMap.get(Number(id))).filter(Boolean) as Student[];
    } else {
      list = (activeSession.studentIds || []).map(id => studentMap.get(Number(id))).filter(Boolean) as Student[];
    }
    // Strict ascending Roll Number order (e.g. 23N81A6701, 23N81A6702, etc.)
    return list.slice().sort((a, b) =>
      (a?.uniqueId || "").localeCompare(b?.uniqueId || "", undefined, { numeric: true, sensitivity: "base" })
    );
  }, [activeSession, currentSubSession, studentMap]);

  // Fetch training attendance for today
  const { data: attendanceRecords = [] } = useQuery<TrainingAttendanceRecord[]>({
    queryKey: ["training-attendance", today, trainingId, activeSubSessionId],
    queryFn: () => apiFetch(`/api/admin/training-attendance?date=${today}${trainingId ? `&trainingId=${trainingId}` : ""}`),
    enabled: !!activeSession,
    refetchInterval: 5000,
  });

  const attendanceMap = useMemo(() => {
    const m = new Map<number, boolean>();
    (attendanceRecords || []).forEach(r => {
      if (r && (!activeSubSessionId || r.subSessionId === activeSubSessionId || !r.subSessionId)) {
        m.set(r.userId, r.markedPresent);
      }
    });
    return m;
  }, [attendanceRecords, activeSubSessionId]);

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/training-sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sessions"] }),
  });

  // Unlock / reset attendance session mutation
  const unlockMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiFetch(`/api/admin/training-sessions/${id}/unlock`, {
        method: "POST",
        body: JSON.stringify({ date: today })
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-attendance"] });
      alert("✅ Attendance session unlocked! Trainer can now mark attendance in Faculty App.");
    }
  });

  // Attendance metrics
  const isAttendanceStarted = (attendanceRecords || []).length > 0;
  const presentCount = enrolledStudents.filter(s => attendanceMap.get(s.id) === true).length;
  const absentCount = isAttendanceStarted ? enrolledStudents.filter(s => attendanceMap.has(s.id) && attendanceMap.get(s.id) === false).length : 0;
  const pendingCount = enrolledStudents.filter(s => !attendanceMap.has(s.id)).length;

  // Filter enrolled students (preserves strict roll number order)
  const filteredEnrolled = useMemo(() => {
    return (enrolledStudents || []).filter(s => {
      if (!s) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (s.name || "").toLowerCase().includes(q);
        const matchRoll = (s.uniqueId || "").toLowerCase().includes(q);
        const matchSec = (s.section || "").toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchSec) return false;
      }

      if (selectedSectionFilter !== "ALL") {
        if (!(s.section || "").toUpperCase().includes(selectedSectionFilter)) return false;
      }

      if (selectedStatusFilter !== "ALL") {
        const isPresent = attendanceMap.get(s.id) === true;
        const isMarked = attendanceMap.has(s.id);
        if (selectedStatusFilter === "PRESENT" && !isPresent) return false;
        if (selectedStatusFilter === "ABSENT" && (!isMarked || isPresent)) return false;
        if (selectedStatusFilter === "PENDING" && isMarked) return false;
      }

      return true;
    });
  }, [enrolledStudents, searchQuery, selectedSectionFilter, selectedStatusFilter, attendanceMap]);

  // Overall landing page stats
  const landingStats = useMemo(() => {
    const totalPrograms = (sessions || []).length;
    let totalEnrolled = 0;
    let totalBatches = 0;
    let totalKeys = 0;

    (sessions || []).forEach(s => {
      if (!s) return;
      totalEnrolled += s.studentIds?.length || 0;
      totalBatches += s.subSessions?.length || 2;
      totalKeys += s.trainerKeys?.length || 0;
    });

    return { totalPrograms, totalEnrolled, totalBatches, totalKeys };
  }, [sessions]);

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <Layout>
      <div className="p-2 sm:p-3.5 max-w-7xl mx-auto space-y-2.5 text-slate-800 font-sans">
        
        {/* ── TOP HEADER ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {activeSession && (
              <Link
                href="/training-sessions"
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Programs</span>
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.2 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                  {activeSession ? `🏢 ${activeSession.company || "NEXT GEN"}` : "PLACEMENT & TECHNICAL TRAINING"}
                </span>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  {activeSession ? activeSession.name : "Training Programs & Bootcamps"}
                </h1>
              </div>
              {activeSession?.description && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{activeSession.description}</p>
              )}
            </div>
          </div>

          {!activeSession ? (
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Program</span>
            </button>
          ) : (
            /* Harmonized Action Toolbar */
            <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
              <button
                onClick={() => setManageStudentsOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Manage Students</span>
              </button>

              <button
                onClick={() => setManageSubSessionsFor(activeSession)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                <span>Batches</span>
              </button>

              <button
                onClick={() => setAddKeyFor(activeSession)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                <span>Trainer Key</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Unlock and reset attendance for ${activeSession.name} today so trainer can mark fresh attendance?`)) {
                    unlockMutation.mutate(activeSession.id);
                  }
                }}
                disabled={unlockMutation.isPending}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-700" />
                <span>{unlockMutation.isPending ? "Unlocking..." : "Unlock"}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── SCREEN 1: LANDING PAGE OVERVIEW (No active session selected) ── */}
        {!activeSession && (
          <div className="space-y-2.5">
            {/* Landing KPI Operational Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Training Programs</span>
                  <span className="text-base font-black text-slate-900">{landingStats.totalPrograms} Active</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total Enrolled</span>
                  <span className="text-base font-black text-indigo-950">{landingStats.totalEnrolled} Candidates</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Configured Batches</span>
                  <span className="text-base font-black text-purple-950">{landingStats.totalBatches} Sessions</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Trainer Credentials</span>
                  <span className="text-base font-black text-emerald-950">{landingStats.totalKeys} Active Keys</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              </div>
            </div>

            {/* Programs Grid */}
            {loadingSessions ? (
              <div className="bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-2 rounded-xl shadow-2xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs text-slate-600 font-semibold">Loading training programs...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-xl text-center space-y-3 shadow-2xs">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-slate-900 font-bold text-sm">No Training Programs Configured Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Create employability training programs, allocate batches, and assign external trainer app credentials.
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Training Session</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 font-mono">
                          🏢 {s.company?.toUpperCase() || "NEXT GEN"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ID: #{s.id}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {s.name}
                      </h3>

                      {s.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {s.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                          <span className="text-sm font-black text-slate-900 block">{s.studentIds?.length || 0}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Enrolled</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                          <span className="text-sm font-black text-slate-900 block">{s.subSessions?.length || 2}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Batches</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/training-sessions/${s.id}`}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>Open Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => { if (confirm(`Delete training program "${s.name}"?`)) deleteSessionMutation.mutate(s.id); }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-400 transition-colors cursor-pointer"
                        title="Delete Program"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Reference Table for All Batches across programs */}
            {sessions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    All Configured Training Batches & Rosters
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Quick Batch Overview</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Program Name</th>
                        <th className="py-2 px-3">Batch Name</th>
                        <th className="py-2 px-3 text-center">Enrolled Strength</th>
                        <th className="py-2 px-3">Trainer App Credential</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {sessions.flatMap(s => {
                        const subs = s?.subSessions && s.subSessions.length > 0 ? s.subSessions : [
                          { id: 1, name: "Session 1 (Final years)", studentIds: [] },
                          { id: 2, name: "Session 2 (Pre Final years)", studentIds: [] }
                        ];
                        const trainerKeyInfo = (s?.trainerKeys && s.trainerKeys.length > 0) ? s.trainerKeys.map(k => `${k.name} (Key: ${k.key})`).join(", ") : "Key: 802";

                        return subs.map((sub, sIdx) => (
                          <tr key={`${s.id}-${sub.id}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {s.name}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-700">
                              📑 {sub.name}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {sub.studentIds?.length || 0} Students
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] font-mono">
                              {trainerKeyInfo}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Link
                                href={`/training-sessions/${s.id}`}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Open Roster</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCREEN 2: ACTIVE PROGRAM DETAIL VIEW ── */}
        {activeSession && (
          <div className="space-y-2.5">
            {/* SUB-SESSIONS / BATCH TABS */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <button
                onClick={() => setActiveSubSessionId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeSubSessionId === null
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                📋 All Enrolled ({activeSession.studentIds?.length || 0})
              </button>

              {subSessions.map(sub => {
                const isSelected = activeSubSessionId === sub.id;
                const count = sub.studentIds?.length || 0;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubSessionId(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                    }`}
                  >
                    📑 {sub.name} ({count})
                  </button>
                );
              })}

              <button
                onClick={() => setManageSubSessionsFor(activeSession)}
                className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                + Add Batch
              </button>
            </div>

            {/* Program Operational Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {currentSubSession ? `${currentSubSession.name} Enrolled` : "Total Candidates"}
                  </span>
                  <span className="text-base font-black text-slate-900">{enrolledStudents.length} Students</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Present Today</span>
                  <span className="text-base font-black text-emerald-900">{presentCount} Marked</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Attendance State</span>
                  <span className={`text-xs font-black ${isAttendanceStarted ? "text-rose-900" : "text-slate-700"}`}>
                    {isAttendanceStarted ? `${absentCount} Absent` : "Attendance Not Started"}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${isAttendanceStarted ? "bg-rose-500" : "bg-slate-400"}`}></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Trainer Keys</span>
                  <span className="text-base font-black text-indigo-900">{activeSession.trainerKeys?.length || 0} Configured</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              </div>
            </div>

            {/* Executive Masked Trainer Key Strip */}
            {(activeSession.trainerKeys || []).length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Trainer App Passkey:</span>
                  </span>
                  {(activeSession.trainerKeys || []).map(tk => {
                    const isRevealed = !!revealedTrainerKeys[tk.id];
                    const isCopied = copiedKeyId === String(tk.id);

                    return (
                      <div key={tk.id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                        <span className="text-xs font-bold text-slate-800">{tk.name}:</span>
                        <span className="font-mono text-xs font-bold text-blue-900 tracking-wider">
                          {isRevealed ? tk.key : "••••••••"}
                        </span>
                        <button
                          onClick={() => setRevealedTrainerKeys(p => ({ ...p, [tk.id]: !p[tk.id] }))}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={isRevealed ? "Hide Passkey" : "Reveal Passkey"}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleCopyKey(tk.key, String(tk.id))}
                          className={`p-0.5 rounded ${isCopied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700"} cursor-pointer`}
                          title="Copy Passkey"
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10.5px] text-slate-500 font-medium">
                  Trainer selects batch from dropdown in Faculty App
                </span>
              </div>
            )}

            {/* Student Roster Toolbar */}
            <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${currentSubSession ? currentSubSession.name : "enrolled"} candidates...`}
                  className="w-full pl-8 pr-7 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={selectedSectionFilter}
                  onChange={e => setSelectedSectionFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e: any) => setSelectedStatusFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Status: All</option>
                  <option value="PRESENT">✓ Present</option>
                  <option value="ABSENT">✗ Absent</option>
                  <option value="PENDING">⏳ Pending / Not Marked</option>
                </select>

                <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  Showing <strong className="text-slate-900">{filteredEnrolled.length}</strong> of {enrolledStudents.length} (Roll Number Order)
                </div>
              </div>
            </div>

            {/* High-Density Student Roster Table - STRICT ROLL NUMBER ORDER */}
            {enrolledStudents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2 shadow-2xs">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-slate-900 font-bold text-sm">
                  No Students in {currentSubSession ? currentSubSession.name : "this Training Program"}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click below to allocate students to {currentSubSession ? currentSubSession.name : activeSession.name}.
                </p>
                <button
                  onClick={() => setManageStudentsOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Allocate Students</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-290px)] min-h-[320px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-3">Roll Number (HTNO)</th>
                        <th className="py-2 px-3">Candidate Full Name</th>
                        <th className="py-2 px-2 text-center">Section</th>
                        <th className="py-2 px-3">Batch Allocation</th>
                        <th className="py-2 px-3">Gate Scan</th>
                        <th className="py-2 px-3 text-center">Training Attendance</th>
                        <th className="py-2 px-2.5 text-right">Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {filteredEnrolled.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                            No student matches the search or filter query.
                          </td>
                        </tr>
                      ) : (
                        filteredEnrolled.map((s, idx) => {
                          if (!s) return null;
                          const isPresent = attendanceMap.get(s.id) === true;
                          const isMarked = attendanceMap.has(s.id);
                          const studentSub = subSessions.find(sub => (sub?.studentIds || []).includes(s.id));

                          return (
                            <tr
                              key={s.id}
                              onClick={() => setSelectedStudent(s)}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-3 font-mono font-black text-blue-950 text-[11px] whitespace-nowrap">
                                {s.uniqueId || "N/A"}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block leading-tight">
                                  {s.name}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                                  {s.section || "N/A"}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 whitespace-nowrap text-slate-600">
                                {studentSub ? (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-semibold">
                                    {studentSub.name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Unassigned Batch</span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Campus Scanned</span>
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                {isMarked ? (
                                  isPresent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Present
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                      <XCircle className="w-3 h-3 text-rose-600" /> Absent
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    ⏳ Pending / Not Marked
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudent(s);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Profile</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {showCreate && (
        <CreateSessionModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => {
            qc.invalidateQueries({ queryKey: ["training-sessions"] });
            setShowCreate(false);
          }}
          allStudents={allStudents}
        />
      )}

      {addKeyFor && (
        <AddTrainerKeyModal
          session={addKeyFor}
          onClose={() => setAddKeyFor(null)}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ["training-sessions"] });
            setAddKeyFor(null);
          }}
        />
      )}

      {manageSubSessionsFor && (
        <ManageSubSessionsModal
          session={manageSubSessionsFor}
          allStudents={allStudents}
          onClose={() => setManageSubSessionsFor(null)}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ["training-sessions"] });
          }}
        />
      )}

      {manageStudentsOpen && activeSession && (
        <ManageStudentsModal
          session={activeSession}
          initialSubSessionId={activeSubSessionId}
          allStudents={allStudents}
          onClose={() => setManageStudentsOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["training-sessions"] });
          }}
        />
      )}

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          trainingStartDate="August 19, 2026"
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </Layout>
  );
}

// ─── Exported Default with ErrorBoundary ─────────────────────────────────────
export default function TrainingSessions(props: { trainingId?: number }) {
  return (
    <TrainingErrorBoundary>
      <TrainingSessionsInner {...props} />
    </TrainingErrorBoundary>
  );
}
