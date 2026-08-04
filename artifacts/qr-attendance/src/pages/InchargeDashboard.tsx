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
  { id: 3, name: "Mr. T. Shravan Kumar", email: "shravan.ds@sphoorthyengg.ac.in", key: "4013", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "23N81A6744", endRoll: "23N81A6787", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
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

  // Direct string compare
  if (cleanRoll >= cleanStart && cleanRoll <= cleanEnd) return true;

  // Suffix numeric compare (e.g. 6701 to 6743)
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

      if (viewScope === "FULL_SECTION") {
        return secInfo.name === activeAllocation.section;
      }

      // Mentored roll range check
      if (activeAllocation.startRoll && activeAllocation.endRoll) {
        return matchesRollRange(roll, activeAllocation.startRoll, activeAllocation.endRoll);
      }
      return secInfo.name === activeAllocation.section;
    });
  }, [allUsers, activeAllocation, viewScope]);

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
      let badgeColor = "bg-emerald-500 text-slate-950 font-black border border-emerald-400";
      let cardBorder = "border-l-4 border-l-emerald-500 border-slate-200";
      let bannerBg = "bg-emerald-50 border-emerald-200 text-slate-900";
      let dotColor = "🟢";
      let tip = "Good Standing (≥ 75%). Attendance target met!";

      if (percent < 65) {
        flag = "RED";
        label = "Critical Risk (< 65%)";
        badgeColor = "bg-rose-600 text-white font-extrabold border border-rose-500 shadow-xs";
        cardBorder = "border-l-4 border-l-rose-500 border-slate-200";
        bannerBg = "bg-rose-50 border-rose-200 text-slate-900";
        dotColor = "🔴";
        tip = `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Warning (Recoverable)";
        badgeColor = "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs";
        cardBorder = "border-l-4 border-l-amber-400 border-slate-200";
        bannerBg = "bg-amber-50 border-amber-200 text-slate-900";
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
        badgeColor,
        cardBorder,
        bannerBg,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-600/30">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeAllocation.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                Sec {activeAllocation.section}
              </span>
            </div>
            <p className="text-xs text-purple-700 font-bold mt-0.5">
              {activeAllocation.role} ({activeAllocation.yearLabel}) • CSE Data Science
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
          Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Allocation Info Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
              Assigned Mentoring Roster
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Roll Range: {activeAllocation.rollRange}
            </h2>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Assigned Mentored Capacity: {activeAllocation.count} Students
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewScope("MENTORED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewScope === "MENTORED"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              My Mentored Students ({analyticsList.length})
            </button>
            <button
              onClick={() => setViewScope("FULL_SECTION")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewScope === "FULL_SECTION"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Full Section {activeAllocation.section}
            </button>
          </div>
        </div>

        {/* Risk Flag Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setRiskFlagFilter("RED")}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-sm ${
              riskFlagFilter === "RED" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200 hover:border-rose-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                🔴 RED FLAG (&lt; 65%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                Critical
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">{redCount} Students</p>
            <p className="text-xs font-bold text-slate-600 mt-1">Shortage Risk • Requires Condonation / Parent Notice</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("YELLOW")}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-sm ${
              riskFlagFilter === "YELLOW" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                🟡 YELLOW FLAG (65%–74%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                Warning
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">{yellowCount} Students</p>
            <p className="text-xs font-bold text-slate-600 mt-1">Recoverable • Needs Consecutive Classes for 75%</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("GREEN")}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer bg-white shadow-sm ${
              riskFlagFilter === "GREEN" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                🟢 GREEN FLAG (≥ 75%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                Safe
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">{greenCount} Students</p>
            <p className="text-xs font-bold text-slate-600 mt-1">Good Standing • Attendance Target Met</p>
          </button>
        </div>

        {/* Toolbar & Student List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={riskFlagFilter}
                onChange={(e: any) => setRiskFlagFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold focus:outline-none"
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
              <div className="p-12 text-center text-slate-500 text-xs font-bold">
                No students found matching your search or risk flag filter.
              </div>
            ) : (
              filteredAnalyticsList.map((item) => (
                <div
                  key={item.student.id}
                  onClick={() => setSelectedStudentForDetails(item.student)}
                  className={`bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all cursor-pointer space-y-3 group shadow-sm ${item.cardBorder}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-base">
                        {item.dotColor}
                      </div>
                      <div>
                        {/* 100% PITCH BLACK BOLD STUDENT NAME */}
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {item.student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-mono font-bold">
                          <span>Roll: <strong className="text-emerald-700 font-extrabold">{item.student.uniqueId || item.student.unique_id || "N/A"}</strong></span>
                          <span>•</span>
                          <span>Year: <strong className="text-slate-800 font-bold">{item.secInfo.yearLabel}</strong></span>
                          <span>•</span>
                          <span>Sec: <strong className="text-purple-700 font-bold">{item.secInfo.name}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs inline-block ${item.badgeColor}`}>
                          {item.label} ({item.percent}%)
                        </span>
                        <p className="text-xs text-slate-600 font-bold mt-1">
                          {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recovery Math Banner */}
                  <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.bannerBg}`}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 shrink-0 text-slate-700" />
                      <span className="font-bold text-slate-800">{item.tip}</span>
                    </div>

                    {item.classesNeededFor75 > 0 ? (
                      <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 shrink-0 shadow-xs">
                        Target +{item.classesNeededFor75} Classes Needed
                      </span>
                    ) : (
                      <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-emerald-600 border border-emerald-500 text-white shrink-0 shadow-xs">
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
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
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
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-600/30">
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{studentName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
                            Roll: {rollNum}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                            Sec: {secObj.name} ({secObj.yearLabel})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedStudentForDetails(null)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Attendance Performance Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                      <p className="text-3xl font-black text-slate-900">{percent}%</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${item?.badgeColor || ""}`}>
                        {item?.label}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days Attended</p>
                      <p className="text-3xl font-black text-slate-900">{presentDays} / {totalDays}</p>
                      <p className="text-[10px] font-bold text-slate-500">Working Days This Month</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Status</p>
                      {classesFor75 > 0 ? (
                        <>
                          <p className="text-3xl font-black text-amber-600">+{classesFor75}</p>
                          <p className="text-[10px] font-bold text-slate-600">Consecutive Classes Needed</p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-black text-emerald-600">✓ Safe</p>
                          <p className="text-[10px] font-bold text-emerald-700">75% Target Achieved</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Recovery Math Strategy Banner */}
                  <div className={`p-4 rounded-2xl border ${item?.bannerBg || "bg-slate-50 border-slate-200"} space-y-2`}>
                    <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                      <TrendingUp className="w-5 h-5 text-purple-700" />
                      Academic Attendance Advisory & Recovery Math
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {item?.tip}
                    </p>
                    {flag === "RED" && (
                      <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-rose-800 border-t border-rose-200 mt-2">
                        <span>Condonation Cutoff (65%): +{classesFor65} Classes</span>
                        <span>Safe Threshold (75%): +{classesFor75} Classes</span>
                      </div>
                    )}
                  </div>

                  {/* Department & College Footer Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
                    <div>
                      <p className="text-slate-900 font-extrabold">Department of CSE - Data Science (DS)</p>
                      <p className="text-slate-500">Sphoorthy Engineering College • Academic Year 2026-2027</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        📱 Send WhatsApp Notice
                      </a>

                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
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
