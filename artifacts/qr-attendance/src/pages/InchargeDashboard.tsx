import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  XCircle,
  Search,
  AlertTriangle,
  Sparkles,
  Users,
  Flag,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Layers,
  Award,
  Filter,
  UserCheck
} from "lucide-react";

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

export const MENTOR_ALLOCATIONS = [
  { id: 1, name: "Mrs. A. Sravanthi", email: "sravanthi.ds@sphoorthyengg.ac.in", key: "4011", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", startRoll: "23N81A6701", endRoll: "23N81A6743", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 2, name: "Mrs. K. Sneha", email: "sneha.ds@sphoorthyengg.ac.in", key: "4012", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", startRoll: "23N81A6788", endRoll: "23N81A67C8", rollRange: "23N81A6788 TO 23N81A67C8 + LE", count: 39 },
  { id: 3, name: "Mr. T. Shravan Kumar", email: "shravan.ds@sphoorthyengg.ac.in", key: "4013", role: "Class In-charge & Mentor (3rd & 4th Yr)", yearLabel: "3rd & 4th Year", section: "3B", startRoll: "23N81A6744", endRoll: "23N81A6787", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 4, name: "Mrs. G. Sushma", email: "sushma.ds@sphoorthyengg.ac.in", key: "3011", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6701", endRoll: "24N81A6731", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 5, name: "Mr. M. Yadaiah", email: "yadaiah.ds@sphoorthyengg.ac.in", key: "3012", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", startRoll: "24N81A67A6", endRoll: "24N81A67D2", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 6, name: "Ms. Priyusha", email: "priyusha.ds@sphoorthyengg.ac.in", key: "3013", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6732", endRoll: "24N81A6752", rollRange: "24N81A6732 TO 24N81A6752 + LE", count: 26 },
  { id: 7, name: "Mrs. CH. Naga Rohini", email: "rohini.ds@sphoorthyengg.ac.in", key: "3014", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "24N81A6753", endRoll: "24N81A6779", rollRange: "24N81A6753 TO 24N81A6779 + RA", count: 26 },
  { id: 8, name: "Mr. Miskeen Ali", email: "miskeen.ds@sphoorthyengg.ac.in", key: "3015", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "24N81A6780", endRoll: "24N81A67A5", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 9, name: "Mrs. Swetha", email: "swetha.ds@sphoorthyengg.ac.in", key: "3016", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", startRoll: "24N81A67D3", endRoll: "24N81A67F9", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },
  { id: 10, name: "Mrs. B. Gayathri", email: "gayathri.ds@sphoorthyengg.ac.in", key: "2011", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6701", endRoll: "25N81A6727", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 11, name: "Mrs. K. Ramya", email: "ramya.ds@sphoorthyengg.ac.in", key: "2012", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", startRoll: "25N81A6756", endRoll: "25N81A6783", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 12, name: "Mr. K. Bikshapathi", email: "bikshapathi.ds@sphoorthyengg.ac.in", key: "2013", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", startRoll: "25N81A67B4", endRoll: "25N81A67E0", rollRange: "25N81A67B4 TO 25N81A67E0", count: 27 },
  { id: 13, name: "Mrs. CH. Vijaya Lakshmi", email: "vijayalaksmi.ds@sphoorthyengg.ac.in", key: "2014", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6728", endRoll: "25N81A6755", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 14, name: "Mr. M. Srinivasulu", email: "srinivasulu.ds@sphoorthyengg.ac.in", key: "2015", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", startRoll: "25N81A6784", endRoll: "25N81A67B3", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
];

function getSectionDisplayName(sectionCode?: string): { name: string; yearLabel: string; yearNum: string } {
  if (!sectionCode) return { name: "Other", yearLabel: "Department", yearNum: "Other" };
  const str = sectionCode.trim();
  const parts = str.split("/");
  const sectionLetter = (parts[parts.length - 1] || "A").trim().toUpperCase();

  if (str.includes("IV") || str.includes("4")) {
    return { name: `4${sectionLetter}`, yearLabel: "4th Year", yearNum: "4" };
  }
  if (str.includes("III") || str.includes("3")) {
    return { name: `3${sectionLetter}`, yearLabel: "3rd Year", yearNum: "3" };
  }
  if (str.includes("II") || str.includes("2")) {
    return { name: `2${sectionLetter}`, yearLabel: "2nd Year", yearNum: "2" };
  }
  return { name: sectionCode, yearLabel: "Department", yearNum: "Other" };
}

function matchesRollRange(rollNumStr: string, startRoll: string, endRoll: string): boolean {
  if (!rollNumStr || !startRoll || !endRoll) return false;
  const cleanRoll = rollNumStr.trim().toUpperCase();
  const cleanStart = startRoll.trim().toUpperCase();
  const cleanEnd = endRoll.trim().toUpperCase();

  if (cleanRoll >= cleanStart && cleanRoll <= cleanEnd) return true;

  const rollSuffix = cleanRoll.slice(-4);
  const startSuffix = cleanStart.slice(-4);
  const endSuffix = cleanEnd.slice(-4);

  if (rollSuffix && startSuffix && endSuffix) {
    if (rollSuffix >= startSuffix && rollSuffix <= endSuffix) {
      return true;
    }
  }

  return false;
}

export default function InchargeDashboard() {
  const { mentor, logout } = useAuth();
  const [, navigate] = useLocation();

  const [riskFlagFilter, setRiskFlagFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [selectedYearFilter, setSelectedYearFilter] = useState<"ALL" | "4" | "3" | "2">("ALL");
  const [viewScope, setViewScope] = useState<"MENTORED" | "FULL_SECTION">("MENTORED");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  // Active Faculty Allocation info
  const activeAllocation = useMemo(() => {
    if (!mentor) return MENTOR_ALLOCATIONS[0];
    return (
      MENTOR_ALLOCATIONS.find(
        (f) =>
          f.key === mentor.key ||
          f.email === mentor.email ||
          f.section.toLowerCase() === (mentor.section || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
          (mentor.section && mentor.section.includes(f.section))
      ) || MENTOR_ALLOCATIONS[0]
    );
  }, [mentor]);

  // Fetch users list
  const { data: allUsers = [] } = useQuery<StudentUser[]>({
    queryKey: ["incharge-users"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  const monthForFlags = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const { data: monthlyAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["incharge-monthly-attendance", monthForFlags],
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
      if (dObj.getDay() !== 0) working++;
    }
    return Math.max(1, working);
  }, [monthForFlags]);

  const studentPresentCounts = useMemo(() => {
    const map = new Map<number, number>();
    (monthlyAttendance || []).forEach((r: any) => {
      const uid = r.userId || r.user_id || r.user?.id;
      if (uid) map.set(uid, (map.get(uid) || 0) + 1);
    });
    return map;
  }, [monthlyAttendance]);

  // Filter students to ONLY those assigned to this Mentor or Section
  const assignedStudents = useMemo(() => {
    const studentsOnly = allUsers.filter((u) => u.role === "student");
    return studentsOnly.filter((student) => {
      const roll = (student.uniqueId || student.unique_id || "").trim().toUpperCase();
      const secInfo = getSectionDisplayName(student.section);

      // Check year filter toggle
      if (selectedYearFilter !== "ALL" && secInfo.yearNum !== selectedYearFilter) {
        return false;
      }

      if (viewScope === "FULL_SECTION") {
        return secInfo.name === activeAllocation.section;
      }

      // Mentored roll range check
      if (activeAllocation.startRoll && activeAllocation.endRoll) {
        return matchesRollRange(roll, activeAllocation.startRoll, activeAllocation.endRoll);
      }
      return secInfo.name === activeAllocation.section;
    });
  }, [allUsers, activeAllocation, viewScope, selectedYearFilter]);

  // Student Analytics List
  const analyticsList = useMemo(() => {
    return assignedStudents.map((student) => {
      const presentDays = studentPresentCounts.get(student.id) || 0;
      const calcWorking = totalMonthWorkingDays > 0 ? totalMonthWorkingDays : 1;
      const percent = Math.min(100, Math.floor((presentDays / calcWorking) * 100));

      const classesNeededFor75 = Math.max(0, 3 * totalMonthWorkingDays - 4 * presentDays);
      const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalMonthWorkingDays - presentDays) / 0.35));

      let flag: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let label = "Safe Zone";
      let badgeStyle = { backgroundColor: "#10b981", color: "#ffffff" };
      let cardBorder = "border-l-4 border-l-emerald-500 border-slate-200";
      let bannerStyle = { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" };
      let dotColor = "🟢";
      let tip = "Good Standing (≥ 75%). Attendance target met!";

      if (percent < 65) {
        flag = "RED";
        label = "Critical Risk (< 65%)";
        badgeStyle = { backgroundColor: "#e11d48", color: "#ffffff" };
        cardBorder = "border-l-4 border-l-rose-600 border-slate-200";
        bannerStyle = { backgroundColor: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" };
        dotColor = "🔴";
        tip = `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Warning (Recoverable)";
        badgeStyle = { backgroundColor: "#f59e0b", color: "#000000" };
        cardBorder = "border-l-4 border-l-amber-500 border-slate-200";
        bannerStyle = { backgroundColor: "#fffbeb", borderColor: "#fde68a", color: "#92400e" };
        dotColor = "🟡";
        tip = `Needs to attend next ${classesNeededFor75} consecutive classes to reach 75% safe threshold. Can improve by attending regularly!`;
      }

      const secInfo = getSectionDisplayName(student.section);
      return {
        student,
        presentDays,
        totalWorkingDays: totalMonthWorkingDays,
        percent,
        flag,
        label,
        badgeStyle,
        cardBorder,
        bannerStyle,
        dotColor,
        tip,
        classesNeededFor75,
        classesNeededFor65,
        secInfo,
      };
    });
  }, [assignedStudents, studentPresentCounts, totalMonthWorkingDays]);

  const filteredAnalyticsList = useMemo(() => {
    return analyticsList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.student.name.toLowerCase().includes(q) ||
        (item.student.uniqueId || item.student.unique_id || "").toLowerCase().includes(q);

      const matchesFlag = riskFlagFilter === "ALL" || item.flag === riskFlagFilter;
      return matchesSearch && matchesFlag;
    });
  }, [analyticsList, searchQuery, riskFlagFilter]);

  const redCount = analyticsList.filter((s) => s.flag === "RED").length;
  const yellowCount = analyticsList.filter((s) => s.flag === "YELLOW").length;
  const greenCount = analyticsList.filter((s) => s.flag === "GREEN").length;

  return (
    <div style={{ backgroundColor: "#f8fafc", color: "#0f172a" }} className="min-h-screen flex flex-col font-sans">
      {/* Header Bar */}
      <header style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border-b px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div style={{ backgroundColor: "#2563eb" }} className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ color: "#0f172a" }} className="text-base sm:text-lg font-black tracking-tight">
                {activeAllocation.name}
              </h1>
              <span style={{ backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black border">
                Sec {activeAllocation.section}
              </span>
            </div>
            <p style={{ color: "#1e40af" }} className="text-xs font-bold mt-0.5">
              {activeAllocation.role} ({activeAllocation.yearLabel}) • CSE Data Science
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          style={{ backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" }}
          className="px-4 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
          Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Allocation Info Banner */}
        <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <span style={{ backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" }} className="text-[10px] font-black uppercase tracking-wider border px-2.5 py-0.5 rounded-full">
              Assigned Mentoring Roster
            </span>
            <h2 style={{ color: "#0f172a" }} className="text-lg font-black mt-1">
              Roll Range: {activeAllocation.rollRange}
            </h2>
            <p style={{ color: "#475569" }} className="text-xs font-bold mt-0.5">
              Assigned Mentored Capacity: {activeAllocation.count} Students
            </p>
          </div>

          {/* Year & Scope Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector Tabs */}
            <div style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }} className="flex p-1 rounded-xl border text-xs font-black">
              <button
                onClick={() => setSelectedYearFilter("ALL")}
                style={{
                  backgroundColor: selectedYearFilter === "ALL" ? "#2563eb" : "transparent",
                  color: selectedYearFilter === "ALL" ? "#ffffff" : "#475569",
                }}
                className="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                All Years
              </button>
              <button
                onClick={() => setSelectedYearFilter("4")}
                style={{
                  backgroundColor: selectedYearFilter === "4" ? "#2563eb" : "transparent",
                  color: selectedYearFilter === "4" ? "#ffffff" : "#475569",
                }}
                className="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                4th Yr
              </button>
              <button
                onClick={() => setSelectedYearFilter("3")}
                style={{
                  backgroundColor: selectedYearFilter === "3" ? "#2563eb" : "transparent",
                  color: selectedYearFilter === "3" ? "#ffffff" : "#475569",
                }}
                className="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                3rd Yr
              </button>
              <button
                onClick={() => setSelectedYearFilter("2")}
                style={{
                  backgroundColor: selectedYearFilter === "2" ? "#2563eb" : "transparent",
                  color: selectedYearFilter === "2" ? "#ffffff" : "#475569",
                }}
                className="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                2nd Yr
              </button>
            </div>

            <button
              onClick={() => setViewScope("MENTORED")}
              style={{
                backgroundColor: viewScope === "MENTORED" ? "#2563eb" : "#f1f5f9",
                color: viewScope === "MENTORED" ? "#ffffff" : "#334155",
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent shadow-xs"
            >
              My Mentored ({analyticsList.length})
            </button>
            <button
              onClick={() => setViewScope("FULL_SECTION")}
              style={{
                backgroundColor: viewScope === "FULL_SECTION" ? "#2563eb" : "#f1f5f9",
                color: viewScope === "FULL_SECTION" ? "#ffffff" : "#334155",
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent shadow-xs"
            >
              Full Sec {activeAllocation.section}
            </button>
          </div>
        </div>

        {/* Risk Flag Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setRiskFlagFilter("RED")}
            style={{
              backgroundColor: "#ffffff",
              borderColor: riskFlagFilter === "RED" ? "#e11d48" : "#e2e8f0",
              boxShadow: riskFlagFilter === "RED" ? "0 0 0 2px rgba(225,29,72,0.2)" : "none",
            }}
            className="p-5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "#be123c" }} className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                🔴 RED FLAG (&lt; 65%)
              </span>
              <span style={{ backgroundColor: "#e11d48", color: "#ffffff" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black">
                Critical
              </span>
            </div>
            <p style={{ color: "#0f172a" }} className="text-3xl font-black">{redCount} Students</p>
            <p style={{ color: "#475569" }} className="text-xs font-bold mt-1">Shortage Risk • Requires Condonation / Parent Notice</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("YELLOW")}
            style={{
              backgroundColor: "#ffffff",
              borderColor: riskFlagFilter === "YELLOW" ? "#f59e0b" : "#e2e8f0",
              boxShadow: riskFlagFilter === "YELLOW" ? "0 0 0 2px rgba(245,158,11,0.2)" : "none",
            }}
            className="p-5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "#b45309" }} className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                🟡 YELLOW FLAG (65%–74%)
              </span>
              <span style={{ backgroundColor: "#fbbf24", color: "#000000" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black">
                Warning
              </span>
            </div>
            <p style={{ color: "#0f172a" }} className="text-3xl font-black">{yellowCount} Students</p>
            <p style={{ color: "#475569" }} className="text-xs font-bold mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("GREEN")}
            style={{
              backgroundColor: "#ffffff",
              borderColor: riskFlagFilter === "GREEN" ? "#10b981" : "#e2e8f0",
              boxShadow: riskFlagFilter === "GREEN" ? "0 0 0 2px rgba(16,185,129,0.2)" : "none",
            }}
            className="p-5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "#047857" }} className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                🟢 GREEN FLAG (≥ 75%)
              </span>
              <span style={{ backgroundColor: "#10b981", color: "#ffffff" }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black">
                Safe
              </span>
            </div>
            <p style={{ color: "#0f172a" }} className="text-3xl font-black">{greenCount} Students</p>
            <p style={{ color: "#475569" }} className="text-xs font-bold mt-1">Good Standing • Attendance Target Met</p>
          </button>
        </div>

        {/* Toolbar & Student List */}
        <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1", color: "#0f172a" }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={riskFlagFilter}
                onChange={(e: any) => setRiskFlagFilter(e.target.value)}
                style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1", color: "#0f172a" }}
                className="px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none"
              >
                <option value="ALL">All Risk Flags (🔴 🟡 🟢)</option>
                <option value="RED">🔴 Red Flag (&lt; 65%)</option>
                <option value="YELLOW">🟡 Yellow Flag (65%–74%)</option>
                <option value="GREEN">🟢 Green Flag (≥ 75%)</option>
              </select>
            </div>
          </div>

          {/* Student Cards Inner Scroll */}
          <div className="space-y-3 pt-2 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar contain-paint">
            {filteredAnalyticsList.length === 0 ? (
              <div style={{ color: "#64748b" }} className="p-12 text-center text-xs font-bold">
                No students found matching your search or risk flag filter.
              </div>
            ) : (
              filteredAnalyticsList.map((item) => (
                <div
                  key={item.student.id}
                  onClick={() => setSelectedStudentForDetails(item.student)}
                  style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer space-y-3 group shadow-xs hover:border-purple-300 ${item.cardBorder}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }} className="w-10 h-10 rounded-xl border flex items-center justify-center font-black text-base">
                        {item.dotColor}
                      </div>
                      <div>
                        {/* EXPLICIT 100% PITCH BLACK BOLD STUDENT NAME */}
                        <h4 style={{ color: "#0f172a" }} className="text-base font-black tracking-tight group-hover:text-purple-700 transition-colors">
                          {item.student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs font-mono font-bold">
                          <span style={{ color: "#334155" }}>Roll: <strong style={{ color: "#047857" }} className="font-extrabold">{item.student.uniqueId || item.student.unique_id || "N/A"}</strong></span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span style={{ color: "#334155" }}>Year: <strong style={{ color: "#0f172a" }} className="font-bold">{item.secInfo.yearLabel}</strong></span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span style={{ color: "#334155" }}>Sec: <strong style={{ color: "#6b21a8" }} className="font-bold">{item.secInfo.name}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span style={item.badgeStyle} className="px-3.5 py-1 rounded-full text-xs font-black shadow-xs inline-block">
                          {item.label} ({item.percent}%)
                        </span>
                        <p style={{ color: "#475569" }} className="text-xs font-bold mt-1">
                          {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recovery Math Banner */}
                  <div style={item.bannerStyle} className="p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span className="font-bold">{item.tip}</span>
                    </div>

                    {item.classesNeededFor75 > 0 ? (
                      <span style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }} className="font-mono font-black text-xs px-3 py-1 rounded-lg border shrink-0 shadow-xs">
                        Target +{item.classesNeededFor75} Classes Needed
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#059669", color: "#ffffff" }} className="font-mono font-black text-xs px-3 py-1 rounded-lg shrink-0 shadow-xs">
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

      {/* STUNNING STUDENT ANALYTICS PROFILE MODAL */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
            {/* Modal Header */}
            {(() => {
              const item = analyticsList.find(a => a.student.id === selectedStudentForDetails.id);
              const studentName = selectedStudentForDetails.name;
              const rollNum = selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A";
              const secObj = getSectionDisplayName(selectedStudentForDetails.section);

              const percent = item ? item.percent : 0;
              const presentDays = item ? item.presentDays : 0;
              const totalDays = item ? item.totalWorkingDays : 1;
              const flag = item ? item.flag : "GREEN";
              const classesFor75 = item ? item.classesNeededFor75 : 0;
              const classesFor65 = item ? item.classesNeededFor65 : 0;

              const whatsappMessage = encodeURIComponent(
                `Official Attendance Alert - Sphoorthy Engineering College (CSE-DS)\n\nStudent: ${studentName}\nRoll No: ${rollNum}\nSection: ${secObj.name}\nCurrent Monthly Attendance: ${percent}%\nDays Attended: ${presentDays}/${totalDays} Days\nRisk Status: ${flag === "RED" ? "🔴 RED FLAG (<65%)" : flag === "YELLOW" ? "🟡 YELLOW FLAG (65%-74%)" : "🟢 GREEN FLAG (≥75%)"}\n\nNotice: Student requires ${classesFor75} consecutive classes to achieve 75% safe attendance threshold.`
              );

              return (
                <>
                  <div style={{ borderColor: "#e2e8f0" }} className="flex items-start justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div style={{ backgroundColor: "#7c3aed" }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ color: "#0f172a" }} className="text-xl font-black tracking-tight">{studentName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span style={{ backgroundColor: "#f1f5f9", color: "#0f172a", borderColor: "#cbd5e1" }} className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border">
                            Roll: {rollNum}
                          </span>
                          <span style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe" }} className="px-2.5 py-0.5 rounded-full text-xs font-extrabold border">
                            Sec: {secObj.name} ({secObj.yearLabel})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedStudentForDetails(null)}
                      style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
                      className="p-1.5 rounded-xl hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Attendance Performance Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="p-4 rounded-2xl border text-center space-y-1">
                      <p style={{ color: "#64748b" }} className="text-xs font-bold uppercase tracking-wider">Attendance Rate</p>
                      <p style={{ color: "#0f172a" }} className="text-3xl font-black">{percent}%</p>
                      <span style={item?.badgeStyle} className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {item?.label}
                      </span>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="p-4 rounded-2xl border text-center space-y-1">
                      <p style={{ color: "#64748b" }} className="text-xs font-bold uppercase tracking-wider">Days Attended</p>
                      <p style={{ color: "#0f172a" }} className="text-3xl font-black">{presentDays} / {totalDays}</p>
                      <p style={{ color: "#64748b" }} className="text-[10px] font-bold">Working Days This Month</p>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="p-4 rounded-2xl border text-center space-y-1">
                      <p style={{ color: "#64748b" }} className="text-xs font-bold uppercase tracking-wider">Target Status</p>
                      {classesFor75 > 0 ? (
                        <>
                          <p style={{ color: "#d97706" }} className="text-3xl font-black">+{classesFor75}</p>
                          <p style={{ color: "#475569" }} className="text-[10px] font-bold">Consecutive Classes Needed</p>
                        </>
                      ) : (
                        <>
                          <p style={{ color: "#059669" }} className="text-3xl font-black">✓ Safe</p>
                          <p style={{ color: "#047857" }} className="text-[10px] font-bold">75% Target Achieved</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Recovery Math Strategy Banner */}
                  <div style={item?.bannerStyle} className="p-4 rounded-2xl border space-y-2">
                    <div style={{ color: "#0f172a" }} className="flex items-center gap-2 font-black text-sm">
                      <TrendingUp className="w-5 h-5 text-purple-700" />
                      Academic Attendance Advisory & Recovery Math
                    </div>
                    <p style={{ color: "#1e293b" }} className="text-xs font-bold leading-relaxed">
                      {item?.tip}
                    </p>
                    {flag === "RED" && (
                      <div style={{ borderColor: "#fecdd3", color: "#9f1239" }} className="pt-2 flex items-center justify-between text-xs font-extrabold border-t mt-2">
                        <span>Condonation Cutoff (65%): +{classesFor65} Classes</span>
                        <span>Safe Threshold (75%): +{classesFor75} Classes</span>
                      </div>
                    )}
                  </div>

                  {/* Department & College Footer Details */}
                  <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold">
                    <div>
                      <p style={{ color: "#0f172a" }} className="font-extrabold">Department of CSE - Data Science (DS)</p>
                      <p style={{ color: "#64748b" }}>Sphoorthy Engineering College • Academic Year 2026-2027</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: "#059669" }}
                        className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:bg-emerald-700"
                      >
                        📱 Send WhatsApp Notice
                      </a>

                      <button
                        onClick={() => window.print()}
                        style={{ backgroundColor: "#7c3aed" }}
                        className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:bg-purple-700"
                      >
                        📄 Print Report
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
