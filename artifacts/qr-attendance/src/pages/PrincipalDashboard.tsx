import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Search,
  Calendar,
  Layers,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Circle,
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import StudentProfileModal from "@/components/StudentProfileModal";

type StudentUser = {
  id: number;
  name: string;
  uniqueId: string;
  unique_id?: string;
  role: string;
  section?: string;
};

type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  durationMinutes: number | null;
  status: "inside" | "exited";
  user?: StudentUser;
};

const BRANCHES = [
  { id: "DS", name: "Computer Science (Data Science)", shortName: "Data Science", code: "DS", totalStudents: 437, active: true },
  { id: "CSE", name: "Computer Science & Engineering", shortName: "CSE", code: "CSE", totalStudents: 0, active: false },
  { id: "AIML", name: "Artificial Intelligence & ML", shortName: "AI & ML", code: "AIML", totalStudents: 0, active: false },
  { id: "CS", name: "Computer Science (Cyber Security)", shortName: "Cyber Security", code: "CS", totalStudents: 0, active: false },
  { id: "CIVIL", name: "Civil Engineering", shortName: "Civil", code: "CIVIL", totalStudents: 0, active: false },
  { id: "ECE", name: "Electronics & Communication", shortName: "ECE", code: "ECE", totalStudents: 0, active: false },
];

function getSectionDisplayName(sectionCode?: string): { name: string; yearLabel: string; yearNum: number } {
  if (!sectionCode) return { name: "Other", yearLabel: "Department", yearNum: 0 };
  const str = sectionCode.trim();
  const parts = str.split("/");
  const sectionLetter = (parts[parts.length - 1] || "A").trim();

  if (str.includes("IV") || str.includes("4")) {
    return { name: `4${sectionLetter}`, yearLabel: "4th Year", yearNum: 4 };
  }
  if (str.includes("III") || str.includes("3")) {
    return { name: `3${sectionLetter}`, yearLabel: "3rd Year", yearNum: 3 };
  }
  if (str.includes("II") || str.includes("2")) {
    return { name: `2${sectionLetter}`, yearLabel: "2nd Year", yearNum: 2 };
  }
  return { name: sectionCode, yearLabel: "Department", yearNum: 0 };
}

function hsYr(y?: string): string {
  if (!y) return "";
  if (y === "IV" || y === "4") return "4";
  if (y === "III" || y === "3") return "3";
  if (y === "II" || y === "2") return "2";
  return y;
}

// Risk Flag Math helper
function getStudentFlagStatus(totalWorkingDays: number, presentDays: number) {
  const calcWorking = totalWorkingDays > 0 ? totalWorkingDays : 1;
  const percent = Math.min(100, Math.floor((presentDays / calcWorking) * 100));

  const classesNeededFor75 = Math.max(0, 3 * totalWorkingDays - 4 * presentDays);
  const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalWorkingDays - presentDays) / 0.35));

  if (percent >= 75) {
    return {
      flag: "GREEN" as const,
      percent,
      label: "Safe (≥ 75%)",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      dotColor: "text-emerald-600",
      classesNeededFor75: 0,
      classesNeededFor65: 0,
    };
  } else if (percent >= 65) {
    return {
      flag: "YELLOW" as const,
      percent,
      label: "Warning (65–74%)",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      dotColor: "text-amber-600",
      classesNeededFor75,
      classesNeededFor65: 0,
    };
  } else {
    return {
      flag: "RED" as const,
      percent,
      label: "Critical (< 65%)",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      dotColor: "text-red-600",
      classesNeededFor75,
      classesNeededFor65,
    };
  }
}

function formatTime(isoStr?: string | null): string {
  if (!isoStr) return "--:--";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}

