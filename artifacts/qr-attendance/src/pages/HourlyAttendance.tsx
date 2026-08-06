import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  UserPlus,
  Plus,
  UserCheck,
  Edit3
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
  status?: "pending" | "started" | "submitted";
  studentCount?: number;
};

type HourlyRecord = {
  id: number;
  studentId: number;
  name: string;
  uniqueId: string;
  markedPresent: boolean;
  scannedGate: boolean;
};

type SubmissionResponse = {
  dates: string[];
  date: string | null;
  records: HourlyRecord[];
};

export default function HourlyAttendance() {
  const { role } = useAuth();
  const [, navigate] = useLocation();
  const [selectedYear, setSelectedYear] = useState<"All" | "4th Year" | "3rd Year" | "2nd Year">("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to get current date in Asia/Kolkata (IST)
  const getTodayISTString = () => {
    const now = new Date();
    // Convert to IST offset
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().slice(0, 10);
  };

  const [selectedDateFilter, setSelectedDateFilter] = useState(getTodayISTString());
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [detailRecords, setDetailRecords] = useState<HourlyRecord[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch mentors list
  const { data: mentors = [] } = useQuery<any[]>({
    queryKey: ["admin-mentors-tracking"],
    queryFn: () => customFetch<any[]>("/api/admin/mentors-tracking"),
  });

  // Assign Faculty Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [scheduleToAssign, setScheduleToAssign] = useState<Schedule | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  // Create Class Schedule Modal States
  const [newClassModalOpen, setNewClassModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newSection, setNewSection] = useState("A");
  const [newYear, setNewYear] = useState("II");
  const [newDay, setNewDay] = useState("MON");
  const [newStartTime, setNewStartTime] = useState("09:00:00");
  const [newEndTime, setNewEndTime] = useState("10:00:00");
  const [newMentorId, setNewMentorId] = useState<number | "">("");
  const [creatingClass, setCreatingClass] = useState(false);

  // Fetch timetables with status for the selected date
  const { data: schedules = [], isLoading: schedulesLoading, error: schedulesErr } = useQuery<Schedule[]>({
    queryKey: ["admin-schedules-list-status", selectedDateFilter],
    queryFn: () => customFetch<Schedule[]>(`/api/admin/schedules-with-status?date=${selectedDateFilter}`)
  });

  const handleOpenAssignModal = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    setScheduleToAssign(schedule);
    setSelectedMentorId(schedule.mentor_id || (mentors[0]?.id ?? ""));
    setAssignSuccessMsg("");
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleToAssign || !selectedMentorId) return;
    setAssigning(true);
    try {
      await customFetch(`/api/admin/schedules/${scheduleToAssign.id}`, {
        method: "PUT",
        body: JSON.stringify({ mentorId: Number(selectedMentorId) }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setAssignSuccessMsg("Faculty assigned successfully!");
      setTimeout(() => {
        setAssignModalOpen(false);
        setAssignSuccessMsg("");
      }, 800);
    } catch (err: any) {
      alert(err?.data?.error || "Failed to assign faculty");
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorId || !newSubject || !newSection || !newYear || !newDay) return;
    setCreatingClass(true);
    try {
      await customFetch("/api/admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          mentorId: Number(newMentorId),
          dayOfWeek: newDay,
          startTime: newStartTime,
          endTime: newEndTime,
          section: newSection,
          subject: newSubject,
          year: newYear,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setNewClassModalOpen(false);
      setNewSubject("");
    } catch (err: any) {
      alert(err?.data?.error || "Failed to create class schedule");
    } finally {
      setCreatingClass(false);
    }
  };

  const loadDetails = async (scheduleId: number, dateStr?: string) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const url = `/api/admin/hourly-attendance-submissions?scheduleId=${scheduleId}${dateStr ? `&date=${dateStr}` : ""}`;
      const res = await customFetch<SubmissionResponse>(url);
      setDetailRecords(res.records);
      setAvailableDates(res.dates);
      if (res.date) {
        setSelectedDate(res.date);
      }
    } catch (err: any) {
      setDetailsError(err?.data?.error ?? "Failed to load submission details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSlotClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setAvailableDates([]);
    setDetailRecords([]);
    setSelectedDate(selectedDateFilter);
    setDrawerOpen(true);
    loadDetails(schedule.id, selectedDateFilter);
  };

  const handleDateChange = (dateVal: string) => {
    setSelectedDate(dateVal);
    if (selectedSchedule) {
      loadDetails(selectedSchedule.id, dateVal);
    }
  };

  // Helper to map date string to day of week (MON, TUE etc.)
  const getDayOfWeekFromDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIndex = dateObj.getDay();
    const days = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];
    return days[dayIndex];
  };

  const getFormattedDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const activeDayOfWeek = getDayOfWeekFromDate(selectedDateFilter);

  const daysFullNames: Record<string, string> = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THUR: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday"
  };

  const filterAndSearchSchedules = (day: string) => {
    return schedules.filter(s => {
      if (s.day_of_week !== day) return false;

      // Year filter
      if (selectedYear === "4th Year" && s.year !== "IV" && s.year !== "4th") return false;
      if (selectedYear === "3rd Year" && s.year !== "III" && s.year !== "3rd") return false;
      if (selectedYear === "2nd Year" && s.year !== "II" && s.year !== "2nd") return false;

      // Section filter
      if (selectedSection !== "All") {
        const sSec = s.section.replace(/[^A-C]/gi, "").toUpperCase();
        const selSec = selectedSection.replace(/[^A-C]/gi, "").toUpperCase();
        if (sSec && selSec && sSec !== selSec) return false;
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.subject.toLowerCase().includes(q) ||
        (s.qr_mentors?.name || "").toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-gray-700 font-sans">
        {role === "mentor" ? (
          /* Navigation Switcher Tabs for Mentors */
          <div style={{ backgroundColor: "#1e293b", borderColor: "#334155" }} className="border p-2 rounded-2xl flex flex-wrap gap-2 shadow-xs mb-4">
            <button
              onClick={() => navigate("/incharge-dashboard")}
              style={{ backgroundColor: "#334155", color: "#f8fafc" }}
              className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-gray-200"
            >
              <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
              Class Incharge Portal
            </button>
            <button
              onClick={() => navigate("/mentor")}
              style={{ backgroundColor: "#334155", color: "#f8fafc" }}
              className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-gray-200"
            >
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              Take Class Attendance
            </button>
            <button
              onClick={() => navigate("/hourly-attendance")}
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
              Hourly Attendance
            </button>
          </div>
        ) : (
          <BackButton to={role === "hod" ? "/hod-dashboard" : "/dashboard"} />
        )}
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              Hourly Lecture Attendance
            </h1>
            <p className="text-sm text-gray-500 mt-1">View scheduled lectures and check hourly attendance submitted by mentors</p>
          </div>

          {(role === "hod" || role === "admin") && (
            <button
              onClick={() => setNewClassModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Assign New Class
            </button>
          )}
        </div>

        {/* Prominent Date View */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Active Date View</span>
            <h2 className="text-2xl font-black text-white mt-1">
              {getFormattedDate(selectedDateFilter)}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Change Date:</span>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-200 text-sm font-bold cursor-pointer font-sans"
            />
          </div>
        </div>

        {/* Filter Buttons Toolbar */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 shadow-sm">
          {/* Year Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider w-24 flex-shrink-0">Year:</span>
            <div className="flex flex-wrap gap-2">
              {(["All", "4th Year", "3rd Year", "2nd Year"] as const).map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedYear === y
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
                      : "bg-gray-100 text-slate-800 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {y === "All" ? "All Years" : y}
                </button>
              ))}
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-gray-200">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider w-24 flex-shrink-0">Section:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All Sections", val: "All" },
                { label: "Sec A", val: "A" },
                { label: "Sec B", val: "B" },
                { label: "Sec C", val: "C" },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSelectedSection(s.val)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedSection === s.val
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]"
                      : "bg-gray-100 text-slate-800 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="pt-3 border-t border-gray-200">
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by subject or teacher name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Timetable view */}
        {schedulesLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-700 font-semibold">Loading scheduled timetable lectures...</p>
          </div>
        ) : schedulesErr ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl text-center text-sm font-semibold">
            Failed to load schedules: {schedulesErr instanceof Error ? schedulesErr.message : "Unknown error"}
          </div>
        ) : activeDayOfWeek === "SUN" ? (
          <div className="bg-white border border-gray-200 p-12 rounded-2xl text-center space-y-3">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-slate-900 font-bold text-lg">Sunday - No Classes Scheduled</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">Please select a weekday to view scheduled lectures and check attendance.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const daySlots = filterAndSearchSchedules(activeDayOfWeek);
              if (daySlots.length === 0) {
                return (
                  <div className="bg-white border border-gray-200 p-12 rounded-2xl text-center space-y-3">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-slate-900 font-bold text-lg">No Classes Found</h3>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      No classes are scheduled on {daysFullNames[activeDayOfWeek]} matching your search filters ({selectedYear}, {selectedSection === "All" ? "All Sections" : `Sec ${selectedSection}`}).
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 px-1">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {daysFullNames[activeDayOfWeek]} Lectures ({selectedDateFilter})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySlots.map(s => (
                      <Card
                        key={s.id}
                        onClick={() => handleSlotClick(s)}
                        className="bg-white border-gray-200 hover:border-blue-500 p-4 shadow-sm rounded-xl cursor-pointer hover:bg-blue-50/30 active:scale-[0.99] transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-black uppercase">
                              {s.year} Yr - {s.section}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                            </span>
                          </div>
                          
                          <h4 className="text-slate-900 font-black text-sm mt-3 group-hover:text-blue-600 transition-colors">
                            {s.subject || "Lecture hour"}
                          </h4>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-slate-600 font-medium">
                              Teacher: <span className="text-slate-900 font-bold">{s.qr_mentors?.name || "Unassigned"}</span>
                            </p>
                            {(role === "hod" || role === "admin") && (
                              <button
                                onClick={(e) => handleOpenAssignModal(e, s)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 transition-colors border border-blue-300"
                                title="Assign or change faculty for this class"
                              >
                                <UserPlus className="w-3 h-3 text-blue-700" />
                                Assign Faculty
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          {/* Attendance Status Badge */}
                          {s.status === "submitted" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                              ✓ Submitted ({s.studentCount} present)
                            </span>
                          ) : s.status === "started" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-400 border border-amber-900/40 animate-pulse">
                              ● Scan Started
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-50 text-gray-400 border border-gray-200">
                              Pending
                            </span>
                          )}
                          
                          <div className="flex items-center text-[10px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Detailed Attendance Log Sheet */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl bg-white border-l border-gray-200 p-0 flex flex-col h-full text-gray-900">
            {selectedSchedule && (
              <>
                <SheetHeader className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 text-[10px] font-extrabold uppercase">
                        {selectedSchedule.year} Yr - {selectedSchedule.section}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {selectedSchedule.start_time.slice(0,5)} - {selectedSchedule.end_time.slice(0,5)}
                      </span>
                    </div>

                    {(role === "hod" || role === "admin") && (
                      <button
                        onClick={(e) => handleOpenAssignModal(e, selectedSchedule)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Reassign Faculty
                      </button>
                    )}
                  </div>
                  <SheetTitle className="text-xl font-black text-gray-900 mt-2 truncate">
                    {selectedSchedule.subject}
                  </SheetTitle>
                  <SheetDescription className="text-gray-500 text-xs mt-1">
                    Teacher: <span className="text-gray-800 font-semibold">{selectedSchedule.qr_mentors?.name || "Unassigned"}</span>
                  </SheetDescription>
                </SheetHeader>

                {/* Toolbar inside drawer */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <label className="text-xs font-bold text-gray-500 flex-shrink-0">Select Date:</label>
                    {availableDates.length > 0 ? (
                      <select
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="flex-1 max-w-[160px] px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {availableDates.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No dates recorded</span>
                    )}
                  </div>
                  
                  {detailRecords.length > 0 && (
                    <div className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      Present: <span className="text-green-400 font-extrabold">{detailRecords.filter(r => r.markedPresent).length}</span> / {detailRecords.length}
                    </div>
                  )}
                </div>

                {/* Drawer Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {detailsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                      <p className="text-xs text-gray-500">Loading student attendance checklist...</p>
                    </div>
                  ) : detailsError ? (
                    <div className="px-4 py-3 rounded-lg bg-red-950/20 border border-red-800 text-red-200 text-xs">
                      {detailsError}
                    </div>
                  ) : detailRecords.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                      <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto" />
                      <p className="text-gray-500 text-sm font-semibold">No attendance submitted for this class yet.</p>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Timetable slots will display student attendance details here once the mentor starts and submits their hourly scan.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-850 border border-gray-200 bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                      {detailRecords.map(r => (
                        <div key={r.studentId} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/25 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                              {r.scannedGate ? (
                                <span className="px-1.5 py-0.5 rounded bg-green-950/40 text-green-400 border border-green-900/30 text-[9px] font-bold">
                                  Gate Scanned
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-gray-50/80 text-gray-400 border border-gray-200 text-[9px]">
                                  No Gate Scan
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{r.uniqueId}</p>
                          </div>

                          <div className="flex-shrink-0">
                            {r.markedPresent ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-950/50 text-green-400 border border-green-900/40">
                                <CheckCircle className="w-3.5 h-3.5" /> Present
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/50 text-red-400 border border-red-900/40">
                                <XCircle className="w-3.5 h-3.5" /> Absent
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Assign Faculty to Class Modal */}
        {assignModalOpen && scheduleToAssign && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Assign Class to Faculty</h3>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-1 text-xs">
                <p className="text-gray-700 font-bold">{scheduleToAssign.subject}</p>
                <p className="text-gray-500">Class: {scheduleToAssign.year} Yr - {scheduleToAssign.section} | Day: {scheduleToAssign.day_of_week}</p>
                <p className="text-gray-400 font-mono">{scheduleToAssign.start_time.slice(0,5)} - {scheduleToAssign.end_time.slice(0,5)}</p>
              </div>

              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Select Faculty / Teacher
                  </label>
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentors.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) — Key: {m.key || "No Key"}
                      </option>
                    ))}
                  </select>
                </div>

                {assignSuccessMsg && (
                  <div className="p-3 rounded-xl bg-green-950/60 border border-green-800 text-green-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    {assignSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !selectedMentorId}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-950/40"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Confirm Assign
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create New Class Schedule Modal */}
        {newClassModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Assign New Class Schedule</h3>
                </div>
                <button
                  onClick={() => setNewClassModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DBMS, Computer Networks, AI"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="MON">Mon</option>
                      <option value="TUE">Tue</option>
                      <option value="WED">Wed</option>
                      <option value="THUR">Thu</option>
                      <option value="FRI">Fri</option>
                      <option value="SAT">Sat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="text"
                      placeholder="09:00:00"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Time</label>
                    <input
                      type="text"
                      placeholder="10:00:00"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign Faculty / Teacher
                  </label>
                  <select
                    value={newMentorId}
                    onChange={(e) => setNewMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentors.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewClassModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClass || !newMentorId || !newSubject}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-950/40"
                  >
                    {creatingClass ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Assign Class
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
