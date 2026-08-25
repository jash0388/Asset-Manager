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
  GraduationCap,
  Sparkles,
  Award,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Flag,
  AlertCircle,
  TrendingUp,
  Info,
  Clock
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
  { id: "DS", name: "Data Science", code: "DS", active: true },
  { id: "CSE", name: "Computer Science & Eng", code: "CSE", active: false },
  { id: "AIML", name: "AI & Machine Learning", code: "AIML", active: false },
  { id: "CS", name: "Cyber Security", code: "CS", active: false },
  { id: "CIVIL", name: "Civil Engineering", code: "CIVIL", active: false },
  { id: "ECE", name: "Electronics & Comm", code: "ECE", active: false },
];

function getSectionDisplayName(sectionCode?: string): { name: string; yearLabel: string } {
  if (!sectionCode) return { name: "Other", yearLabel: "Department" };
  const str = sectionCode.trim();
  const parts = str.split("/");
  const sectionLetter = (parts[parts.length - 1] || "A").trim();

  if (str.includes("IV") || str.includes("4")) {
    return { name: `4${sectionLetter}`, yearLabel: "4th Year" };
  }
  if (str.includes("III") || str.includes("3")) {
    return { name: `3${sectionLetter}`, yearLabel: "3rd Year" };
  }
  if (str.includes("II") || str.includes("2")) {
    return { name: `2${sectionLetter}`, yearLabel: "2nd Year" };
  }
  return { name: sectionCode, yearLabel: "Department" };
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

  // Additional consecutive classes needed to reach 75%: ceil((0.75*N - P) / 0.25) -> max(0, 3*N - 4*P)
  const classesNeededFor75 = Math.max(0, 3 * totalWorkingDays - 4 * presentDays);
  // Additional consecutive classes needed to reach 65%: ceil((0.65*N - P) / 0.35)
  const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalWorkingDays - presentDays) / 0.35));

  if (percent >= 75) {
    return {
      flag: "GREEN" as const,
      percent,
      label: "Safe Zone",
      badgeColor: "bg-emerald-500 text-slate-950 font-black border border-emerald-400",
      cardBorder: "border-l-4 border-l-emerald-500 border-gray-200",
      bannerBg: "bg-gray-50 border-emerald-500/30 text-gray-800",
      dotColor: "🟢",
      classesNeededFor75: 0,
      classesNeededFor65: 0,
      tip: "Good Standing (≥ 75%). Attendance target met!",
    };
  } else if (percent >= 65) {
    return {
      flag: "YELLOW" as const,
      percent,
      label: "Warning (Recoverable)",
      badgeColor: "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs",
      cardBorder: "border-l-4 border-l-amber-400 border-gray-200",
      bannerBg: "bg-gray-50 border-amber-500/40 text-gray-800",
      dotColor: "🟡",
      classesNeededFor75,
      classesNeededFor65: 0,
      tip: `Needs to attend next ${classesNeededFor75} consecutive classes to reach 75% safe threshold. Can improve by attending regularly!`,
    };
  } else {
    return {
      flag: "RED" as const,
      percent,
      label: "Critical Risk (< 65%)",
      badgeColor: "bg-rose-600 text-white font-extrabold border border-rose-400 shadow-xs",
      cardBorder: "border-l-4 border-l-rose-500 border-gray-200",
      bannerBg: "bg-gray-50 border-rose-500/40 text-gray-800",
      dotColor: "🔴",
      classesNeededFor75,
      classesNeededFor65,
      tip: `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`,
    };
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
        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-slate-800 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
      >
        <Calendar className="w-4 h-4 text-blue-600" />
        <span>{monthNames[month - 1]} {year}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-gray-200 p-4 shadow-2xl z-30 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-slate-800 hover:bg-gray-100 transition-all cursor-pointer"
              >
                &larr;
              </button>
              <span className="text-sm font-bold text-slate-800 font-mono">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-slate-800 hover:bg-gray-100 transition-all cursor-pointer"
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
                        : "bg-gray-50 border border-gray-100 hover:bg-gray-100 text-slate-700"
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
  const [activeTab, setActiveTab] = useState<"summary" | "hourly" | "detailed" | "flags">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "flags" ? "flags" : "summary";
  });
  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");

  // Hourly / Period Attendance States
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
  const [exportStudentId, setExportStudentId] = useState<number | "">("");
  const [exportRollQuery, setExportRollQuery] = useState("");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Users (Students)
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<StudentUser[]>({
    queryKey: ["users-all"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  const students = allUsers.filter((u) => u.role === "student");

  // Fetch Monthly Attendance Records for Flag Calculations across the month
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
  const totalMonthWorkingDays = (() => {
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
  })();

  // Map student IDs to monthly present count
  const studentPresentCounts = new Map<number, number>();
  (monthlyAttendanceForFlags || []).forEach((r: any) => {
    const uid = r.userId || r.user_id || r.user?.id;
    if (uid) {
      studentPresentCounts.set(uid, (studentPresentCounts.get(uid) || 0) + 1);
    }
  });

  // Calculate Student Analytics with Risk Flags
  const studentAnalyticsList = students.map((student) => {
    const presentDays = studentPresentCounts.get(student.id) || 0;
    const flagInfo = getStudentFlagStatus(totalMonthWorkingDays, presentDays);
    return {
      student,
      presentDays,
      totalWorkingDays: totalMonthWorkingDays,
      ...flagInfo,
    };
  });

  // Red, Yellow, Green Counts
  const redFlagCount = studentAnalyticsList.filter((s) => s.flag === "RED").length;
  const yellowFlagCount = studentAnalyticsList.filter((s) => s.flag === "YELLOW").length;
  const greenFlagCount = studentAnalyticsList.filter((s) => s.flag === "GREEN").length;

  // Fetch Daily Detailed Logs (Gate Attendance)
  const { data: detailedLogs = [], isLoading: logsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-detailed", logDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${logDate}&to=${logDate}`),
    refetchInterval: 5000,
  });

  // Fetch Class Presence (marked present in hourly classes by faculty + training) - Matches HOD Dashboard 100%
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

  // Fetch Hourly / Period Classroom Attendance for the selected date
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

  // Fetch Monthly Student Records when modal is open (Ultra-Fast API query for both gate and hourly attendance)
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

  // Calculate DS Branch Stats
  const dsTotalStudents = students.length;
  const dsPresentSet = new Set(detailedLogs.map((l) => l.userId || (l as any).user_id));

  // Overall Present Set (Present at Gate OR in Classroom / Hourly Attendance) - EXACT SAME AS HOD DASHBOARD
  const overallPresentSet = useMemo(() => {
    const set = new Set<number>(dsPresentSet);
    classPresentUserIds.forEach((id) => set.add(id));
    return set;
  }, [dsPresentSet, classPresentUserIds]);

  const dsPresentCount = overallPresentSet.size;
  const dsAbsentCount = Math.max(0, dsTotalStudents - dsPresentCount);
  const dsAttendancePercent = dsTotalStudents > 0 ? Math.floor((dsPresentCount / dsTotalStudents) * 100) : 0;

  // Calculate Campus Total Stats across all branches
  const campusTotalStudents = dsTotalStudents;
  const campusPresentCount = dsPresentCount;
  const campusAbsentCount = dsAbsentCount;
  const campusAttendancePercent = campusTotalStudents > 0 ? Math.floor((campusPresentCount / campusTotalStudents) * 100) : 0;

  // Section Breakdown for DS - EXACT MATCH WITH HOD DASHBOARD
  const sections = ["2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"];
  const sectionStats = sections.map((secKey) => {
    const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === secKey);
    const total = secStudents.length;
    const gatePresent = secStudents.filter((s) => dsPresentSet.has(s.id)).length;
    const classPresent = secStudents.filter((s) => classPresentUserIds.has(s.id)).length;
    const present = secStudents.filter((s) => overallPresentSet.has(s.id)).length;
    const absent = Math.max(0, total - present);
    const percent = total > 0 ? Math.floor((present / total) * 100) : 0;
    return { section: secKey, total, present, gatePresent, classPresent, absent, percent };
  });

  // Filter Detailed Logs for Table
  const filteredLogs = detailedLogs.filter((log) => {
    const student = log.user || students.find((s) => s.id === log.userId);
    if (!student) return true;
    const matchesSearch =
      searchQuery === "" ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.uniqueId || "").toLowerCase().includes(searchQuery.toLowerCase());
    const secName = getSectionDisplayName(student.section).name;
    const matchesSection = sectionFilter === "ALL" || secName === sectionFilter;
    return matchesSearch && matchesSection;
  });

  // Filter Student Analytics List for Risk Flag Tab
  const filteredAnalyticsList = studentAnalyticsList.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.student.uniqueId || "").toLowerCase().includes(searchQuery.toLowerCase());
    const secName = getSectionDisplayName(item.student.section).name;
    const matchesSection = sectionFilter === "ALL" || secName === sectionFilter;
    const matchesRisk = riskFilter === "ALL" || item.flag === riskFilter;
    return matchesSearch && matchesSection && matchesRisk;
  });

  // Helper format time
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    try {
      if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      const [h, m] = timeStr.split(":");
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const isLateTime = (timeStr?: string | null) => {
    if (!timeStr) return false;
    try {
      if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const seconds = d.getSeconds();
        const ms = d.getMilliseconds();
        return (seconds === 59 && ms === 999) || (hours === 22 && minutes === 0) || (hours === 3 && minutes === 30);
      }
      const [h, m] = timeStr.split(":");
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      return (hour === 22 && minute === 0) || (hour === 3 && minute === 30);
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

  // CSV Generator Function
  const handleGenerateCsv = async () => {
    setIsExporting(true);
    try {
      const [yearStr, monthStr] = exportMonth.split("-");
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

      const fromStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
      const toStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      const allRecords = await customFetch<AttendanceRecord[]>(`/api/attendance?from=${fromStr}&to=${toStr}`);

      let targetStudents = [...students];
      if (exportType === "section") {
        targetStudents = targetStudents.filter((s) => getSectionDisplayName(s.section).name === exportSection);
      } else if (exportType === "student") {
        if (exportStudentId) {
          targetStudents = targetStudents.filter((s) => s.id === Number(exportStudentId));
        } else if (exportRollQuery.trim()) {
          const q = exportRollQuery.trim().toLowerCase();
          targetStudents = targetStudents.filter(
            (s) => (s.uniqueId || s.unique_id || "").toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
          );
        }
      }

      targetStudents.sort((a, b) => (a.uniqueId || "").localeCompare(b.uniqueId || ""));

      const attendanceMap = new Map<number, Set<string>>();
      (allRecords || []).forEach((r: any) => {
        const uid = r.userId || r.user_id || r.user?.id;
        if (!uid || !r.date) return;
        const dStr = typeof r.date === "string" ? r.date.slice(0, 10) : "";
        if (!dStr) return;
        if (!attendanceMap.has(uid)) {
          attendanceMap.set(uid, new Set());
        }
        attendanceMap.get(uid)!.add(dStr);
      });

      const formatDateLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dateList: { dayNum: number; dateStr: string; dayLabel: string; isSunday: boolean }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dObj = new Date(yearNum, monthNum - 1, day, 12, 0, 0);
        const dateStr = formatDateLocal(dObj);
        const dayOfWeek = daysOfWeek[dObj.getDay()];
        dateList.push({
          dayNum: day,
          dateStr,
          dayLabel: `${day} ${dayOfWeek}`,
          isSunday: dObj.getDay() === 0,
        });
      }

      const csvRows: string[][] = [];
      csvRows.push([`CAMPUS ATTENDANCE REGISTER — PRINCIPAL REPORT (${exportMonth})`]);
      csvRows.push([`Generated on: ${new Date().toLocaleString()}`]);
      csvRows.push([]);

      const headerRow = ["S.No", "Roll Number", "Student Name", "Year", "Section"];
      dateList.forEach((d) => headerRow.push(`"${d.dayLabel}"`));
      headerRow.push("Total Present (P)", "Total Absent (A)", "Attendance %", "Risk Status", "Classes Needed for 75%");
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

        dateList.forEach((d) => {
          const isPresent = studentDatesPresent.has(d.dateStr);
          const isFuture = d.dateStr > todayStr;

          if (isFuture) {
            studentRow.push("");
          } else if (d.isSunday) {
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
        const flagInfo = getStudentFlagStatus(calcDays, totalPresent);

        studentRow.push(
          String(totalPresent),
          String(totalAbsent),
          `${percent}%`,
          `"${flagInfo.label}"`,
          String(flagInfo.classesNeededFor75)
        );
        csvRows.push(studentRow);
      });

      const csvContent = csvRows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Principal_Campus_Register_${exportMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (err) {
      alert("Failed to export register CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Top Header Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30 border border-blue-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">QR Attendance System</h1>
            <p className="text-xs text-blue-700 font-semibold">Office of the Principal • Sphoorthy Engineering College</p>
          </div>
        </div>

        {/* Top-Right Logout Button */}
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-700 font-bold text-xs border border-red-800/60 flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
        >
          <LogOut className="w-4 h-4 text-red-700" />
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 space-y-3 max-w-7xl mx-auto w-full">
        {/* Executive Principal Header Card (only when NOT on Risk Flag Analytics tab) */}
        {activeTab !== "flags" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                  <Award className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Dr. M. V. Ram Prasad
                    </h1>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-500/40 uppercase tracking-wider">
                      Principal
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 font-medium">
                    Sphoorthy Engineering College • Institutional Campus Portal
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector("input");
                    if (input && typeof (input as any).showPicker === "function") {
                      (input as any).showPicker();
                    }
                  }}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-2xl text-gray-800 font-semibold text-xs cursor-pointer hover:border-gray-300 transition-all"
                >
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <input
                    type="date"
                    value={logDate}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof (e.currentTarget as any).showPicker === "function") {
                        (e.currentTarget as any).showPicker();
                      }
                    }}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="bg-transparent text-gray-800 focus:outline-none cursor-pointer [color-scheme:light]"
                  />
                </div>

                <button
                  onClick={() => setExportModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Register (.csv)
                </button>
              </div>
            </div>

            {/* Campus Overview KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Campus Enrolled</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{campusTotalStudents} Students</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Across All 8 Sections</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Present Today</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{campusPresentCount} Students</p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold">{classPresentUserIds.size} In-Class • {dsPresentSet.size} Gate Scans</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Absent Today</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{campusAbsentCount} Students</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Missing from Gate & Class</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Campus Attendance Rate</p>
                <p className="text-2xl font-black text-blue-700 mt-1">{campusAttendancePercent}%</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Department Overall</p>
              </div>
            </div>
          </div>
        )}

        {/* Branch Switcher Tabs (only when NOT on Risk Flag Analytics tab) */}
        {activeTab !== "flags" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                Engineering Departments & Branches
              </h2>
              <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                6 Departments
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x">
              {BRANCHES.map((b) => {
                const isSelected = selectedBranch === b.code;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(b.code)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer min-w-[175px] flex-shrink-0 snap-start ${
                      isSelected
                        ? "bg-white border-blue-500 ring-2 ring-blue-500/40 shadow-xl"
                        : "bg-white/80 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-mono text-base font-black text-gray-900">{b.code}</span>
                       {b.code === "DS" ? (
                         <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-500/40 uppercase">
                           LIVE
                         </span>
                       ) : (
                         <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 uppercase">
                           Ready
                         </span>
                       )}
                     </div>
                     <p className="text-xs font-semibold text-gray-500 truncate">{b.name}</p>
                   </button>
                 );
               })}
             </div>
          </div>
        )}

        {/* Selected Branch Details */}
        {selectedBranch === "DS" ? (
          <div className="space-y-5">
            {/* View Mode Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "summary"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-900"
                }`}
              >
                <Layers className="w-4 h-4" />
                Section Breakdown Grid
              </button>

              <button
                onClick={() => setActiveTab("hourly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "hourly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-900"
                }`}
              >
                <Clock className="w-4 h-4" />
                Hourly / Period Attendance ({hourlySessions.length})
              </button>

              <button
                onClick={() => setActiveTab("detailed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "detailed"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                Detailed Daily Logs ({filteredLogs.length})
              </button>
            </div>

            {activeTab === "summary" ? (
              /* DS Section Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionStats.map((st) => {
                  const secHourlySessions = hourlySessions.filter((hs: any) => {
                    const secName = hs.section || "";
                    const yr = hs.year === "II" ? "2" : hs.year === "III" ? "3" : hs.year === "IV" ? "4" : hs.year;
                    return `${yr}${secName}` === st.section;
                  });
                  const secHourlyPresent = secHourlySessions.reduce((acc: number, hs: any) => acc + (hs.presentCount || 0), 0);
                  const secHourlyTotal = secHourlySessions.reduce((acc: number, hs: any) => acc + (hs.totalStudents || 0), 0);
                  const secHourlyPct = secHourlyTotal > 0 ? Math.round((secHourlyPresent / secHourlyTotal) * 100) : null;

                  return (
                    <div key={st.section} className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-md hover:border-gray-300 transition-all">
                      <div
                        onClick={() => {
                          const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section);
                          setSectionModalData({
                            title: `Section ${st.section} Roster`,
                            subtitle: `All ${st.total} Enrolled Students in Data Science Dept (${st.present} Present, ${st.absent} Absent)`,
                            students: secStudents.map((s) => {
                              const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                              const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                              const hourlyPresentCount = hourlyForStudent.filter((h: any) => h.markedPresent).length;
                              const isGatePresent = dsPresentSet.has(s.id);
                              const isClassPresent = classPresentSet.has(s.id);
                              return {
                                student: s,
                                isPresent: isGatePresent || isClassPresent,
                                isClassPresent,
                                entryTime: log?.entryTime,
                                exitTime: log?.exitTime,
                                hourlyCount: hourlyPresentCount,
                                hourlyTotal: hourlyForStudent.length,
                                hourlyPeriods: hourlyForStudent,
                              };
                            }),
                          });
                        }}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-700 text-sm group-hover:scale-105 transition-transform">
                            {st.section}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Section {st.section}</h4>
                            <p className="text-xs font-medium text-gray-500">
                              {secHourlyPct !== null
                                ? `Classroom: ${secHourlyPct}% (${secHourlySessions.length} Periods) • Click Roster`
                                : "Data Science Dept • Click for Roster"}
                            </p>
                          </div>
                        </div>
                        <span className="text-base font-black text-blue-700">{st.percent}%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        {/* Enrolled Button */}
                        <button
                          onClick={() => {
                            const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section);
                            setSectionModalData({
                              title: `Section ${st.section} — Enrolled Roster`,
                              subtitle: `Total ${st.total} Students Enrolled`,
                              students: secStudents.map((s) => {
                                const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                                const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                const isGatePresent = dsPresentSet.has(s.id);
                                const isClassPresent = classPresentSet.has(s.id);
                                return {
                                  student: s,
                                  isPresent: isGatePresent || isClassPresent,
                                  isClassPresent,
                                  entryTime: log?.entryTime,
                                  exitTime: log?.exitTime,
                                  hourlyCount: hourlyForStudent.filter((h: any) => h.markedPresent).length,
                                  hourlyTotal: hourlyForStudent.length,
                                  hourlyPeriods: hourlyForStudent,
                                };
                              }),
                            });
                          }}
                          className="p-3 rounded-xl bg-gray-50 hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer text-center active:scale-95"
                        >
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Enrolled</p>
                          <p className="text-base font-black text-gray-900 mt-1">{st.total}</p>
                        </button>

                        {/* Present Button */}
                        <button
                          onClick={() => {
                            const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section && overallPresentSet.has(s.id));
                            setSectionModalData({
                              title: `Section ${st.section} — Present Students (Class & Gate)`,
                              subtitle: `${st.present} Students Present on ${logDate} (${st.classPresent} In-Class • ${st.gatePresent} Gate Scan)`,
                              students: secStudents.map((s) => {
                                const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                                const hourlyForStudent = studentDayHourlyMap.get(s.id) || [];
                                const isGatePresent = dsPresentSet.has(s.id);
                                const isClassPresent = classPresentSet.has(s.id);
                                return {
                                  student: s,
                                  isPresent: true,
                                  isClassPresent,
                                  entryTime: log?.entryTime,
                                  exitTime: log?.exitTime,
                                  hourlyCount: hourlyForStudent.filter((h: any) => h.markedPresent).length,
                                  hourlyTotal: hourlyForStudent.length,
                                  hourlyPeriods: hourlyForStudent,
                                };
                              }),
                            });
                          }}
                          className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer text-center active:scale-95"
                        >
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Present</p>
                          <p className="text-base font-black text-emerald-700 mt-1">{st.present}</p>
                          <p className="text-[9px] font-semibold text-emerald-600 truncate mt-0.5">{st.classPresent} In-Class • {st.gatePresent} Gate</p>
                        </button>

                        {/* Absent Button */}
                        <button
                          onClick={() => {
                            const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section && !overallPresentSet.has(s.id));
                            setSectionModalData({
                              title: `Section ${st.section} — Absent Students`,
                              subtitle: `${st.absent} Students Absent from both Class & Gate on ${logDate}`,
                              students: secStudents.map((s) => {
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
                          className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer text-center active:scale-95"
                        >
                          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Absent</p>
                          <p className="text-base font-black text-rose-700 mt-1">{st.absent}</p>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "hourly" ? (
              /* DEDICATED HOURLY / PERIOD ATTENDANCE VIEW */
              <div className="space-y-6">
                {/* Hourly Bento Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Classes Conducted</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{hourlySummary.totalClasses} Periods</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Faculty Marked Sessions</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Classroom Attendance</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{hourlySummary.averageAttendance}%</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Average Across Classes</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Students Present</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{hourlySummary.totalPresent}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Marked In Period Logs</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Students Absent</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">{hourlySummary.totalAbsent}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Missed Class Sessions</p>
                  </div>
                </div>

                {/* Section Filter Pills & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                    {["ALL", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setHourlySectionFilter(sec)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          hourlySectionFilter === sec
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {sec === "ALL" ? "All Sections" : `Sec ${sec}`}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student, roll no, subject..."
                      value={hourlySearchQuery}
                      onChange={(e) => setHourlySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Class Sessions List */}
                {hourlyLoading ? (
                  <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
                    <p className="text-sm font-semibold animate-pulse">Loading Hourly Period Attendance...</p>
                  </div>
                ) : hourlySessions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 space-y-2">
                    <Clock className="w-10 h-10 text-gray-400 mx-auto" />
                    <p className="text-base font-bold text-gray-800">No Classroom Attendance Submitted on {logDate}</p>
                    <p className="text-xs text-gray-500">Faculty attendance records submitted through the mobile app will automatically appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hourlySessions
                      .filter((session: any) => {
                        const secName = session.section || "";
                        const yr = session.year === "II" ? "2" : session.year === "III" ? "3" : hsYr(session.year);
                        const secKey = `${yr}${secName}`;
                        const matchesSection = hourlySectionFilter === "ALL" || secKey === hourlySectionFilter || session.section === hourlySectionFilter;
                        if (!matchesSection) return false;

                        if (!hourlySearchQuery) return true;
                        const q = hourlySearchQuery.toLowerCase();
                        const matchesMeta = (session.subject || "").toLowerCase().includes(q) ||
                                            (session.facultyName || "").toLowerCase().includes(q) ||
                                            (session.fullSection || "").toLowerCase().includes(q);
                        const matchesStudent = (session.students || []).some((st: any) =>
                          (st.name || "").toLowerCase().includes(q) || (st.uniqueId || "").toLowerCase().includes(q)
                        );
                        return matchesMeta || matchesStudent;
                      })
                      .map((session: any) => {
                        const isExpanded = expandedHourlyScheduleId === session.scheduleId;
                        const pct = session.percentage || 0;
                        const studentList = session.students || [];

                        return (
                          <div
                            key={`${session.scheduleId}_${session.date || logDate}`}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-gray-300 transition-all"
                          >
                            {/* Card Header */}
                            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-700 flex-shrink-0">
                                  <span className="text-[10px] font-bold uppercase">{session.year} Year</span>
                                  <span className="text-sm font-black font-mono">Sec {session.section}</span>
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-bold text-gray-900">{session.subject}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300">
                                      SUBMITTED
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      {session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-gray-700">
                                      Faculty: {session.facultyName}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="text-lg font-black text-gray-900">{pct}%</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      pct >= 75
                                        ? "bg-emerald-100 text-emerald-700"
                                        : pct >= 65
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-rose-100 text-rose-700"
                                    }`}>
                                      {session.presentCount}/{session.totalStudents} Present
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{session.absentCount} Absent</p>
                                </div>

                                <button
                                  onClick={() => setExpandedHourlyScheduleId(isExpanded ? null : session.scheduleId)}
                                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? "Hide Roster" : `View Students (${studentList.length})`}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Student Roster */}
                            {isExpanded && (
                              <div className="p-4 sm:p-5 bg-gray-50 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Period Attendance Roster ({session.presentCount} Present, {session.absentCount} Absent)
                                  </h4>
                                  <a
                                    href={`/api/mentor/history/export?date=${logDate}&scheduleId=${session.scheduleId}`}
                                    download={`Attendance_${session.subject}_Sec${session.section}_${logDate}.csv`}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Export CSV
                                  </a>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3">Roll Number</th>
                                        <th className="py-2.5 px-3">Student Name</th>
                                        <th className="py-2.5 px-3 text-center">Class Status</th>
                                        <th className="py-2.5 px-3 text-center">Marking Method</th>
                                        <th className="py-2.5 px-3 text-center">Gate Scan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {studentList.map((st: any, idx: number) => (
                                        <tr
                                          key={st.id}
                                          onClick={() => {
                                            const fullUser = students.find((s) => s.id === st.id) || st;
                                            setSelectedStudentForDetails(fullUser);
                                          }}
                                          className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                        >
                                          <td className="py-2 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                                          <td className="py-2 px-3 font-mono font-bold text-gray-900">{st.uniqueId || "N/A"}</td>
                                          <td className="py-2 px-3 font-semibold text-gray-800">{st.name}</td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                              st.markedPresent
                                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                : "bg-rose-100 text-rose-800 border-rose-300"
                                            }`}>
                                              {st.markedPresent ? "🟢 PRESENT" : "🔴 ABSENT"}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className="text-[11px] font-medium text-gray-600">
                                              {st.scannedQr ? "📱 QR Code Scan" : st.markedByTeacher ? "✍️ Faculty Marked" : "—"}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={`text-[11px] font-medium ${
                                              st.scannedGate ? "text-emerald-700 font-bold" : "text-gray-400"
                                            }`}>
                                              {st.scannedGate ? (st.gateEntryTime ? `In: ${formatTime(st.gateEntryTime)}` : "Verified Gate In") : "No Gate Scan"}
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
            ) : activeTab === "flags" ? (
              /* DEDICATED STUDENT RISK FLAG ANALYTICS TAB */
              <div className="space-y-5">
                {/* Risk Flag Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setRiskFilter("RED")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      riskFilter === "RED"
                        ? "bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 shadow-xl"
                        : "bg-white border-gray-200 hover:border-rose-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        🔴 Red Flag (&lt; 65%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-500/40">
                        Critical
                      </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{redFlagCount} Students</p>
                    <p className="text-[11px] text-gray-500 mt-1">Shortage Risk • Requires Condonation / Intimation</p>
                  </button>

                  <button
                    onClick={() => setRiskFilter("YELLOW")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      riskFilter === "YELLOW"
                        ? "bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/40 shadow-xl"
                        : "bg-white border-gray-200 hover:border-amber-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        🟡 Yellow Flag (65%–74%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 border border-amber-500/40">
                        Warning
                      </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{yellowFlagCount} Students</p>
                    <p className="text-[11px] text-gray-500 mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
                  </button>

                  <button
                    onClick={() => setRiskFilter("GREEN")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      riskFilter === "GREEN"
                        ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl"
                        : "bg-white border-gray-200 hover:border-emerald-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        🟢 Green Flag (≥ 75%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-500/40">
                        Safe
                      </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{greenFlagCount} Students</p>
                    <p className="text-[11px] text-gray-500 mt-1">Good Standing • Target Met</p>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={riskFilter}
                        onChange={(e: any) => setRiskFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none"
                      >
                        <option value="ALL">All Risk Flags (🔴 🟡 🟢)</option>
                        <option value="RED">🔴 Red Flag (&lt; 65%)</option>
                        <option value="YELLOW">🟡 Yellow Flag (65%–74%)</option>
                        <option value="GREEN">🟢 Green Flag (≥ 75%)</option>
                      </select>

                      <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none"
                      >
                        <option value="ALL">All Sections</option>
                        {sections.map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Flag Cards */}
                  <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar contain-paint">
                    {filteredAnalyticsList.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs font-medium">
                        No students found matching current risk flag filter.
                      </div>
                    ) : (
                      filteredAnalyticsList.map((item) => (
                        <div
                          key={item.student.id}
                          onClick={() => setSelectedStudentForDetails(item.student)}
                          className={`bg-white border rounded-2xl p-4 transition-colors cursor-pointer space-y-3 group ${item.cardBorder}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-black text-sm">
                                {item.dotColor}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {item.student.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-700 font-mono font-medium">
                                  <span>Roll: <strong className="text-emerald-700 font-extrabold">{item.student.uniqueId || item.student.unique_id || "N/A"}</strong></span>
                                  <span>•</span>
                                  <span>Sec: <strong className="text-blue-700 font-bold">{getSectionDisplayName(item.student.section).name}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs inline-block ${item.badgeColor}`}>
                                  {item.label} ({item.percent}%)
                                </span>
                                <p className="text-xs text-gray-700 font-bold mt-1">
                                  {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Recovery Math & Action Advice */}
                          <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.bannerBg}`}>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 shrink-0 text-gray-700" />
                              <span className="font-semibold text-gray-800">{item.tip}</span>
                            </div>

                            {item.classesNeededFor75 > 0 ? (
                              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-white border border-gray-300 text-white shrink-0 shadow-xs">
                                Target +{item.classesNeededFor75} Classes Needed
                              </span>
                            ) : (
                              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-700 shrink-0 shadow-xs">
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
            ) : (
              /* Detailed Student Logs Table */
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Sections</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  {logsLoading ? (
                    <div className="p-8 text-center text-gray-500 text-xs font-medium">Loading attendance records...</div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs font-medium">No scan records found for date {logDate}.</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-white text-gray-500 font-bold uppercase">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4 text-center">Section</th>
                          <th className="py-3 px-4 text-center">Entry Time (In)</th>
                          <th className="py-3 px-4 text-center">Exit Time (Out)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredLogs.map((log: any) => {
                          const student = log.user || students.find((s) => s.id === log.userId);
                          return (
                            <tr key={log.id} className="hover:bg-white">
                              <td className="py-3 px-4 font-bold text-gray-900">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-blue-700 hover:text-blue-700 hover:underline cursor-pointer transition-colors text-left"
                                  >
                                    {student.name}
                                  </button>
                                ) : (
                                  "Unknown"
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-gray-700">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-emerald-700 hover:text-emerald-700 hover:underline cursor-pointer font-bold transition-colors"
                                  >
                                    {student.uniqueId || student.unique_id || "N/A"}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-700 font-semibold">
                                {student ? getSectionDisplayName(student.section).name : "—"}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-emerald-700">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span>{log.entryTime ? formatTime(log.entryTime) : "—"}</span>
                                  {isLateTime(log.entryTime) && (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider scale-90">
                                      Late Entry
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-blue-700">
                                {log.exitTime ? formatTime(log.exitTime) : "—"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  log.status === "inside"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-500/30"
                                    : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}>
                                  {log.status === "inside" ? "Still on Campus" : "Exited"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-DS Branch Setup Card */
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-700 mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {BRANCHES.find((b) => b.code === selectedBranch)?.name} ({selectedBranch})
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto font-medium">
              Department infrastructure configured. Currently 0 students are registered under this department. Live scanning active for Data Science (DS).
            </p>
          </div>
        )}

        {/* Section Interactive Roster Modal */}
        {sectionModalData && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {sectionModalData.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{sectionModalData.subtitle}</p>
                </div>
                <button onClick={() => setSectionModalData(null)} className="text-gray-500 hover:text-gray-900 p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 pr-1 flex-1 border border-gray-200 rounded-xl bg-gray-50 p-2">
                {sectionModalData.students.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs italic">No students match this section view.</div>
                ) : (
                  sectionModalData.students.map((item, idx) => (
                    <div
                      key={item.student.id}
                      onClick={() => {
                        setSelectedStudentForDetails(item.student);
                        setSectionModalData(null);
                      }}
                      className="p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {item.student.name}
                          </p>
                          <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                            Roll: {item.student.uniqueId || item.student.unique_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.hourlyTotal && item.hourlyTotal > 0 ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            item.hourlyCount && item.hourlyCount > 0
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}>
                            📚 {item.hourlyCount}/{item.hourlyTotal} Periods Present
                          </span>
                        ) : null}

                        {item.entryTime ? (
                          <span className="text-xs font-mono font-extrabold text-emerald-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-emerald-500/50 shadow-xs flex items-center gap-1.5">
                            Gate In: {formatTime(item.entryTime)}
                            {isLateTime(item.entryTime) && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider">LATE</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400">
                            No Gate Scan
                          </span>
                        )}

                        {/* Smart Status Badge based on Class and Gate attendance */}
                        {item.hourlyCount && item.hourlyCount > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-emerald-100 text-emerald-800 border-emerald-400 flex items-center gap-1">
                            🟢 PRESENT IN CLASS
                          </span>
                        ) : item.entryTime ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-amber-100 text-amber-800 border-amber-400 flex items-center gap-1">
                            🟡 GATE ONLY
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-rose-100 text-rose-800 border-rose-300 flex items-center gap-1">
                            🔴 ABSENT
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSectionModalData(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Profile & Attendance Details Modal - FULL SCREEN REDESIGN */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-gray-50 text-gray-900 flex flex-col p-6 sm:p-10 md:p-12 overflow-y-auto animate-fadeIn font-sans">
            <div className="max-w-4xl mx-auto w-full space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-2xl font-black text-gray-900 shadow-xl">
                    {selectedStudentForDetails.name ? selectedStudentForDetails.name.charAt(0) : "S"}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      {selectedStudentForDetails.name}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-500/30 uppercase tracking-wider">
                        Student
                      </span>
                    </h2>
                    <p className="text-sm font-semibold text-gray-500 mt-1">
                      Department of CSE Data Science
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase">Roll Number</p>
                    <p className="text-base font-bold text-gray-800 font-mono mt-1">
                      {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                  <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase">Section & Year</p>
                    <p className="text-base font-bold text-gray-800 mt-1">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel})
                    </p>
                  </div>
                  <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase">Department</p>
                    <p className="text-base font-bold text-blue-700 mt-1">
                      CSE Data Science
                    </p>
                  </div>
                </div>

                {/* Interactive Monthly Attendance Register Grid & Day Details */}
                <div className="space-y-6">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
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
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-800/60 shadow-xs"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            Download Register (.csv)
                          </button>
                        </div>

                        {/* Stats Row & Visual Pie Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          {/* Pie Chart Card */}
                          <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance Breakdown</p>
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
                                <span className="text-2xl font-black text-gray-900">{studentMonthlyPercent}%</span>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Monthly</span>
                              </div>
                            </div>
                          </div>

                          {/* Present Days Card */}
                          <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                            <p className="text-xs font-bold text-emerald-700 uppercase">Present Days (P)</p>
                            <p className="text-3xl font-black text-gray-900">{studentPresentCount} Days</p>
                            <p className="text-[10px] text-gray-400 font-bold">Attended out of {calcWorkingDays} working days</p>
                          </div>

                          {/* Absent Days Card */}
                          <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                            <p className="text-xs font-bold text-rose-700 uppercase">Absent Days (A)</p>
                            <p className="text-3xl font-black text-gray-900">{studentAbsentCount} Days</p>
                            <p className="text-[10px] text-gray-400 font-bold">Missed classes</p>
                          </div>

                          {/* Average College stay time */}
                          <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                            <p className="text-xs font-bold text-blue-700 uppercase">Avg Daily Campus Stay</p>
                            <p className="text-3xl font-black text-gray-900">{avgDurationStr}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Calculated from gate logs</p>
                          </div>
                        </div>

                        {/* Daily Register Grid */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Daily Register Grid (Click any date to view Entry/Exit times)</span>
                            <span className="text-gray-400 font-normal">P = Present | A = Absent | * = Holiday | — = Future</span>
                          </p>
                          
                          <div className="grid grid-cols-7 gap-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
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
                                      ? "bg-gray-50/40 border-gray-200/80 text-slate-600 opacity-60"
                                      : "bg-red-950/40 border-red-900/40 text-red-700"
                                  }`}
                                >
                                  <span className="text-[10px] font-mono font-semibold text-gray-500">
                                    {d.dayNum} {d.dayOfWeek}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                    d.status === "P"
                                      ? "bg-emerald-500 text-slate-950"
                                      : d.status === "*"
                                      ? "bg-amber-400 text-slate-950"
                                      : d.status === "—"
                                      ? "bg-gray-100 text-gray-400"
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
                                <Calendar className="w-4 h-4 text-blue-700" />
                                <h5 className="text-sm font-bold text-gray-900">
                                  Date: <span className="font-mono text-blue-700">{selectedDayDetail.dateStr}</span> ({selectedDayDetail.dayOfWeek})
                                </h5>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                selectedDayDetail.status === "P"
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-500/40"
                                  : selectedDayDetail.status === "*"
                                  ? "bg-purple-500/20 text-purple-700 border border-purple-500/40"
                                  : selectedDayDetail.status === "—"
                                  ? "bg-gray-100 text-gray-600 border border-gray-200"
                                  : "bg-red-100 text-red-700 border border-red-500/40"
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
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between">
                                    <span>Entry Time (In)</span>
                                    {isLateTime(selectedDayDetail.record.entryTime) && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider animate-pulse">LATE</span>
                                    )}
                                  </p>
                                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Exit Time (Out)</p>
                                  <p className="text-sm font-bold text-blue-700 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Duration / Status</p>
                                  <p className="text-xs font-bold text-gray-800 mt-1">
                                    {selectedDayDetail.record.durationMinutes
                                      ? `${Math.floor(selectedDayDetail.record.durationMinutes / 60)}h ${selectedDayDetail.record.durationMinutes % 60}m`
                                      : selectedDayDetail.record.status === "inside"
                                      ? "Still on Campus"
                                      : "Completed"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic pt-1 font-medium">
                                {selectedDayDetail.status === "*"
                                  ? "Sunday / College Holiday. No attendance recorded."
                                  : selectedDayDetail.status === "—"
                                  ? "This date is in the future."
                                  : "No QR scan records registered for this date (Absent)."}
                              </p>
                            )}
                            {/* Hourly Period Attendance */}
                            <div className="space-y-2 pt-2.5 border-t border-gray-200">
                              <h6 className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-700" />
                                Hourly Period Attendance
                              </h6>
                              {hourlyForSelectedDay.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                                  {hourlyForSelectedDay.map((hr: any) => (
                                    <div key={hr.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/60 border border-gray-200">
                                      <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-gray-900">
                                          {hr.qr_schedules?.subject || "Unknown Subject"}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium font-mono">
                                          Period: {hr.qr_schedules?.start_time?.slice(0, 5)} - {hr.qr_schedules?.end_time?.slice(0, 5)}
                                        </p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                        hr.marked_present
                                          ? "bg-emerald-950/80 text-emerald-700 border-emerald-900/30"
                                          : "bg-red-950/80 text-red-700 border-red-900/30"
                                      }`}>
                                        {hr.marked_present ? "PRESENT" : "ABSENT"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  No period-wise attendance records for this date.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Export Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  Export Campus Register (.csv)
                </h3>
                <button onClick={() => setExportModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Month</label>
                  <div
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector("input");
                      if (input && typeof (input as any).showPicker === "function") {
                        (input as any).showPicker();
                      }
                    }}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="month"
                      value={exportMonth}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof (e.currentTarget as any).showPicker === "function") {
                          (e.currentTarget as any).showPicker();
                        }
                      }}
                      onChange={(e) => setExportMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-white text-xs font-semibold focus:outline-none cursor-pointer [color-scheme:light]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Export Scope</label>
                  <select
                    value={exportType}
                    onChange={(e: any) => setExportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Entire Campus (All Sections)</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {exportType === "section" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none"
                    >
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCsv}
                  disabled={isExporting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {isExporting ? "Generating CSV..." : "Download Register (.csv)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
