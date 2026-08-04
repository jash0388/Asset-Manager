import { useState } from "react";
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
  Info
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
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
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
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
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
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      dotColor: "🔴",
      classesNeededFor75,
      classesNeededFor65,
      tip: `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`,
    };
  }
}

export default function PrincipalDashboard() {
  const { logout } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState("DS");
  const [activeTab, setActiveTab] = useState<"summary" | "detailed" | "flags">(() => {
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

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  const [sectionModalData, setSectionModalData] = useState<{
    title: string;
    subtitle: string;
    students: {
      student: StudentUser;
      isPresent: boolean;
      entryTime?: string | null;
      exitTime?: string | null;
    }[];
  } | null>(null);

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

  // Fetch Daily Detailed Logs
  const { data: detailedLogs = [], isLoading: logsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-detailed", logDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${logDate}&to=${logDate}`),
    refetchInterval: 5000,
  });

  // Fetch Monthly Student Records when modal is open
  const { data: studentMonthlyRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["student-monthly-records", selectedStudentForDetails?.id, selectedStudentForDetails?.uniqueId, studentModalMonth],
    queryFn: async () => {
      if (!selectedStudentForDetails) return [];
      const [yearStr, monthStr] = studentModalMonth.split("-");
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const fromStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
      const toStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      const data = await customFetch<AttendanceRecord[]>(`/api/attendance?from=${fromStr}&to=${toStr}`);
      const targetId = selectedStudentForDetails.id;
      const targetRoll = (selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "").toLowerCase().trim();

      return (data || []).filter((r: any) => {
        const uId = r.userId || r.user_id || r.user?.id;
        const rRoll = (r.user?.uniqueId || r.user?.unique_id || "").toLowerCase().trim();
        return uId === targetId || (targetRoll && rRoll && targetRoll === rRoll);
      });
    },
    enabled: Boolean(selectedStudentForDetails)
  });

  // Calculate DS Branch Stats
  const dsTotalStudents = students.length;
  const dsPresentSet = new Set(detailedLogs.map((l) => l.userId || (l as any).user_id));
  const dsPresentCount = dsPresentSet.size;
  const dsAbsentCount = Math.max(0, dsTotalStudents - dsPresentCount);
  const dsAttendancePercent = dsTotalStudents > 0 ? Math.floor((dsPresentCount / dsTotalStudents) * 100) : 0;

  // Calculate Campus Total Stats across all branches
  const campusTotalStudents = dsTotalStudents;
  const campusPresentCount = dsPresentCount;
  const campusAbsentCount = dsAbsentCount;
  const campusAttendancePercent = campusTotalStudents > 0 ? Math.floor((campusPresentCount / campusTotalStudents) * 100) : 0;

  // Section Breakdown for DS
  const sections = ["2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"];
  const sectionStats = sections.map((secKey) => {
    const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === secKey);
    const total = secStudents.length;
    const present = secStudents.filter((s) => dsPresentSet.has(s.id)).length;
    const absent = Math.max(0, total - present);
    const percent = total > 0 ? Math.floor((present / total) * 100) : 0;
    return { section: secKey, total, present, absent, percent };
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30 border border-blue-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">QR Attendance System</h1>
            <p className="text-xs text-blue-400 font-semibold">Office of the Principal • Sphoorthy Engineering College</p>
          </div>
        </div>

        {/* Top-Right Logout Button */}
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 font-bold text-xs border border-red-800/60 flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Principal Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Dr. M. V. Ram Prasad
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                    Principal
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1 font-medium">
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
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl text-slate-200 font-semibold text-xs cursor-pointer hover:border-slate-700 transition-all"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
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
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
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
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Campus Enrolled</p>
              <p className="text-2xl font-black text-white mt-1">{campusTotalStudents} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Present Today</p>
              <p className="text-2xl font-black text-emerald-300 mt-1">{campusPresentCount} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Absent Today</p>
              <p className="text-2xl font-black text-rose-300 mt-1">{campusAbsentCount} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Campus Attendance Rate</p>
              <p className="text-2xl font-black text-blue-300 mt-1">{campusAttendancePercent}%</p>
            </div>
          </div>
        </div>

        {/* Branch Switcher Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Engineering Departments & Branches
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              6 Departments
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {BRANCHES.map((b) => {
              const isSelected = selectedBranch === b.code;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranch(b.code)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/40 shadow-xl"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-base font-black text-white">{b.code}</span>
                    {b.code === "DS" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 uppercase">
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 truncate">{b.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Branch Details */}
        {selectedBranch === "DS" ? (
          <div className="space-y-5">
            {/* View Mode Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "summary"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                Section Breakdown Grid
              </button>

              <button
                onClick={() => setActiveTab("detailed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "detailed"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                Detailed Daily Logs ({filteredLogs.length})
              </button>

              {/* DEDICATED STUDENT RISK FLAG ANALYTICS BUTTON */}
              <button
                onClick={() => setActiveTab("flags")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "flags"
                    ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-500/40"
                    : "bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-850"
                }`}
              >
                <Flag className="w-4 h-4 text-amber-400" />
                Student Risk Flag Analytics
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  🔴 {redFlagCount} | 🟡 {yellowFlagCount}
                </span>
              </button>
            </div>

            {activeTab === "summary" ? (
              /* DS Section Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionStats.map((st) => (
                  <div key={st.section} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all">
                    <div
                      onClick={() => {
                        const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section);
                        setSectionModalData({
                          title: `Section ${st.section} Roster`,
                          subtitle: `All ${st.total} Enrolled Students in Data Science Dept (${st.present} Present, ${st.absent} Absent)`,
                          students: secStudents.map((s) => {
                            const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                            return {
                              student: s,
                              isPresent: dsPresentSet.has(s.id),
                              entryTime: log?.entryTime,
                              exitTime: log?.exitTime,
                            };
                          }),
                        });
                      }}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-sm group-hover:scale-105 transition-transform">
                          {st.section}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">Section {st.section}</h4>
                          <p className="text-xs font-medium text-slate-400">Data Science Dept • Click for Roster</p>
                        </div>
                      </div>
                      <span className="text-base font-black text-blue-400">{st.percent}%</span>
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
                              return {
                                student: s,
                                isPresent: dsPresentSet.has(s.id),
                                entryTime: log?.entryTime,
                                exitTime: log?.exitTime,
                              };
                            }),
                          });
                        }}
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/80 transition-all cursor-pointer text-center active:scale-95"
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</p>
                        <p className="text-base font-black text-white mt-1">{st.total}</p>
                      </button>

                      {/* Present Button */}
                      <button
                        onClick={() => {
                          const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section && dsPresentSet.has(s.id));
                          setSectionModalData({
                            title: `Section ${st.section} — Present Students`,
                            subtitle: `${st.present} Students Present on ${logDate}`,
                            students: secStudents.map((s) => {
                              const log = detailedLogs.find((l) => (l.userId || (l as any).user_id) === s.id);
                              return {
                                student: s,
                                isPresent: true,
                                entryTime: log?.entryTime,
                                exitTime: log?.exitTime,
                              };
                            }),
                          });
                        }}
                        className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer text-center active:scale-95"
                      >
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Present</p>
                        <p className="text-base font-black text-emerald-300 mt-1">{st.present}</p>
                      </button>

                      {/* Absent Button */}
                      <button
                        onClick={() => {
                          const secStudents = students.filter((s) => getSectionDisplayName(s.section).name === st.section && !dsPresentSet.has(s.id));
                          setSectionModalData({
                            title: `Section ${st.section} — Absent Students`,
                            subtitle: `${st.absent} Students Absent on ${logDate}`,
                            students: secStudents.map((s) => ({
                              student: s,
                              isPresent: false,
                            })),
                          });
                        }}
                        className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer text-center active:scale-95"
                      >
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Absent</p>
                        <p className="text-base font-black text-rose-300 mt-1">{st.absent}</p>
                      </button>
                    </div>
                  </div>
                ))}
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
                        : "bg-slate-900 border-slate-800 hover:border-rose-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        🔴 Red Flag (&lt; 65%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Critical
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white">{redFlagCount} Students</p>
                    <p className="text-[11px] text-slate-400 mt-1">Shortage Risk • Requires Condonation / Intimation</p>
                  </button>

                  <button
                    onClick={() => setRiskFilter("YELLOW")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      riskFilter === "YELLOW"
                        ? "bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/40 shadow-xl"
                        : "bg-slate-900 border-slate-800 hover:border-amber-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        🟡 Yellow Flag (65%–74%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Warning
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white">{yellowFlagCount} Students</p>
                    <p className="text-[11px] text-slate-400 mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
                  </button>

                  <button
                    onClick={() => setRiskFilter("GREEN")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      riskFilter === "GREEN"
                        ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl"
                        : "bg-slate-900 border-slate-800 hover:border-emerald-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        🟢 Green Flag (≥ 75%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Safe
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white">{greenFlagCount} Students</p>
                    <p className="text-[11px] text-slate-400 mt-1">Good Standing • Target Met</p>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={riskFilter}
                        onChange={(e: any) => setRiskFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                      >
                        <option value="ALL">All Risk Flags (🔴 🟡 🟢)</option>
                        <option value="RED">🔴 Red Flag (&lt; 65%)</option>
                        <option value="YELLOW">🟡 Yellow Flag (65%–74%)</option>
                        <option value="GREEN">🟢 Green Flag (≥ 75%)</option>
                      </select>

                      <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                      >
                        <option value="ALL">All Sections</option>
                        {sections.map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Flag Cards */}
                  <div className="space-y-3">
                    {filteredAnalyticsList.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs font-medium">
                        No students found matching current risk flag filter.
                      </div>
                    ) : (
                      filteredAnalyticsList.map((item) => (
                        <div
                          key={item.student.id}
                          onClick={() => setSelectedStudentForDetails(item.student)}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer space-y-3 group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                item.flag === "RED"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : item.flag === "YELLOW"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}>
                                {item.dotColor}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                  {item.student.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono font-medium">
                                  <span>Roll: <strong className="text-emerald-400">{item.student.uniqueId || item.student.unique_id || "N/A"}</strong></span>
                                  <span>•</span>
                                  <span>Sec: <strong className="text-white">{getSectionDisplayName(item.student.section).name}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.badgeColor}`}>
                                  {item.label} ({item.percent}%)
                                </span>
                                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                                  {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Recovery Math & Action Advice */}
                          <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            item.flag === "RED"
                              ? "bg-rose-950/40 border-rose-900/50 text-rose-200"
                              : item.flag === "YELLOW"
                              ? "bg-amber-950/40 border-amber-900/50 text-amber-200"
                              : "bg-emerald-950/40 border-emerald-900/50 text-emerald-200"
                          }`}>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 shrink-0" />
                              <span className="font-semibold">{item.tip}</span>
                            </div>

                            {item.classesNeededFor75 > 0 ? (
                              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white shrink-0">
                                Target +{item.classesNeededFor75} Classes Needed
                              </span>
                            ) : (
                              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-emerald-300 shrink-0">
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Sections</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  {logsLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading attendance records...</div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">No scan records found for date {logDate}.</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase">
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
                            <tr key={log.id} className="hover:bg-slate-900/60">
                              <td className="py-3 px-4 font-bold text-white">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition-colors text-left"
                                  >
                                    {student.name}
                                  </button>
                                ) : (
                                  "Unknown"
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer font-bold transition-colors"
                                  >
                                    {student.uniqueId || student.unique_id || "N/A"}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-300 font-semibold">
                                {student ? getSectionDisplayName(student.section).name : "—"}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-emerald-400">
                                {log.entryTime ? formatTime(log.entryTime) : "—"}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-blue-400">
                                {log.exitTime ? formatTime(log.exitTime) : "—"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  log.status === "inside"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400 border-slate-750"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {BRANCHES.find((b) => b.code === selectedBranch)?.name} ({selectedBranch})
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">
              Department infrastructure configured. Currently 0 students are registered under this department. Live scanning active for Data Science (DS).
            </p>
          </div>
        )}

        {/* Section Interactive Roster Modal */}
        {sectionModalData && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {sectionModalData.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{sectionModalData.subtitle}</p>
                </div>
                <button onClick={() => setSectionModalData(null)} className="text-slate-400 hover:text-white p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 pr-1 flex-1 border border-slate-800 rounded-xl bg-slate-950 p-2">
                {sectionModalData.students.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs italic">No students match this section view.</div>
                ) : (
                  sectionModalData.students.map((item, idx) => (
                    <div
                      key={item.student.id}
                      onClick={() => {
                        setSelectedStudentForDetails(item.student);
                        setSectionModalData(null);
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                            {item.student.name}
                          </p>
                          <p className="text-[11px] font-mono text-emerald-400 font-semibold">
                            Roll: {item.student.uniqueId || item.student.unique_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.entryTime ? (
                          <span className="text-xs font-mono font-extrabold text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/50 shadow-xs">
                            In: {formatTime(item.entryTime)}
                          </span>
                        ) : null}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.isPresent
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                        }`}>
                          {item.isPresent ? "🟢 PRESENT" : "🔴 ABSENT"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSectionModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal with Flag Recovery Analytics */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-lg font-black text-white shadow-md shadow-blue-600/20">
                    {selectedStudentForDetails.name ? selectedStudentForDetails.name.charAt(0) : "S"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {selectedStudentForDetails.name}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                        Student
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                      Roll No: {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Roll Number</p>
                    <p className="text-xs font-bold text-white font-mono mt-1">
                      {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Section & Year</p>
                    <p className="text-xs font-bold text-white mt-1">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel})
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Department</p>
                    <p className="text-xs font-bold text-blue-400 mt-1">
                      CSE Data Science
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={studentModalMonth}
                      onClick={(e) => {
                        if (typeof (e.currentTarget as any).showPicker === "function") {
                          (e.currentTarget as any).showPicker();
                        }
                      }}
                      onChange={(e) => {
                        setStudentModalMonth(e.target.value);
                        setSelectedDayDetail(null);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>

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
                    (studentMonthlyRecords || []).forEach((r) => {
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
                      const isFuture = dateStr > todayStr;

                      const record = studentAttendanceByDate.get(dateStr);
                      const isPresent = Boolean(record);

                      let status: "P" | "A" | "*" | "—" = "A";
                      if (isFuture) {
                        status = "—";
                      } else if (isSunday) {
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
                        isSunday,
                        isFuture,
                        record
                      });
                    }

                    const calcWorkingDays = studentWorkingDaysCount > 0 ? studentWorkingDaysCount : 1;
                    const studentMonthlyPercent = Math.min(100, Math.floor((studentPresentCount / calcWorkingDays) * 100));
                    const studentFlagInfo = getStudentFlagStatus(calcWorkingDays, studentPresentCount);

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase">Present (P)</p>
                            <p className="text-base font-black text-emerald-300 mt-0.5">{studentPresentCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <p className="text-[10px] font-bold text-rose-400 uppercase">Absent (A)</p>
                            <p className="text-base font-black text-rose-300 mt-0.5">{studentAbsentCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <p className="text-[10px] font-bold text-purple-400 uppercase">Holidays (*)</p>
                            <p className="text-base font-black text-purple-300 mt-0.5">{studentHolidayCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-[10px] font-bold text-blue-400 uppercase">Monthly %</p>
                            <p className="text-base font-black text-blue-300 mt-0.5">{studentMonthlyPercent}%</p>
                          </div>
                        </div>

                        {/* STUDENT RISK FLAG RECOVERY MATH BANNER */}
                        <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                          studentFlagInfo.flag === "RED"
                            ? "bg-rose-950/40 border-rose-900/60 text-rose-200"
                            : studentFlagInfo.flag === "YELLOW"
                            ? "bg-amber-950/40 border-amber-900/60 text-amber-200"
                            : "bg-emerald-950/40 border-emerald-900/60 text-emerald-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{studentFlagInfo.dotColor}</span>
                              <h5 className="font-extrabold text-white text-sm">
                                Risk Status: {studentFlagInfo.label} ({studentMonthlyPercent}%)
                              </h5>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${studentFlagInfo.badgeColor}`}>
                              {studentFlagInfo.flag} FLAG
                            </span>
                          </div>

                          <p className="text-xs font-medium leading-relaxed">
                            {studentFlagInfo.tip}
                          </p>
                        </div>

                        <div>
                          <div className="grid grid-cols-7 gap-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                            {monthDaysList.map((d) => {
                              const isSelected = selectedDayDetail?.dateStr === d.dateStr;
                              return (
                                <button
                                  key={d.dateStr}
                                  onClick={() => setSelectedDayDetail(d)}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                                    isSelected
                                      ? "ring-2 ring-blue-400 scale-105 z-10 bg-slate-900"
                                      : "hover:scale-102"
                                  } ${
                                    d.status === "P"
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                                      : d.status === "*"
                                      ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                                      : d.status === "—"
                                      ? "bg-slate-950/40 border-slate-850/80 text-slate-600 opacity-60"
                                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                  }`}
                                >
                                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                                    {d.dayNum} {d.dayOfWeek}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    d.status === "P"
                                      ? "bg-emerald-500 text-slate-950"
                                      : d.status === "*"
                                      ? "bg-amber-400 text-slate-950"
                                      : d.status === "—"
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-rose-500/80 text-white"
                                  }`}>
                                    {d.status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedDayDetail ? (
                          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
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
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              }`}>
                                {selectedDayDetail.status === "P"
                                  ? "🟢 PRESENT"
                                  : selectedDayDetail.status === "*"
                                  ? "🟨 SUNDAY / HOLIDAY"
                                  : selectedDayDetail.status === "—"
                                  ? "🗓️ FUTURE DATE"
                                  : "🔴 ABSENT"}
                              </span>
                            </div>

                            {selectedDayDetail.record ? (
                              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Entry Time (In)</p>
                                  <p className="text-xs font-bold text-emerald-400 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Exit Time (Out)</p>
                                  <p className="text-xs font-bold text-blue-400 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Duration / Status</p>
                                  <p className="text-xs font-bold text-slate-200 mt-0.5">
                                    {selectedDayDetail.record.durationMinutes
                                      ? `${Math.floor(selectedDayDetail.record.durationMinutes / 60)}h ${selectedDayDetail.record.durationMinutes % 60}m`
                                      : selectedDayDetail.record.status === "inside"
                                      ? "Still on Campus"
                                      : "Completed"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic pt-1 font-medium">
                                {selectedDayDetail.status === "*"
                                  ? "Sunday / College Holiday. No attendance recorded."
                                  : selectedDayDetail.status === "—"
                                  ? "This date is in the future."
                                  : "No QR scan records registered for this date (Absent)."}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Export Campus Register (.csv)
                </h3>
                <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Month</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Export Scope</label>
                  <select
                    value={exportType}
                    onChange={(e: any) => setExportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Entire Campus (All Sections)</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {exportType === "section" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Section</label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                    >
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCsv}
                  disabled={isExporting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
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
