import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { customFetch } from "@workspace/api-client-react";
import {
  GraduationCap,
  Plus,
  X,
  Loader2,
  UserCheck,
  Clock,
  Calendar,
  List,
  Trash2,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Filter,
  BookOpen,
} from "lucide-react";

type Mentor = { id: number; name: string; email: string };
type User = {
  id: number;
  name: string;
  uniqueId: string;
  role: "student" | "staff";
  mentorId: number | null;
};

type Schedule = {
  id: number;
  mentor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  section: string;
  subject: string;
  year: string;
  qr_mentors?: { name: string; email: string };
};

type TrackingSession = {
  id: number;
  date: string;
  startedAt: string;
  endedAt: string | null;
  studentCount: number;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
    section: string;
    subject: string;
  } | null;
};

type MentorTracking = {
  id: number;
  name: string;
  email: string;
  sessions: TrackingSession[];
};

export default function Mentors() {
  const [activeTab, setActiveTab] = useState<"mentors" | "schedules" | "tracking">("mentors");
  
  // Data for Mentors tab
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  // Mentors Tab Filters
  const [mentorSearchQuery, setMentorSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [studentMentorFilter, setStudentMentorFilter] = useState<string>("all");

  // Data for Tracking tab
  const [trackingData, setTrackingData] = useState<MentorTracking[]>([]);
  const [selectedMentorTracking, setSelectedMentorTracking] = useState<MentorTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");

  // Data for Schedules tab
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");
  const [scheduleDayFilter, setScheduleDayFilter] = useState("all");
  const [scheduleYearFilter, setScheduleYearFilter] = useState("all");
  const [scheduleSectionFilter, setScheduleSectionFilter] = useState("all");
  const [scheduleMentorFilter, setScheduleMentorFilter] = useState("all");

  const [scheduleForm, setScheduleForm] = useState({
    mentorId: "",
    dayOfWeek: "MON",
    startTime: "09:00:00",
    endTime: "10:00:00",
    section: "A",
    subject: "",
    year: "II"
  });

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, s] = await Promise.all([
        customFetch<Mentor[]>("/api/mentors"),
        customFetch<User[]>("/api/users?role=student"),
      ]);
      setMentors(m);
      setStudents(s);
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to load mentors and students");
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async () => {
    setTrackingLoading(true);
    setError(null);
    try {
      const data = await customFetch<MentorTracking[]>("/api/admin/mentors-tracking");
      setTrackingData(data);
      if (selectedMentorTracking) {
        const updatedSelected = data.find(m => m.id === selectedMentorTracking.id);
        if (updatedSelected) setSelectedMentorTracking(updatedSelected);
      } else if (data.length > 0) {
        setSelectedMentorTracking(data[0]);
      }
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to load tracking log");
    } finally {
      setTrackingLoading(false);
    }
  };

  const loadSchedules = async () => {
    setSchedulesLoading(true);
    setError(null);
    try {
      const data = await customFetch<Schedule[]>("/api/admin/schedules");
      setSchedules(data);
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to load schedules");
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mentors") {
      reload();
    } else if (activeTab === "tracking") {
      loadTracking();
    } else if (activeTab === "schedules") {
      loadSchedules();
      reload(); // load mentors list for schedule form dropdown
    }
  }, [activeTab]);

  const createMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await customFetch("/api/mentors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      reload();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to create mentor");
    } finally {
      setSubmitting(false);
    }
  };

  const assignMentor = async (userId: number, mentorId: number | null) => {
    try {
      await customFetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, mentorId } : s))
      );
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to assign mentor");
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await customFetch("/api/admin/schedules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mentorId: parseInt(scheduleForm.mentorId),
          dayOfWeek: scheduleForm.dayOfWeek,
          startTime: scheduleForm.startTime,
          endTime: scheduleForm.endTime,
          section: scheduleForm.section,
          subject: scheduleForm.subject,
          year: scheduleForm.year
        })
      });
      setShowScheduleForm(false);
      setScheduleForm(p => ({ ...p, subject: "" }));
      loadSchedules();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSchedule = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await customFetch(`/api/admin/schedules/${id}`, {
        method: "DELETE"
      });
      loadSchedules();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to delete schedule");
    }
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  };

  // Filtered Mentors
  const filteredMentors = useMemo(() => {
    const q = mentorSearchQuery.toLowerCase().trim();
    if (!q) return mentors;
    return mentors.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.email.toLowerCase().includes(q)
    );
  }, [mentors, mentorSearchQuery]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search query
      const q = studentSearchQuery.toLowerCase().trim();
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q);
        const rollMatch = s.uniqueId.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch) return false;
      }
      // Status filter
      if (studentStatusFilter === "assigned" && !s.mentorId) return false;
      if (studentStatusFilter === "unassigned" && s.mentorId) return false;
      // Mentor filter
      if (studentMentorFilter !== "all") {
        if (s.mentorId !== Number(studentMentorFilter)) return false;
      }
      return true;
    });
  }, [students, studentSearchQuery, studentStatusFilter, studentMentorFilter]);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      // Search query
      const q = scheduleSearchQuery.toLowerCase().trim();
      if (q) {
        const subMatch = (s.subject || "").toLowerCase().includes(q);
        const mentorMatch = (s.qr_mentors?.name || "").toLowerCase().includes(q);
        const secMatch = (s.section || "").toLowerCase().includes(q);
        if (!subMatch && !mentorMatch && !secMatch) return false;
      }
      // Day filter
      if (scheduleDayFilter !== "all" && s.day_of_week !== scheduleDayFilter) return false;
      // Year filter
      if (scheduleYearFilter !== "all" && s.year !== scheduleYearFilter) return false;
      // Section filter
      if (scheduleSectionFilter !== "all" && s.section !== scheduleSectionFilter) return false;
      // Mentor filter
      if (scheduleMentorFilter !== "all" && String(s.mentor_id) !== scheduleMentorFilter) return false;
      return true;
    });
  }, [schedules, scheduleSearchQuery, scheduleDayFilter, scheduleYearFilter, scheduleSectionFilter, scheduleMentorFilter]);

  // Filtered Tracking Mentors
  const filteredTrackingMentors = useMemo(() => {
    const q = trackingSearchQuery.toLowerCase().trim();
    if (!q) return trackingData;
    return trackingData.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }, [trackingData, trackingSearchQuery]);

  const assignedStudentsCount = useMemo(() => students.filter(s => s.mentorId).length, [students]);
  const unassignedStudentsCount = useMemo(() => students.filter(s => !s.mentorId).length, [students]);

  return (
    <Layout>
      <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4 text-slate-800">
        <BackButton />
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-300/70 pb-4">
          <div>
            <p className="eyebrow text-slate-500">Faculty Registry</p>
            <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5">
              Faculty &amp; Mentors Registry
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage department mentors, student allotments, timetable schedules, and live scanning logs
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex items-center gap-2">
            <span className="stamp border-purple-300 bg-purple-50 text-purple-800">
              <GraduationCap className="w-3 h-3" />
              {mentors.length} Mentors
            </span>
            <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
              <Users className="w-3 h-3" />
              {students.length} Students
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-white border border-slate-300/70 p-1 rounded-lg w-fit gap-1 shadow-xs">
          <button
            onClick={() => setActiveTab("mentors")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "mentors"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Mentors &amp; Student Allotment
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-700">
              {mentors.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "schedules"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timetable Schedules
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-700">
              {schedules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "tracking"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Live Scan Logs
          </button>
        </div>

        {error && (
          <div className="px-3.5 py-2 rounded-md bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1: MENTORS & STUDENT ALLOTMENT
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "mentors" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow text-slate-500">Allotment Summary</span>
                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  {assignedStudentsCount} Assigned
                </span>
                <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  {unassignedStudentsCount} Unassigned
                </span>
              </div>

              <button
                data-testid="add-mentor-button"
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Faculty Mentor
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={createMentor}
                className="bg-white border border-slate-300/70 rounded-lg p-4 grid sm:grid-cols-3 gap-3 shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Full Name</label>
                  <input
                    data-testid="mentor-name"
                    required
                    placeholder="e.g. Dr. A. Balaram"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Official Email</label>
                  <input
                    data-testid="mentor-email"
                    required
                    type="email"
                    placeholder="e.g. drabalaram@sphoorthyengg.ac.in"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Password / Passkey</label>
                  <input
                    data-testid="mentor-password"
                    required
                    type="password"
                    minLength={4}
                    placeholder="Min 4 characters"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3 flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 rounded-md bg-white text-slate-700 text-xs font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="create-mentor-submit"
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    {submitting ? "Creating…" : "Save Mentor"}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="grid lg:grid-cols-12 gap-3.5">
                <div className="lg:col-span-5 bg-white border border-slate-300/70 rounded-lg p-3 space-y-3 h-[650px]">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                        <div className="h-2 bg-slate-200 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-7 bg-white border border-slate-300/70 rounded-lg p-3 space-y-4 h-[650px]">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-2/5" />
                        <div className="h-2 bg-slate-200 rounded animate-pulse w-1/4" />
                      </div>
                      <div className="h-8 w-36 bg-slate-200 rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-3.5">
                {/* Mentors Directory (Col 5) */}
                <div className="lg:col-span-5 bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col h-[650px]">
                  <div className="p-3 border-b border-slate-200 bg-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-700" />
                        <h2 className="text-[13px] font-bold text-slate-950">
                          Faculty Mentors ({filteredMentors.length})
                        </h2>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Total: {mentors.length}</span>
                    </div>
                    {/* Mentor search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search mentor name or email..."
                        value={mentorSearchQuery}
                        onChange={(e) => setMentorSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                      />
                      {mentorSearchQuery && (
                        <button
                          onClick={() => setMentorSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                    {filteredMentors.length === 0 ? (
                      <div className="p-8 text-center">
                        <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-600">No mentors match "{mentorSearchQuery}"</p>
                      </div>
                    ) : (
                      filteredMentors.map((m) => {
                        const count = students.filter((s) => s.mentorId === m.id).length;
                        const isSelected = studentMentorFilter === String(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => setStudentMentorFilter(isSelected ? "all" : String(m.id))}
                            className={`p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                              isSelected ? "bg-emerald-50 border-l-[3px] border-emerald-600" : "hover:bg-slate-50 border-l-[3px] border-transparent"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 text-purple-800 flex items-center justify-center text-xs font-bold shrink-0 font-mono">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-950 truncate">{m.name}</p>
                              <p className="text-[11px] text-slate-500 truncate font-mono">{m.email}</p>
                            </div>
                            <span className={`stamp shrink-0 ${
                              count > 0
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-slate-300 bg-slate-50 text-slate-600"
                            }`}>
                              {count} students
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Student Assignment Registry (Col 7) */}
                <div className="lg:col-span-7 bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col h-[650px]">
                  <div className="p-3 border-b border-slate-200 bg-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-700" />
                        <h2 className="text-[13px] font-bold text-slate-950">
                          Student Roster &amp; Mentor Allocation ({filteredStudents.length})
                        </h2>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Total: {students.length}</span>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[160px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search student name or roll number..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                        />
                        {studentSearchQuery && (
                          <button
                            onClick={() => setStudentSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Status Filter */}
                      <select
                        value={studentStatusFilter}
                        onChange={(e: any) => setStudentStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors"
                      >
                        <option value="all">All Students</option>
                        <option value="assigned">Assigned ({assignedStudentsCount})</option>
                        <option value="unassigned">Unassigned ({unassignedStudentsCount})</option>
                      </select>

                      {/* Mentor Specific Filter */}
                      <select
                        value={studentMentorFilter}
                        onChange={(e) => setStudentMentorFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors max-w-[150px]"
                      >
                        <option value="all">All Mentors</option>
                        {mentors.map(m => (
                          <option key={m.id} value={String(m.id)}>{m.name}</option>
                        ))}
                      </select>

                      {(studentSearchQuery || studentStatusFilter !== "all" || studentMentorFilter !== "all") && (
                        <button
                          onClick={() => {
                            setStudentSearchQuery("");
                            setStudentStatusFilter("all");
                            setStudentMentorFilter("all");
                          }}
                          className="px-2 py-1 rounded-md bg-white hover:bg-red-50 text-red-700 text-xs font-semibold border border-red-300 hover:border-red-400 cursor-pointer transition-colors"
                          title="Reset student filters"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                    {filteredStudents.length === 0 ? (
                      <div className="p-12 text-center">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-600">No students match the current filters.</p>
                      </div>
                    ) : (
                      filteredStudents.map((s) => {
                        const assignedMentor = mentors.find(m => m.id === s.mentorId);
                        return (
                          <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-slate-950 truncate">{s.name}</p>
                                <span className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                                  {s.uniqueId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Current Mentor:{" "}
                                <span className={assignedMentor ? "font-bold text-emerald-700" : "font-medium text-amber-700 italic"}>
                                  {assignedMentor ? assignedMentor.name : "Not Assigned"}
                                </span>
                              </p>
                            </div>

                            <select
                              data-testid={`assign-mentor-${s.id}`}
                              value={s.mentorId ?? ""}
                              onChange={(e) =>
                                assignMentor(
                                  s.id,
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate transition-colors ${
                                s.mentorId
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                  : "bg-white border-slate-300 text-slate-700"
                              }`}
                            >
                              <option value="">— Unassigned —</option>
                              {mentors.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2: TIMETABLE SCHEDULES
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "schedules" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-300/70 p-3 rounded-lg shadow-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subject, mentor, or section..."
                  value={scheduleSearchQuery}
                  onChange={(e) => setScheduleSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                />
                {scheduleSearchQuery && (
                  <button
                    onClick={() => setScheduleSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Day Filter */}
                <select
                  value={scheduleDayFilter}
                  onChange={(e) => setScheduleDayFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All Days</option>
                  <option value="MON">Monday</option>
                  <option value="TUE">Tuesday</option>
                  <option value="WED">Wednesday</option>
                  <option value="THUR">Thursday</option>
                  <option value="FRI">Friday</option>
                  <option value="SAT">Saturday</option>
                </select>

                {/* Year Filter */}
                <select
                  value={scheduleYearFilter}
                  onChange={(e) => setScheduleYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All Years</option>
                  <option value="II">II Year (2nd Year)</option>
                  <option value="III">III Year (3rd Year)</option>
                  <option value="IV">IV Year (4th Year)</option>
                </select>

                {/* Section Filter */}
                <select
                  value={scheduleSectionFilter}
                  onChange={(e) => setScheduleSectionFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>

                {/* Mentor Filter */}
                <select
                  value={scheduleMentorFilter}
                  onChange={(e) => setScheduleMentorFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-colors max-w-[140px]"
                >
                  <option value="all">All Faculty</option>
                  {mentors.map(m => (
                    <option key={m.id} value={String(m.id)}>{m.name}</option>
                  ))}
                </select>

                {(scheduleSearchQuery || scheduleDayFilter !== "all" || scheduleYearFilter !== "all" || scheduleSectionFilter !== "all" || scheduleMentorFilter !== "all") && (
                  <button
                    onClick={() => {
                      setScheduleSearchQuery("");
                      setScheduleDayFilter("all");
                      setScheduleYearFilter("all");
                      setScheduleSectionFilter("all");
                      setScheduleMentorFilter("all");
                    }}
                    className="px-2 py-1 rounded-md bg-white hover:bg-red-50 text-red-700 text-xs font-semibold border border-red-300 hover:border-red-400 cursor-pointer transition-colors"
                    title="Reset schedule filters"
                  >
                    Reset
                  </button>
                )}

                <button
                  onClick={() => setShowScheduleForm((v) => !v)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Class Slot
                </button>
              </div>
            </div>

            {showScheduleForm && (
              <form
                onSubmit={createSchedule}
                className="bg-white border border-slate-300/70 rounded-lg p-4 grid sm:grid-cols-3 gap-3 shadow-xs animate-in fade-in duration-200"
              >
                {/* Mentor Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Assigned Faculty / Mentor</label>
                  <select
                    required
                    value={scheduleForm.mentorId}
                    onChange={(e) => setScheduleForm(p => ({ ...p, mentorId: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  >
                    <option value="">— Select Faculty —</option>
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Day of Week */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Day of Week</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm(p => ({ ...p, dayOfWeek: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  >
                    <option value="MON">Monday</option>
                    <option value="TUE">Tuesday</option>
                    <option value="WED">Wednesday</option>
                    <option value="THUR">Thursday</option>
                    <option value="FRI">Friday</option>
                    <option value="SAT">Saturday</option>
                  </select>
                </div>

                {/* Subject name */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Subject Name / Code</label>
                  <input
                    required
                    placeholder="e.g. JAVA, MSF, DBMS, COA"
                    value={scheduleForm.subject}
                    onChange={(e) => setScheduleForm(p => ({ ...p, subject: e.target.value }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>

                {/* Start Time */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Start Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime.slice(0,5)}
                    onChange={(e) => setScheduleForm(p => ({ ...p, startTime: e.target.value + ":00" }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>

                {/* End Time */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">End Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime.slice(0,5)}
                    onChange={(e) => setScheduleForm(p => ({ ...p, endTime: e.target.value + ":00" }))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>

                {/* Section & Year */}
                <div className="flex flex-col gap-1">
                  <label className="eyebrow block text-slate-600">Year & Section</label>
                  <div className="flex gap-2">
                    <select
                      value={scheduleForm.year}
                      onChange={(e) => setScheduleForm(p => ({ ...p, year: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors font-semibold"
                    >
                      <option value="II">II Year (2nd Yr)</option>
                      <option value="III">III Year (3rd Yr)</option>
                      <option value="IV">IV Year (4th Yr)</option>
                    </select>
                    <input
                      required
                      placeholder="Sec (e.g. A)"
                      value={scheduleForm.section}
                      onChange={(e) => setScheduleForm(p => ({ ...p, section: e.target.value.toUpperCase() }))}
                      className="w-20 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors text-center font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-3.5 py-1.5 rounded-md bg-white text-slate-700 text-xs font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    {submitting ? "Saving…" : "Save Class Schedule"}
                  </button>
                </div>
              </form>
            )}

            {schedulesLoading ? (
              <div className="bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-100">
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-56" />
                </div>
                <div className="p-4 space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-200 rounded animate-pulse" style={{ width: `${95 - (i % 4) * 12}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-[13px] font-bold text-slate-950">
                      Active Class Timetable Slots ({filteredSchedules.length})
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Total: {schedules.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Faculty / Mentor</th>
                        <th className="px-4 py-2.5 text-center eyebrow text-slate-600">Day</th>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Time Period</th>
                        <th className="px-4 py-2.5 text-center eyebrow text-slate-600">Class / Section</th>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Subject</th>
                        <th className="px-4 py-2.5 text-center eyebrow text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center">
                            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">No schedules match the selected filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSchedules.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-semibold text-slate-950 block leading-tight">
                                {s.qr_mentors?.name || "Unassigned Faculty"}
                              </span>
                              <span className="text-[10.5px] font-mono text-slate-500 block">
                                {s.qr_mentors?.email || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                                {s.day_of_week}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 font-mono text-[11px] font-medium">
                              {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="stamp border-purple-300 bg-purple-50 text-purple-800">
                                {s.year} Yr - Sec {s.section}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-slate-900 max-w-[220px] truncate" title={s.subject}>
                              {s.subject || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => deleteSchedule(s.id)}
                                className="p-1.5 rounded-md bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
                                title="Delete Schedule Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 3: MENTOR SCANNING LOGS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "tracking" && (
          <div className="grid md:grid-cols-12 gap-3.5">
            {/* Mentor Selection Sidebar (Col 4) */}
            <div className="md:col-span-4 bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col h-[650px]">
              <div className="p-3 border-b border-slate-200 bg-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-[13px] font-bold text-slate-950">
                    Faculty List ({filteredTrackingMentors.length})
                  </h2>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search mentor name or email..."
                    value={trackingSearchQuery}
                    onChange={(e) => setTrackingSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                  {trackingSearchQuery && (
                    <button
                      onClick={() => setTrackingSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {trackingLoading && trackingData.length === 0 ? (
                <div className="p-3 space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                        <div className="h-2 bg-slate-200 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span className="text-[11px] text-slate-500 font-mono">loading records</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                  {filteredTrackingMentors.length === 0 ? (
                    <div className="p-8 text-center">
                      <List className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600">No mentors found</p>
                    </div>
                  ) : (
                    filteredTrackingMentors.map((m) => {
                      const isSelected = selectedMentorTracking?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMentorTracking(m)}
                          className={`p-3 cursor-pointer transition-colors border-l-[3px] ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 border-emerald-600"
                              : "hover:bg-slate-50 border-transparent"
                          }`}
                        >
                          <p className={`text-xs truncate ${isSelected ? "font-bold text-emerald-950" : "font-semibold text-slate-950"}`}>{m.name}</p>
                          <p className="text-[10.5px] text-slate-500 font-mono truncate">{m.email}</p>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>Total scanned sessions:</span>
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                              {m.sessions.length}
                            </span>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Mentor Scan History Logs Table (Col 8) */}
            <div className="md:col-span-8 bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col h-[650px]">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-[13px] font-bold text-slate-950">
                    {selectedMentorTracking
                      ? `${selectedMentorTracking.name}'s Attendance Sessions`
                      : "Select a Faculty Mentor to View Scanning Logs"}
                  </h2>
                </div>
                {selectedMentorTracking && (
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                    {selectedMentorTracking.sessions.length} Records
                  </span>
                )}
              </div>

              {!selectedMentorTracking ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <GraduationCap className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-600 max-w-[280px]">
                    Select a faculty mentor from the left panel to inspect their lecture scanning timeline and student counts.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Date</th>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Subject &amp; Class</th>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">Start Time</th>
                        <th className="px-4 py-2.5 eyebrow text-slate-600">End Time</th>
                        <th className="px-4 py-2.5 text-center eyebrow text-slate-600">Status / Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {selectedMentorTracking.sessions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-16 text-center">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">
                              No attendance scanning sessions recorded for this faculty member yet.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        selectedMentorTracking.sessions.map((s) => {
                          const isLive = !s.endedAt;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 font-semibold text-slate-950 whitespace-nowrap font-mono">
                                {s.date}
                              </td>
                              <td className="px-4 py-2.5">
                                {s.schedule ? (
                                  <div>
                                    <p className="font-semibold text-slate-950">{s.schedule.subject}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      Sec {s.schedule.section} · {s.schedule.day} ({s.schedule.startTime.slice(0,5)} - {s.schedule.endTime.slice(0,5)})
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">Period slot updated</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                {formatDateTime(s.startedAt)}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                    Active Scanning
                                  </span>
                                ) : (
                                  formatDateTime(s.endedAt)
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                                  {s.studentCount} Present
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