function isLateTime(isoStr?: string | null): boolean {
  if (!isoStr) return false;
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return false;
    const hours = d.getHours();
    const mins = d.getMinutes();
    return hours > 9 || (hours === 9 && mins > 30);
  } catch {
    return false;
  }
}

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
        className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
        <span>{monthNames[month - 1]} {year}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-60 rounded-lg bg-white border border-slate-300 p-3 shadow-xl z-30 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1 rounded-md bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 cursor-pointer text-xs"
              >
                &larr;
              </button>
              <span className="text-xs font-bold text-slate-900 font-mono">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1 rounded-md bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 cursor-pointer text-xs"
              >
                &rarr;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {monthNames.map((mName, idx) => {
                const isSelected = currentYear === year && (idx + 1) === month;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
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

const DEFAULT_COLLEGE_HOLIDAYS: Record<string, string> = {
  "2026-08-26": "Declared College Holiday",
  "2026-08-15": "Independence Day",
  "2026-08-10": "Holiday",
};

export default function PrincipalDashboard() {
  const { logout } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState("DS");
  const [activeTab, setActiveTab] = useState<"sections" | "hourly" | "flags" | "logs">("sections");
  
  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [logStatusFilter, setLogStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LATE" | "CLASS_ONLY" | "GATE_ONLY">("ALL");

  // Class Attendance Filter States
  const [hourlySectionFilter, setHourlySectionFilter] = useState("ALL");
  const [hourlySearchQuery, setHourlySearchQuery] = useState("");
  const [expandedHourlyScheduleId, setExpandedHourlyScheduleId] = useState<number | null>(null);

  // Filters & Sub-state
  const [riskFilter, setRiskFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LATE" | "CLASS_ONLY" | "GATE_ONLY">("ALL");
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentUser | null>(null);

  // Pagination states (20 per page)
  const [flagsPage, setFlagsPage] = useState(1);
  const [sectionModalPage, setSectionModalPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modals
  const [sectionModalData, setSectionModalData] = useState<{
    title: string;
    subtitle: string;
    students: {
      student: StudentUser;
      isPresent: boolean;
      isClassPresent?: boolean;
      entryTime?: string | null;
      exitTime?: string | null;
      hourlyCount?: number;
      hourlyTotal?: number;
      hourlyPeriods?: { subject: string; time: string; markedPresent: boolean; faculty: string }[];
    }[];
  } | null>(null);

  const [studentModalMonth, setStudentModalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [holidays] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("qr_hod_holidays");
      return { ...DEFAULT_COLLEGE_HOLIDAYS, ...(saved ? JSON.parse(saved) : {}) };
    } catch {
      return DEFAULT_COLLEGE_HOLIDAYS;
    }
  });

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    dayOfWeek: string;
    status: "P" | "A" | "*" | "—" | "SUN" | "HOL";
    record?: AttendanceRecord;
    holidayReason?: string;
    isFuture?: boolean;
  } | null>(null);

  // CSV Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"section" | "all" | "student">("all");
  const [exportSection, setExportSection] = useState("2A");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // 1. Fetch Students
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<StudentUser[]>({
    queryKey: ["users-all"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  const students = allUsers.filter((u) => u.role === "student");

  // 2. Fetch Monthly Attendance Records for Flag Calculations across current month
  const [monthForFlags] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: monthlyAttendanceForFlags = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-month-flags", monthForFlags],
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

  // Calculate Month Working Days elapsed
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
      if (dObj.getDay() !== 0 && !holidays[dStr]) { // Not Sunday and Not Declared Holiday
        working++;
      }
    }
    return Math.max(1, working);
  }, [monthForFlags, holidays]);

  // Map student IDs to monthly present count
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

  // Calculate Student Analytics with Risk Flags
  const studentAnalyticsList = useMemo(() => {
    return students.map((student) => {
      const presentDays = studentPresentCounts.get(student.id) || 0;
      const flagInfo = getStudentFlagStatus(totalMonthWorkingDays, presentDays);
      return {
        student,
        presentDays,
        totalWorkingDays: totalMonthWorkingDays,
        ...flagInfo,
      };
    });
  }, [students, studentPresentCounts, totalMonthWorkingDays]);

  const redFlagCount = studentAnalyticsList.filter((s) => s.flag === "RED").length;
  const yellowFlagCount = studentAnalyticsList.filter((s) => s.flag === "YELLOW").length;
  const greenFlagCount = studentAnalyticsList.filter((s) => s.flag === "GREEN").length;

  // 3. Fetch Daily Detailed Logs (Gate Attendance)
  const { data: detailedLogs = [], isLoading: logsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-detailed", logDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${logDate}&to=${logDate}`),
    refetchInterval: 5000,
  });

  // 4. Fetch Class Presence (marked present in hourly classes by faculty + training)
  const { data: todayClassPresence = [] } = useQuery<any[]>({
    queryKey: ["principal-today-class-presence", logDate],
    queryFn: () => customFetch<any[]>(`/api/admin/today-class-presence?date=${logDate}`),
    refetchInterval: 5000,
  });

  const classPresentUserIds = useMemo(() => {
    const set = new Set<number>();
    (todayClassPresence || []).forEach((r: any) => {
      const uid = Number(r.user_id || r.userId || r.user?.id);
      if (uid && !isNaN(uid)) set.add(uid);
    });
    return set;
  }, [todayClassPresence]);

  const dsPresentSet = useMemo(() => {
    return new Set(detailedLogs.map((l) => l.userId || (l as any).user_id));
  }, [detailedLogs]);

  // Unified Overall Present Set (Present at Gate OR in Classroom / Hourly Attendance)
  const overallPresentSet = useMemo(() => {
    const set = new Set<number>(dsPresentSet);
    classPresentUserIds.forEach((id) => set.add(id));
    return set;
  }, [dsPresentSet, classPresentUserIds]);

  // 5. Fetch Hourly / Period Classroom Attendance for the selected date
  const { data: hourlyHistoryData, isLoading: hourlyLoading } = useQuery<{
    date?: string;
    summary: {
      totalClasses: number;
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      averageAttendance: number;
    };
    sessions: any[];
  }>({
    queryKey: ["principal-hourly-history", logDate],
    queryFn: () => customFetch(`/api/mentor/history?date=${logDate}&scope=all`),
    refetchInterval: 10000,
  });

  const hourlySessions = hourlyHistoryData?.sessions || [];
  const hourlySummary = hourlyHistoryData?.summary || {
    totalClasses: 0,
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    averageAttendance: 0
  };

  // Map of userId -> array of attended periods for the day
  const studentDayHourlyMap = useMemo(() => {
    const map = new Map<number, { subject: string; time: string; markedPresent: boolean; faculty: string }[]>();
    hourlySessions.forEach((session: any) => {
      (session.students || []).forEach((st: any) => {
        if (!map.has(st.id)) map.set(st.id, []);
        map.get(st.id)!.push({
          subject: session.subject,
          time: `${session.startTime?.slice(0, 5)} - ${session.endTime?.slice(0, 5)}`,
          markedPresent: st.markedPresent,
          faculty: session.facultyName
        });
      });
    });
    return map;
  }, [hourlySessions]);

  // 6. Fetch Monthly Student Records when modal is open
  const { data: studentMonthlyData } = useQuery<{ records: AttendanceRecord[], hourlyRecords: any[] }>({
    queryKey: ["student-monthly-records", selectedStudentForDetails?.id, selectedStudentForDetails?.uniqueId, studentModalMonth],
    queryFn: async () => {
      if (!selectedStudentForDetails) return { records: [], hourlyRecords: [] };
      return customFetch<{ records: AttendanceRecord[], hourlyRecords: any[] }>(`/api/attendance/user/${selectedStudentForDetails.id}?month=${studentModalMonth}`);
    },
    enabled: Boolean(selectedStudentForDetails)
  });

  const studentMonthlyRecords = studentMonthlyData?.records || [];

  // Institution Executive Statistics
  const campusTotalStudents = students.length;
  const campusPresentCount = overallPresentSet.size;
  const campusAbsentCount = Math.max(0, campusTotalStudents - campusPresentCount);
  const campusAttendancePercent = campusTotalStudents > 0 ? Math.round((campusPresentCount / campusTotalStudents) * 100) : 0;

  const bothGateAndClassCount = useMemo(() => {
    let count = 0;
    dsPresentSet.forEach(id => {
      if (classPresentUserIds.has(id)) count++;
    });
    return count;
  }, [dsPresentSet, classPresentUserIds]);

  // Section Breakdown Matrix
  const sections = ["2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"];
  const sectionStats = useMemo(() => {
    return sections.map((secKey) => {
      const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === secKey);
      const total = secStudents.length;
      const gatePresent = secStudents.filter((s) => dsPresentSet.has(s.id)).length;
      const classPresent = secStudents.filter((s) => classPresentUserIds.has(s.id)).length;
      const present = secStudents.filter((s) => overallPresentSet.has(s.id)).length;
      const absent = Math.max(0, total - present);
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;
      
      const secHourly = hourlySessions.filter((hs: any) => {
        const secName = hs.section || "";
        const yr = hs.year === "II" ? "2" : hs.year === "III" ? "3" : hsYr(hs.year);
        return `${yr}${secName}` === secKey;
      });

      return {
        section: secKey,
        yearLabel: secKey.startsWith("2") ? "2nd Year" : secKey.startsWith("3") ? "3rd Year" : "4th Year",
        total,
        present,
        gatePresent,
        classPresent,
        absent,
        percent,
        periodsCount: secHourly.length,
        status: percent >= 75 ? "Good" : percent >= 65 ? "Warning" : "Critical"
      };
    });
  }, [sections, students, dsPresentSet, classPresentUserIds, overallPresentSet, hourlySessions]);

  // Filter Daily Records
  const filteredLogs = useMemo(() => {
    return students.map(student => {
      const log = detailedLogs.find(l => (l.userId || (l as any).user_id) === student.id);
      const isGate = dsPresentSet.has(student.id);
      const isClass = classPresentUserIds.has(student.id);
      const isPresent = isGate || isClass;
      const isLate = isGate && isLateTime(log?.entryTime);

      let unifiedStatus: "PRESENT" | "ABSENT" | "GATE_ONLY" | "CLASS_ONLY" = "ABSENT";
      if (isGate && isClass) unifiedStatus = "PRESENT";
      else if (isClass) unifiedStatus = "CLASS_ONLY";
      else if (isGate) unifiedStatus = "GATE_ONLY";

      return {
        student,
        log,
        isGate,
        isClass,
        isPresent,
        isLate,
        unifiedStatus,
        sectionDisplayName: getSectionDisplayName(student.section).name
      };
    }).filter(item => {
      if (sectionFilter !== "ALL" && item.sectionDisplayName !== sectionFilter) return false;
      if (logStatusFilter === "PRESENT" && !item.isPresent) return false;
      if (logStatusFilter === "ABSENT" && item.isPresent) return false;
      if (logStatusFilter === "LATE" && !item.isLate) return false;
      if (logStatusFilter === "CLASS_ONLY" && item.unifiedStatus !== "CLASS_ONLY") return false;
      if (logStatusFilter === "GATE_ONLY" && item.unifiedStatus !== "GATE_ONLY") return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.student.name.toLowerCase().includes(q) ||
        (item.student.uniqueId || "").toLowerCase().includes(q) ||
        item.sectionDisplayName.toLowerCase().includes(q)
      );
    });
  }, [students, detailedLogs, dsPresentSet, classPresentUserIds, sectionFilter, logStatusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-12">
      {/* 1. PRINCIPAL PAGE HEADER */}
      <header className="bg-white border-b border-slate-300/70 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-950 tracking-tight" style={{ fontFamily: "var(--app-font-display)" }}>
                  Sphoorthy Engineering College
                </h1>
                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">Principal</span>
              </div>
              <p className="eyebrow text-slate-500 mt-0.5">Institutional Campus Portal</p>
            </div>
          </div>

          {/* Controls: Date, Export, Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-none cursor-pointer [color-scheme:light] font-mono text-xs"
              />
            </div>

            <button
              onClick={() => setExportModalOpen(true)}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* 2. TOP SUMMARY (EXECUTIVE STATS) */}
        <section className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <p className="eyebrow text-slate-500">Daily Register</p>
              <h2 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                College Attendance Today — <span className="font-mono">{logDate}</span>
              </h2>
            </div>
            <span className="stamp border-slate-300 bg-slate-50 text-slate-600">All Departments</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Card 1: Total Students */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" aria-hidden />
              <p className="eyebrow text-slate-500">Total Students</p>
              <p className="text-xl font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{campusTotalStudents}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Enrolled</p>
            </div>

            {/* Card 2: Present Today */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
              <p className="eyebrow text-slate-500">Present Today</p>
              <p className="text-xl font-bold text-emerald-700 mt-1.5 font-mono tabular-nums">{campusPresentCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{campusAttendancePercent}%</p>
            </div>

            {/* Card 3: Absent Today */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500" aria-hidden />
              <p className="eyebrow text-slate-500">Absent Today</p>
              <p className="text-xl font-bold text-red-700 mt-1.5 font-mono tabular-nums">{campusAbsentCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{100 - campusAttendancePercent}%</p>
            </div>

            {/* Card 4: Attendance % */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-500" aria-hidden />
              <p className="eyebrow text-slate-500">Attendance %</p>
              <p className="text-xl font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{campusAttendancePercent}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5">College Average</p>
            </div>

            {/* Card 5: Classes */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" aria-hidden />
              <p className="eyebrow text-slate-500">Classes</p>
              <p className="text-xl font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{hourlySummary.totalClasses}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Scheduled</p>
            </div>

            {/* Card 6: Completed */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" aria-hidden />
              <p className="eyebrow text-slate-500">Completed</p>
              <p className="text-xl font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{hourlySessions.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Submitted</p>
            </div>

            {/* Card 7: Pending */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-400" aria-hidden />
              <p className="eyebrow text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-950 mt-1.5 font-mono tabular-nums">0</p>
              <p className="text-[10px] text-emerald-700 mt-0.5 font-semibold">None</p>
            </div>

            {/* Card 8: Critical */}
            <div
              onClick={() => {
                setActiveTab("flags");
                setRiskFilter("RED");
                const criticalStudents = studentAnalyticsList
                  .filter((s) => s.flag === "RED" || s.percent < 65)
                  .map((item) => {
                    const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === item.student.id);
                    const hourlyForStudent = studentDayHourlyMap.get(item.student.id) || [];
                    return {
                      student: item.student,
                      isPresent: overallPresentSet.has(item.student.id),
                      isClassPresent: classPresentUserIds.has(item.student.id),
                      entryTime: log?.entryTime,
                      exitTime: log?.exitTime,
                      hourlyCount: hourlyForStudent.filter((h) => h.markedPresent).length,
                      hourlyTotal: hourlyForStudent.length,
                      hourlyPeriods: hourlyForStudent,
                    };
                  });
                setSectionModalData({
                  title: `Critical Attendance (< 65%) — ${criticalStudents.length} Students`,
                  subtitle: `Data Science • Attendance Below 65% Target Limit`,
                  students: criticalStudents,
                });
              }}
              className="bg-white border border-slate-300/70 rounded-lg p-3 shadow-xs relative overflow-hidden cursor-pointer hover:border-red-300 transition-colors"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600" aria-hidden />
              <div className="flex items-center justify-between">
                <p className="eyebrow text-slate-500">Critical</p>
                <ChevronRight className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-xl font-bold text-red-700 mt-1.5 font-mono tabular-nums">{redFlagCount}</p>
              <p className="text-[10px] text-red-700 mt-0.5 font-semibold underline">Below 65%</p>
            </div>
          </div>

          {/* Modality Strip */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-600">Class Attendance</span>
              <span className="font-semibold text-emerald-700 font-mono">{classPresentUserIds.size} Present</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-600">Gate Scans</span>
              <span className="font-semibold text-blue-700 font-mono">{dsPresentSet.size} Scanned</span>
            </div>
          </div>
        </section>

        {/* 3. ACADEMIC DEPARTMENTS AT A GLANCE */}
        <section className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <p className="eyebrow text-slate-500">Department Comparison</p>
              <h3 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                Academic Departments at a Glance
              </h3>
            </div>
            <span className="stamp border-blue-300 bg-blue-50 text-blue-800">6 Departments</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-300/70">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Department</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Students</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Present</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Absent</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Attendance %</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Classes Pending</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {BRANCHES.map((dept) => {
                  const isDS = dept.code === "DS";
                  const isSelected = selectedBranch === dept.code;
                  const enrolled = isDS ? campusTotalStudents : 0;
                  const present = isDS ? campusPresentCount : 0;
                  const absent = isDS ? campusAbsentCount : 0;
                  const pct = isDS ? campusAttendancePercent : null;

                  return (
                    <tr
                      key={dept.code}
                      onClick={() => setSelectedBranch(dept.code)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-emerald-50/60" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {dept.name} <span className="font-mono text-slate-500">({dept.code})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                        {isDS ? enrolled : <span className="text-slate-400 text-[11px]">No Data Today</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {isDS ? present : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700">
                        {isDS ? absent : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {pct !== null ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-slate-900 w-8 text-right">{pct}%</span>
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  pct >= 75 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isDS ? (
                          <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">0 Pending</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`stamp ${
                          dept.active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-300 bg-slate-50 text-slate-500"
                        }`}>
                          {dept.active ? "Live" : "Not Started"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBranch(dept.code);
                          }}
                          className={`px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-white border border-slate-300 hover:border-slate-400 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Current" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. DEPARTMENT DRILL-DOWN VIEWS */}
        {selectedBranch === "DS" ? (
          <section className="space-y-3">
            {/* DEPARTMENT SPECIFIC NEEDS ATTENTION */}
            <div className="bg-white border border-slate-300/70 rounded-lg p-3.5 space-y-2.5 shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500" aria-hidden />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="eyebrow text-slate-500">Data Science</p>
                  <span className="text-[13px] font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>
                    Needs Attention
                  </span>
                </div>
                <span className="stamp border-amber-300 bg-amber-50 text-amber-800">
                  {sectionStats.filter(s => s.status !== "Good").length} Issues
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Issue 1: Section 4A */}
                <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <p className="font-bold text-slate-900">Section 4A — <span className="font-mono">54%</span></p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">29 absent out of 63 students.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("sections");
                      const sec4A = students.filter(s => getSectionDisplayName(s.section).name === "4A");
                      setSectionModalData({
                        title: "Section 4A — Students",
                        subtitle: "54% Present • 29 Absent",
                        students: sec4A.map(s => {
                          const log = detailedLogs.find(l => (l.userId || (l as any).user_id) === s.id);
                          const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                          return {
                            student: s,
                            isPresent: overallPresentSet.has(s.id),
                            isClassPresent: classPresentUserIds.has(s.id),
                            entryTime: log?.entryTime,
                            exitTime: log?.exitTime,
                            hourlyCount: hourlyForStudent.filter(h => h.markedPresent).length,
                            hourlyTotal: hourlyForStudent.length,
                            hourlyPeriods: hourlyForStudent,
                          };
                        })
                      });
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] cursor-pointer whitespace-nowrap transition-colors"
                  >
                    View 4A
                  </button>
                </div>

                {/* Issue 2: Section 3C */}
                <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="font-bold text-slate-900">Section 3C — <span className="font-mono">70%</span></p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">16 absent out of 54 students.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("sections");
                      const sec3C = students.filter(s => getSectionDisplayName(s.section).name === "3C");
                      setSectionModalData({
                        title: "Section 3C — Students",
                        subtitle: "70% Present • 16 Absent",
                        students: sec3C.map(s => {
                          const log = detailedLogs.find(l => (l.userId || (l as any).user_id) === s.id);
                          const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                          return {
                            student: s,
                            isPresent: overallPresentSet.has(s.id),
                            isClassPresent: classPresentUserIds.has(s.id),
                            entryTime: log?.entryTime,
                            exitTime: log?.exitTime,
                            hourlyCount: hourlyForStudent.filter(h => h.markedPresent).length,
                            hourlyTotal: hourlyForStudent.length,
                            hourlyPeriods: hourlyForStudent,
                          };
                        })
                      });
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] cursor-pointer whitespace-nowrap transition-colors"
                  >
                    View 3C
                  </button>
                </div>

                {/* Issue 3: Critical Attendance */}
                <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <p className="font-bold text-slate-900"><span className="font-mono">{redFlagCount}</span> Students — Below 65%</p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">Attendance below 65% limit.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("flags");
                      setRiskFilter("RED");
                      const criticalStudents = studentAnalyticsList
                        .filter((s) => s.flag === "RED" || s.percent < 65)
                        .map((item) => {
                          const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === item.student.id);
                          const hourlyForStudent = studentDayHourlyMap.get(item.student.id) || [];
                          return {
                            student: item.student,
                            isPresent: overallPresentSet.has(item.student.id),
                            isClassPresent: classPresentUserIds.has(item.student.id),
                            entryTime: log?.entryTime,
                            exitTime: log?.exitTime,
                            hourlyCount: hourlyForStudent.filter((h) => h.markedPresent).length,
                            hourlyTotal: hourlyForStudent.length,
                            hourlyPeriods: hourlyForStudent,
                          };
                        });
                      setSectionModalData({
                        title: `Critical Attendance (< 65%) — ${criticalStudents.length} Students`,
                        subtitle: `Data Science • Attendance Below 65% Target Limit`,
                        students: criticalStudents,
                      });
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] cursor-pointer whitespace-nowrap transition-colors"
                  >
                    View Students
                  </button>
                </div>
              </div>
            </div>
            {/* View Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <button
                onClick={() => setActiveTab("sections")}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "sections"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Section Attendance <span className="font-mono">({sectionStats.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("hourly")}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "hourly"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Class Attendance <span className="font-mono">({hourlySessions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("flags")}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "flags"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Attendance Problems <span className="font-mono">({redFlagCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "logs"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Daily Records <span className="font-mono">({filteredLogs.length})</span>
              </button>
            </div>

            {/* TAB 1: SECTION ATTENDANCE */}
            {activeTab === "sections" && (
              <div className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <p className="eyebrow text-slate-500">Data Science</p>
                    <h3 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                      Section Attendance
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attendance across all 8 class sections
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="stamp border-slate-300 bg-slate-50 text-slate-600">{campusTotalStudents} Students</span>
                    <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                      {campusPresentCount} Present ({campusAttendancePercent}%)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-300/70">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="py-2.5 px-3 w-14 text-center eyebrow text-slate-500 font-semibold">Year</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Section</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Students</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Present</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Absent</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Attendance %</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Classes</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sectionStats.map((st) => {
                        const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section);

                        return (
                          <tr key={st.section} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-500 font-mono">
                              {st.yearLabel.slice(0, 3)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="flex items-center gap-2 font-semibold text-slate-900">
                                <span className="w-6 h-6 rounded bg-blue-50 border border-blue-300 text-blue-800 font-mono font-bold flex items-center justify-center text-xs">
                                  {st.section}
                                </span>
                                <span>Section {st.section}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              <button
                                onClick={() => {
                                  setSectionModalData({
                                    title: `Section ${st.section} — Students`,
                                    subtitle: `Total ${st.total} Students`,
                                    students: secStudents.map((s) => {
                                      const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                                      const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                      return {
                                        student: s,
                                        isPresent: overallPresentSet.has(s.id),
                                        isClassPresent: classPresentUserIds.has(s.id),
                                        entryTime: log?.entryTime,
                                        exitTime: log?.exitTime,
                                        hourlyCount: hourlyForStudent.filter((h: any) => h.markedPresent).length,
                                        hourlyTotal: hourlyForStudent.length,
                                        hourlyPeriods: hourlyForStudent,
                                      };
                                    }),
                                  });
                                }}
                                className="hover:underline text-slate-800 cursor-pointer font-bold"
                              >
                                {st.total}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  const presentOnly = secStudents.filter(s => overallPresentSet.has(s.id));
                                  setSectionModalData({
                                    title: `Section ${st.section} — Present Students`,
                                    subtitle: `${st.present} Present on ${logDate}`,
                                    students: presentOnly.map((s) => {
                                      const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                                      const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                      return {
                                        student: s,
                                        isPresent: true,
                                        isClassPresent: classPresentUserIds.has(s.id),
                                        entryTime: log?.entryTime,
                                        exitTime: log?.exitTime,
                                        hourlyCount: hourlyForStudent.filter((h: any) => h.markedPresent).length,
                                        hourlyTotal: hourlyForStudent.length,
                                        hourlyPeriods: hourlyForStudent,
                                      };
                                    }),
                                  });
                                }}
                                className="px-2 py-0.5 rounded stamp border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                              >
                                {st.present}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  const absentOnly = secStudents.filter(s => !overallPresentSet.has(s.id));
                                  setSectionModalData({
                                    title: `Section ${st.section} — Absent Students`,
                                    subtitle: `${st.absent} Absent on ${logDate}`,
                                    students: absentOnly.map((s) => {
                                      const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                      return {
                                        student: s,
                                        isPresent: false,
                                        isClassPresent: false,
                                        hourlyCount: 0,
                                        hourlyTotal: hourlyForStudent.length,
                                        hourlyPeriods: hourlyForStudent,
                                      };
                                    }),
                                  });
                                }}
                                className="px-2 py-0.5 rounded stamp border-red-300 bg-red-50 text-red-800 hover:bg-red-100 cursor-pointer"
                              >
                                {st.absent}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`font-mono font-bold ${
                                  st.percent >= 75 ? "text-emerald-700" : st.percent >= 65 ? "text-amber-700" : "text-red-700"
                                }`}>
                                  {st.percent}%
                                </span>
                                <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      st.percent >= 75 ? "bg-emerald-500" : st.percent >= 65 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${st.percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-mono font-semibold">
                              {st.periodsCount > 0 ? `${st.periodsCount} Completed` : "0"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`stamp ${
                                st.status === "Good"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : st.status === "Warning"
                                  ? "border-amber-300 bg-amber-50 text-amber-800"
                                  : "border-red-300 bg-red-50 text-red-800"
                              }`}>
                                {st.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSectionModalData({
                                    title: `Section ${st.section} — Students`,
                                    subtitle: `All ${st.total} Students (${st.present} Present, ${st.absent} Absent)`,
                                    students: secStudents.map((s) => {
                                      const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                                      const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                      return {
                                        student: s,
                                        isPresent: overallPresentSet.has(s.id),
                                        isClassPresent: classPresentUserIds.has(s.id),
                                        entryTime: log?.entryTime,
                                        exitTime: log?.exitTime,
                                        hourlyCount: hourlyForStudent.filter((h: any) => h.markedPresent).length,
                                        hourlyTotal: hourlyForStudent.length,
                                        hourlyPeriods: hourlyForStudent,
                                      };
                                    }),
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-[11px] cursor-pointer transition-colors"
                              >
                                View Students
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CLASS ATTENDANCE */}
            {activeTab === "hourly" && (
              <div className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                  <div>
                    <p className="eyebrow text-slate-500">Faculty Submissions</p>
                    <h3 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                      Class Attendance Today — <span className="font-mono">{logDate}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attendance submissions by faculty
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search subject, faculty..."
                        value={hourlySearchQuery}
                        onChange={(e) => setHourlySearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto">
                      {["ALL", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setHourlySectionFilter(sec)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                            hourlySectionFilter === sec
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {sec === "ALL" ? "All" : sec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {hourlyLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-slate-200 animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-slate-200 rounded w-1/3 animate-pulse" />
                          <div className="h-2.5 bg-slate-200 rounded w-1/4 animate-pulse" />
                        </div>
                        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : hourlySessions.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-xs space-y-1.5">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-900 text-sm" style={{ fontFamily: "var(--app-font-display)" }}>No Classes Recorded on {logDate}</p>
                    <p className="text-slate-500">Classes will appear here as faculty submit attendance.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {hourlySessions
                      .filter((session: any) => {
                        const secName = session.section || "";
                        const yr = session.year === "II" ? "2" : session.year === "III" ? "3" : hsYr(session.year);
                        const secKey = `${yr}${secName}`;
                        const matchesSec = hourlySectionFilter === "ALL" || secKey === hourlySectionFilter || session.section === hourlySectionFilter;
                        if (!matchesSec) return false;

                        if (!hourlySearchQuery) return true;
                        const q = hourlySearchQuery.toLowerCase();
                        return (
                          (session.subject || "").toLowerCase().includes(q) ||
                          (session.facultyName || "").toLowerCase().includes(q) ||
                          (session.fullSection || "").toLowerCase().includes(q)
                        );
                      })
                      .map((session: any) => {
                        const isExpanded = expandedHourlyScheduleId === session.scheduleId;
                        const pct = session.percentage || 0;
                        const studentList = session.students || [];

                        return (
                          <div
                            key={`${session.scheduleId}_${session.date || logDate}`}
                            className="border border-slate-300/70 rounded-lg overflow-hidden shadow-xs hover:border-slate-400 transition-all bg-white"
                          >
                            <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-300 text-blue-800 flex flex-col items-center justify-center flex-shrink-0 font-mono">
                                  <span className="text-[9px] font-semibold uppercase">{session.year}</span>
                                  <span className="text-xs font-bold">{session.section}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-950">{session.subject}</h4>
                                    <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                                      Complete
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span className="font-mono">{session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}</span>
                                    <span>•</span>
                                    <span className="font-medium text-slate-700">Faculty: {session.facultyName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 justify-end">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="text-sm font-bold text-slate-950 font-mono">{pct}%</span>
                                    <span className={`stamp ${
                                      pct >= 75 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : pct >= 65 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-red-300 bg-red-50 text-red-800"
                                    }`}>
                                      {session.presentCount}/{session.totalStudents} Present
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono">{session.absentCount} Absent</p>
                                </div>

                                <button
                                  onClick={() => setExpandedHourlyScheduleId(isExpanded ? null : session.scheduleId)}
                                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  {isExpanded ? "Hide" : `Students (${studentList.length})`}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 bg-white space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700">
                                    Students (<span className="font-mono">{session.presentCount}</span> Present, <span className="font-mono">{session.absentCount}</span> Absent)
                                  </span>
                                  <a
                                    href={`/api/mentor/history/export?date=${logDate}&scheduleId=${session.scheduleId}`}
                                    download={`Attendance_${session.subject}_Sec${session.section}_${logDate}.csv`}
                                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Export CSV
                                  </a>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-300/70">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-100 border-b border-slate-200">
                                        <th className="py-2 px-3 w-10 text-center eyebrow text-slate-500 font-semibold">#</th>
                                        <th className="py-2 px-3 eyebrow text-slate-500 font-semibold">Roll Number</th>
                                        <th className="py-2 px-3 eyebrow text-slate-500 font-semibold">Student Name</th>
                                        <th className="py-2 px-3 eyebrow text-slate-500 font-semibold text-center">Class Status</th>
                                        <th className="py-2 px-3 eyebrow text-slate-500 font-semibold text-center">Marking Method</th>
                                        <th className="py-2 px-3 eyebrow text-slate-500 font-semibold text-center">Gate Scan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                      {studentList.map((st: any, idx: number) => (
                                        <tr
                                          key={st.id}
                                          onClick={() => {
                                            const fullUser = students.find((s) => s.id === st.id) || st;
                                            setSelectedStudentForDetails(fullUser);
                                          }}
                                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                          <td className="py-1.5 px-3 font-mono font-semibold text-slate-900">{st.uniqueId || "N/A"}</td>
                                          <td className="py-1.5 px-3 font-semibold text-slate-800">{st.name}</td>
                                          <td className="py-1.5 px-3 text-center">
                                            <span className={`stamp ${
                                              st.markedPresent
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                : "border-red-300 bg-red-50 text-red-800"
                                            }`}>
                                              {st.markedPresent ? "Present" : "Absent"}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-slate-600 text-[11px]">
                                            {st.scannedQr ? "QR Scan" : st.markedByTeacher ? "Faculty Marked" : "—"}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-[11px]">
                                            <span className={st.scannedGate ? "text-emerald-700 font-semibold font-mono" : "text-slate-400 font-mono"}>
                                              {st.scannedGate ? (st.gateEntryTime ? formatTime(st.gateEntryTime) : "Scanned") : "No Gate Scan"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ATTENDANCE PROBLEMS */}
            {activeTab === "flags" && (() => {
              const filteredFlagsList = studentAnalyticsList.filter(
                (item) => riskFilter === "ALL" || item.flag === riskFilter
              );
              const totalFlagsPages = Math.ceil(filteredFlagsList.length / PAGE_SIZE) || 1;
              const paginatedFlagsList = filteredFlagsList.slice((flagsPage - 1) * PAGE_SIZE, flagsPage * PAGE_SIZE);

              return (
                <div className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                    <div>
                      <p className="eyebrow text-slate-500">Risk Flag Analytics</p>
                      <h3 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                        Attendance Problems (<span className="font-mono">{monthForFlags}</span>)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Students below 75% target threshold
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRiskFilter("ALL");
                          setFlagsPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                          riskFilter === "ALL" ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        All <span className="font-mono">({studentAnalyticsList.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setRiskFilter("RED");
                          setFlagsPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                          riskFilter === "RED" ? "bg-red-600 text-white" : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        Critical <span className="font-mono">({redFlagCount})</span>
                      </button>
                      <button
                        onClick={() => {
                          setRiskFilter("YELLOW");
                          setFlagsPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                          riskFilter === "YELLOW" ? "bg-amber-600 text-white" : "bg-white border border-amber-300 text-amber-800 hover:bg-amber-50"
                        }`}
                      >
                        Warning <span className="font-mono">({yellowFlagCount})</span>
                      </button>
                      <button
                        onClick={() => {
                          setRiskFilter("GREEN");
                          setFlagsPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                          riskFilter === "GREEN" ? "bg-emerald-600 text-white" : "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        Safe <span className="font-mono">({greenFlagCount})</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-300/70">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Student Name</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Roll Number</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Section</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-right">Days Present</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Attendance %</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Status</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Needed for 75%</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedFlagsList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-500">
                              No students found in this category.
                            </td>
                          </tr>
                        ) : (
                          paginatedFlagsList.map((item) => (
                            <tr
                              key={item.student.id}
                              onClick={() => setSelectedStudentForDetails(item.student)}
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <td className="py-2 px-3 font-semibold text-slate-900">{item.student.name}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-700">{item.student.uniqueId || "N/A"}</td>
                              <td className="py-2 px-3 text-center font-mono font-semibold text-blue-700">
                                Sec {getSectionDisplayName(item.student.section).name}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                                {item.presentDays} / {item.totalWorkingDays}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold">
                                <span className={item.percent >= 75 ? "text-emerald-700" : item.percent >= 65 ? "text-amber-700" : "text-red-700"}>
                                  {item.percent}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`stamp ${item.badgeColor}`}>
                                  <Circle className={`w-1.5 h-1.5 fill-current ${item.dotColor}`} />
                                  {item.label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {item.flag === "RED" ? (
                                  <span className="text-red-700 font-semibold font-mono">
                                    Needs {item.classesNeededFor75} days for 75%
                                  </span>
                                ) : item.flag === "YELLOW" ? (
                                  <span className="text-amber-700 font-semibold font-mono">
                                    Needs {item.classesNeededFor75} days for 75%
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold">Target Satisfied</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudentForDetails(item.student);
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-[11px] cursor-pointer transition-colors"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 20 Per Page Pagination Bar */}
                  {filteredFlagsList.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                      <div>
                        Showing <span className="font-bold font-mono text-slate-900">{(flagsPage - 1) * PAGE_SIZE + 1}–{Math.min(flagsPage * PAGE_SIZE, filteredFlagsList.length)}</span> of <span className="font-bold font-mono text-slate-900">{filteredFlagsList.length}</span> students
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={flagsPage <= 1}
                          onClick={() => setFlagsPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 cursor-pointer transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono font-semibold text-slate-800 text-xs">
                          Page {flagsPage} of {totalFlagsPages}
                        </span>
                        <button
                          disabled={flagsPage >= totalFlagsPages}
                          onClick={() => setFlagsPage((p) => Math.min(totalFlagsPages, p + 1))}
                          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 cursor-pointer transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB 4: DAILY RECORDS */}
            {activeTab === "logs" && (
              <div className="bg-white border border-slate-300/70 rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                  <div>
                    <p className="eyebrow text-slate-500">Unified Register</p>
                    <h3 className="text-[15px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                      Daily Records — <span className="font-mono">{logDate}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Student attendance across classes and gate
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student, roll..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="ALL">All Sections</option>
                      {sections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                    </select>

                    <select
                      value={logStatusFilter}
                      onChange={(e) => setLogStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PRESENT">Present</option>
                      <option value="CLASS_ONLY">Class Only</option>
                      <option value="GATE_ONLY">Gate Only</option>
                      <option value="LATE">Late</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-300/70">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 text-center eyebrow text-slate-500 font-semibold">#</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Roll Number</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold">Student Name</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Section</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Entry</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Exit</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Class Attendance</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-500 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLogs.slice(0, 150).map((item, idx) => (
                        <tr
                          key={item.student.id}
                          onClick={() => setSelectedStudentForDetails(item.student)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">{item.student.uniqueId || "N/A"}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.student.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-blue-700">
                            Sec {item.sectionDisplayName}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px]">
                            {item.log?.entryTime ? (
                              <span className="font-semibold text-slate-800">
                                {formatTime(item.log.entryTime)}
                                {item.isLate && (
                                  <span className="stamp ml-1 border-amber-300 bg-amber-50 text-amber-800">LATE</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                            {item.log?.exitTime ? formatTime(item.log.exitTime) : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.isClass ? (
                              <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                                Present
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Absent</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`stamp ${
                              item.unifiedStatus === "PRESENT"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : item.unifiedStatus === "CLASS_ONLY"
                                ? "border-blue-300 bg-blue-50 text-blue-800"
                                : item.unifiedStatus === "GATE_ONLY"
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-red-300 bg-red-50 text-red-800"
                            }`}>
                              {item.unifiedStatus === "PRESENT"
                                ? "Present"
                                : item.unifiedStatus === "CLASS_ONLY"
                                ? "Class Only"
                                : item.unifiedStatus === "GATE_ONLY"
                                ? "Gate Only"
                                : "Absent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="bg-white border border-slate-300/70 rounded-lg p-10 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>
              Department of {BRANCHES.find(b => b.code === selectedBranch)?.name} ({selectedBranch})
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No attendance data today. This department is available but has not started sessions yet.
            </p>
            <button
              onClick={() => setSelectedBranch("DS")}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Open Data Science (DS)
            </button>
          </section>
        )}

        {/* SECTION STUDENTS MODAL */}
        {sectionModalData && (() => {
          const totalSectionModalPages = Math.ceil(sectionModalData.students.length / PAGE_SIZE) || 1;
          const paginatedSectionStudents = sectionModalData.students.slice(
            (sectionModalPage - 1) * PAGE_SIZE,
            sectionModalPage * PAGE_SIZE
          );

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-300/70 rounded-lg w-full max-w-2xl p-5 space-y-3 shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>{sectionModalData.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{sectionModalData.subtitle}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSectionModalData(null);
                      setSectionModalPage(1);
                    }}
                    className="w-7 h-7 rounded-md bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 p-1 cursor-pointer transition-colors flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 border border-slate-300/70 rounded-lg bg-slate-50/70 p-2">
                  {sectionModalData.students.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs">
                      No students match this view.
                    </div>
                  ) : (
                    paginatedSectionStudents.map((item, idx) => (
                      <div
                        key={item.student.id}
                        onClick={() => {
                          setSelectedStudentForDetails(item.student);
                          setSectionModalData(null);
                          setSectionModalPage(1);
                        }}
                        className="p-2.5 rounded-md bg-white border border-slate-300/70 hover:border-emerald-400 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center font-mono">
                            {(sectionModalPage - 1) * PAGE_SIZE + idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {item.student.name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500">
                              Roll: {item.student.uniqueId || item.student.unique_id || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.hourlyTotal && item.hourlyTotal > 0 ? (
                            <span className={`stamp ${
                              item.hourlyCount && item.hourlyCount > 0
                                ? "border-blue-300 bg-blue-50 text-blue-800"
                                : "border-slate-300 bg-slate-50 text-slate-500"
                            }`}>
                              {item.hourlyCount}/{item.hourlyTotal} Classes
                            </span>
                          ) : null}

                          {item.entryTime ? (
                            <span className="stamp border-slate-300 bg-slate-50 text-slate-700">
                              Gate: {formatTime(item.entryTime)}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              No Gate Scan
                            </span>
                          )}

                          <span className={`stamp ${
                            item.hourlyCount && item.hourlyCount > 0
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : item.entryTime
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-red-300 bg-red-50 text-red-800"
                          }`}>
                            {item.hourlyCount && item.hourlyCount > 0
                              ? "Present in Class"
                              : item.entryTime
                              ? "Gate Only"
                              : "Absent"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 20 Per Page Pagination Bar */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Showing <span className="font-bold font-mono text-slate-900">{sectionModalData.students.length === 0 ? 0 : (sectionModalPage - 1) * PAGE_SIZE + 1}–{Math.min(sectionModalPage * PAGE_SIZE, sectionModalData.students.length)}</span> of <span className="font-bold font-mono text-slate-900">{sectionModalData.students.length}</span> students
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={sectionModalPage <= 1}
                      onClick={() => setSectionModalPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 cursor-pointer transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-semibold text-slate-800 text-[11px]">
                      {sectionModalPage} / {totalSectionModalPages}
                    </span>
                    <button
                      disabled={sectionModalPage >= totalSectionModalPages}
                      onClick={() => setSectionModalPage((p) => Math.min(totalSectionModalPages, p + 1))}
                      className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => {
                        setSectionModalData(null);
                        setSectionModalPage(1);
                      }}
                      className="ml-2 px-3 py-1 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* STUDENT PROFILE & ATTENDANCE REGISTER MODAL - REDESIGNED FULL SCREEN */}
        {selectedStudentForDetails && (
          <StudentProfileModal
            student={selectedStudentForDetails}
            onClose={() => {
              setSelectedStudentForDetails(null);
              setSelectedDayDetail(null);
            }}
            initialMonth={studentModalMonth}
          />
        )}

        {/* CSV EXPORT MODAL */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300/70 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-950 text-sm" style={{ fontFamily: "var(--app-font-display)" }}>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Attendance (.csv)</span>
                </div>
                <button onClick={() => setExportModalOpen(false)} className="w-7 h-7 rounded-md bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="eyebrow block text-slate-600">Scope</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="all">All Departments &amp; Sections</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {exportType === "section" && (
                  <div>
                    <label className="eyebrow block text-slate-600">Section</label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="eyebrow block text-slate-600">Month</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-mono font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // The anchor version could not send the Authorization
                    // header and hit a nonexistent route; fetch the CSV with
                    // the bearer token and download it as a blob instead.
                    const qs = exportType === "section" ? `&section=${encodeURIComponent(exportSection)}` : "";
                    try {
                      const res = await fetch(`/api/attendance/export?month=${exportMonth}${qs}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("qr_token") || ""}` },
                      });
                      if (!res.ok) throw new Error(`Export failed (${res.status})`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Attendance_${exportMonth}${exportType === "section" ? `_${exportSection}` : ""}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      setExportModalOpen(false);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
