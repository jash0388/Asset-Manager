import { useEffect, useState, useMemo } from "react";
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
  Edit3,
  Lock,
  Unlock,
  ShieldCheck,
  LayoutList,
  LayoutGrid,
  Activity,
  X,
  Eye,
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
  isReassigned?: boolean;
  reassignedTo?: string | null;
  reassignedFrom?: string | null;
  reassignmentInfo?: any;
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "submitted" | "started" | "missing" | "locked">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Helper to get current date in Asia/Kolkata (IST)
  const getTodayISTString = () => {
    const now = new Date();
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

  // Fetch Schedule Overrides for selected date
  const { data: scheduleOverrides = [] } = useQuery<any[]>({
    queryKey: ["admin-schedule-overrides", selectedDateFilter],
    queryFn: () => customFetch<any[]>(`/api/admin/schedule-overrides?date=${selectedDateFilter}`),
    refetchInterval: 3000,
  });

  const handleToggleScheduleOverride = async (scheduleId: number, currentUnlocked: boolean, currentExtendedMins: number) => {
    try {
      await customFetch("/api/admin/schedule-override", {
        method: "POST",
        body: JSON.stringify({
          scheduleId,
          date: selectedDateFilter,
          isUnlocked: !currentUnlocked,
          extendedMinutes: currentExtendedMins,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-overrides", selectedDateFilter] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status", selectedDateFilter] });
    } catch (err: any) {
      alert("Failed to update schedule override settings");
    }
  };

  const handleExtendScheduleTime = async (scheduleId: number, currentUnlocked: boolean, minutesToAdd: number) => {
    try {
      await customFetch("/api/admin/schedule-override", {
        method: "POST",
        body: JSON.stringify({
          scheduleId,
          date: selectedDateFilter,
          isUnlocked: true,
          extendedMinutes: minutesToAdd,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-overrides", selectedDateFilter] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status", selectedDateFilter] });
    } catch (err: any) {
      alert("Failed to extend schedule attendance time");
    }
  };

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
      month: "short",
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

  // Duration Calculator
  const getDurationInfo = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return { hours: 1, label: "1 hr", isBlock: false };
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    const diffMins = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    const hours = Math.round(diffMins / 60) || 1;
    const isBlock = hours >= 2;
    return {
      hours,
      label: isBlock ? `${hours} hrs • Block / Lab` : `${hours} hr`,
      isBlock,
    };
  };

  // Section expected strength
  const getSectionTotalStudents = (year: string, section: string) => {
    const y = (year || "").toUpperCase();
    if (y.includes("4") || y === "IV") return 64;
    if (y.includes("3") || y === "III") return 60;
    if (y.includes("2") || y === "II") return 55;
    return 60;
  };

  // Check if class is in past
  const isClassPastTime = (endTimeStr: string, dateStr: string) => {
    if (!endTimeStr || !dateStr) return false;
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    const todayStr = nowIST.toISOString().slice(0, 10);
    
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;
    
    const [eH, eM] = endTimeStr.split(":").map(Number);
    const nowH = nowIST.getUTCHours();
    const nowM = nowIST.getUTCMinutes();
    return (nowH * 60 + nowM) > (eH * 60 + (eM || 0));
  };

  // Filter and search schedules
  const daySlots = useMemo(() => {
    return schedules.filter(s => {
      if (s.day_of_week !== activeDayOfWeek) return false;

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

      // Status filter
      if (selectedStatusFilter !== "All") {
        const isPast = isClassPastTime(s.end_time, selectedDateFilter);
        if (selectedStatusFilter === "submitted" && s.status !== "submitted") return false;
        if (selectedStatusFilter === "started" && s.status !== "started") return false;
        if (selectedStatusFilter === "missing" && (s.status === "submitted" || s.status === "started" || !isPast)) return false;
        if (selectedStatusFilter === "locked" && (s.status === "submitted" || s.status === "started" || isPast)) return false;
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.subject.toLowerCase().includes(q) ||
        (s.qr_mentors?.name || "").toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.year.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [schedules, activeDayOfWeek, selectedYear, selectedSection, selectedStatusFilter, searchQuery, selectedDateFilter]);

  // Operational KPI stats
  const operationalStats = useMemo(() => {
    const total = daySlots.length;
    let submittedCount = 0;
    let startedCount = 0;
    let missingCount = 0;
    let lockedCount = 0;

    daySlots.forEach(s => {
      const isPast = isClassPastTime(s.end_time, selectedDateFilter);
      if (s.status === "submitted") {
        submittedCount++;
      } else if (s.status === "started") {
        startedCount++;
      } else if (isPast) {
        missingCount++;
      } else {
        lockedCount++;
      }
    });

    return { total, submittedCount, startedCount, missingCount, lockedCount };
  }, [daySlots, selectedDateFilter]);

  return (
    <Layout>
      <div className="p-2 sm:p-3.5 max-w-7xl mx-auto space-y-2.5 text-slate-800 font-sans">
        
        {/* Navigation Switcher Tabs for Mentors */}
        {role === "mentor" && (
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex flex-wrap gap-1 shadow-2xs mb-1">
            <button
              onClick={() => navigate("/incharge-dashboard")}
              className="px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              Class Incharge Portal
            </button>
            <button
              onClick={() => navigate("/mentor")}
              className="px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Take Class Attendance
            </button>
            <button
              onClick={() => navigate("/hourly-attendance")}
              className="px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all bg-slate-900 text-white shadow-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
              Hourly Attendance
            </button>
          </div>
        )}

        {/* ── ROW 1: TIGHT EXECUTIVE HEADER (Title + Date + Action in ONE Row) ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:px-3.5 sm:py-2 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {role !== "mentor" && (
              <BackButton to={role === "hod" ? "/hod-dashboard" : "/dashboard"} className="p-1 h-7.5 w-7.5" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Hourly Lecture Attendance Control
                </h1>
                <span className="px-2 py-0.2 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {getFormattedDate(selectedDateFilter)} ({daysFullNames[activeDayOfWeek] || "Day"})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* Inline Date Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer [color-scheme:light]"
              />
            </div>

            {(role === "hod" || role === "admin") && (
              <button
                onClick={() => setNewClassModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Class
              </button>
            )}
          </div>
        </div>

        {/* ── ROW 2: ULTRA-COMPACT OPERATIONAL KPI METRIC STRIP (~40px) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Total Scheduled</span>
              <span className="text-sm font-black text-slate-900">{operationalStats.total} Lectures</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">Completed</span>
              <span className="text-sm font-black text-emerald-900">{operationalStats.submittedCount} Verified</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-amber-700 uppercase tracking-wider block">Live / Scanning</span>
              <span className="text-sm font-black text-amber-900">{operationalStats.startedCount} In Progress</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[9.5px] font-bold text-rose-700 uppercase tracking-wider block">Missing Attendance</span>
              <span className="text-sm font-black text-rose-900">{operationalStats.missingCount} Overdue</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${operationalStats.missingCount > 0 ? "bg-rose-500 animate-ping" : "bg-rose-400"}`}></span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider block">Upcoming / Locked</span>
              <span className="text-sm font-black text-slate-800">{operationalStats.lockedCount} Scheduled</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
        </div>

        {/* ── ROW 3: COMPACT SINGLE-LINE TOOLBAR (Filters + Search + View Switcher) ── */}
        <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject, faculty, section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e: any) => setSelectedYear(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="4th Year">4th Year (IV)</option>
              <option value="3rd Year">3rd Year (III)</option>
              <option value="2nd Year">2nd Year (II)</option>
            </select>

            {/* Section Selector */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>

            {/* Attendance Status Selector */}
            <select
              value={selectedStatusFilter}
              onChange={(e: any) => setSelectedStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="submitted">✓ Completed (Submitted)</option>
              <option value="started">● Live Scanning</option>
              <option value="missing">⚠️ Missing Attendance</option>
              <option value="locked">🔒 Upcoming / Locked</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="ERP Table View (Fast Scanning, No Page Scroll)"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Dense Lecture Cards Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN ATTENDANCE DISPLAY (HIGH DENSITY TABLE & DENSE GRID) ── */}
        {schedulesLoading ? (
          <div className="bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-2 rounded-xl shadow-2xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-600 font-semibold">Loading daily lecture attendance register...</p>
          </div>
        ) : schedulesErr ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-center text-xs font-semibold">
            Failed to load schedules: {schedulesErr instanceof Error ? schedulesErr.message : "Unknown error"}
          </div>
        ) : activeDayOfWeek === "SUN" ? (
          <div className="bg-white border border-slate-200 p-10 rounded-xl text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-slate-900 font-bold text-sm">Sunday - No Classes Scheduled</h3>
            <p className="text-xs text-slate-500">Please select a weekday above to view scheduled lecture attendance.</p>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-xl text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-slate-900 font-bold text-sm">No Lectures Found</h3>
            <p className="text-xs text-slate-500">
              No classes match your current search filters for {daysFullNames[activeDayOfWeek]}.
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* HIGH-DENSITY ERP TABLE VIEW (Zero Outer Scroll, Sticky Header) */
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-250px)] min-h-[350px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-8">#</th>
                    <th className="py-2 px-3">Subject & Course Code</th>
                    <th className="py-2 px-2 text-center">Class</th>
                    <th className="py-2 px-3">Timing & Duration</th>
                    <th className="py-2 px-3">Assigned Faculty</th>
                    <th className="py-2 px-3">Live Attendance Status</th>
                    <th className="py-2 px-2.5 text-center">HOD Override</th>
                    <th className="py-2 px-2.5 text-right">Log Sheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-xs">
                  {daySlots.map((s, idx) => {
                    const duration = getDurationInfo(s.start_time, s.end_time);
                    const isPast = isClassPastTime(s.end_time, selectedDateFilter);
                    const totalStudents = getSectionTotalStudents(s.year, s.section);
                    const presentCount = s.studentCount || (s.status === "submitted" ? 52 : 0);
                    const absentCount = Math.max(0, totalStudents - presentCount);
                    const attendanceRate = Math.round((presentCount / totalStudents) * 100);

                    const overrideObj = (scheduleOverrides || []).find((o: any) => o.scheduleId === s.id);
                    const isUnlocked = overrideObj ? overrideObj.isUnlocked : false;
                    const extendedMins = overrideObj ? overrideObj.extendedMinutes : 0;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSlotClick(s)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block leading-tight">
                            {s.subject}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {s.year ? `${s.year} Year` : "Academic"}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                            {s.year ? `${s.year} - ` : ""}{s.section}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${
                              duration.isBlock
                                ? "bg-indigo-50 text-indigo-900 border-indigo-300 font-bold"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                              {duration.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          {s.isReassigned && s.reassignedTo ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-700">
                                <span className="text-slate-400 line-through truncate max-w-[85px]" title={s.qr_mentors?.name}>
                                  {s.qr_mentors?.name || "Original"}
                                </span>
                                <span className="text-indigo-600 font-bold">➔</span>
                                <span className="text-indigo-900 font-black truncate max-w-[110px]" title={s.reassignedTo}>
                                  {s.reassignedTo}
                                </span>
                              </div>
                              <span className="inline-block text-[8.5px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-black uppercase tracking-wider">
                                Reassigned
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-slate-900 truncate max-w-[140px]" title={s.qr_mentors?.name || "Unassigned"}>
                                {s.qr_mentors?.name || "Unassigned"}
                              </span>
                              {(role === "hod" || role === "admin") && (
                                <button
                                  onClick={(e) => handleOpenAssignModal(e, s)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Reassign Faculty"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-3">
                          {s.status === "submitted" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Submitted ({presentCount}/{totalStudents})
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 font-mono">
                                {attendanceRate}% • {absentCount}A
                              </span>
                            </div>
                          ) : s.status === "started" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse shrink-0">
                                <Activity className="w-3 h-3 text-amber-600" />
                                Live Scanning ({s.studentCount || 0} Present)
                              </span>
                            </div>
                          ) : isPast ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Attendance Missing / Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Starts at {s.start_time.slice(0, 5)}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleScheduleOverride(s.id, isUnlocked, extendedMins);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer border ${
                              isUnlocked
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                            }`}
                            title={isUnlocked ? "Click to lock" : "Click to unlock"}
                          >
                            {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5 text-slate-500" />}
                            <span>{isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
                          </button>
                        </td>
                        <td className="py-1.5 px-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlotClick(s);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* DENSE LECTURE CARDS GRID (~115px Height) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[calc(100vh-250px)] min-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
            {daySlots.map(s => {
              const duration = getDurationInfo(s.start_time, s.end_time);
              const isPast = isClassPastTime(s.end_time, selectedDateFilter);
              const totalStudents = getSectionTotalStudents(s.year, s.section);
              const presentCount = s.studentCount || (s.status === "submitted" ? 52 : 0);
              const absentCount = Math.max(0, totalStudents - presentCount);
              const attendanceRate = Math.round((presentCount / totalStudents) * 100);

              const overrideObj = (scheduleOverrides || []).find((o: any) => o.scheduleId === s.id);
              const isUnlocked = overrideObj ? overrideObj.isUnlocked : false;
              const extendedMins = overrideObj ? overrideObj.extendedMinutes : 0;

              return (
                <div
                  key={s.id}
                  onClick={() => handleSlotClick(s)}
                  className="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                          {s.year ? `${s.year} - ` : ""}{s.section}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${
                          duration.isBlock
                            ? "bg-indigo-50 text-indigo-900 border-indigo-300"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                          {duration.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-800">
                        {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <h4 className="text-slate-900 font-bold text-xs group-hover:text-blue-600 transition-colors leading-tight">
                      {s.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      {s.isReassigned && s.reassignedTo ? (
                        <div className="space-y-0.5 truncate">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 line-through truncate max-w-[80px]">{s.qr_mentors?.name}</span>
                            <span className="text-indigo-600 font-bold">➔</span>
                            <strong className="text-indigo-900 font-black truncate max-w-[100px]">{s.reassignedTo}</strong>
                          </div>
                          <span className="inline-block text-[8px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-black uppercase">
                            Reassigned
                          </span>
                        </div>
                      ) : (
                        <span className="truncate">
                          Faculty: <strong className="text-slate-900">{s.qr_mentors?.name || "Unassigned"}</strong>
                        </span>
                      )}
                      {(role === "hod" || role === "admin") && !s.isReassigned && (
                        <button
                          onClick={(e) => handleOpenAssignModal(e, s)}
                          className="text-[10.5px] text-blue-700 hover:underline font-bold"
                          title="Change Faculty"
                        >
                          Reassign
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Dominant Status Badge */}
                    {s.status === "submitted" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        ✓ {presentCount}/{totalStudents} ({attendanceRate}%)
                      </span>
                    ) : s.status === "started" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        ● Live ({s.studentCount || 0} Present)
                      </span>
                    ) : isPast ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                        ⚠️ Missing Attendance
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                        🔒 Starts at {s.start_time.slice(0, 5)}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleScheduleOverride(s.id, isUnlocked, extendedMins);
                      }}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer border ${
                        isUnlocked
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5 text-slate-500" />}
                      <span>{isUnlocked ? "OPEN" : "LOCK"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DETAILED ATTENDANCE LOG SHEET (SLIDE-OUT DRAWER) ── */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl bg-white border-l border-slate-200 p-0 flex flex-col h-full text-slate-900">
            {selectedSchedule && (() => {
              const overrideObj = (scheduleOverrides || []).find((o: any) => o.scheduleId === selectedSchedule.id);
              const isUnlocked = overrideObj ? overrideObj.isUnlocked : false;
              const extendedMins = overrideObj ? overrideObj.extendedMinutes : 0;

              return (
                <>
                  <SheetHeader className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-300 text-blue-900 text-[10.5px] font-black uppercase">
                          {selectedSchedule.year} Yr - {selectedSchedule.section}
                        </span>
                        <span className="text-xs text-slate-600 font-mono font-bold">
                          {selectedSchedule.start_time.slice(0, 5)} - {selectedSchedule.end_time.slice(0, 5)}
                        </span>
                      </div>

                      {(role === "hod" || role === "admin") && (
                        <button
                          onClick={(e) => handleOpenAssignModal(e, selectedSchedule)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Reassign Faculty
                        </button>
                      )}
                    </div>

                    <SheetTitle className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate">
                      {selectedSchedule.subject}
                    </SheetTitle>
                    <SheetDescription className="text-slate-600 text-xs mt-0.5">
                      Faculty: <span className="text-slate-900 font-bold">{selectedSchedule.qr_mentors?.name || "Unassigned"}</span>
                    </SheetDescription>

                    {/* HOD Attendance Control Switch & Buffer Extension inside Modal */}
                    <div className="mt-3 p-2.5 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white flex items-center gap-1">
                              <Unlock className="w-3 h-3" /> UNLOCKED (Attendance Open)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white text-slate-800 border border-slate-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" /> Standard Time Lock Active
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleScheduleOverride(selectedSchedule.id, isUnlocked, extendedMins)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                            isUnlocked
                              ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                              : "bg-slate-900 text-white border-slate-950 hover:bg-slate-800"
                          }`}
                        >
                          {isUnlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {isUnlocked ? "Lock Class" : "Unlock Now"}
                        </button>
                      </div>

                      {/* Buffer Time Extension Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200 text-xs">
                        <span className="text-[11px] font-bold text-slate-700">Extend Attendance Buffer:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleExtendScheduleTime(selectedSchedule.id, isUnlocked, 15)}
                            className={`px-2 py-0.5 rounded text-xs font-bold border cursor-pointer ${
                              extendedMins === 15 ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +15m
                          </button>
                          <button
                            onClick={() => handleExtendScheduleTime(selectedSchedule.id, isUnlocked, 30)}
                            className={`px-2 py-0.5 rounded text-xs font-bold border cursor-pointer ${
                              extendedMins === 30 ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +30m
                          </button>
                          <button
                            onClick={() => handleExtendScheduleTime(selectedSchedule.id, isUnlocked, 60)}
                            className={`px-2 py-0.5 rounded text-xs font-bold border cursor-pointer ${
                              extendedMins === 60 ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +1h
                          </button>
                          {extendedMins > 0 && (
                            <button
                              onClick={() => handleExtendScheduleTime(selectedSchedule.id, isUnlocked, 0)}
                              className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                              title="Reset extra buffer time"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Toolbar inside drawer */}
                  <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <label className="text-xs font-bold text-slate-500">Date:</label>
                      {availableDates.length > 0 ? (
                        <select
                          value={selectedDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          {availableDates.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">{selectedDateFilter}</span>
                      )}
                    </div>
                    
                    {detailRecords.length > 0 && (
                      <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                        Present: <span className="text-emerald-700 font-black">{detailRecords.filter(r => r.markedPresent).length}</span> / {detailRecords.length}
                      </div>
                    )}
                  </div>

                  {/* Drawer Content Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {detailsLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="text-xs text-slate-500">Loading student attendance checklist...</p>
                      </div>
                    ) : detailsError ? (
                      <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {detailsError}
                      </div>
                    ) : detailRecords.length === 0 ? (
                      <div className="py-16 text-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-slate-700 text-xs font-bold">No attendance submitted for this lecture yet.</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Student checklist will update in real time once the mentor starts scanning.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs">
                        {detailRecords.map(r => (
                          <div key={r.studentId} className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{r.name}</p>
                              <p className="text-[10.5px] text-slate-500 font-mono">{r.uniqueId}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {r.markedPresent ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Present
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Absent
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

        {/* ── ASSIGN FACULTY TO CLASS MODAL ── */}
        {assignModalOpen && scheduleToAssign && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Assign Faculty to Class</h3>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-0.5 text-xs">
                <p className="text-slate-900 font-bold">{scheduleToAssign.subject}</p>
                <p className="text-slate-600">Class: {scheduleToAssign.year} Yr - {scheduleToAssign.section} | Day: {scheduleToAssign.day_of_week}</p>
                <p className="text-slate-500 font-mono">{scheduleToAssign.start_time.slice(0,5)} - {scheduleToAssign.end_time.slice(0,5)}</p>
              </div>

              <form onSubmit={handleConfirmAssign} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Select Faculty / Mentor
                  </label>
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
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

                {assignSuccessMsg && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {assignSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !selectedMentorId}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Confirm Assign
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CREATE NEW CLASS SCHEDULE MODAL ── */}
        {newClassModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Add New Timetable Lecture</h3>
                </div>
                <button
                  onClick={() => setNewClassModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Web Services, Cloud Computing"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="II">2nd Year (II)</option>
                      <option value="III">3rd Year (III)</option>
                      <option value="IV">4th Year (IV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="MON">Monday</option>
                      <option value="TUE">Tuesday</option>
                      <option value="WED">Wednesday</option>
                      <option value="THUR">Thursday</option>
                      <option value="FRI">Friday</option>
                      <option value="SAT">Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Assigned Faculty</label>
                  <select
                    value={newMentorId}
                    onChange={(e) => setNewMentorId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
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

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewClassModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClass}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                  >
                    {creatingClass ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Schedule"
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
