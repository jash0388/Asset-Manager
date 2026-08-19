import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("qr_token") || "";
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

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
  trainerKeys: Array<{ id: number; name: string; email: string; key: string }>;
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
  name: string;
  uniqueId: string;
  section: string;
}

// ─── Student Profile Modal ───────────────────────────────────────────────────
function StudentProfileModal({ student, trainingStartDate, onClose }: { student: Student; trainingStartDate?: string; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["parent-report", student.uniqueId],
    queryFn: () => apiFetch(`/api/parent/student-report?rollNumber=${encodeURIComponent(student.uniqueId)}`),
    enabled: !!student.uniqueId,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "88vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)", padding: "20px 24px", borderRadius: "16px 16px 0 0", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.5px", marginBottom: "4px" }}>STUDENT ATTENDANCE PROFILE</div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>{student.name}</h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.85 }}>{student.uniqueId} · {student.section}</p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>✕ Close</button>
          </div>

          {/* Training Session Date Banner */}
          <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.18)", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏢</span>
              <span><strong>Training Started:</strong> {trainingStartDate || "August 19, 2026"}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.18)", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📱</span>
              <span><strong>Attendance Marked via:</strong> Faculty App</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {isLoading && <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Loading student attendance records...</div>}
          {report && (
            <>
              {/* Overall Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "18px" }}>
                {[
                  { label: "Total Tracked Days", value: report.stats?.totalDays ?? "—", color: "#1E40AF", bg: "#EFF6FF" },
                  { label: "Present Days", value: report.stats?.presentDays ?? "—", color: "#15803D", bg: "#F0FDF4" },
                  { label: "Absent Days", value: report.stats?.absentDays ?? "—", color: "#DC2626", bg: "#FEF2F2" },
                  { label: "Attendance %", value: report.stats?.attendancePercentage ?? "—", color: "#7C3AED", bg: "#F5F3FF" },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center", padding: "12px 8px", background: stat.bg, borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: "10px", color: "#6B7280", fontWeight: 600, marginTop: "2px" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Today's Gate Status */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>TODAY'S GATE STATUS ({report.today?.date || "Today"})</div>
                {report.today?.entryTime ? (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px" }}>🟢 <strong>Entry:</strong> {new Date(report.today.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>
                    <span style={{ fontSize: "13px" }}>⚫ <strong>Exit:</strong> {report.today.exitTime ? new Date(report.today.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Inside Campus"}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "2px 8px", borderRadius: "6px" }}>Status: {report.today.gateStatus || "PRESENT"}</span>
                  </div>
                ) : (
                  <div style={{ color: "#DC2626", fontSize: "13px", fontWeight: 600 }}>❌ No gate scan record for today</div>
                )}
              </div>

              {/* Today's Class Schedule */}
              {report.todaySchedule && report.todaySchedule.length > 0 && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>TODAY'S CLASS SCHEDULE ({report.today?.day})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {report.todaySchedule.map((h: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "10px", background: h.status === "PRESENT" ? "#F0FDF4" : h.status === "ABSENT" ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${h.status === "PRESENT" ? "#BBF7D0" : h.status === "ABSENT" ? "#FECACA" : "#E2E8F0"}` }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>{h.subject}</div>
                          <div style={{ fontSize: "11px", color: "#6B7280" }}>{h.startTime} – {h.endTime} · {h.teacherName}</div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: h.status === "PRESENT" ? "#15803D" : h.status === "ABSENT" ? "#DC2626" : "#6B7280" }}>
                          {h.status === "PRESENT" ? "✓ Present" : h.status === "ABSENT" ? "✗ Absent" : "⏳ Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    session.subSessions && session.subSessions.length > 0
      ? [...session.subSessions]
      : [
          { id: 1, name: "Session 1 (Morning)", studentIds: [] },
          { id: 2, name: "Session 2 (Afternoon)", studentIds: [] }
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
      setError(e.message || "Failed to save sessions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "620px", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #0284C7, #0EA5E9)", padding: "18px 24px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", opacity: 0.75 }}>TRAINING SESSIONS & BATCHES</div>
            <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800 }}>Manage Sessions for {session.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: 0, marginBottom: "16px" }}>
            Add students to <strong>Session 1</strong> or <strong>Session 2</strong> below so the trainer can take attendance separately for each batch in the Faculty App.
          </p>

          {/* List of sub-sessions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {subSessions.map((sub, idx) => (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "12px", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <span style={{ background: "#0284C7", color: "#fff", width: "24px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <input
                      value={sub.name}
                      onChange={e => {
                        const val = e.target.value;
                        setSubSessions(prev => prev.map(s => s.id === sub.id ? { ...s, name: val } : s));
                      }}
                      style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "4px 8px", width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      👥 {sub.studentIds?.length || 0} students assigned to this session
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => setSubForStudents(sub)}
                    style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}
                  >
                    👥 Select Students ({sub.studentIds?.length || 0})
                  </button>
                  <button
                    onClick={() => handleRemove(sub.id)}
                    style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new sub-session */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <input
              value={newSubName}
              onChange={e => setNewSubName(e.target.value)}
              placeholder="e.g. Session 3 (Evening Batch)"
              style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              style={{ padding: "9px 16px", borderRadius: "8px", border: "none", background: "#0284C7", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Session
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: "10px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSaveAll} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0284C7, #0EA5E9)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save Sessions"}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-session student selector modal nested */}
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

// ─── Manage Students Modal with Session 1 & Session 2 Toggle ─────────────────
function ManageStudentsModal({ session, initialSubSessionId, allStudents, onClose, onSaved }: {
  session: TrainingSession;
  initialSubSessionId?: number | null;
  allStudents: Student[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const subSessions = (session.subSessions && session.subSessions.length > 0)
    ? session.subSessions
    : [
        { id: 1, name: "Session 1 (Morning Batch)", studentIds: [] },
        { id: 2, name: "Session 2 (Afternoon Batch)", studentIds: [] }
      ];

  // Active sub-session tab inside the modal (default to Session 1 or initial selection)
  const [activeTabSubId, setActiveTabSubId] = useState<number | null>(
    initialSubSessionId !== undefined ? initialSubSessionId : (subSessions[0]?.id || 1)
  );

  // In-memory state for students assigned to each sub-session
  const [subStudentsMap, setSubStudentsMap] = useState<Record<number, number[]>>(() => {
    const map: Record<number, number[]> = {};
    subSessions.forEach(s => { map[s.id] = [...(s.studentIds || [])]; });
    return map;
  });

  const [overallIds, setOverallIds] = useState<number[]>([...(session.studentIds || [])]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentSelectedIds = activeTabSubId !== null ? (subStudentsMap[activeTabSubId] || []) : overallIds;
  const currentSub = subSessions.find(s => s.id === activeTabSubId);

  const filtered = useMemo(() => {
    if (!search.trim()) return allStudents;
    const q = search.trim().toLowerCase();
    return allStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.uniqueId || "").toLowerCase().includes(q) ||
      (s.section || "").toLowerCase().includes(q)
    );
  }, [search, allStudents]);

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

      // Overall enrolled is union of all subSessions + overall
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
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", padding: "18px 24px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", opacity: 0.75, letterSpacing: "0.5px" }}>MANAGE TRAINING ROSTER</div>
            <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800 }}>{session.name} — Select Session Students</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}

          {/* SESSION 1 / SESSION 2 TOGGLE TABS */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
              CHOOSE SESSION TO ADD / EDIT STUDENTS:
            </label>
            <div style={{ display: "flex", gap: "8px", background: "#F1F5F9", padding: "6px", borderRadius: "12px", flexWrap: "wrap" }}>
              {subSessions.map(sub => {
                const isSelected = activeTabSubId === sub.id;
                const count = (subStudentsMap[sub.id] || []).length;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTabSubId(sub.id)}
                    style={{
                      flex: "1 1 140px", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                      fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
                      background: isSelected ? "linear-gradient(135deg, #7C3AED, #8B5CF6)" : "transparent",
                      color: isSelected ? "#fff" : "#475569",
                      boxShadow: isSelected ? "0 4px 12px rgba(124,58,237,0.3)" : "none"
                    }}
                  >
                    📑 {sub.name} ({count})
                  </button>
                );
              })}
              <button
                onClick={() => setActiveTabSubId(null)}
                style={{
                  flex: "1 1 120px", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
                  background: activeTabSubId === null ? "#1E293B" : "transparent",
                  color: activeTabSubId === null ? "#fff" : "#475569"
                }}
              >
                📋 All Enrolled ({overallIds.length})
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
              {currentSelectedIds.length} students selected for {currentSub ? currentSub.name : "All Enrolled"}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={selectAll} style={{ fontSize: "11px", padding: "5px 12px", borderRadius: "6px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontWeight: 600, cursor: "pointer" }}>Select All Visible</button>
              <button onClick={clearAll} style={{ fontSize: "11px", padding: "5px 12px", borderRadius: "6px", background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Clear All</button>
            </div>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search students to add to ${currentSub ? currentSub.name : "session"}...`}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1", borderRadius: "10px", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", outline: "none" }}
          />

          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", maxHeight: "320px", overflow: "auto", marginBottom: "16px" }}>
            {filtered.map((s, idx) => {
              const checked = currentSelectedIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", cursor: "pointer", background: checked ? "#F5F3FF" : idx % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F1F5F9" }}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "5px", border: `2px solid ${checked ? "#7C3AED" : "#CBD5E1"}`, background: checked ? "#7C3AED" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {checked && <span style={{ color: "#fff", fontSize: "12px", fontWeight: 800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: checked ? "#6D28D9" : "#1E293B" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>{s.uniqueId} · {s.section}</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No students found matching "{search}"</div>}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save Students to Session"}
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
            { id: 1, name: "Session 1 (Morning Batch)", studentIds: [] },
            { id: 2, name: "Session 2 (Afternoon Batch)", studentIds: [] }
          ]
        })
      });
      onCreated(created);
    } catch (e: any) {
      setError(e.message || "Failed to create training session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)", padding: "18px 24px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>NEW TRAINING PROGRAM</div>
            <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700 }}>Create Training Session</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Training Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wipro Training" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Company</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Wipro" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Full Stack & Aptitude Training" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
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
      setError(e.message || "Failed to add trainer key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "460px", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #059669, #10B981)", padding: "18px 24px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>ADD TRAINER KEY</div>
            <h2 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700 }}>{session.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>The trainer will log in to the Faculty App using this key and will see the assigned session students in <strong>{session.name}</strong>.</p>
          {[
            { label: "Trainer Name *", value: trainerName, set: setTrainerName, placeholder: "e.g. Mr. Ravi Kumar" },
            { label: "Trainer Email", value: trainerEmail, set: setTrainerEmail, placeholder: "ravi.kumar@wipro.com" },
            { label: "Faculty App Key *", value: trainerKey, set: setTrainerKey, placeholder: "e.g. 801" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Adding..." : "Add Trainer Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main TrainingSessions Page ──────────────────────────────────────────────
export default function TrainingSessions({ trainingId }: { trainingId?: number }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [addKeyFor, setAddKeyFor] = useState<TrainingSession | null>(null);
  const [manageStudentsOpen, setManageStudentsOpen] = useState(false);
  const [manageSubSessionsFor, setManageSubSessionsFor] = useState<TrainingSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeSubSessionId, setActiveSubSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Fetch all training sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<TrainingSession[]>({
    queryKey: ["training-sessions"],
    queryFn: () => apiFetch("/api/admin/training-sessions"),
    refetchInterval: 10000,
  });

  // Active session based on trainingId
  const activeSession = trainingId ? sessions.find(s => s.id === trainingId) : null;

  // Active sub-sessions (defaults to Session 1 and Session 2 if empty)
  const subSessions = (activeSession?.subSessions && activeSession.subSessions.length > 0)
    ? activeSession.subSessions
    : [
        { id: 1, name: "Session 1 (Morning)", studentIds: [] },
        { id: 2, name: "Session 2 (Afternoon)", studentIds: [] }
      ];

  const currentSubSession = activeSubSessionId !== null ? subSessions.find(s => s.id === activeSubSessionId) : null;

  // Fetch all students for lookup
  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["all-students-for-training"],
    queryFn: async () => {
      const data = await apiFetch("/api/users?role=student");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
  });

  const studentMap = useMemo(() => {
    const m = new Map<number, Student>();
    allStudents.forEach(s => m.set(s.id, s));
    return m;
  }, [allStudents]);

  // Enrolled students for active view (subSession or overall)
  const enrolledStudents = useMemo(() => {
    if (!activeSession) return [];
    if (currentSubSession) {
      return (currentSubSession.studentIds || []).map(id => studentMap.get(id)).filter(Boolean) as Student[];
    }
    return (activeSession.studentIds || []).map(id => studentMap.get(id)).filter(Boolean) as Student[];
  }, [activeSession, currentSubSession, studentMap]);

  // Fetch training attendance for today
  const { data: attendanceRecords = [] } = useQuery<TrainingAttendanceRecord[]>({
    queryKey: ["training-attendance", today, trainingId, activeSubSessionId],
    queryFn: () => apiFetch(`/api/admin/training-attendance?date=${today}${trainingId ? `&trainingId=${trainingId}` : ""}`),
    enabled: !!trainingId,
    refetchInterval: 5000,
  });

  const attendanceMap = useMemo(() => {
    const m = new Map<number, boolean>();
    attendanceRecords.forEach(r => {
      if (!activeSubSessionId || r.subSessionId === activeSubSessionId || !r.subSessionId) {
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

  // Filter enrolled students by search
  const filteredEnrolled = useMemo(() => {
    if (!searchQuery.trim()) return enrolledStudents;
    const q = searchQuery.trim().toLowerCase();
    return enrolledStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.uniqueId || "").toLowerCase().includes(q) ||
      (s.section || "").toLowerCase().includes(q)
    );
  }, [enrolledStudents, searchQuery]);

  const presentCount = enrolledStudents.filter(s => attendanceMap.get(s.id) === true).length;
  const absentCount = enrolledStudents.length - presentCount;

  return (
    <Layout>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.5px", marginBottom: "4px" }}>
              {activeSession ? `🏢 ${activeSession.company || "Corporate"}` : "TRAINING MANAGEMENT"}
            </div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#111827" }}>
              {activeSession ? activeSession.name : "Training Sessions"}
            </h1>
            {activeSession?.description && (
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>{activeSession.description}</p>
            )}
          </div>

          {!activeSession && (
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
            >
              + Create Training Session
            </button>
          )}

          {activeSession && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Manage Students button (opens modal with Session 1 & Session 2 toggle) */}
              <button
                onClick={() => setManageStudentsOpen(true)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
              >
                👥 Manage Students (Session 1 & 2)
              </button>

              {/* Manage Sub-Sessions / Batches */}
              <button
                onClick={() => setManageSubSessionsFor(activeSession)}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0284C7, #0EA5E9)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}
              >
                📑 Manage Sessions / Batches
              </button>

              {/* Add Trainer Key */}
              <button
                onClick={() => setAddKeyFor(activeSession)}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
              >
                🔑 Trainer Keys
              </button>

              {/* Unlock Attendance */}
              <button
                onClick={() => {
                  if (confirm(`Unlock and reset attendance for ${activeSession.name} today so trainer can mark fresh attendance?`)) {
                    unlockMutation.mutate(activeSession.id);
                  }
                }}
                disabled={unlockMutation.isPending}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1.5px solid #FCD34D", background: "#FEF3C7", color: "#92400E", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                {unlockMutation.isPending ? "Unlocking..." : "🔓 Unlock Session"}
              </button>
            </div>
          )}
        </div>

        {/* ── OVERVIEW (no active session selected) ── */}
        {!activeSession && (
          <>
            {loadingSessions && <div style={{ textAlign: "center", padding: "60px", color: "#6B7280" }}>Loading training sessions...</div>}
            {!loadingSessions && sessions.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 20px", background: "#F8FAFC", borderRadius: "16px", border: "2px dashed #E5E7EB" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏢</div>
                <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#374151" }}>No Training Sessions Yet</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>Create your first training session (e.g., Wipro Training, Infosys Training)</p>
                <button onClick={() => setShowCreate(true)} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  + Create Training Session
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {sessions.map(s => (
                <div key={s.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "all 0.2s" }}>
                  <div style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)", padding: "16px 18px", color: "#fff" }}>
                    <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "4px" }}>{s.company?.toUpperCase() || "CORPORATE"}</div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{s.name}</h3>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                      <div style={{ textAlign: "center", flex: 1, padding: "10px", background: "#F0FDF4", borderRadius: "10px" }}>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803D" }}>{s.studentIds.length}</div>
                        <div style={{ fontSize: "10px", color: "#6B7280" }}>Students</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1, padding: "10px", background: "#EFF6FF", borderRadius: "10px" }}>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#1D4ED8" }}>{s.subSessions?.length || 2}</div>
                        <div style={{ fontSize: "10px", color: "#6B7280" }}>Sessions/Batches</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`/training-sessions/${s.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: "9px", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
                        Open Session →
                      </a>
                      <button
                        onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteSessionMutation.mutate(s.id); }}
                        style={{ padding: "9px 10px", borderRadius: "9px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: "12px", cursor: "pointer" }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ACTIVE SESSION VIEW ── */}
        {activeSession && (
          <>
            {/* SUB-SESSIONS BUTTONS BESIDE ALL ENROLLED BUTTON */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "18px", overflowX: "auto", paddingBottom: "4px" }}>
              <button
                onClick={() => setActiveSubSessionId(null)}
                style={{
                  padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
                  background: activeSubSessionId === null ? "#1E293B" : "#F1F5F9",
                  color: activeSubSessionId === null ? "#fff" : "#475569",
                  boxShadow: activeSubSessionId === null ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                }}
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
                    style={{
                      padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
                      fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
                      background: isSelected ? "linear-gradient(135deg, #0284C7, #0EA5E9)" : "#F1F5F9",
                      color: isSelected ? "#fff" : "#475569",
                      boxShadow: isSelected ? "0 4px 12px rgba(2,132,199,0.3)" : "none"
                    }}
                  >
                    📑 {sub.name} ({count})
                  </button>
                );
              })}

              <button
                onClick={() => setManageSubSessionsFor(activeSession)}
                style={{
                  padding: "9px 14px", borderRadius: "10px", border: "1.5px dashed #94A3B8", background: "transparent",
                  color: "#0284C7", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                }}
              >
                + Add Session
              </button>
            </div>

            {/* Stats bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[
                { label: currentSubSession ? `${currentSubSession.name} Enrolled` : "Total Enrolled", value: enrolledStudents.length, color: "#1E40AF", bg: "#EFF6FF" },
                { label: "Present Today", value: presentCount, color: "#15803D", bg: "#F0FDF4" },
                { label: "Absent Today", value: absentCount, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Trainer Keys", value: activeSession.trainerKeys?.length || 0, color: "#7C3AED", bg: "#F5F3FF" },
              ].map(stat => (
                <div key={stat.label} style={{ flex: "1 1 120px", minWidth: "120px", background: stat.bg, borderRadius: "12px", padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trainer Keys Banner */}
            {activeSession.trainerKeys?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", padding: "14px 18px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280" }}>🔑 TRAINER FACULTY APP KEY</div>
                  <div style={{ fontSize: "13px", color: "#1E293B", fontWeight: 600, marginTop: "2px" }}>
                    {activeSession.trainerKeys.map(tk => `${tk.name}: Key ${tk.key}`).join(" · ")}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", background: "#F1F5F9", padding: "4px 10px", borderRadius: "6px" }}>
                  Trainer selects session from dropdown in Faculty App
                </div>
              </div>
            )}

            {/* Search bar */}
            <div style={{ marginBottom: "16px" }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${currentSubSession ? currentSubSession.name : "enrolled"} students by name or roll number...`}
                style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #D1D5DB", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
              />
            </div>

            {/* Student roster */}
            {enrolledStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#F8FAFC", borderRadius: "16px", border: "2px dashed #CBD5E1" }}>
                <div style={{ fontSize: "42px", marginBottom: "12px" }}>👥</div>
                <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "#1E293B", fontWeight: 700 }}>
                  No Students in {currentSubSession ? currentSubSession.name : "this Training Program"}
                </h3>
                <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "20px" }}>
                  Click below to select and assign students to <strong>{currentSubSession ? currentSubSession.name : activeSession.name}</strong>.
                </p>
                <button
                  onClick={() => setManageStudentsOpen(true)}
                  style={{ padding: "11px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
                >
                  👥 {currentSubSession ? `Add Students to ${currentSubSession.name}` : "Manage Students"}
                </button>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                {/* Sticky Header */}
                <div style={{ padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>
                    {currentSubSession ? currentSubSession.name : "All Enrolled"} Roster ({filteredEnrolled.length})
                  </span>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Click student name for profile · Live trainer status shown</span>
                </div>

                {/* Scrollable Student List Inside Box */}
                <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                  {filteredEnrolled.map((s, idx) => {
                    const isPresent = attendanceMap.get(s.id) === true;
                    const isMarked = attendanceMap.has(s.id);
                    return (
                      <div
                        key={s.id}
                        style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #F3F4F6", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                      >
                        <div style={{ width: "32px", fontSize: "12px", color: "#9CA3AF", flexShrink: 0 }}>{idx + 1}</div>

                        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedStudent(s)}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1D4ED8", textDecoration: "underline", textDecorationStyle: "dotted" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "1px" }}>{s.uniqueId} · {s.section}</div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {isMarked ? (
                            isPresent ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "8px", background: "#DCFCE7", color: "#15803D", fontSize: "12px", fontWeight: 700 }}>
                                ✓ Present
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "8px", background: "#FEE2E2", color: "#DC2626", fontSize: "12px", fontWeight: 700 }}>
                                ✗ Absent
                              </span>
                            )
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "8px", background: "#F1F5F9", color: "#64748B", fontSize: "12px", fontWeight: 600 }}>
                              ⏳ Pending Scan
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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
