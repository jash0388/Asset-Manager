import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("hod_token") || localStorage.getItem("admin_token") || "";
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
interface TrainingSession {
  id: number;
  name: string;
  company: string;
  description: string;
  createdAt: string;
  studentIds: number[];
  trainerKeys: Array<{ id: number; name: string; email: string; key: string }>;
}

interface Student {
  id: number;
  name: string;
  uniqueId: string;   // API returns camelCase 'uniqueId'
  section: string;
  role: string;
}

interface TrainingAttendanceRecord {
  trainingId: number;
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
function StudentProfileModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["parent-report", student.uniqueId],
    queryFn: () => apiFetch(`/api/parent/student-report?rollNumber=${encodeURIComponent(student.uniqueId)}`),
    enabled: !!student.uniqueId,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "640px", maxHeight: "85vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)", padding: "20px 24px", borderRadius: "16px 16px 0 0", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "4px" }}>STUDENT PROFILE</div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{student.name}</h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.8 }}>{student.uniqueId} · {student.section}</p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px" }}>✕ Close</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {isLoading && <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Loading student data...</div>}
          {report && (
            <>
              {/* Today's Gate Status */}
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803D", marginBottom: "8px" }}>TODAY'S GATE STATUS</div>
                {report.gateRecord ? (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px" }}>🟢 <strong>Entry:</strong> {report.gateRecord.entry_time ? new Date(report.gateRecord.entry_time).toLocaleTimeString() : "—"}</span>
                    <span style={{ fontSize: "13px" }}>⚫ <strong>Exit:</strong> {report.gateRecord.exit_time ? new Date(report.gateRecord.exit_time).toLocaleTimeString() : "Still Inside"}</span>
                  </div>
                ) : <div style={{ color: "#EF4444", fontSize: "13px" }}>❌ No gate scan today</div>}
              </div>

              {/* Today's Class Attendance */}
              {report.todayHourly && report.todayHourly.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>TODAY'S HOURLY ATTENDANCE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {report.todayHourly.map((h: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "10px", background: h.markedPresent ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${h.markedPresent ? "#BBF7D0" : "#FECACA"}` }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>{h.subject || "Class"}</div>
                          <div style={{ fontSize: "11px", color: "#6B7280" }}>{h.startTime} – {h.endTime}</div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: h.markedPresent ? "#15803D" : "#DC2626" }}>
                          {h.markedPresent ? "✓ Present" : "✗ Absent"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Stats */}
              <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", marginBottom: "10px" }}>OVERALL ATTENDANCE STATS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                  {[
                    { label: "Total Days", value: report.stats?.totalDays ?? "—" },
                    { label: "Present Days", value: report.stats?.presentDays ?? "—", color: "#15803D" },
                    { label: "Absent Days", value: report.stats?.absentDays ?? "—", color: "#DC2626" },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center", padding: "10px", background: "#fff", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: stat.color || "#1E40AF" }}>{stat.value}</div>
                      <div style={{ fontSize: "10px", color: "#6B7280" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allStudents;
    const q = search.trim().toLowerCase();
    return allStudents.filter(s => s.name.toLowerCase().includes(q) || (s.uniqueId || "").toLowerCase().includes(q) || (s.section || "").toLowerCase().includes(q));
  }, [search, allStudents]);

  const toggleStudent = (id: number) => setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedStudentIds(filtered.map(s => s.id));
  const clearAll = () => setSelectedStudentIds([]);

  const handleCreate = async () => {
    if (!name.trim()) { setError("Training name is required"); return; }
    setSaving(true);
    try {
      const created = await apiFetch("/api/admin/training-sessions", {
        method: "POST",
        body: JSON.stringify({ name, company, description, studentIds: selectedStudentIds })
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
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)", padding: "18px 24px", borderRadius: "16px 16px 0 0", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>NEW TRAINING SESSION</div>
            <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700 }}>Create Training Session</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Training Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wipro Training" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Wipro" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Full Stack Dev & Aptitude Training" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Assign Students ({selectedStudentIds.length} selected)</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={selectAll} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", cursor: "pointer" }}>Select All</button>
                <button onClick={clearAll} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280", cursor: "pointer" }}>Clear</button>
              </div>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students by name, roll no, section..." style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }} />
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "10px", maxHeight: "220px", overflow: "auto" }}>
              {filtered.map((s, idx) => {
                const checked = selectedStudentIds.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleStudent(s.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", cursor: "pointer", background: checked ? "#EFF6FF" : idx % 2 === 0 ? "#fff" : "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${checked ? "#2563EB" : "#D1D5DB"}`, background: checked ? "#2563EB" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {checked && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 800 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.uniqueId} · {s.section}</div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>No students found</div>}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Creating..." : "Create Training Session"}
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
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>The trainer will log in to the Faculty App using this key and will only see students in <strong>{session.name}</strong>.</p>
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Fetch all training sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<TrainingSession[]>({
    queryKey: ["training-sessions"],
    queryFn: () => apiFetch("/api/admin/training-sessions"),
    refetchInterval: 15000,
  });

  // Active session based on trainingId
  const activeSession = trainingId ? sessions.find(s => s.id === trainingId) : null;

  // Fetch all students for assignment/display
  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["all-students-for-training"],
    queryFn: async () => {
      // /api/users returns a plain array; ?role=student filters server-side
      const data = await apiFetch("/api/users?role=student");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
  });

  // Build a lookup map
  const studentMap = useMemo(() => {
    const m = new Map<number, Student>();
    allStudents.forEach(s => m.set(s.id, s));
    return m;
  }, [allStudents]);

  // Enrolled students for active session
  const enrolledStudents = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.studentIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];
  }, [activeSession, studentMap]);

  // Fetch training attendance for today for this session
  const { data: attendanceRecords = [] } = useQuery<TrainingAttendanceRecord[]>({
    queryKey: ["training-attendance", today, trainingId],
    queryFn: () => apiFetch(`/api/admin/training-attendance?date=${today}${trainingId ? `&trainingId=${trainingId}` : ""}`),
    enabled: !!trainingId,
    refetchInterval: 10000,
  });

  const attendanceMap = useMemo(() => {
    const m = new Map<number, boolean>();
    attendanceRecords.forEach(r => m.set(r.userId, r.markedPresent));
    return m;
  }, [attendanceRecords]);

  // Toggle attendance for a single student
  const toggleAttendanceMutation = useMutation({
    mutationFn: async ({ userId, markedPresent }: { userId: number; markedPresent: boolean }) => {
      await apiFetch("/api/admin/training-attendance", {
        method: "POST",
        body: JSON.stringify({ trainingId, userId, date: today, markedPresent })
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-attendance"] }),
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/training-sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sessions"] }),
  });

  // Filter enrolled students by search
  const filteredEnrolled = useMemo(() => {
    if (!searchQuery.trim()) return enrolledStudents;
    const q = searchQuery.trim().toLowerCase();
    return enrolledStudents.filter(s => s.name.toLowerCase().includes(q) || (s.uniqueId || "").toLowerCase().includes(q));
  }, [enrolledStudents, searchQuery]);

  const presentCount = enrolledStudents.filter(s => attendanceMap.get(s.id) === true).length;
  const absentCount = enrolledStudents.length - presentCount;

  return (
    <Layout>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
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
            <button
              onClick={() => setAddKeyFor(activeSession)}
              style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
            >
              🔑 Add Trainer Key
            </button>
          )}
        </div>

        {/* ── OVERVIEW (no active session) ── */}
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
                <div key={s.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"}
                >
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
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#1D4ED8" }}>{s.trainerKeys?.length || 0}</div>
                        <div style={{ fontSize: "10px", color: "#6B7280" }}>Trainers</div>
                      </div>
                    </div>
                    {s.trainerKeys?.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#6B7280", marginBottom: "6px" }}>TRAINER KEYS</div>
                        {s.trainerKeys.map(tk => (
                          <div key={tk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#F8FAFC", borderRadius: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#374151" }}>{tk.name}</span>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: "6px" }}>Key: {tk.key}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`/training-sessions/${s.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: "9px", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
                        Open Session →
                      </a>
                      <button
                        onClick={() => setAddKeyFor(s)}
                        style={{ padding: "9px 12px", borderRadius: "9px", border: "1px solid #D1FAE5", background: "#F0FDF4", color: "#059669", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                      >
                        🔑 Key
                      </button>
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
            {/* Stats bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[
                { label: "Total Enrolled", value: enrolledStudents.length, color: "#1E40AF", bg: "#EFF6FF" },
                { label: "Present Today", value: presentCount, color: "#15803D", bg: "#F0FDF4" },
                { label: "Absent Today", value: absentCount, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Trainer Keys", value: activeSession.trainerKeys?.length || 0, color: "#7C3AED", bg: "#F5F3FF" },
              ].map(stat => (
                <div key={stat.label} style={{ flex: "1 1 120px", minWidth: "120px", background: stat.bg, borderRadius: "12px", padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trainer Keys */}
            {activeSession.trainerKeys?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", marginBottom: "10px" }}>🔑 TRAINER KEYS (Faculty App Login)</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {activeSession.trainerKeys.map(tk => (
                    <div key={tk.id} style={{ padding: "8px 14px", background: "#EFF6FF", borderRadius: "10px", border: "1px solid #BFDBFE" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{tk.name}</span>
                      <span style={{ marginLeft: "10px", fontSize: "14px", fontWeight: 800, color: "#1D4ED8" }}>Key: {tk.key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search bar */}
            <div style={{ marginBottom: "16px" }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students by name or roll number..."
                style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #D1D5DB", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
              />
            </div>

            {/* Student roster */}
            {enrolledStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", background: "#F8FAFC", borderRadius: "14px", border: "2px dashed #E5E7EB" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>👥</div>
                <p style={{ color: "#6B7280" }}>No students enrolled in this session yet.</p>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Students Roster ({filteredEnrolled.length})</span>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Click name for full profile · Toggle In/Out for attendance</span>
                </div>

                {filteredEnrolled.map((s, idx) => {
                  const isPresent = attendanceMap.get(s.id) === true;
                  const isPending = attendanceMap.get(s.id) === undefined;
                  return (
                    <div
                      key={s.id}
                      style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #F3F4F6", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    >
                      {/* Index */}
                      <div style={{ width: "30px", fontSize: "12px", color: "#9CA3AF", flexShrink: 0 }}>{idx + 1}</div>

                      {/* Student info (clickable for profile) */}
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedStudent(s)}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D4ED8", textDecoration: "underline", textDecorationStyle: "dotted" }}>{s.name}</div>
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.uniqueId} · {s.section}</div>
                      </div>

                      {/* In/Out Toggle */}
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button
                          onClick={() => toggleAttendanceMutation.mutate({ userId: s.id, markedPresent: true })}
                          style={{
                            padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            fontSize: "12px", fontWeight: 700, transition: "all 0.15s",
                            background: isPresent ? "#15803D" : "#F0FDF4",
                            color: isPresent ? "#fff" : "#15803D",
                            boxShadow: isPresent ? "0 2px 8px rgba(21,128,61,0.35)" : "none",
                          }}
                        >
                          ✓ In
                        </button>
                        <button
                          onClick={() => toggleAttendanceMutation.mutate({ userId: s.id, markedPresent: false })}
                          style={{
                            padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            fontSize: "12px", fontWeight: 700, transition: "all 0.15s",
                            background: (!isPending && !isPresent) ? "#DC2626" : "#FEF2F2",
                            color: (!isPending && !isPresent) ? "#fff" : "#DC2626",
                            boxShadow: (!isPending && !isPresent) ? "0 2px 8px rgba(220,38,38,0.35)" : "none",
                          }}
                        >
                          ✗ Out
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            qc.invalidateQueries({ queryKey: ["training-sessions-nav"] });
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
      {selectedStudent && (
        <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </Layout>
  );
}
