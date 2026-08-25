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
} from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

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
      dotColor: "🟢",
      classesNeededFor75: 0,
      classesNeededFor65: 0,
    };
  } else if (percent >= 65) {
    return {
      flag: "YELLOW" as const,
      percent,
      label: "Warning (65–74%)",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      dotColor: "🟡",
      classesNeededFor75,
      classesNeededFor65: 0,
    };
  } else {
    return {
      flag: "RED" as const,
      percent,
      label: "Critical (< 65%)",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      dotColor: "🔴",
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
        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>{monthNames[month - 1]} {year}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white border border-gray-200 p-3 shadow-xl z-30 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1 rounded-md bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer text-xs"
              >
                &larr;
              </button>
              <span className="text-xs font-bold text-gray-800 font-mono">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1 rounded-md bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer text-xs"
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
                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      isSelected 
                        ? "bg-blue-600 text-white shadow-xs" 
                        : "bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700"
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
  const [riskFilter, setRiskFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");

  // Class Attendance Filter States
  const [hourlySectionFilter, setHourlySectionFilter] = useState("ALL");
  const [hourlySearchQuery, setHourlySearchQuery] = useState("");
  const [expandedHourlyScheduleId, setExpandedHourlyScheduleId] = useState<number | null>(null);

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

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
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    dayOfWeek: string;
    status: "P" | "A" | "*" | "—";
    record?: AttendanceRecord;
    holidayReason?: string;
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
      if (dObj.getDay() !== 0) { // Not Sunday
        working++;
      }
    }
    return Math.max(1, working);
  }, [monthForFlags]);

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
      {/* 1. COMPACT PRINCIPAL HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Sphoorthy Engineering College</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  PRINCIPAL
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                Institutional Campus Portal
              </p>
            </div>
          </div>

          {/* Controls: Date, Export, Logout */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
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
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* 2. TOP SUMMARY (SIMPLE EXECUTIVE STATS) */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                College Attendance Today — {logDate}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              All Departments
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Card 1: Total Students */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Students</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{campusTotalStudents}</p>
              <p className="text-[10px] text-slate-400">Enrolled</p>
            </div>

            {/* Card 2: Present Today */}
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">Present Today</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{campusPresentCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{campusAttendancePercent}%</p>
            </div>

            {/* Card 3: Absent Today */}
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <p className="text-[10px] font-bold text-rose-800 uppercase">Absent Today</p>
              <p className="text-xl font-black text-rose-700 mt-0.5">{campusAbsentCount}</p>
              <p className="text-[10px] text-rose-600 font-semibold">{100 - campusAttendancePercent}%</p>
            </div>

            {/* Card 4: Attendance % */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-[10px] font-bold text-blue-800 uppercase">Attendance %</p>
              <p className="text-xl font-black text-blue-700 mt-0.5">{campusAttendancePercent}%</p>
              <p className="text-[10px] text-blue-600">College Average</p>
            </div>

            {/* Card 5: Classes */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Classes</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">{hourlySummary.totalClasses}</p>
              <p className="text-[10px] text-slate-400">Scheduled</p>
            </div>

            {/* Card 6: Completed */}
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">Completed</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{hourlySessions.length}</p>
              <p className="text-[10px] text-emerald-600">Submitted</p>
            </div>

            {/* Card 7: Pending */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Pending</p>
              <p className="text-xl font-black text-slate-700 mt-0.5">0</p>
              <p className="text-[10px] text-emerald-600 font-semibold">None</p>
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
              className="p-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-rose-800 uppercase">Critical</p>
                <ChevronRight className="w-3 h-3 text-rose-500" />
              </div>
              <p className="text-xl font-black text-rose-700 mt-0.5">{redFlagCount}</p>
              <p className="text-[10px] text-rose-600 font-semibold underline">Below 65%</p>
            </div>
          </div>

          {/* Simple Modality Strip */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Class Attendance</span>
              <span className="font-bold text-emerald-700 font-mono">{classPresentUserIds.size} Present</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Gate Scans</span>
              <span className="font-bold text-blue-700 font-mono">{dsPresentSet.size} Scanned</span>
            </div>
          </div>
        </section>

        {/* 3. ACADEMIC DEPARTMENTS AT A GLANCE */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Academic Departments at a Glance</h3>
              <p className="text-xs text-slate-500">Department comparison today</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              6 Departments
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Students</th>
                  <th className="py-2.5 px-3 text-right">Present</th>
                  <th className="py-2.5 px-3 text-right">Absent</th>
                  <th className="py-2.5 px-3 text-center">Attendance %</th>
                  <th className="py-2.5 px-3 text-center">Classes Pending</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                        isSelected ? "bg-blue-50/50 font-medium" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {dept.name} ({dept.code})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                        {isDS ? enrolled : "No Data Today"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {isDS ? present : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        {isDS ? absent : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {pct !== null ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-slate-900 w-8 text-right">{pct}%</span>
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  pct >= 75 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-rose-500"
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            0 Pending
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          dept.active
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-200"
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
                          className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Data Science — Needs Attention</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700">
                  {sectionStats.filter(s => s.status !== "Good").length} Issues
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Issue 1: Section 4A */}
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-start justify-between gap-2 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <p className="font-bold text-slate-900">Section 4A — 54%</p>
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
                    className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer whitespace-nowrap"
                  >
                    View 4A
                  </button>
                </div>

                {/* Issue 2: Section 3C */}
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-start justify-between gap-2 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="font-bold text-slate-900">Section 3C — 70%</p>
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
                    className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer whitespace-nowrap"
                  >
                    View 3C
                  </button>
                </div>

                {/* Issue 3: Critical Attendance */}
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-start justify-between gap-2 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <p className="font-bold text-slate-900">{redFlagCount} Students — Below 65%</p>
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
                    className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer whitespace-nowrap"
                  >
                    View Students
                  </button>
                </div>
              </div>
            </div>
            {/* Simple View Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
              <button
                onClick={() => setActiveTab("sections")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "sections"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Section Attendance ({sectionStats.length})
              </button>

              <button
                onClick={() => setActiveTab("hourly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "hourly"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Class Attendance ({hourlySessions.length})
              </button>

              <button
                onClick={() => setActiveTab("flags")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "flags"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Attendance Problems ({redFlagCount})
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "logs"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Daily Records ({filteredLogs.length})
              </button>
            </div>

            {/* TAB 1: SECTION ATTENDANCE */}
            {activeTab === "sections" && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Section Attendance — Data Science
                    </h3>
                    <p className="text-xs text-slate-500">
                      Attendance across all 8 class sections
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {campusTotalStudents} Students
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {campusPresentCount} Present ({campusAttendancePercent}%)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                        <th className="py-2.5 px-3 w-14 text-center">Year</th>
                        <th className="py-2.5 px-3">Section</th>
                        <th className="py-2.5 px-3 text-right">Students</th>
                        <th className="py-2.5 px-3 text-right">Present</th>
                        <th className="py-2.5 px-3 text-right">Absent</th>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                        <th className="py-2.5 px-3 text-center">Classes</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sectionStats.map((st) => {
                        const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section);

                        return (
                          <tr key={st.section} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                              {st.yearLabel.slice(0, 3)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 font-mono font-black flex items-center justify-center text-xs">
                                {st.section}
                              </span>
                              <span>Section {st.section}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
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
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
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
                                className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
                              >
                                {st.present}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
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
                                className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer"
                              >
                                {st.absent}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`font-mono font-black ${
                                  st.percent >= 75 ? "text-emerald-700" : st.percent >= 65 ? "text-amber-700" : "text-rose-700"
                                }`}>
                                  {st.percent}%
                                </span>
                                <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      st.percent >= 75 ? "bg-emerald-500" : st.percent >= 65 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${st.percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-semibold">
                              {st.periodsCount > 0 ? `${st.periodsCount} Completed` : "0"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                st.status === "Good"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : st.status === "Warning"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-rose-100 text-rose-800 border-rose-300"
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
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
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
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Class Attendance Today — {logDate}
                    </h3>
                    <p className="text-xs text-slate-500">
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
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto">
                      {["ALL", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setHourlySectionFilter(sec)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            hourlySectionFilter === sec
                              ? "bg-blue-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {sec === "ALL" ? "All" : sec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {hourlyLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-semibold animate-pulse">
                    Loading Class Attendance...
                  </div>
                ) : hourlySessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">No Classes Recorded on {logDate}</p>
                    <p className="text-slate-400">Classes will appear here as faculty submit attendance.</p>
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
                            className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all bg-white"
                          >
                            <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex flex-col items-center justify-center flex-shrink-0 font-mono">
                                  <span className="text-[9px] font-bold uppercase">{session.year}</span>
                                  <span className="text-xs font-black">{session.section}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">{session.subject}</h4>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Complete
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span>{session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-700">Faculty: {session.facultyName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 justify-end">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="text-sm font-black text-slate-900">{pct}%</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      pct >= 75 ? "bg-emerald-100 text-emerald-800" : pct >= 65 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                    }`}>
                                      {session.presentCount}/{session.totalStudents} Present
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">{session.absentCount} Absent</p>
                                </div>

                                <button
                                  onClick={() => setExpandedHourlyScheduleId(isExpanded ? null : session.scheduleId)}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                  {isExpanded ? "Hide" : `Students (${studentList.length})`}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">
                                    Students ({session.presentCount} Present, {session.absentCount} Absent)
                                  </span>
                                  <a
                                    href={`/api/mentor/history/export?date=${logDate}&scheduleId=${session.scheduleId}`}
                                    download={`Attendance_${session.subject}_Sec${session.section}_${logDate}.csv`}
                                    className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Export CSV
                                  </a>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                                        <th className="py-2 px-3 w-10 text-center">#</th>
                                        <th className="py-2 px-3">Roll Number</th>
                                        <th className="py-2 px-3">Student Name</th>
                                        <th className="py-2 px-3 text-center">Class Status</th>
                                        <th className="py-2 px-3 text-center">Marking Method</th>
                                        <th className="py-2 px-3 text-center">Gate Scan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {studentList.map((st: any, idx: number) => (
                                        <tr
                                          key={st.id}
                                          onClick={() => {
                                            const fullUser = students.find((s) => s.id === st.id) || st;
                                            setSelectedStudentForDetails(fullUser);
                                          }}
                                          className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                        >
                                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{st.uniqueId || "N/A"}</td>
                                          <td className="py-1.5 px-3 font-semibold text-slate-800">{st.name}</td>
                                          <td className="py-1.5 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                              st.markedPresent
                                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                : "bg-rose-100 text-rose-800 border-rose-300"
                                            }`}>
                                              {st.markedPresent ? "Present" : "Absent"}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-slate-600 text-[11px]">
                                            {st.scannedQr ? "QR Scan" : st.markedByTeacher ? "Faculty Marked" : "—"}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-[11px]">
                                            <span className={st.scannedGate ? "text-emerald-700 font-bold" : "text-slate-400"}>
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
            {activeTab === "flags" && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Attendance Problems ({monthForFlags})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Students below 75% target threshold
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRiskFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        riskFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      All ({studentAnalyticsList.length})
                    </button>
                    <button
                      onClick={() => setRiskFilter("RED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        riskFilter === "RED" ? "bg-rose-700 text-white" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      Critical ({redFlagCount})
                    </button>
                    <button
                      onClick={() => setRiskFilter("YELLOW")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        riskFilter === "YELLOW" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Warning ({yellowFlagCount})
                    </button>
                    <button
                      onClick={() => setRiskFilter("GREEN")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        riskFilter === "GREEN" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Safe ({greenFlagCount})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Roll Number</th>
                        <th className="py-2.5 px-3 text-center">Section</th>
                        <th className="py-2.5 px-3 text-right">Days Present</th>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Needed for 75%</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAnalyticsList
                        .filter((item) => riskFilter === "ALL" || item.flag === riskFilter)
                        .slice(0, 100)
                        .map((item) => (
                          <tr
                            key={item.student.id}
                            onClick={() => setSelectedStudentForDetails(item.student)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-2 px-3 font-bold text-slate-900">{item.student.name}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.student.uniqueId || "N/A"}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                              Sec {getSectionDisplayName(item.student.section).name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {item.presentDays} / {item.totalWorkingDays}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black">
                              <span className={item.percent >= 75 ? "text-emerald-700" : item.percent >= 65 ? "text-amber-700" : "text-rose-700"}>
                                {item.percent}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${item.badgeColor}`}>
                                {item.dotColor} {item.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {item.flag === "RED" ? (
                                <span className="text-rose-700 font-semibold">
                                  Needs {item.classesNeededFor75} days for 75%
                                </span>
                              ) : item.flag === "YELLOW" ? (
                                <span className="text-amber-700 font-semibold">
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
                                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: DAILY RECORDS */}
            {activeTab === "logs" && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Daily Records — {logDate}
                    </h3>
                    <p className="text-xs text-slate-500">
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
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                    >
                      <option value="ALL">All Sections</option>
                      {sections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                    </select>

                    <select
                      value={logStatusFilter}
                      onChange={(e) => setLogStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
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

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Roll Number</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-center">Section</th>
                        <th className="py-2.5 px-3 text-center">Entry</th>
                        <th className="py-2.5 px-3 text-center">Exit</th>
                        <th className="py-2.5 px-3 text-center">Class Attendance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.slice(0, 150).map((item, idx) => (
                        <tr
                          key={item.student.id}
                          onClick={() => setSelectedStudentForDetails(item.student)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.student.uniqueId || "N/A"}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.student.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                            Sec {item.sectionDisplayName}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px]">
                            {item.log?.entryTime ? (
                              <span className="font-bold text-slate-800">
                                {formatTime(item.log.entryTime)}
                                {item.isLate && (
                                  <span className="ml-1 px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black">LATE</span>
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
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                Present
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Absent</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              item.unifiedStatus === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : item.unifiedStatus === "CLASS_ONLY"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : item.unifiedStatus === "GATE_ONLY"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
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
          <section className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              Department of {BRANCHES.find(b => b.code === selectedBranch)?.name} ({selectedBranch})
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No attendance data today. This department is available but has not started sessions yet.
            </p>
            <button
              onClick={() => setSelectedBranch("DS")}
              className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Open Data Science (DS)
            </button>
          </section>
        )}

        {/* SECTION STUDENTS MODAL */}
        {sectionModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-5 space-y-3 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{sectionModalData.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{sectionModalData.subtitle}</p>
                </div>
                <button onClick={() => setSectionModalData(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                {sectionModalData.students.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No students match this view.</div>
                ) : (
                  sectionModalData.students.map((item, idx) => (
                    <div
                      key={item.student.id}
                      onClick={() => {
                        setSelectedStudentForDetails(item.student);
                        setSectionModalData(null);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {item.student.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            Roll: {item.student.uniqueId || item.student.unique_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.hourlyTotal && item.hourlyTotal > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            item.hourlyCount && item.hourlyCount > 0
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {item.hourlyCount}/{item.hourlyTotal} Classes
                          </span>
                        ) : null}

                        {item.entryTime ? (
                          <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Gate: {formatTime(item.entryTime)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            No Gate Scan
                          </span>
                        )}

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          item.hourlyCount && item.hourlyCount > 0
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : item.entryTime
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
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

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSectionModalData(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT PROFILE & ATTENDANCE REGISTER MODAL */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-700 text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {selectedStudentForDetails.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedStudentForDetails.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                        Roll: {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel}) • Data Science
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Month Selector & Metrics */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Month:</span>
                  <CustomMonthSelector value={studentModalMonth} onChange={setStudentModalMonth} />
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {studentMonthlyRecords.length} Days Attended in {studentModalMonth}
                </span>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Monthly Calendar</h4>
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="font-bold text-slate-400 py-1">{d}</div>
                  ))}
                  {(() => {
                    const [yStr, mStr] = studentModalMonth.split("-");
                    const y = parseInt(yStr);
                    const m = parseInt(mStr);
                    const daysInM = new Date(y, m, 0).getDate();
                    const firstDayIdx = new Date(y, m - 1, 1).getDay();
                    const cells = [];

                    for (let i = 0; i < firstDayIdx; i++) {
                      cells.push(<div key={`empty_${i}`} className="h-13 rounded-lg bg-slate-50/50" />);
                    }

                    for (let day = 1; day <= daysInM; day++) {
                      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dObj = new Date(y, m - 1, day);
                      const isSunday = dObj.getDay() === 0;
                      const record = studentMonthlyRecords.find(r => r.date === dStr);
                      const isHoliday = holidays[dStr];
                      const isPresent = Boolean(record);

                      cells.push(
                        <div
                          key={dStr}
                          onClick={() => {
                            setSelectedDayDetail({
                              dateStr: dStr,
                              dayNum: day,
                              dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dObj.getDay()],
                              status: isPresent ? "P" : isSunday || isHoliday ? "*" : "A",
                              record,
                              holidayReason: isHoliday
                            });
                          }}
                          className={`h-13 rounded-lg p-1 border flex flex-col justify-between cursor-pointer transition-all ${
                            isPresent
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : isSunday || isHoliday
                              ? "bg-slate-100 border-slate-200 text-slate-400"
                              : "bg-rose-50 border-rose-200 text-rose-900"
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span>{day}</span>
                            <span>{isPresent ? "P" : isSunday ? "SUN" : isHoliday ? "HOL" : "A"}</span>
                          </div>
                          <span className="text-[9px] truncate font-mono">
                            {isPresent && record?.entryTime ? formatTime(record.entryTime) : isHoliday || isSunday ? "Off" : "Absent"}
                          </span>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Day Inspector */}
              {selectedDayDetail && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{selectedDayDetail.dateStr} ({selectedDayDetail.dayOfWeek})</span>
                    <button onClick={() => setSelectedDayDetail(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                  </div>
                  <p className="text-slate-600">
                    Status: <span className="font-bold">{selectedDayDetail.status === "P" ? "Present" : selectedDayDetail.status === "A" ? "Absent" : "Off"}</span>
                    {selectedDayDetail.record?.entryTime && ` • Entry: ${formatTime(selectedDayDetail.record.entryTime)}`}
                    {selectedDayDetail.record?.exitTime && ` • Exit: ${formatTime(selectedDayDetail.record.exitTime)}`}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV EXPORT MODAL */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Export Attendance (.csv)</span>
                </div>
                <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Scope</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="all">All Departments & Sections</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {exportType === "section" && (
                  <div>
                    <label className="font-bold text-slate-700">Section</label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold"
                    >
                      {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700">Month</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <a
                  href={`/api/attendance/export?month=${exportMonth}${exportType === "section" ? `&section=${exportSection}` : ""}`}
                  download={`Attendance_${exportMonth}.csv`}
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs"
                >
                  Download CSV
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
