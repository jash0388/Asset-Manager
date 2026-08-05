import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { OFFICIAL_FACULTY_LIST } from "./MentorApp";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  GraduationCap,
  ListFilter,
  Grid3X3,
  ClipboardList,
  UserPlus,
  Plus,
  UserCheck,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  Flag,
  AlertCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type StudentUser = {
  id: number;
  name: string;
  uniqueId: string;
  role: string;
  section: string | null;
  batch: string | null;
};

type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status: "inside" | "left";
  user?: StudentUser;
  durationMinutes?: number | null;
};

type SectionStats = {
  sectionKey: string;     // e.g. "DS II/I/A"
  displayName: string;    // e.g. "2A"
  batch: string;          // e.g. "2025"
  yearLabel: string;      // e.g. "2nd Year"
  totalStudents: StudentUser[];
  presentStudents: { student: StudentUser; record: AttendanceRecord }[];
  absentStudents: StudentUser[];
};

function CustomMonthSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, month] = value.split("-").map(Number);
  const [currentYear, setCurrentYear] = useState(year);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, "0");
    onChange(`${currentYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-20">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl bg-white border border-slate-250 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
      >
        <Calendar className="w-4 h-4 text-blue-600" />
        <span>{monthNames[month - 1]} {year}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 p-4 shadow-2xl z-30 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                &larr;
              </button>
              <span className="text-sm font-bold text-slate-800 font-mono">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                &rarr;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((mName, idx) => {
                const isSelected = currentYear === year && (idx + 1) === month;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function HodDashboard() {
  const [activeTab, setActiveTab] = useState<"summary" | "logs" | "mentors" | "schedules" | "flags" | "student-analytics">((): any => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "flags") return "flags";
    if (tab === "student-analytics") return "student-analytics";
    return "summary";
  });

  const [riskFlagFilter, setRiskFlagFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [riskYearFilter, setRiskYearFilter] = useState("ALL");
  const [riskSectionFilter, setRiskSectionFilter] = useState("ALL");
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [riskSortOrder, setRiskSortOrder] = useState<"lowest" | "roll" | "name">("lowest");

  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState("");
  const [analyticsYearFilter, setAnalyticsYearFilter] = useState("ALL");
  const [analyticsSectionFilter, setAnalyticsSectionFilter] = useState("ALL");

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "flags") {
        setActiveTab("flags");
      } else if (tab === "student-analytics") {
        setActiveTab("student-analytics");
      } else if (!params.has("tab")) {
        setActiveTab("summary");
      }
    };
    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [logDate, setLogDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<{
    title: string;
    description: string;
    studentsList: Array<{
      student: StudentUser;
      record?: AttendanceRecord;
      status: "present" | "absent";
    }>;
  }>({
    title: "",
    description: "",
    studentsList: []
  });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [mentorsSearchQuery, setMentorsSearchQuery] = useState("");
  const [schedulesSearchQuery, setSchedulesSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("All");

  // Fetch all students
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<StudentUser[]>({
    queryKey: ["users"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  // Fetch Monthly Attendance Records for Flag Calculations across the month
  const [monthForFlags] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: monthlyAttendanceForFlags = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["hod-attendance-month-flags", monthForFlags],
    queryFn: async () => {
      const [yearStr, monthStr] = monthForFlags.split("-");
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const fromStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
      const toStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      return customFetch<AttendanceRecord[]>(`/api/attendance?from=${fromStr}&to=${toStr}`);
    },
  });

  const totalMonthWorkingDays = useMemo(() => {
    const [yStr, mStr] = monthForFlags.split("-");
    const y = parseInt(yStr);
    const m = parseInt(mStr);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    let working = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dObj = new Date(y, m - 1, day, 12, 0, 0);
      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dStr > todayStr) break;
      if (dObj.getDay() !== 0) {
        working++;
      }
    }
    return Math.max(1, working);
  }, [monthForFlags]);

  const studentPresentCounts = useMemo(() => {
    const map = new Map<number, number>();
    (monthlyAttendanceForFlags || []).forEach((r: any) => {
      const uid = r.userId || r.user_id || r.user?.id;
      if (uid) {
        map.set(uid, (map.get(uid) || 0) + 1);
      }
    });
    return map;
  }, [monthlyAttendanceForFlags]);

  const hodStudents = useMemo(() => {
    return allUsers.filter((u) => u.role === "student");
  }, [allUsers]);

  const hodStudentAnalyticsList = useMemo(() => {
    return hodStudents.map((student) => {
      const presentDays = studentPresentCounts.get(student.id) || 0;
      const calcWorking = totalMonthWorkingDays > 0 ? totalMonthWorkingDays : 1;
      const percent = Math.min(100, Math.floor((presentDays / calcWorking) * 100));

      const classesNeededFor75 = Math.max(0, 3 * totalMonthWorkingDays - 4 * presentDays);
      const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalMonthWorkingDays - presentDays) / 0.35));

      let flag: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let label = "Safe Zone";
      let badgeColor = "bg-emerald-500 text-slate-950 font-black border border-emerald-400";
      let cardBorder = "border-l-4 border-l-emerald-500 border-slate-800";
      let bannerBg = "bg-slate-950 border-emerald-500/30 text-slate-200";
      let dotColor = "🟢";
      let tip = "Good Standing (≥ 75%). Attendance target met!";

      if (percent < 65) {
        flag = "RED";
        label = "Critical Risk (< 65%)";
        badgeColor = "bg-rose-600 text-white font-extrabold border border-rose-400 shadow-xs";
        cardBorder = "border-l-4 border-l-rose-500 border-slate-800";
        bannerBg = "bg-slate-950 border-rose-500/40 text-slate-200";
        dotColor = "🔴";
        tip = `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Warning (Recoverable)";
        badgeColor = "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs";
        cardBorder = "border-l-4 border-l-amber-400 border-slate-800";
        bannerBg = "bg-slate-950 border-amber-500/40 text-slate-200";
        dotColor = "🟡";
        tip = `Needs to attend next ${classesNeededFor75} consecutive classes to reach 75% safe threshold. Can improve by attending regularly!`;
      }

      const str = (student.section || "").trim();
      const parts = str.split("/");
      const sectionLetter = (parts[parts.length - 1] || "A").trim().toUpperCase();
      let yearLabel = "Department";
      let yearNum = "Other";
      let secName = student.section || "A";

      if (str.includes("IV") || str.includes("4")) {
        yearLabel = "4th Year"; yearNum = "4"; secName = `4${sectionLetter}`;
      } else if (str.includes("III") || str.includes("3")) {
        yearLabel = "3rd Year"; yearNum = "3"; secName = `3${sectionLetter}`;
      } else if (str.includes("II") || str.includes("2")) {
        yearLabel = "2nd Year"; yearNum = "2"; secName = `2${sectionLetter}`;
      }

      return {
        student,
        presentDays,
        totalWorkingDays: totalMonthWorkingDays,
        percent,
        flag,
        label,
        badgeColor,
        cardBorder,
        bannerBg,
        dotColor,
        tip,
        classesNeededFor75,
        classesNeededFor65,
        secInfo: { name: secName, yearLabel, yearNum }
      };
    });
  }, [hodStudents, studentPresentCounts, totalMonthWorkingDays]);

  const hodRedCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "RED").length, [hodStudentAnalyticsList]);
  const hodYellowCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "YELLOW").length, [hodStudentAnalyticsList]);
  const hodGreenCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "GREEN").length, [hodStudentAnalyticsList]);

  const filteredHodAnalyticsList = useMemo(() => {
    let result = hodStudentAnalyticsList.filter((item) => {
      const q = riskSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.student.name.toLowerCase().includes(q) ||
        (item.student.uniqueId || "").toLowerCase().includes(q);

      const matchesFlag = riskFlagFilter === "ALL" || item.flag === riskFlagFilter;
      const matchesYear = riskYearFilter === "ALL" || item.secInfo.yearNum === riskYearFilter;
      const matchesSection = riskSectionFilter === "ALL" || item.secInfo.name === riskSectionFilter;

      return matchesSearch && matchesFlag && matchesYear && matchesSection;
    });

    if (riskSortOrder === "lowest") {
      result.sort((a, b) => a.percent - b.percent);
    } else if (riskSortOrder === "roll") {
      result.sort((a, b) => (a.student.uniqueId || "").localeCompare(b.student.uniqueId || ""));
    } else if (riskSortOrder === "name") {
      result.sort((a, b) => a.student.name.localeCompare(b.student.name));
    }

    return result;
  }, [hodStudentAnalyticsList, riskSearchQuery, riskFlagFilter, riskYearFilter, riskSectionFilter, riskSortOrder]);

  // Fetch summary attendance records for selected date
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-summary", selectedDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${selectedDate}&to=${selectedDate}`),
    refetchInterval: 5000,
  });

  // Fetch custom date attendance logs
  const { data: detailedLogs = [], isLoading: logsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-logs", logDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${logDate}&to=${logDate}`),
    refetchInterval: activeTab === "logs" ? 5000 : undefined,
  });

  const queryClient = useQueryClient();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [scheduleToAssign, setScheduleToAssign] = useState<any | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  const [newClassModalOpen, setNewClassModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMentorId, setNewMentorId] = useState<number | "">("");
  const [newSection, setNewSection] = useState("A");
  const [newYear, setNewYear] = useState("II");
  const [newDay, setNewDay] = useState("MON");
  const [newStartTime, setNewStartTime] = useState("09:00:00");
  const [newEndTime, setNewEndTime] = useState("10:00:00");
  const [creatingClass, setCreatingClass] = useState(false);

  // Export Monthly Attendance Register state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateMode, setExportDateMode] = useState<"month" | "range">("month");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exportFromDate, setExportFromDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [exportToDate, setExportToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [exportType, setExportType] = useState<"department" | "year" | "section" | "student">("department");
  const [exportYear, setExportYear] = useState("2nd Year");
  const [exportSection, setExportSection] = useState("2A");
  const [exportStudentId, setExportStudentId] = useState<number | "">("");
  const [exportRollQuery, setExportRollQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Selected student for detail view modal
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [studentModalMonth, setStudentModalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    dayOfWeek: string;
    status: "P" | "A" | "*" | "—";
    record?: AttendanceRecord;
    holidayReason?: string;
  } | null>(null);

  const { data: studentMonthlyData } = useQuery<{ records: AttendanceRecord[], hourlyRecords: any[] }>({
    queryKey: ["student-monthly-records", selectedStudentForDetails?.id, selectedStudentForDetails?.uniqueId, studentModalMonth],
    queryFn: async () => {
      if (!selectedStudentForDetails) return { records: [], hourlyRecords: [] };
      return customFetch<{ records: AttendanceRecord[], hourlyRecords: any[] }>(`/api/attendance/user/${selectedStudentForDetails.id}?month=${studentModalMonth}`);
    },
    enabled: Boolean(selectedStudentForDetails)
  });

  const studentMonthlyRecords = studentMonthlyData?.records || [];
  const studentHourlyRecords = studentMonthlyData?.hourlyRecords || [];

  // Holiday Management State (persisted in localStorage)
  const [holidays, setHolidays] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("qr_hod_holidays");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      "2026-08-15": "Independence Day",
      "2026-01-26": "Republic Day",
      "2026-10-02": "Gandhi Jayanti",
      "2026-12-25": "Christmas"
    };
  });
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) return;
    const updated = {
      ...holidays,
      [newHolidayDate]: newHolidayReason || "Official Holiday"
    };
    setHolidays(updated);
    try {
      localStorage.setItem("qr_hod_holidays", JSON.stringify(updated));
    } catch (e) {}
    setNewHolidayDate("");
    setNewHolidayReason("");
  };

  const handleRemoveHoliday = (dateKey: string) => {
    const updated = { ...holidays };
    delete updated[dateKey];
    setHolidays(updated);
    try {
      localStorage.setItem("qr_hod_holidays", JSON.stringify(updated));
    } catch (e) {}
  };

  // Fetch mentors with keys for HOD Dashboard
  const { data: mentorsTracking = [], isLoading: mentorsLoading } = useQuery<any[]>({
    queryKey: ["admin-mentors-tracking"],
    queryFn: () => customFetch<any[]>("/api/admin/mentors-tracking"),
  });

  // Fetch timetables/schedules for HOD Dashboard
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<any[]>({
    queryKey: ["admin-schedules"],
    queryFn: () => customFetch<any[]>("/api/admin/schedules"),
    enabled: activeTab === "schedules",
  });

  const handleOpenAssignModal = (schedule: any) => {
    setScheduleToAssign(schedule);
    setSelectedMentorId(schedule.mentor_id || (mentorsTracking[0]?.id ?? ""));
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
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      setNewClassModalOpen(false);
      setNewSubject("");
    } catch (err: any) {
      alert(err?.data?.error || "Failed to create class schedule");
    } finally {
      setCreatingClass(false);
    }
  };

  const studentsOnly = allUsers.filter(u => u.role === "student");

  // Helper to map section name to code (e.g. "DS II/I/A" -> "2A")
  const getSectionDisplayName = (sectionStr: string | null | undefined): { name: string; yearLabel: string } => {
    if (!sectionStr) return { name: "Other", yearLabel: "Other" };
    
    const parts = sectionStr.split("/");
    const sectionLetter = parts[parts.length - 1] || "A";
    
    if (sectionStr.includes("IV")) {
      return { name: `4${sectionLetter}`, yearLabel: "4th Year" };
    }
    if (sectionStr.includes("III")) {
      return { name: `3${sectionLetter}`, yearLabel: "3rd Year" };
    }
    if (sectionStr.includes("II")) {
      return { name: `2${sectionLetter}`, yearLabel: "2nd Year" };
    }
    
    return { name: sectionStr, yearLabel: "Other" };
  };

  // Generate and Download Attendance Register CSV (Month or Date Range)
  const handleGenerateCsv = async () => {
    setIsExporting(true);
    try {
      let startDateStr = "";
      let endDateStr = "";
      let periodLabel = "";

      if (exportDateMode === "month") {
        const [yearStr, monthStr] = exportMonth.split("-");
        const yearNum = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        startDateStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
        endDateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        periodLabel = monthName.toUpperCase();
      } else {
        startDateStr = exportFromDate;
        endDateStr = exportToDate;
        periodLabel = `${exportFromDate} TO ${exportToDate}`;
      }

      // Helper to format local date YYYY-MM-DD without UTC timezone shift
      const formatDateLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Generate date array between startDateStr and endDateStr (inclusive) using noon local time
      const dateList: { dateStr: string; dayNum: number; dayOfWeek: string; displayLabel: string; isSundayOrHoliday: boolean }[] = [];
      const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);

      const curr = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);

      while (curr <= end) {
        const dateStr = formatDateLocal(curr);
        const dayNum = curr.getDate();
        const dayOfWeekStr = daysOfWeek[curr.getDay()];

        const isSunday = curr.getDay() === 0;
        const isDeclaredHoliday = Boolean(holidays[dateStr]);
        const isSundayOrHoliday = isSunday || isDeclaredHoliday;

        // Display label: e.g. "1 Sun", "2 Mon", "3 Tue"...
        const displayLabel = `${dayNum} ${dayOfWeekStr}`;

        dateList.push({ dateStr, dayNum, dayOfWeek: dayOfWeekStr, displayLabel, isSundayOrHoliday });
        curr.setDate(curr.getDate() + 1);
      }

      const rangeRecords = await customFetch<AttendanceRecord[]>(`/api/attendance?from=${startDateStr}&to=${endDateStr}`);

      const attendanceMap = new Map<number, Set<string>>();
      (rangeRecords || []).forEach(r => {
        const uId = r.userId || (r as any).user_id;
        if (!uId || !r.date) return;

        const rawDateStr = typeof r.date === "string" ? r.date.slice(0, 10) : formatDateLocal(new Date(r.date));
        if (!rawDateStr) return;

        if (!attendanceMap.has(uId)) {
          attendanceMap.set(uId, new Set<string>());
        }
        attendanceMap.get(uId)!.add(rawDateStr);
      });

      let targetStudents = [...studentsOnly];

      if (exportType === "year") {
        targetStudents = targetStudents.filter(s => getSectionDisplayName(s.section).yearLabel === exportYear);
      } else if (exportType === "section") {
        targetStudents = targetStudents.filter(s => getSectionDisplayName(s.section).name === exportSection);
      } else if (exportType === "student") {
        if (exportStudentId) {
          targetStudents = targetStudents.filter(s => s.id === Number(exportStudentId));
        }
      }

      targetStudents.sort((a, b) => {
        const secA = getSectionDisplayName(a.section).name;
        const secB = getSectionDisplayName(b.section).name;
        if (secA !== secB) return secA.localeCompare(secB);
        return a.name.localeCompare(b.name);
      });

      const csvRows: string[][] = [];

      csvRows.push([`ATTENDANCE REGISTER`]);
      csvRows.push([`PERIOD: ${periodLabel}`, `SCOPE: ${exportType.toUpperCase()}`]);
      csvRows.push([`LEGEND: P = Present, A = Absent, * = Sunday / Holiday`]);
      csvRows.push([]);

      const headerRow = ["Serial No.", "Roll No / Unique ID", "Student Name", "Year", "Section"];
      dateList.forEach(d => headerRow.push(d.displayLabel));
      headerRow.push("Total Present (P)", "Total Absent (A)", "Attendance %");
      csvRows.push(headerRow);

      const todayStr = formatDateLocal(new Date());

      targetStudents.forEach((student, idx) => {
        const secInfo = getSectionDisplayName(student.section);
        const studentDatesPresent = attendanceMap.get(student.id) || new Set<string>();

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalWorkingDays = 0;

        const studentRow = [
          String(idx + 1),
          `"${(student.uniqueId || "").replace(/"/g, '""')}"`,
          `"${(student.name || "").replace(/"/g, '""')}"`,
          secInfo.yearLabel,
          secInfo.name
        ];

        dateList.forEach(d => {
          const isPresent = studentDatesPresent.has(d.dateStr);
          const isFuture = d.dateStr > todayStr;

          if (isFuture) {
            studentRow.push("");
          } else if (d.isSundayOrHoliday) {
            if (isPresent) {
              studentRow.push("P");
              totalPresent++;
            } else {
              studentRow.push("*");
            }
          } else {
            totalWorkingDays++;
            if (isPresent) {
              studentRow.push("P");
              totalPresent++;
            } else {
              studentRow.push("A");
              totalAbsent++;
            }
          }
        });

        const calcDays = totalWorkingDays > 0 ? totalWorkingDays : 1;
        const percent = calcDays > 0 ? Math.floor((totalPresent / calcDays) * 100) : 0;

        studentRow.push(String(totalPresent), String(totalAbsent), `${percent}%`);
        csvRows.push(studentRow);
      });

      const csvContent = csvRows.map(e => e.join(",")).join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const scopeLabel = exportType === "section" ? exportSection : exportType === "year" ? exportYear : exportType === "student" ? "Individual" : "Department";
      const periodFileStr = exportDateMode === "month" ? exportMonth : `${exportFromDate}_to_${exportToDate}`;
      link.setAttribute("download", `Attendance_Register_${scopeLabel}_${periodFileStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (err: any) {
      alert("Failed to export attendance register: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Compile section statistics
  const sectionsMap = new Map<string, SectionStats>();

  studentsOnly.forEach(s => {
    const sec = s.section || "Unassigned";
    const batch = s.batch || "Unknown";
    const { name: displayName, yearLabel } = getSectionDisplayName(s.section);
    
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, {
        sectionKey: sec,
        displayName,
        batch,
        yearLabel,
        totalStudents: [],
        presentStudents: [],
        absentStudents: []
      });
    }
    
    sectionsMap.get(sec)!.totalStudents.push(s);
  });

  // Map today's attendance to sections
  const attendanceByUserId = new Map<number, AttendanceRecord>();
  attendanceRecords.forEach(r => {
    attendanceByUserId.set(r.userId, r);
  });

  sectionsMap.forEach((stats) => {
    stats.totalStudents.forEach(s => {
      const record = attendanceByUserId.get(s.id);
      if (record) {
        stats.presentStudents.push({ student: s, record });
      } else {
        stats.absentStudents.push(s);
      }
    });
  });

  const allSectionsList = Array.from(sectionsMap.values());

  // Sort sections: Year 2 first (A, B, C), Year 3 next, Year 4 last
  const sortOrder = ["DS II/I/A", "DS II/I/B", "DS II/I/C", "DS III/I/A", "DS III/I/B", "DS III/I/C", "DS III/I/D", "DS IV/I/A", "DS IV/I/B", "DS IV/I/C"];
  allSectionsList.sort((a, b) => {
    const indexA = sortOrder.indexOf(a.sectionKey);
    const indexB = sortOrder.indexOf(b.sectionKey);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.sectionKey.localeCompare(b.sectionKey);
  });

  // Group by yearLabel
  const yearGroups = ["2nd Year", "3rd Year", "4th Year"];

  // Total sums
  let overallTotalPresent = 0;
  let overallTotalAbsent = 0;
  let overallTotalStudents = 0;

  allSectionsList.forEach(s => {
    overallTotalPresent += s.presentStudents.length;
    overallTotalAbsent += s.absentStudents.length;
    overallTotalStudents += s.totalStudents.length;
  });

  const overallDeptPercentage = overallTotalStudents > 0 
    ? Math.floor((overallTotalPresent / overallTotalStudents) * 100) 
    : 0;

  // Handle cell click to open drill-down
  const handleCellClick = (type: "PR" | "AB" | "Total", sectionStats: SectionStats) => {
    let title = "";
    let description = "";
    let list: Array<{ student: StudentUser; record?: AttendanceRecord; status: "present" | "absent" }> = [];

    const secName = sectionStats.sectionKey.replace(/\//g, " ");

    if (type === "PR") {
      title = `Present Students — Section ${sectionStats.displayName}`;
      description = `Showing ${sectionStats.presentStudents.length} present students in ${secName}`;
      list = sectionStats.presentStudents.map(p => ({
        student: p.student,
        record: p.record,
        status: "present"
      }));
    } else if (type === "AB") {
      title = `Absent Students — Section ${sectionStats.displayName}`;
      description = `Showing ${sectionStats.absentStudents.length} absent students in ${secName}`;
      list = sectionStats.absentStudents.map(s => ({
        student: s,
        status: "absent"
      }));
    } else {
      title = `All Students — Section ${sectionStats.displayName}`;
      description = `Showing total roster of ${sectionStats.totalStudents.length} students in ${secName}`;
      list = sectionStats.totalStudents.map(s => {
        const pRecord = sectionStats.presentStudents.find(p => p.student.id === s.id);
        return {
          student: s,
          record: pRecord?.record,
          status: pRecord ? "present" : "absent"
        };
      });
    }

    setDrawerConfig({ title, description, studentsList: list });
    setStudentSearchQuery("");
    setDrawerOpen(true);
  };

  const filteredDrawerStudents = drawerConfig.studentsList.filter(item => {
    const q = studentSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.student.name.toLowerCase().includes(q) || item.student.uniqueId.toLowerCase().includes(q);
  });

  // Deduplicate and consolidate detailed logs so each student appears only once per date
  const consolidatedLogs = useMemo(() => {
    const logsMap = new Map<number, AttendanceRecord>();

    detailedLogs.forEach((log) => {
      if (!log.userId) return;

      const existing = logsMap.get(log.userId);
      if (!existing) {
        logsMap.set(log.userId, { ...log });
      } else {
        const earliestEntry = (() => {
          if (!log.entryTime) return existing.entryTime;
          if (!existing.entryTime) return log.entryTime;
          return new Date(log.entryTime).getTime() < new Date(existing.entryTime).getTime()
            ? log.entryTime
            : existing.entryTime;
        })();

        const latestExit = (() => {
          if (!log.exitTime) return existing.exitTime;
          if (!existing.exitTime) return log.exitTime;
          return new Date(log.exitTime).getTime() > new Date(existing.exitTime).getTime()
            ? log.exitTime
            : existing.exitTime;
        })();

        const isInside = existing.status === "inside" || log.status === "inside";
        const finalStatus = isInside ? "inside" : "left";
        const finalExitTime = isInside ? null : latestExit;

        let durationMinutes: number | null = null;
        if (earliestEntry && finalExitTime) {
          durationMinutes = Math.floor(Math.abs(new Date(finalExitTime).getTime() - new Date(earliestEntry).getTime()) / 60000);
        } else if (existing.durationMinutes || log.durationMinutes) {
          durationMinutes = (existing.durationMinutes || 0) + (log.durationMinutes || 0);
        }

        logsMap.set(log.userId, {
          ...existing,
          entryTime: earliestEntry,
          exitTime: finalExitTime,
          status: finalStatus,
          durationMinutes,
        });
      }
    });

    return Array.from(logsMap.values());
  }, [detailedLogs]);

  // Filter logs list based on section filter and search query
  const filteredLogs = consolidatedLogs.filter(log => {
    const sUser = log.user;
    if (!sUser) return false;
    
    // Filter section
    if (selectedSectionFilter !== "All") {
      const { name: dName } = getSectionDisplayName(sUser.section);
      if (dName !== selectedSectionFilter) return false;
    }
    
    // Filter search query
    const q = logSearchQuery.toLowerCase().trim();
    if (q) {
      return sUser.name.toLowerCase().includes(q) || sUser.uniqueId.toLowerCase().includes(q);
    }
    return true;
  });

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const isLateTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return false;
    try {
      const d = new Date(timeStr);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const seconds = d.getSeconds();
      const ms = d.getMilliseconds();
      return (seconds === 59 && ms === 999) || (hours === 22 && minutes === 0) || (hours === 3 && minutes === 30);
    } catch {
      return false;
    }
  };

  const handleDirectCSVDownload = (studentName: string, month: string, records: AttendanceRecord[]) => {
    const [sYearStr, sMonthStr] = month.split("-");
    const sYearNum = parseInt(sYearStr);
    const sMonthNum = parseInt(sMonthStr);
    const sDaysInMonth = new Date(sYearNum, sMonthNum, 0).getDate();

    const formatDateLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatDateLocal(new Date());

    const studentAttendanceByDate = new Map<string, AttendanceRecord>();
    (records || []).forEach(r => {
      if (!r.date) return;
      const rawDateStr = typeof r.date === "string" ? r.date.slice(0, 10) : formatDateLocal(new Date(r.date));
      if (rawDateStr) {
        studentAttendanceByDate.set(rawDateStr, r);
      }
    });

    const monthDaysList = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let day = 1; day <= sDaysInMonth; day++) {
      const dObj = new Date(sYearNum, sMonthNum - 1, day, 12, 0, 0);
      const dateStr = formatDateLocal(dObj);
      const dayOfWeek = daysOfWeek[dObj.getDay()];
      const isSunday = dObj.getDay() === 0;
      const isDeclaredHoliday = Boolean(holidays[dateStr]);
      const isSundayOrHoliday = isSunday || isDeclaredHoliday;
      const isFuture = dateStr > todayStr;
      
      const record = studentAttendanceByDate.get(dateStr);
      const isPresent = Boolean(record);

      let status = "Absent";
      if (isFuture) {
        status = "Future Date";
      } else if (isSundayOrHoliday) {
        if (isPresent) {
          status = "Present";
        } else {
          status = `Holiday (${isDeclaredHoliday ? holidays[dateStr] : "Sunday"})`;
        }
      } else {
        if (isPresent) {
          status = "Present";
        } else {
          status = "Absent";
        }
      }

      monthDaysList.push({
        dateStr,
        dayOfWeek,
        status,
        record
      });
    }

    const csvRows = [];
    csvRows.push([`CAMPUS ATTENDANCE REGISTER — ${studentName} (${month})`]);
    csvRows.push(["Date", "Day", "Status", "Entry Time (In)", "Exit Time (Out)", "Stay Duration"]);

    monthDaysList.forEach((d) => {
      const entryTimeStr = d.record?.entryTime ? formatTime(d.record.entryTime) : "—";
      const exitTimeStr = d.record?.exitTime ? formatTime(d.record.exitTime) : "—";
      let durationStr = "—";
      if (d.record?.durationMinutes) {
        durationStr = `${Math.floor(d.record.durationMinutes / 60)}h ${d.record.durationMinutes % 60}m`;
      } else if (d.record?.status === "inside") {
        durationStr = "Still on Campus";
      }

      csvRows.push([
        d.dateStr,
        d.dayOfWeek,
        d.status,
        entryTimeStr,
        exitTimeStr,
        durationStr
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${studentName}_Attendance_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExitTimeOver = (logDate: string | null | undefined, exitTime: string | null | undefined) => {
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
  };

  const getPercentageColor = (percent: number) => {
    if (percent < 40) return "text-red-500 font-bold";
    if (percent < 60) return "text-orange-400 font-semibold";
    return "text-green-400 font-semibold";
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
        
        {/* Header section (only show when NOT on Risk Flag Analytics tab) */}
        {activeTab !== "flags" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-500" />
                HOD Dashboard
              </h1>
              <p className="text-slate-400 font-medium mt-1">Department of Data Science (DS)</p>
            </div>
            
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 shadow-md hover:border-blue-500/50 transition-colors">
              <Calendar className="w-4 h-4 text-blue-400 pointer-events-none" />
              <input
                type="date"
                value={activeTab === "summary" ? selectedDate : logDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setLogDate(e.target.value);
                  }
                }}
                className="bg-transparent text-sm font-bold text-slate-200 outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {/* Tab Toggle buttons (only show when NOT on Risk Flag Analytics tab) */}
        {activeTab !== "flags" && (
          <div className="flex bg-slate-900/60 border border-slate-850 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "summary"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Summary Grid
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Detailed Logs
            </button>
            <button
              onClick={() => setActiveTab("mentors")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "mentors"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Department Mentors
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "schedules"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedules (Timetable)
            </button>
            <button
              onClick={() => setActiveTab("student-analytics")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "student-analytics"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Student Analytics
            </button>
          </div>
        )}

        {activeTab === "summary" ? (
          <>
            {/* Quick summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-200">{overallTotalStudents}</span>
                  <span className="text-xs text-slate-400">enrolled</span>
                </div>
              </Card>

              <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-green-400">{overallTotalPresent}</span>
                  <span className="text-xs text-slate-400">active</span>
                </div>
              </Card>

              <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Today</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-red-400">{overallTotalAbsent}</span>
                  <span className="text-xs text-slate-400">missed</span>
                </div>
              </Card>

              <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between border-l-4 border-l-blue-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department %</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-blue-400">{overallDeptPercentage}%</span>
                  <span className="text-xs text-slate-450">attendance</span>
                </div>
              </Card>
            </div>

            {/* Main Grid View */}
            {usersLoading || attendanceLoading ? (
              <div className="bg-slate-900 border border-slate-855 p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400">Loading student rosters & attendance records...</p>
              </div>
            ) : (
              <Card className="bg-slate-900/50 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900 text-slate-350 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">DS (Section)</th>
                        <th className="py-4 px-6 text-center">PR (Present)</th>
                        <th className="py-4 px-6 text-center">AB (Absent)</th>
                        <th className="py-4 px-6 text-center">Total</th>
                        <th className="py-4 px-6 text-center">% of Present</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-855/60">
                      {yearGroups.map(year => {
                        const sectionsInYear = allSectionsList.filter(s => s.yearLabel === year);
                        if (sectionsInYear.length === 0) return null;

                        // Compute year overall
                        let yearPresent = 0;
                        let yearAbsent = 0;
                        let yearTotal = 0;

                        sectionsInYear.forEach(s => {
                          yearPresent += s.presentStudents.length;
                          yearAbsent += s.absentStudents.length;
                          yearTotal += s.totalStudents.length;
                        });

                        const yearPercentage = yearTotal > 0 
                          ? Math.floor((yearPresent / yearTotal) * 100) 
                          : 0;

                        return (
                          <>
                            {sectionsInYear.map(s => {
                              const percent = s.totalStudents.length > 0 
                                ? (s.presentStudents.length / s.totalStudents.length) * 100 
                                : 0;

                              return (
                                <tr key={s.sectionKey} className="hover:bg-slate-800/30 transition-colors group">
                                  <td className="py-4 px-6 font-bold text-slate-200 text-base">{s.displayName}</td>
                                  
                                  <td 
                                    onClick={() => handleCellClick("PR", s)}
                                    className="py-4 px-6 text-center text-green-400 font-semibold cursor-pointer hover:bg-green-500/10 active:scale-[0.98] transition-transform text-lg"
                                  >
                                    {s.presentStudents.length}
                                  </td>
                                  
                                  <td 
                                    onClick={() => handleCellClick("AB", s)}
                                    className="py-4 px-6 text-center text-red-400 font-semibold cursor-pointer hover:bg-red-500/10 active:scale-[0.98] transition-transform text-lg"
                                  >
                                    {s.absentStudents.length}
                                  </td>
                                  
                                  <td 
                                    onClick={() => handleCellClick("Total", s)}
                                    className="py-4 px-6 text-center text-slate-300 font-medium cursor-pointer hover:bg-slate-700/20 active:scale-[0.98] transition-transform text-lg"
                                  >
                                    {s.totalStudents.length}
                                  </td>
                                  
                                  <td className="py-4 px-6 text-center font-mono">
                                    <span className={getPercentageColor(percent)}>
                                      {Math.floor(percent)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Overall row for this specific year */}
                            <tr className="bg-blue-950/20 border-y border-slate-800">
                              <td className="py-4 px-6 font-black text-blue-400 text-base italic">Overall ({year})</td>
                              <td className="py-4 px-6 text-center text-green-400 font-bold text-lg">{yearPresent}</td>
                              <td className="py-4 px-6 text-center text-red-400 font-bold text-lg">{yearAbsent}</td>
                              <td className="py-4 px-6 text-center text-slate-200 font-bold text-lg">{yearTotal}</td>
                              <td className="py-4 px-6 text-center font-mono font-black text-blue-400 text-lg">
                                {yearPercentage}
                              </td>
                            </tr>
                          </>
                        );
                      })}
                      
                      {/* Department level summary footer */}
                      <tr className="bg-slate-900 border-t border-slate-850">
                        <td colSpan={4} className="py-6 px-6 font-black text-slate-200 text-lg tracking-wider text-right pr-12">
                          Overall Department %
                        </td>
                        <td className="py-6 px-6 text-center font-mono font-black text-blue-400 text-xl border-l border-slate-850">
                          {overallDeptPercentage}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : activeTab === "logs" ? (
          <>
            {/* Detailed logs filter toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Date Filter</label>
                <div className="relative">
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-semibold [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Section Filter</label>
                <select
                  value={selectedSectionFilter}
                  onChange={(e) => setSelectedSectionFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-semibold cursor-pointer"
                >
                  <option value="All">All Sections</option>
                  <option value="2A">2A CSE Data Science</option>
                  <option value="2B">2B CSE Data Science</option>
                  <option value="2C">2C CSE Data Science</option>
                  <option value="3A">3A CSE Data Science</option>
                  <option value="3B">3B CSE Data Science</option>
                  <option value="3C">3C CSE Data Science</option>
                  <option value="3D">3D CSE Data Science</option>
                  <option value="4A">4A CSE Data Science</option>
                  <option value="4B">4B CSE Data Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Search Students</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name or roll..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Holidays</label>
                <button
                  onClick={() => setHolidayModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 active:scale-[0.98] text-blue-200 font-bold text-xs border border-blue-700/50 transition-all shadow-md cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Manage Holidays
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Export Register</label>
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Detailed Logs Table */}
            {logsLoading ? (
              <div className="bg-slate-900 border border-slate-855 p-20 flex flex-col items-center justify-center gap-4 rounded-3xl">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400">Loading attendance log registry...</p>
              </div>
            ) : (
              <Card className="bg-slate-900/50 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto max-h-[620px] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                      <tr className="border-b border-slate-800/80 bg-slate-900 text-slate-350 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Student details</th>
                        <th className="py-4 px-6 text-center">Class / Section</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-center">Entry Time (In)</th>
                        <th className="py-4 px-6 text-center">Exit Time (Out)</th>
                        <th className="py-4 px-6 text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-855/60">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                            No attendance logs registered for this query selection.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          const user = log.user!;
                          const { name: sDisplayName } = getSectionDisplayName(user.section);
                          
                          return (
                            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6">
                                <div
                                  onClick={() => setSelectedStudentForDetails(user)}
                                  className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
                                  title="Click to view full student details"
                                >
                                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase group-hover:border-blue-500 transition-colors">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">
                                      {user.name}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5 group-hover:text-blue-300 transition-colors">
                                      {user.uniqueId}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center font-bold text-slate-300">
                                {sDisplayName}
                              </td>

                              <td className="py-4 px-6 text-center">
                                {isExitTimeOver(log.date, log.exitTime) ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    Not Scanned
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                                    log.status === "inside"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                      : "bg-slate-800/60 text-slate-400 border border-slate-700/50"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${log.status === "inside" ? "bg-emerald-400" : "bg-slate-500"}`} />
                                    {log.status === "inside" ? "On Campus" : "Left"}
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-center text-slate-300 font-mono">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span>{formatTime(log.entryTime)}</span>
                                  {isLateTime(log.entryTime) && (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider scale-95">
                                      Late Entry
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-center text-slate-300 font-mono">
                                {isExitTimeOver(log.date, log.exitTime) ? (
                                  <span className="inline-flex items-center justify-center gap-1.5 text-slate-500 text-xs font-medium">
                                    <span className="w-4 h-[1.5px] bg-slate-600 rounded-full inline-block" />
                                    —
                                  </span>
                                ) : (
                                  formatTime(log.exitTime)
                                )}
                              </td>

                              <td className="py-4 px-6 text-center text-slate-400 text-sm">
                                {log.durationMinutes ? `${log.durationMinutes} mins` : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : activeTab === "mentors" ? (
          <>
            {/* Mentors Search Toolbar */}
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex-1 min-w-0">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search mentor name, email, or passkey..."
                    value={mentorsSearchQuery}
                    onChange={(e) => setMentorsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Mentors Grid */}
            {mentorsLoading ? (
              <div className="bg-slate-900 border border-slate-800 p-20 flex flex-col items-center justify-center gap-4 rounded-3xl">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400">Loading faculty registry...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {OFFICIAL_FACULTY_LIST.filter((m) => {
                  const q = mentorsSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    m.name.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    m.role.toLowerCase().includes(q) ||
                    m.section.toLowerCase().includes(q)
                  );
                }).map((m) => (
                  <div key={m.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors shadow-lg min-w-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-slate-300 uppercase flex-shrink-0">
                          {m.name.split(" ").slice(-1)[0]?.charAt(0) || m.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-100 text-sm leading-tight truncate">{m.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate w-full block">{m.email}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                        m.yearLabel?.includes("4") ? "bg-orange-950/60 border-orange-800/50 text-orange-400"
                        : m.yearLabel?.includes("3") ? "bg-blue-950/60 border-blue-800/50 text-blue-400"
                        : "bg-emerald-950/60 border-emerald-800/50 text-emerald-400"
                      }`}>
                        {m.yearLabel}
                      </span>
                    </div>

                    {/* Section & Roll Range */}
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned Section</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">Sec {m.section}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono mt-1 pt-1.5 border-t border-slate-700/40 break-words leading-relaxed">{m.rollRange}</p>
                    </div>

                    {/* Role & Students Count */}
                    <div className="flex items-center justify-between bg-slate-800/30 rounded-xl px-3.5 py-2.5 border border-slate-700/30">
                      <span className="text-xs font-bold text-slate-400 truncate">{m.role}</span>
                      <span className="text-xs font-black text-slate-200 font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 flex-shrink-0">{m.count} Students</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "schedules" ? (
          <>
            {/* Timetable Schedules Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex-1 min-w-0 w-full">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search subject, section, day or mentor..."
                    value={schedulesSearchQuery}
                    onChange={(e) => setSchedulesSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={() => setNewClassModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] w-full sm:w-auto flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Assign New Class
              </button>
            </div>

            {/* Timetable Schedules Table */}
            {schedulesLoading ? (
              <div className="bg-slate-900 border border-slate-855 p-20 flex flex-col items-center justify-center gap-4 rounded-3xl">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400">Loading department timetables...</p>
              </div>
            ) : (
              <Card className="bg-slate-900/50 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto max-h-[620px] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                      <tr className="border-b border-slate-800/80 bg-slate-900 text-slate-350 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Mentor / Teacher</th>
                        <th className="py-4 px-6">Day</th>
                        <th className="py-4 px-6">Time Slot</th>
                        <th className="py-4 px-6">Class / Section</th>
                        <th className="py-4 px-6">Subject</th>
                        <th className="py-4 px-6 text-center">Assign Faculty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-855/60">
                      {schedules.filter((s: any) => {
                        const q = schedulesSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          (s.qr_mentors?.name || "").toLowerCase().includes(q) ||
                          s.day_of_week.toLowerCase().includes(q) ||
                          s.section.toLowerCase().includes(q) ||
                          s.year.toLowerCase().includes(q) ||
                          (s.subject || "").toLowerCase().includes(q)
                        );
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                            No timetable slots found matching your query.
                          </td>
                        </tr>
                      ) : (
                        schedules.filter((s: any) => {
                          const q = schedulesSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            (s.qr_mentors?.name || "").toLowerCase().includes(q) ||
                            s.day_of_week.toLowerCase().includes(q) ||
                            s.section.toLowerCase().includes(q) ||
                            s.year.toLowerCase().includes(q) ||
                            (s.subject || "").toLowerCase().includes(q)
                          );
                        }).map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-200">{s.qr_mentors?.name || "Unassigned"}</td>
                            <td className="py-4 px-6 text-slate-300 font-bold">{s.day_of_week}</td>
                            <td className="py-4 px-6 text-slate-405 font-mono text-xs">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</td>
                            <td className="py-4 px-6">
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 font-bold text-xs">
                                {s.year} Yr - {s.section}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-300">{s.subject || "—"}</td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleOpenAssignModal(s)}
                                className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Assign Faculty
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : activeTab === "student-analytics" ? (
          <div className="space-y-6">
            {/* Student Analytics Search & Filter Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Student Analytics & Profiles
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 font-semibold">
                    Search any student by full name or roll number to view full attendance reports, risk status, and monthly register
                  </p>
                </div>
              </div>

              {/* Prominent Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type student name or roll number (e.g. 23N81A6701, Jashwanth)..."
                  value={analyticsSearchQuery}
                  onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-900 font-bold placeholder-slate-500 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider mr-1">Year:</span>
                  {["ALL", "2", "3", "4"].map((y) => (
                    <button
                      key={y}
                      onClick={() => setAnalyticsYearFilter(y)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        analyticsYearFilter === y
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300"
                      }`}
                    >
                      {y === "ALL" ? "All Years" : `${y}nd/rd/th Year`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider mr-1">Section:</span>
                  {["ALL", "A", "B", "C"].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setAnalyticsSectionFilter(sec)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        analyticsSectionFilter === sec
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300"
                      }`}
                    >
                      {sec === "ALL" ? "All Sections" : `Sec ${sec}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtered Students Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const filtered = hodStudentAnalyticsList.filter((item) => {
                  const s = item.student;
                  const q = analyticsSearchQuery.toLowerCase().trim();
                  if (q) {
                    const matchName = s.name.toLowerCase().includes(q);
                    const matchRoll = (s.uniqueId || "").toLowerCase().includes(q);
                    if (!matchName && !matchRoll) return false;
                  }
                  if (analyticsYearFilter !== "ALL") {
                    if (item.secInfo.yearNum !== analyticsYearFilter) return false;
                  }
                  if (analyticsSectionFilter !== "ALL") {
                    if (item.secInfo.name !== analyticsSectionFilter) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
                      <Users className="w-12 h-12 text-slate-500 mx-auto" />
                      <h4 className="text-slate-900 font-bold text-base">No Students Found</h4>
                      <p className="text-xs text-slate-700 font-semibold">No student matches your search query or selected filters.</p>
                    </div>
                  );
                }

                return filtered.map((item) => {
                  const s = item.student;
                  const isSafe = item.flag === "GREEN";
                  const isWarning = item.flag === "YELLOW";

                  return (
                    <div
                      key={s.id}
                      className="bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 group min-w-0"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-300 text-blue-900 flex items-center justify-center font-black text-lg flex-shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {s.name}
                              </h4>
                              <p className="text-xs font-mono font-bold text-slate-700 mt-0.5 truncate">
                                {s.uniqueId || "N/A"}
                              </p>
                            </div>
                          </div>
                          
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                              isSafe
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : isWarning
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-rose-100 text-rose-900 border-rose-300"
                            }`}
                          >
                            {item.percent}% ({isSafe ? "Safe" : isWarning ? "Warning" : "Critical"})
                          </span>
                        </div>

                        <div className="bg-slate-850 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-700 font-semibold">
                            <span>Class / Section:</span>
                            <span className="font-bold text-slate-900">{item.secInfo.yearLabel} - Sec {item.secInfo.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700 font-semibold">
                            <span>Days Attended:</span>
                            <span className="font-bold text-slate-900">{item.presentDays} / {item.totalWorkingDays} days</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedStudentForDetails(s)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        View Full Profile & Report
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activeTab === "flags" ? (
          /* DEDICATED HOD STUDENT RISK FLAG ANALYTICS VIEW */
          <div className="space-y-5">
            {/* Risk Flag Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setRiskFlagFilter("RED")}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  riskFlagFilter === "RED"
                    ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 shadow-xl"
                    : "bg-slate-900 border-slate-800 hover:border-rose-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    🔴 Red Flag (&lt; 65%)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                    Critical
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{hodRedCount} Students</p>
                <p className="text-xs text-slate-700 font-semibold mt-1">Shortage Risk • Requires Condonation / Intimation</p>
              </button>

              <button
                onClick={() => setRiskFlagFilter("YELLOW")}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  riskFlagFilter === "YELLOW"
                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xl"
                    : "bg-slate-900 border-slate-800 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    🟡 Yellow Flag (65%–74%)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    Warning
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{hodYellowCount} Students</p>
                <p className="text-xs text-slate-700 font-semibold mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
              </button>

              <button
                onClick={() => setRiskFlagFilter("GREEN")}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  riskFlagFilter === "GREEN"
                    ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl"
                    : "bg-slate-900 border-slate-800 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    🟢 Green Flag (≥ 75%)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Safe
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{hodGreenCount} Students</p>
                <p className="text-xs text-slate-700 font-semibold mt-1">Good Standing • Target Met</p>
              </button>
            </div>

            {/* Categorization & Filter Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student name or roll number..."
                    value={riskSearchQuery}
                    onChange={(e) => setRiskSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Flag Filter */}
                  <select
                    value={riskFlagFilter}
                    onChange={(e: any) => setRiskFlagFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Risk Flags (🔴 🟡 🟢)</option>
                    <option value="RED">🔴 Red Flag (&lt; 65%)</option>
                    <option value="YELLOW">🟡 Yellow Flag (65%–74%)</option>
                    <option value="GREEN">🟢 Green Flag (≥ 75%)</option>
                  </select>

                  {/* Year Filter */}
                  <select
                    value={riskYearFilter}
                    onChange={(e) => setRiskYearFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="2">2nd Year (II)</option>
                    <option value="3">3rd Year (III)</option>
                    <option value="4">4th Year (IV)</option>
                  </select>

                  {/* Section Filter */}
                  <select
                    value={riskSectionFilter}
                    onChange={(e) => setRiskSectionFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Sections</option>
                    <option value="2A">Section 2A</option>
                    <option value="2B">Section 2B</option>
                    <option value="2C">Section 2C</option>
                    <option value="3A">Section 3A</option>
                    <option value="3B">Section 3B</option>
                    <option value="3C">Section 3C</option>
                    <option value="4A">Section 4A</option>
                    <option value="4B">Section 4B</option>
                  </select>

                  {/* Sort Order */}
                  <select
                    value={riskSortOrder}
                    onChange={(e: any) => setRiskSortOrder(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="lowest">Sort: Lowest Attendance %</option>
                    <option value="roll">Sort: Roll Number</option>
                    <option value="name">Sort: Student Name</option>
                  </select>
                </div>
              </div>

              {/* Student Flag Cards */}
              <div className="space-y-3 pt-2 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar contain-paint">
                {filteredHodAnalyticsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-600 text-xs font-semibold">
                    No students found matching your categorised filter.
                  </div>
                ) : (
                  filteredHodAnalyticsList.map((item) => (
                    <div
                      key={item.student.id}
                      onClick={() => setSelectedStudentForDetails(item.student)}
                      className={`bg-slate-900 border rounded-2xl p-4 transition-colors cursor-pointer space-y-3 group ${item.cardBorder}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-base">
                            {item.dotColor}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.student.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-700 font-mono font-semibold">
                              <span>Roll: <strong className="text-emerald-700 font-extrabold">{item.student.uniqueId || "N/A"}</strong></span>
                              <span>•</span>
                              <span>Year: <strong className="text-slate-900 font-bold">{item.secInfo.yearLabel}</strong></span>
                              <span>•</span>
                              <span>Sec: <strong className="text-blue-700 font-bold">{item.secInfo.name}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs inline-block ${item.badgeColor}`}>
                              {item.label} ({item.percent}%)
                            </span>
                            <p className="text-xs text-slate-700 font-bold mt-1">
                              {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recovery Math Banner */}
                      <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.bannerBg}`}>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 shrink-0 text-slate-600" />
                          <span className="font-bold text-slate-900">{item.tip}</span>
                        </div>

                        {item.classesNeededFor75 > 0 ? (
                          <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 shrink-0 shadow-xs">
                            Target +{item.classesNeededFor75} Classes Needed
                          </span>
                        ) : (
                          <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 shrink-0 shadow-xs">
                            ✓ Target Met
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Detailed student listing slide-over sheet */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl bg-slate-900 border-l border-slate-800/80 p-0 flex flex-col h-full text-slate-100">
            <SheetHeader className="p-6 border-b border-slate-800">
              <SheetTitle className="text-2xl font-bold text-slate-200 tracking-tight">
                {drawerConfig.title}
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-sm mt-1">
                {drawerConfig.description}
              </SheetDescription>
            </SheetHeader>

            {/* Search filter */}
            <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search student name or roll number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                />
              </div>
            </div>

            {/* Students list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-855 p-2">
              {filteredDrawerStudents.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No students match your query.
                </div>
              ) : (
                filteredDrawerStudents.map((item, idx) => {
                  const s = item.student;
                  const record = item.record;
                  
                  return (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                          <p className="text-xs text-slate-550 font-mono mt-0.5">{s.uniqueId}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 text-right">
                        {item.status === "present" ? (
                          <>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              record && isExitTimeOver(record.date, record.exitTime)
                                ? "bg-red-950/60 text-red-400 border border-red-900/40"
                                : "bg-green-950/60 text-green-400 border border-green-900/40"
                            }`}>
                              {record && isExitTimeOver(record.date, record.exitTime) ? (
                                <XCircle className="w-3 h-3 text-red-400" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {record?.exitTime
                                ? "Left Campus"
                                : record && isExitTimeOver(record.date, record.exitTime)
                                  ? "Not Scanned"
                                  : "Still on Campus"}
                            </span>
                            <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-500" /> 
                                In: {formatTime(record?.entryTime)}
                                {isLateTime(record?.entryTime) && (
                                  <span className="ml-1.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider">LATE</span>
                                )}
                              </span>
                              {record?.exitTime ? (
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-red-500" /> Out: {formatTime(record?.exitTime)}</span>
                              ) : record && isExitTimeOver(record.date, record.exitTime) ? (
                                <span className="flex items-center gap-1 text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5 text-red-500" /> Out: Not Scanned</span>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-900/40">
                            <XCircle className="w-3 h-3" />
                            Absent
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Assign Faculty to Class Modal */}
        {assignModalOpen && scheduleToAssign && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Assign Class to Faculty</h3>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1 text-xs">
                <p className="text-slate-300 font-bold">{scheduleToAssign.subject}</p>
                <p className="text-slate-400">Class: {scheduleToAssign.year} Yr - {scheduleToAssign.section} | Day: {scheduleToAssign.day_of_week}</p>
                <p className="text-slate-500 font-mono">{scheduleToAssign.start_time?.slice(0,5)} - {scheduleToAssign.end_time?.slice(0,5)}</p>
              </div>

              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Faculty / Teacher
                  </label>
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentorsTracking.map((m: any) => (
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
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Assign New Class Schedule</h3>
                </div>
                <button
                  onClick={() => setNewClassModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DBMS, Computer Networks, AI"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold"
                    >
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold"
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="text"
                      placeholder="09:00:00"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                    <input
                      type="text"
                      placeholder="10:00:00"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assign Faculty / Teacher
                  </label>
                  <select
                    value={newMentorId}
                    onChange={(e) => setNewMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentorsTracking.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) — Key: {m.key || "No Key"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewClassModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
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

        {/* Export Monthly Attendance Register Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Download Monthly Register</h3>
                    <p className="text-xs text-slate-400">Export attendance spreadsheet (P / A register format)</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Date Selection Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date Range Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExportDateMode("month")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        exportDateMode === "month"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🗓️ By Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportDateMode("range")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        exportDateMode === "range"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📅 Calendar Range (From - To)
                    </button>
                  </div>
                </div>

                {/* Month Picker */}
                {exportDateMode === "month" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={exportMonth}
                      onChange={(e) => setExportMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                      required
                    />
                  </div>
                ) : (
                  /* Custom From - To Calendar Date Pickers */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={exportFromDate}
                        onChange={(e) => setExportFromDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={exportToDate}
                        onChange={(e) => setExportToDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Scope Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Target Scope
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="department">Full Department (All Students)</option>
                    <option value="year">By Year (2nd, 3rd, or 4th Year)</option>
                    <option value="section">By Section (e.g. 2A, 2B, 3A...)</option>
                    <option value="student">Individual Student</option>
                  </select>
                </div>

                {/* Year Selector */}
                {exportType === "year" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Year
                    </label>
                    <select
                      value={exportYear}
                      onChange={(e) => setExportYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="2nd Year">2nd Year (DS II)</option>
                      <option value="3rd Year">3rd Year (DS III)</option>
                      <option value="4th Year">4th Year (DS IV)</option>
                    </select>
                  </div>
                )}

                {/* Section Selector */}
                {exportType === "section" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Section
                    </label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="2A">2A CSE Data Science</option>
                      <option value="2B">2B CSE Data Science</option>
                      <option value="2C">2C CSE Data Science</option>
                      <option value="3A">3A CSE Data Science</option>
                      <option value="3B">3B CSE Data Science</option>
                      <option value="3C">3C CSE Data Science</option>
                      <option value="3D">3D CSE Data Science</option>
                      <option value="4A">4A CSE Data Science</option>
                      <option value="4B">4B CSE Data Science</option>
                    </select>
                  </div>
                )}

                {/* Student Selector by Roll Number or Name */}
                {exportType === "student" && (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Enter Roll Number or Search Student
                    </label>

                    {/* Roll Number Search Input */}
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        <Search className="w-4 h-4 text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Type Roll Number (e.g. 23N81A6701)..."
                        value={exportRollQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExportRollQuery(val);
                          const matched = studentsOnly.find(s => 
                            s.uniqueId?.toLowerCase().trim() === val.toLowerCase().trim()
                          );
                          if (matched) {
                            setExportStudentId(matched.id);
                          } else if (!val) {
                            setExportStudentId("");
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 placeholder-slate-600 font-mono"
                      />
                    </div>

                    {/* Dropdown sorted by Roll Number first */}
                    <select
                      value={exportStudentId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setExportStudentId(id);
                        const s = studentsOnly.find(st => st.id === id);
                        if (s) {
                          setExportRollQuery(s.uniqueId || "");
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Select from Roll Number List --</option>
                      {[...studentsOnly]
                        .filter(s => {
                          if (!exportRollQuery) return true;
                          const q = exportRollQuery.toLowerCase().trim();
                          return (s.uniqueId || "").toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
                        })
                        .sort((a, b) => (a.uniqueId || "").localeCompare(b.uniqueId || ""))
                        .map(s => {
                          const { name: secName } = getSectionDisplayName(s.section);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.uniqueId ? `${s.uniqueId} — ` : ""}{s.name} (Sec {secName})
                            </option>
                          );
                        })}
                    </select>

                    {/* Selected Student Details Card */}
                    {exportStudentId ? (
                      (() => {
                        const s = studentsOnly.find(st => st.id === Number(exportStudentId));
                        if (!s) return null;
                        const { name: secName, yearLabel } = getSectionDisplayName(s.section);
                        return (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center font-bold text-emerald-300">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-emerald-200 text-sm">{s.name}</p>
                                <p className="text-emerald-400/80 font-mono">Roll No: {s.uniqueId || "N/A"} | Sec {secName} ({yearLabel})</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Selected
                            </span>
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                )}

                <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">📊 Register Format Preview:</p>
                  <p>• Columns: S.No | Roll No | Student Name | Year | Section | Day 1..31 | Total P | Total A | Attendance %</p>
                  <p>• Daily Status: <span className="text-emerald-400 font-bold">P</span> = Present, <span className="text-red-400 font-bold">A</span> = Absent</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCsv}
                  disabled={isExporting || (exportType === "student" && !exportStudentId)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Spreadsheet (.csv)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Holidays Modal */}
        {holidayModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Declare / Manage Holidays</h3>
                </div>
                <button
                  onClick={() => setHolidayModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Add Holiday Form */}
              <form onSubmit={handleAddHoliday} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Holiday Date
                    </label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reason / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Independence Day"
                      value={newHolidayReason}
                      onChange={(e) => setNewHolidayReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500 placeholder-slate-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newHolidayDate}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Holiday
                </button>
              </form>

              {/* Declared Holidays List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Declared Holidays ({Object.keys(holidays).length})
                </p>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {Object.keys(holidays).length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-3">No custom holidays declared yet.</p>
                  ) : (
                    Object.entries(holidays)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dStr, reason]) => (
                        <div key={dStr} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs">
                          <div>
                            <span className="font-mono font-bold text-purple-300">{dStr}</span>
                            <span className="text-slate-400 ml-2 font-medium">— {reason}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveHoliday(dStr)}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                            title="Remove Holiday"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40 text-[11px] text-purple-300/80 space-y-0.5">
                <p className="font-bold text-purple-200">ℹ️ Automatic Rules:</p>
                <p>• All <span className="font-bold text-purple-200">Sundays</span> are automatically marked with <span className="font-bold text-amber-400">*</span> in the register.</p>
                <p>• Declared holidays above are also marked with <span className="font-bold text-amber-400">*</span> and not counted as absent days.</p>
              </div>
            </div>
          </div>
        )}
        {/* Student Profile & Attendance Details Modal - FULL SCREEN REDESIGN */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col p-6 sm:p-10 md:p-12 overflow-y-auto animate-fadeIn font-sans">
            <div className="max-w-4xl mx-auto w-full space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                    {selectedStudentForDetails.name ? selectedStudentForDetails.name.charAt(0) : "S"}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                      {selectedStudentForDetails.name}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                        Student
                      </span>
                    </h2>
                    <p className="text-sm font-semibold text-slate-400 mt-1">
                      Department of CSE Data Science
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Roll Number</p>
                    <p className="text-base font-bold text-slate-200 font-mono mt-1">
                      {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                  <div className="p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Section & Year</p>
                    <p className="text-base font-bold text-slate-200 mt-1">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel})
                    </p>
                  </div>
                  <div className="p-4.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Department</p>
                    <p className="text-base font-bold text-blue-400 mt-1">
                      CSE Data Science
                    </p>
                  </div>
                </div>

                {/* Interactive Monthly Attendance Register Grid & Day Details */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Select Month
                      </label>
                      <CustomMonthSelector
                        value={studentModalMonth}
                        onChange={(val) => {
                          setStudentModalMonth(val);
                          setSelectedDayDetail(null);
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleDirectCSVDownload(selectedStudentForDetails.name, studentModalMonth, studentMonthlyRecords)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-800/60 shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download Register (.csv)
                    </button>
                  </div>

                  {/* Monthly Stats Summary Bar */}
                  {(() => {
                    const [sYearStr, sMonthStr] = studentModalMonth.split("-");
                    const sYearNum = parseInt(sYearStr);
                    const sMonthNum = parseInt(sMonthStr);
                    const sDaysInMonth = new Date(sYearNum, sMonthNum, 0).getDate();

                    const formatDateLocal = (d: Date) => {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      return `${y}-${m}-${day}`;
                    };

                    const todayStr = formatDateLocal(new Date());

                    const studentAttendanceByDate = new Map<string, AttendanceRecord>();
                    (studentMonthlyRecords || []).forEach(r => {
                      if (!r.date) return;
                      const rawDateStr = typeof r.date === "string" ? r.date.slice(0, 10) : formatDateLocal(new Date(r.date));
                      if (rawDateStr) {
                        studentAttendanceByDate.set(rawDateStr, r);
                      }
                    });

                    const monthDaysList = [];
                    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                    let studentPresentCount = 0;
                    let studentAbsentCount = 0;
                    let studentHolidayCount = 0;
                    let studentWorkingDaysCount = 0;

                    for (let day = 1; day <= sDaysInMonth; day++) {
                      const dObj = new Date(sYearNum, sMonthNum - 1, day, 12, 0, 0);
                      const dateStr = formatDateLocal(dObj);
                      const dayOfWeek = daysOfWeek[dObj.getDay()];
                      const isSunday = dObj.getDay() === 0;
                      const isDeclaredHoliday = Boolean(holidays[dateStr]);
                      const isSundayOrHoliday = isSunday || isDeclaredHoliday;
                      const isFuture = dateStr > todayStr;
                      
                      const record = studentAttendanceByDate.get(dateStr);
                      const isPresent = Boolean(record);

                      let status: "P" | "A" | "*" | "—" = "A";
                      if (isFuture) {
                        status = "—";
                      } else if (isSundayOrHoliday) {
                        if (isPresent) {
                          status = "P";
                          studentPresentCount++;
                        } else {
                          status = "*";
                          studentHolidayCount++;
                        }
                      } else {
                        studentWorkingDaysCount++;
                        if (isPresent) {
                          status = "P";
                          studentPresentCount++;
                        } else {
                          status = "A";
                          studentAbsentCount++;
                        }
                      }

                      monthDaysList.push({
                        dayNum: day,
                        dateStr,
                        dayOfWeek,
                        status,
                        isSundayOrHoliday,
                        isFuture,
                        holidayReason: isDeclaredHoliday ? holidays[dateStr] : isSunday ? "Sunday" : undefined,
                        record
                      });
                    }

                    const calcWorkingDays = studentWorkingDaysCount > 0 ? studentWorkingDaysCount : 1;
                    const studentMonthlyPercent = Math.floor((studentPresentCount / calcWorkingDays) * 100);

                    // Dynamic stay time math
                    const presentDaysWithDuration = (studentMonthlyRecords || []).filter(r => r.durationMinutes && r.durationMinutes > 0);
                    const totalDurationMinutes = presentDaysWithDuration.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
                    const avgDurationMinutes = presentDaysWithDuration.length > 0 ? Math.round(totalDurationMinutes / presentDaysWithDuration.length) : 0;
                    const avgDurationStr = avgDurationMinutes > 0 ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m` : "No checkout logs";

                    const hourlyForSelectedDay = (studentHourlyRecords || []).filter((hr: any) => {
                      if (!hr.date || !selectedDayDetail) return false;
                      return hr.date.slice(0, 10) === selectedDayDetail.dateStr;
                    });

                    return (
                      <div className="space-y-6">
                        {/* Stats Row & Visual Pie Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          {/* Pie Chart Card */}
                          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Breakdown</p>
                            <div className="relative flex items-center justify-center">
                              {/* Inline SVG Pie Chart */}
                              <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
                                <path
                                  className="text-slate-850"
                                  strokeWidth="3"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className={studentMonthlyPercent >= 75 ? "text-emerald-500" : studentMonthlyPercent >= 65 ? "text-amber-500" : "text-rose-500"}
                                  strokeDasharray={`${studentMonthlyPercent}, 100`}
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{studentMonthlyPercent}%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Monthly</span>
                              </div>
                            </div>
                          </div>

                          {/* Present Days Card */}
                          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                            <p className="text-xs font-bold text-emerald-400 uppercase">Present Days (P)</p>
                            <p className="text-3xl font-black text-white">{studentPresentCount} Days</p>
                            <p className="text-[10px] text-slate-500 font-bold">Attended out of {calcWorkingDays} working days</p>
                          </div>

                          {/* Absent Days Card */}
                          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                            <p className="text-xs font-bold text-rose-400 uppercase">Absent Days (A)</p>
                            <p className="text-3xl font-black text-white">{studentAbsentCount} Days</p>
                            <p className="text-[10px] text-slate-500 font-bold">Missed classes</p>
                          </div>

                          {/* Average College stay time */}
                          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                            <p className="text-xs font-bold text-blue-400 uppercase">Avg Daily Campus Stay</p>
                            <p className="text-3xl font-black text-white">{avgDurationStr}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Calculated from gate logs</p>
                          </div>
                        </div>

                        {/* Daily Register Grid */}
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Daily Register Grid (Click any date to view Entry/Exit times)</span>
                            <span className="text-slate-500 font-normal">P = Present | A = Absent | * = Holiday | — = Future</span>
                          </p>
                          
                          <div className="grid grid-cols-7 gap-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                            {monthDaysList.map((d) => {
                              const isSelected = selectedDayDetail?.dateStr === d.dateStr;
                              return (
                                <button
                                  key={d.dateStr}
                                  onClick={() => setSelectedDayDetail(d)}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                                    isSelected
                                      ? "ring-2 ring-blue-500 scale-105 z-10 shadow-lg"
                                      : "hover:scale-102"
                                  } ${
                                    d.status === "P"
                                      ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-250"
                                      : d.status === "*"
                                      ? "bg-purple-950/50 border-purple-800/60 text-purple-250"
                                      : d.status === "—"
                                      ? "bg-slate-950/40 border-slate-850/80 text-slate-600 opacity-60"
                                      : "bg-red-950/40 border-red-900/40 text-red-300"
                                  }`}
                                >
                                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                                    {d.dayNum} {d.dayOfWeek}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                    d.status === "P"
                                      ? "bg-emerald-500 text-slate-950"
                                      : d.status === "*"
                                      ? "bg-amber-400 text-slate-950"
                                      : d.status === "—"
                                      ? "bg-slate-800 text-slate-450"
                                      : "bg-red-500/80 text-white"
                                  }`}>
                                    {d.status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Day Detail Card */}
                        {selectedDayDetail ? (
                          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <h5 className="text-sm font-bold text-white">
                                  Date: <span className="font-mono text-blue-300">{selectedDayDetail.dateStr}</span> ({selectedDayDetail.dayOfWeek})
                                </h5>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                selectedDayDetail.status === "P"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : selectedDayDetail.status === "*"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  : selectedDayDetail.status === "—"
                                  ? "bg-slate-800/50 text-slate-400 border border-slate-700/50"
                                  : "bg-red-500/20 text-red-300 border border-red-500/40"
                              }`}>
                                {selectedDayDetail.status === "P"
                                  ? "🟢 PRESENT"
                                  : selectedDayDetail.status === "*"
                                  ? `🟨 HOLIDAY (${selectedDayDetail.holidayReason || "Sunday"})`
                                  : selectedDayDetail.status === "—"
                                  ? "🗓️ FUTURE DATE (Not Occurred Yet)"
                                  : "🔴 ABSENT"}
                              </span>
                            </div>

                            {selectedDayDetail.record ? (
                              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                                    <span>Entry Time (In)</span>
                                    {isLateTime(selectedDayDetail.record.entryTime) && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider animate-pulse">LATE</span>
                                    )}
                                  </p>
                                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Exit Time (Out)</p>
                                  <p className="text-sm font-bold text-blue-400 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Duration / Status</p>
                                  <p className="text-xs font-bold text-slate-200 mt-1">
                                    {selectedDayDetail.record.durationMinutes
                                      ? `${Math.floor(selectedDayDetail.record.durationMinutes / 60)}h ${selectedDayDetail.record.durationMinutes % 60}m`
                                      : selectedDayDetail.record.status === "inside"
                                      ? "Still on Campus"
                                      : "Completed"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic pt-1">
                                {selectedDayDetail.status === "*"
                                  ? `College was closed on this day (${selectedDayDetail.holidayReason || "Sunday"}). No attendance recorded.`
                                  : selectedDayDetail.status === "—"
                                  ? "This date is in the future. Attendance will be recorded when the student scans on this day."
                                  : "No QR scan records registered for this date (Absent)."}
                              </p>
                            )}

                             {/* Hourly Period Attendance */}
                             <div className="space-y-2 pt-2.5 border-t border-slate-800/80">
                               <h6 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5 text-blue-400" />
                                 Hourly Period Attendance
                               </h6>
                               {hourlyForSelectedDay.length > 0 ? (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                                   {hourlyForSelectedDay.map((hr: any) => (
                                     <div key={hr.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
                                       <div className="space-y-0.5">
                                         <p className="text-xs font-bold text-white">
                                           {hr.qr_schedules?.subject || "Unknown Subject"}
                                         </p>
                                         <p className="text-[10px] text-slate-500 font-medium font-mono">
                                           Period: {hr.qr_schedules?.start_time?.slice(0, 5)} - {hr.qr_schedules?.end_time?.slice(0, 5)}
                                         </p>
                                       </div>
                                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                         hr.marked_present
                                           ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/30"
                                           : "bg-red-950/80 text-red-400 border-red-900/30"
                                       }`}>
                                         {hr.marked_present ? "PRESENT" : "ABSENT"}
                                       </span>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-xs text-slate-500 italic">
                                   No period-wise attendance records for this date.
                                 </p>
                               )}
                             </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-2.5 bg-slate-950 rounded-xl border border-slate-850">
                            💡 Click on any date box above (P, A, *, or —) to view exact Entry & Exit scan timestamps for that day.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
