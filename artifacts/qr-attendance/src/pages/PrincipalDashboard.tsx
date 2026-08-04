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
  ShieldCheck
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

function getSectionDisplayName(sectionCode?: string) {
  if (!sectionCode) return { name: "3B", yearLabel: "3rd Year" };
  const upper = sectionCode.toUpperCase().replace(/\s+/g, "");
  if (upper.includes("2A") || upper.includes("II/I/A")) return { name: "2A", yearLabel: "2nd Year" };
  if (upper.includes("2B") || upper.includes("II/I/B")) return { name: "2B", yearLabel: "2nd Year" };
  if (upper.includes("3A") || upper.includes("III/I/A")) return { name: "3A", yearLabel: "3rd Year" };
  if (upper.includes("3B") || upper.includes("III/I/B")) return { name: "3B", yearLabel: "3rd Year" };
  if (upper.includes("4A") || upper.includes("IV/I/A")) return { name: "4A", yearLabel: "4th Year" };
  if (upper.includes("4B") || upper.includes("IV/I/B")) return { name: "4B", yearLabel: "4th Year" };
  return { name: sectionCode, yearLabel: "Department" };
}

export default function PrincipalDashboard() {
  const { logout } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState("DS");
  const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary");
  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");
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
  const sections = ["2A", "2B", "3A", "3B", "4A", "4B"];
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

        studentRow.push(String(totalPresent), String(totalAbsent), `${percent}%`);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">QR Attendance System</h1>
            <p className="text-xs text-slate-500 font-semibold">Office of the Principal • SPHN</p>
          </div>
        </div>

        {/* Top-Right Logout Button */}
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Principal Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Dr. K. S. S. S. N. V. Prasad
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    Principal
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-0.5 font-medium">
                  St. Peter's Engineering College (SPHN) • Institutional Campus Portal
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 font-semibold text-xs">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="bg-transparent text-slate-800 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setExportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Register (.csv)
              </button>
            </div>
          </div>

          {/* Campus Overview KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Campus Enrolled</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{campusTotalStudents} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Present Today</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{campusPresentCount} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Absent Today</p>
              <p className="text-2xl font-black text-rose-800 mt-1">{campusAbsentCount} Students</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Campus Attendance Rate</p>
              <p className="text-2xl font-black text-blue-800 mt-1">{campusAttendancePercent}%</p>
            </div>
          </div>
        </div>

        {/* Branch Switcher Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Engineering Departments & Branches
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
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
                      ? "bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-base font-black text-slate-900">{b.code}</span>
                    {b.code === "DS" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600 truncate">{b.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Branch Details */}
        {selectedBranch === "DS" ? (
          <div className="space-y-5">
            {/* View Mode Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                Section Breakdown Grid
              </button>
              <button
                onClick={() => setActiveTab("detailed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "detailed"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                Detailed Student Logs ({filteredLogs.length})
              </button>
            </div>

            {activeTab === "summary" ? (
              /* DS Section Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionStats.map((st) => (
                  <div key={st.section} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-700 text-sm">
                          {st.section}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Section {st.section}</h4>
                          <p className="text-xs font-medium text-slate-500">Data Science Dept</p>
                        </div>
                      </div>
                      <span className="text-base font-black text-blue-700">{st.percent}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Enrolled</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{st.total}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Present</p>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">{st.present}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                        <p className="text-[10px] font-bold text-rose-700 uppercase">Absent</p>
                        <p className="text-sm font-bold text-rose-800 mt-0.5">{st.absent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Detailed Student Logs Table */
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Sections</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {logsLoading ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-medium">Loading attendance records...</div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-medium">No scan records found for date {logDate}.</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4 text-center">Section</th>
                          <th className="py-3 px-4 text-center">Entry Time (In)</th>
                          <th className="py-3 px-4 text-center">Exit Time (Out)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLogs.map((log: any) => {
                          const student = log.user || students.find((s) => s.id === log.userId);
                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
                                  >
                                    {student.name}
                                  </button>
                                ) : (
                                  "Unknown"
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-700">
                                {student ? (
                                  <button
                                    onClick={() => setSelectedStudentForDetails(student)}
                                    className="text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer font-bold transition-colors"
                                  >
                                    {student.uniqueId || student.unique_id || "N/A"}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-700 font-semibold">
                                {student ? getSectionDisplayName(student.section).name : "—"}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-emerald-700">
                                {log.entryTime ? formatTime(log.entryTime) : "—"}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-blue-700">
                                {log.exitTime ? formatTime(log.exitTime) : "—"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  log.status === "inside"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {BRANCHES.find((b) => b.code === selectedBranch)?.name} ({selectedBranch})
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
              Department infrastructure configured. Currently 0 students are registered under this department. Live scanning active for Data Science (DS).
            </p>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-lg font-black text-white shadow-md shadow-blue-600/20">
                    {selectedStudentForDetails.name ? selectedStudentForDetails.name.charAt(0) : "S"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {selectedStudentForDetails.name}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        Student
                      </span>
                    </h3>
                    <p className="text-xs text-blue-600 font-mono font-bold mt-0.5">
                      Roll No: {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Roll Number</p>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-1">
                      {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Section & Year</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel})
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Department</p>
                    <p className="text-xs font-bold text-blue-600 mt-1">
                      CSE Data Science
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={studentModalMonth}
                      onChange={(e) => {
                        setStudentModalMonth(e.target.value);
                        setSelectedDayDetail(null);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
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
                    const studentMonthlyPercent = Math.floor((studentPresentCount / calcWorkingDays) * 100);

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase">Present (P)</p>
                            <p className="text-sm font-black text-emerald-800 mt-0.5">{studentPresentCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                            <p className="text-[10px] font-bold text-rose-700 uppercase">Absent (A)</p>
                            <p className="text-sm font-black text-rose-800 mt-0.5">{studentAbsentCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                            <p className="text-[10px] font-bold text-purple-700 uppercase">Holidays (*)</p>
                            <p className="text-sm font-black text-purple-800 mt-0.5">{studentHolidayCount} days</p>
                          </div>
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-[10px] font-bold text-blue-700 uppercase">Monthly %</p>
                            <p className="text-sm font-black text-blue-800 mt-0.5">{studentMonthlyPercent}%</p>
                          </div>
                        </div>

                        <div>
                          <div className="grid grid-cols-7 gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            {monthDaysList.map((d) => {
                              const isSelected = selectedDayDetail?.dateStr === d.dateStr;
                              return (
                                <button
                                  key={d.dateStr}
                                  onClick={() => setSelectedDayDetail(d)}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                                    isSelected
                                      ? "ring-2 ring-blue-600 scale-105 z-10 bg-white"
                                      : "hover:scale-102"
                                  } ${
                                    d.status === "P"
                                      ? "bg-emerald-100/70 border-emerald-300 text-emerald-900"
                                      : d.status === "*"
                                      ? "bg-amber-100/70 border-amber-300 text-amber-900"
                                      : d.status === "—"
                                      ? "bg-slate-100 border-slate-200 text-slate-400"
                                      : "bg-rose-100/70 border-rose-300 text-rose-900"
                                  }`}
                                >
                                  <span className="text-[10px] font-mono font-semibold text-slate-600">
                                    {d.dayNum} {d.dayOfWeek}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    d.status === "P"
                                      ? "bg-emerald-600 text-white"
                                      : d.status === "*"
                                      ? "bg-amber-500 text-white"
                                      : d.status === "—"
                                      ? "bg-slate-200 text-slate-500"
                                      : "bg-rose-600 text-white"
                                  }`}>
                                    {d.status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedDayDetail ? (
                          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <h5 className="text-sm font-bold text-slate-900">
                                  Date: <span className="font-mono text-blue-700">{selectedDayDetail.dateStr}</span> ({selectedDayDetail.dayOfWeek})
                                </h5>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                selectedDayDetail.status === "P"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : selectedDayDetail.status === "*"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : selectedDayDetail.status === "—"
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
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
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Entry Time (In)</p>
                                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Exit Time (Out)</p>
                                  <p className="text-xs font-bold text-blue-700 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Duration / Status</p>
                                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    {selectedDayDetail.record.durationMinutes
                                      ? `${Math.floor(selectedDayDetail.record.durationMinutes / 60)}h ${selectedDayDetail.record.durationMinutes % 60}m`
                                      : selectedDayDetail.record.status === "inside"
                                      ? "Still on Campus"
                                      : "Completed"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic pt-1 font-medium">
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

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Export Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Export Campus Register (.csv)
                </h3>
                <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Month</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Export Scope</label>
                  <select
                    value={exportType}
                    onChange={(e: any) => setExportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Entire Campus (All Sections)</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {exportType === "section" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                    >
                      {sections.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCsv}
                  disabled={isExporting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
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
