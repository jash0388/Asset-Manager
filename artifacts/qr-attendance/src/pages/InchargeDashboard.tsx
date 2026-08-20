import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  CheckCircle2,
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
  UserCheck,
  Clock,
  ClipboardCheck,
  BookOpen
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
  // IV Year
  { id: 1, name: "Mrs A Sravanthi", email: "mrsasravanthi@gmail.com", key: "4011", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", startRoll: "23N81A6701", endRoll: "23N81A6743", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 3, name: "Mr T Shravan Kumar", email: "mrtshravankumar@gmail.com", key: "3012", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "23N81A6744", endRoll: "23N81A6787", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 2, name: "Mrs K Sneha", email: "mrsksneha@gmail.com", key: "4012", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", startRoll: "23N81A6788", endRoll: "23N81A67C8", rollRange: "23N81A6788 TO 23N81A67C8 + LE-3, LE-4", count: 39 },

  // III Year
  { id: 4, name: "Mrs G Sushma", email: "mrsgsushma@gmail.com", key: "3011", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6701", endRoll: "24N81A6731", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 15, name: "Ms. Priyusha", email: "msspriyusha@gmail.com", key: "115", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6732", endRoll: "24N81A6752", rollRange: "24N81A6732 TO 24N81A6752 + LE-3 to LE-8", count: 26 },
  { id: 6, name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com", key: "101", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "24N81A6753", endRoll: "24N81A6779", rollRange: "24N81A6753 TO 24N81A6779 + RA-33, A9", count: 26 },
  { id: 8, name: "Mr Miskeen Ali", email: "mrmiskeenali@gmail.com", key: "103", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", startRoll: "24N81A6780", endRoll: "24N81A67A5", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 5, name: "Mr M Yadaiah", email: "mrmyadaiah@gmail.com", key: "3013", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", startRoll: "24N81A67A6", endRoll: "24N81A67D2", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 9, name: "Mrs. Swetha", email: "mrsswetha@gmail.com", key: "102", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", startRoll: "24N81A67D3", endRoll: "24N81A67F9", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },

  // II Year
  { id: 10, name: "Mrs B Gayathri", email: "mrsbgayathri@gmail.com", key: "2011", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6701", endRoll: "25N81A6727", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 13, name: "Mrs Ch Vijaya Lakshmi", email: "mrschvijayalakshmi@gmail.com", key: "113", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6728", endRoll: "25N81A6755", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 11, name: "Mrs K Ramya", email: "mrskramya@gmail.com", key: "2012", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", startRoll: "25N81A6756", endRoll: "25N81A6783", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 14, name: "Mr M Srinivasulu", email: "mrmsrinivasulu@gmail.com", key: "105", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", startRoll: "25N81A6784", endRoll: "25N81A67B3", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
  { id: 12, name: "Mrs K Srinija", email: "mrsksrinija@gmail.com", key: "114", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2C", startRoll: "25N81A67B4", endRoll: "25N81A67D9", rollRange: "25N81A67B4 TO 25N81A67D9", count: 26 },
  { id: 7, name: "Mr K Bikshapathi", email: "mrkbikshapathi@gmail.com", key: "2013", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", startRoll: "25N81A67E0", endRoll: "25N81A67G0", rollRange: "25N81A67E0 TO 25N81A67G0", count: 19 },

  // Subject Faculty
  { id: 18, name: "Mr. Rakesh Goud", email: "mrrakeshgoud@gmail.com", key: "118", role: "Subject Faculty (MSF)", yearLabel: "2nd Year", section: "2A/2B/2C", startRoll: "25N81A6701", endRoll: "25N81A67G0", rollRange: "MSF — All 2nd Year Students", count: 80 },
  { id: 16, name: "Dr. A. Balaram", email: "drabalaram@gmail.com", key: "116", role: "Subject Faculty", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6701", endRoll: "25N81A6727", rollRange: "2nd Year Students", count: 27 },
  { id: 17, name: "Dr. Md Abdul Azeem", email: "drmdabdulazeem@gmail.com", key: "117", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6701", endRoll: "24N81A6731", rollRange: "3rd Year Students", count: 29 },
  { id: 19, name: "Dr. Sri Hari VLN", email: "drsriharivln@gmail.com", key: "119", role: "Subject Faculty", yearLabel: "2nd Year", section: "2A", startRoll: "25N81A6701", endRoll: "25N81A6727", rollRange: "2nd Year Students", count: 27 },
  { id: 20, name: "Mr. Prateek", email: "mrprateek@gmail.com", key: "120", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6701", endRoll: "24N81A6731", rollRange: "3rd Year Students", count: 29 },
  { id: 21, name: "Ms. Vaidehi", email: "msvaidehi@gmail.com", key: "121", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", startRoll: "24N81A6701", endRoll: "24N81A6731", rollRange: "3rd Year Students", count: 29 },
  { id: 22, name: "Dr. C. Lakshmi Nath", email: "lakshminath@sphoorthyengg.ac.in", key: "122", role: "Subject Faculty (OE)", yearLabel: "4th Year", section: "4B", startRoll: "23N81A6788", endRoll: "23N81A67C8", rollRange: "PPLE(OE) — All 4B Students", count: 39 },
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

  // Ensure same admission year prefix (e.g. "23", "24", "25") to prevent mismatching different batches
  if (cleanRoll.slice(0, 2) !== cleanStart.slice(0, 2)) return false;

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

export default function InchargeDashboard() {
  const { mentor, logout } = useAuth();
  const [holidays] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("qr_hod_holidays");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
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

  const [, navigate] = useLocation();

  const [riskFlagFilter, setRiskFlagFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [selectedYearFilter, setSelectedYearFilter] = useState<"ALL" | "4" | "3" | "2">("ALL");
  const [viewScope, setViewScope] = useState<"MENTORED" | "FULL_SECTION">("MENTORED");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [studentModalMonth, setStudentModalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);

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

  // Active Faculty Allocation info
  // Active Faculty Allocation info
  const activeAllocation = useMemo(() => {
    if (!mentor) return MENTOR_ALLOCATIONS[0];

    // Helper map to match 3-digit mentor key with 4-digit incharge key
    const INCHARGE_KEY_MAP: Record<string, string> = {
      "109": "4011", // Sravanthi
      "110": "4012", // Sneha
      "106": "3012", // Shravan
      "108": "3011", // Sushma
      "104": "3013", // Yadaiah
      "111": "2011", // Gayathri
      "112": "2012", // Ramya
      "107": "2013", // Bikshapathi
    };

    const mKey = mentor.key || "";
    const mappedKey = INCHARGE_KEY_MAP[mKey] || mKey;

    return (
      MENTOR_ALLOCATIONS.find(
        (f) =>
          f.key === mKey ||
          f.key === mappedKey ||
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
      let cardBorder = "border-l-4 border-l-emerald-500 border-gray-200";
      let bannerStyle = { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" };
      let dotColor = "🟢";
      let tip = "Good Standing (≥ 75%). Attendance target met!";

      if (percent < 65) {
        flag = "RED";
        label = "Critical Risk (< 65%)";
        badgeStyle = { backgroundColor: "#e11d48", color: "#ffffff" };
        cardBorder = "border-l-4 border-l-rose-600 border-gray-200";
        bannerStyle = { backgroundColor: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" };
        dotColor = "🔴";
        tip = `Critical attendance shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation limit, and ${classesNeededFor75} classes to reach 75% safe threshold. Parent notification recommended.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Warning (Recoverable)";
        badgeStyle = { backgroundColor: "#f59e0b", color: "#000000" };
        cardBorder = "border-l-4 border-l-amber-500 border-gray-200";
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

  const queryClient = useQueryClient();

  // Permission / OD Attendance Modal States
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionDate, setPermissionDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [permissionStudentSearch, setPermissionStudentSearch] = useState("");
  const [permissionReason, setPermissionReason] = useState("Official Permission / On-Duty");
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [permissionSuccessMsg, setPermissionSuccessMsg] = useState("");
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");

  // Fetch all schedules for timetable lookup
  const { data: allSchedules = [] } = useQuery<any[]>({
    queryKey: ["admin-all-schedules"],
    queryFn: () => customFetch<any[]>("/api/admin/schedules"),
  });

  // Calculate day of week and section schedules for permissionDate
  const { targetDayName, daySchedules } = useMemo(() => {
    const [y, m, d] = (permissionDate || "").split("-").map(Number);
    const dayIdx = !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m - 1, d, 12, 0, 0).getDay() : new Date().getDay();
    const dayMap: Record<number, string> = {
      1: "MON",
      2: "TUE",
      3: "WED",
      4: "THUR",
      5: "FRI",
      6: "SAT",
      0: "SUN"
    };
    const dayNameMap: Record<number, string> = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      0: "Sunday"
    };
    const targetDay = dayMap[dayIdx] || "MON";
    const targetDayName = dayNameMap[dayIdx] || "Monday";

    const inchargeSec = (activeAllocation.section || "").trim().toUpperCase(); // e.g. "4A", "3B", "2C", "3A"
    const secLetter = inchargeSec.replace(/[^A-Z]/g, "") || "A"; // e.g. "A", "B", "C"
    const yearCode = inchargeSec.includes("4") ? "IV" : inchargeSec.includes("3") ? "III" : inchargeSec.includes("2") ? "II" : "";

    const matched = (allSchedules || []).filter((s: any) => {
      const sDay = (s.day_of_week || "").trim().toUpperCase();
      if (sDay !== targetDay) return false;
      const sSec = (s.section || "").trim().toUpperCase();
      const sYear = (s.year || "").trim().toUpperCase();

      const matchSec = sSec === secLetter || sSec === inchargeSec || sSec.includes(secLetter);
      const matchYear = !yearCode || sYear === yearCode || (yearCode === "IV" && (sYear === "4" || sYear === "IV")) || (yearCode === "III" && (sYear === "3" || sYear === "III")) || (yearCode === "II" && (sYear === "2" || sYear === "II"));

      return matchSec && matchYear;
    });

    return {
      targetDayName,
      daySchedules: matched.sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""))
    };
  }, [allSchedules, permissionDate, activeAllocation.section]);

  // Students available for selection in permission modal
  const modalFilteredStudents = useMemo(() => {
    const q = permissionStudentSearch.toLowerCase().trim();
    return assignedStudents.filter((s) => {
      if (!q) return true;
      const name = (s.name || "").toLowerCase();
      const roll = (s.uniqueId || s.unique_id || "").toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [assignedStudents, permissionStudentSearch]);

  const handleMarkPermissionAttendance = async () => {
    if (selectedStudentIds.length === 0) {
      setPermissionErrorMsg("Please select at least one student.");
      return;
    }
    if (selectedScheduleIds.length === 0) {
      setPermissionErrorMsg("Please select at least one class period.");
      return;
    }

    setPermissionSubmitting(true);
    setPermissionErrorMsg("");
    setPermissionSuccessMsg("");

    try {
      const res = await customFetch<any>("/api/admin/mark-permission-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          scheduleIds: selectedScheduleIds,
          date: permissionDate,
          reason: permissionReason
        })
      });

      setPermissionSuccessMsg(res.message || "Attendance marked successfully!");
      queryClient.invalidateQueries({ queryKey: ["incharge-monthly-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["admin-today-class-presence"] });

      setTimeout(() => {
        setPermissionModalOpen(false);
        setSelectedStudentIds([]);
        setSelectedScheduleIds([]);
        setPermissionSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setPermissionErrorMsg(err?.data?.error || err.message || "Failed to mark permission attendance.");
    } finally {
      setPermissionSubmitting(false);
    }
  };

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPermissionModalOpen(true);
              setPermissionErrorMsg("");
              setPermissionSuccessMsg("");
            }}
            style={{ backgroundColor: "#10b981", color: "#ffffff", borderColor: "#10b981" }}
            className="px-3.5 sm:px-4 py-2 rounded-xl font-extrabold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 hover:opacity-95"
            title="Mark attendance for students taking permission / On-Duty"
          >
            <ClipboardCheck className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Permission / OD Attendance</span>
            <span className="sm:hidden">Permission</span>
          </button>

          <button
            onClick={() => navigate("/mentor")}
            style={{ backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb" }}
            className="px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Take Class Attendance</span>
            <span className="sm:hidden">Take Class</span>
          </button>

          <button
            onClick={logout}
            style={{ backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" }}
            className="px-3 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation Switcher Tabs */}
        <div style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }} className="border p-2 rounded-2xl flex flex-wrap gap-2 shadow-xs mb-2">
          <button
            onClick={() => navigate("/incharge-dashboard")}
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Award className="w-3.5 h-3.5" />
            Class Incharge Portal
          </button>
          <button
            onClick={() => navigate("/mentor")}
            style={{ backgroundColor: "#f1f5f9", color: "#334155" }}
            className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-gray-200"
          >
            <Clock className="w-3.5 h-3.5 text-slate-550" />
            Take Class Attendance
          </button>
        </div>

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
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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

      {/* STUNNING STUDENT ANALYTICS PROFILE MODAL - REDESIGNED FULL SCREEN */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 bg-gray-50 text-gray-900 flex flex-col p-6 sm:p-10 md:p-12 overflow-y-auto animate-fadeIn font-sans">
          <div className="max-w-4xl mx-auto w-full space-y-8">
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

              // Daily Register Month Calculation
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

              const monthDaysList: any[] = [];
              const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

              let calcPresentCount = 0;
              let calcAbsentCount = 0;
              let calcHolidayCount = 0;
              let calcWorkingDaysCount = 0;

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
                    calcPresentCount++;
                  } else {
                    status = "*";
                    calcHolidayCount++;
                  }
                } else {
                  calcWorkingDaysCount++;
                  if (isPresent) {
                    status = "P";
                    calcPresentCount++;
                  } else {
                    status = "A";
                    calcAbsentCount++;
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

              const calcWorkingDays = calcWorkingDaysCount > 0 ? calcWorkingDaysCount : 1;
              const studentMonthlyPercent = Math.floor((calcPresentCount / calcWorkingDays) * 100);

              // Dynamic Stay Duration calculation
              const presentDaysWithDuration = (studentMonthlyRecords || []).filter(r => r.durationMinutes && r.durationMinutes > 0);
              const totalDurationMinutes = presentDaysWithDuration.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
              const avgDurationMinutes = presentDaysWithDuration.length > 0 ? Math.round(totalDurationMinutes / presentDaysWithDuration.length) : 0;
              const avgDurationStr = avgDurationMinutes > 0 ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m` : "No checkout logs";

              // Instant Direct CSV download handler
              const handleDirectCSVDownload = () => {
                const csvRows = [];
                csvRows.push([`CAMPUS ATTENDANCE REGISTER — ${studentName} (${studentModalMonth})`]);
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
                  
                  let statusLabel = "Absent";
                  if (d.status === "P") statusLabel = "Present";
                  else if (d.status === "*") statusLabel = `Holiday (${d.holidayReason})`;
                  else if (d.status === "—") statusLabel = "Future Date";

                  csvRows.push([
                    d.dateStr,
                    d.dayOfWeek,
                    statusLabel,
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
                link.setAttribute("download", `${studentName}_Attendance_${studentModalMonth}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              return (
                <>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-2xl font-black text-gray-900 shadow-xl">
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                          {studentName}
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

                  {/* Body Details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                        <p className="text-xs font-bold text-gray-400 uppercase">Roll Number</p>
                        <p className="text-base font-bold text-gray-800 font-mono mt-1">
                          {rollNum}
                        </p>
                      </div>
                      <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                        <p className="text-xs font-bold text-gray-400 uppercase">Section & Year</p>
                        <p className="text-base font-bold text-gray-800 mt-1">
                          Sec {secObj.name} ({secObj.yearLabel})
                        </p>
                      </div>
                      <div className="p-4.5 rounded-2xl bg-white border border-gray-200">
                        <p className="text-xs font-bold text-gray-400 uppercase">Department</p>
                        <p className="text-base font-bold text-blue-700 mt-1">
                          CSE Data Science
                        </p>
                      </div>
                    </div>

                    {/* Interactive Register Grid */}
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
                          onClick={handleDirectCSVDownload}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 shadow-xs"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Download Register (.csv)
                        </button>
                      </div>

                      {/* Stats cards & Pie Chart */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        {/* Pie Chart Card */}
                        <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center space-y-3">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance Breakdown</p>
                          <div className="relative flex items-center justify-center">
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
                          <p className="text-3xl font-black text-gray-900">{calcPresentCount} Days</p>
                          <p className="text-[10px] text-gray-400 font-bold">Attended out of {calcWorkingDays} working days</p>
                        </div>

                        {/* Absent Days Card */}
                        <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                          <p className="text-xs font-bold text-rose-700 uppercase">Absent Days (A)</p>
                          <p className="text-3xl font-black text-gray-900">{calcAbsentCount} Days</p>
                          <p className="text-[10px] text-gray-400 font-bold">Missed classes</p>
                        </div>

                        {/* Average College stay time */}
                        <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                          <p className="text-xs font-bold text-blue-700 uppercase">Avg Daily Campus Stay</p>
                          <p className="text-3xl font-black text-gray-900">{avgDurationStr}</p>
                          <p className="text-[10px] text-gray-400 font-bold">Calculated from gate logs</p>
                        </div>
                      </div>

                      {/* Flag Math Strategy card */}
                      <div className={`p-4.5 rounded-2xl border-y border-r border-l-4 space-y-2 bg-white border-gray-200 shadow-lg ${
                        flag === "RED"
                          ? "border-l-rose-500 text-rose-200"
                          : flag === "YELLOW"
                          ? "border-l-amber-500 text-amber-200"
                          : "border-l-emerald-500 text-emerald-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-black text-sm text-white">
                            <TrendingUp className="w-5 h-5 text-blue-700" />
                            Academic Attendance Advisory & Recovery Strategy
                          </div>
                          <span style={item?.badgeStyle} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                            {flag} Flag
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed text-gray-600">
                          {item?.tip}
                        </p>
                        {flag === "RED" && (
                          <div className="pt-2 flex items-center justify-between text-xs font-extrabold border-t border-rose-950/65 mt-2 text-rose-700">
                            <span>Condonation Cutoff (65%): +{classesFor65} Classes</span>
                            <span>Safe Threshold (75%): +{classesFor75} Classes</span>
                          </div>
                        )}
                      </div>

                      {/* Daily Grid */}
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
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                    : d.status === "*"
                                    ? "bg-purple-100 border-purple-300 text-purple-800"
                                    : d.status === "—"
                                    ? "bg-gray-50/40 border-gray-200/80 text-slate-600 opacity-60"
                                    : "bg-red-50 border-red-200 text-red-700"
                                }`}
                              >
                                <span className="text-[10px] font-mono font-extrabold" style={{ color: "#ffffff" }}>
                                  {d.dayNum} {d.dayOfWeek}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  d.status === "P"
                                    ? "bg-emerald-500 text-white"
                                    : d.status === "*"
                                    ? "bg-amber-400 text-gray-900"
                                    : d.status === "—"
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-red-500 text-white"
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
                        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
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
                                ? "🗓️ FUTURE DATE"
                                : "🔴 ABSENT"}
                            </span>
                          </div>

                          {/* Gateway Logs Sub-section */}
                          <div className="space-y-2">
                            <h6 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
                              Gateway Scan Details
                            </h6>
                            {selectedDayDetail.record ? (
                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                                    <span>Entry Time (In)</span>
                                    {isLateTime(selectedDayDetail.record.entryTime) && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider animate-pulse">LATE</span>
                                    )}
                                  </p>
                                  <p className="text-sm font-bold text-emerald-450 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Exit Time (Out)</p>
                                  <p className="text-sm font-bold text-blue-700 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Duration / Status</p>
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
                              <p className="text-xs text-gray-500 italic font-medium">
                                {selectedDayDetail.status === "*"
                                  ? `College was closed on this day (${selectedDayDetail.holidayReason || "Sunday"}). No attendance recorded.`
                                  : selectedDayDetail.status === "—"
                                  ? "This date is in the future."
                                  : "No QR scan records registered for this date (Absent)."}
                              </p>
                            )}
                          </div>

                          {/* Hourly Class Attendance Sub-section */}
                          {(() => {
                            const hourlyForDay = (studentHourlyRecords || []).filter((h: any) => {
                              const hDate = typeof h.date === "string" ? h.date.slice(0, 10) : "";
                              return hDate === selectedDayDetail.dateStr;
                            });

                            return (
                              <div className="pt-2 border-t border-gray-200 space-y-2">
                                <h6 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
                                  Hourly Class Attendance (Lectures)
                                </h6>
                                {hourlyForDay.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {hourlyForDay.map((h: any) => {
                                      const sched = h.qr_schedules || {};
                                      const isPresent = h.marked_present;
                                      return (
                                        <div key={h.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs">
                                          <div className="space-y-0.5">
                                            <p className="font-extrabold text-gray-800">
                                              {sched.subject || "Elective/Subject"}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold font-mono">
                                              {sched.start_time || "—"} - {sched.end_time || "—"}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                              isPresent
                                                ? "bg-emerald-100 text-emerald-700 border border-emerald-500/30"
                                                : "bg-rose-100 text-rose-700 border border-rose-500/30"
                                            }`}>
                                              {isPresent ? "Present" : "Absent"}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-semibold">
                                              {h.scanned_qr ? "Scanned QR" : h.marked_by_teacher ? "By Teacher" : "System"}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">
                                    {selectedDayDetail.status === "*" 
                                      ? "College closed. No lectures scheduled."
                                      : selectedDayDetail.status === "—"
                                      ? "No lectures scheduled for future date."
                                      : "No hourly class logs found for this day."}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic text-center py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                          💡 Click on any date box above (P, A, *, or —) to view exact Entry & Exit scan timestamps for that day.
                        </p>
                      )}

                      {/* WhatsApp Notice Share footer */}
                      <div className="border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold bg-white mt-4">
                        <div>
                          <p className="font-extrabold text-gray-800">Department of CSE - Data Science (DS)</p>
                          <p className="text-gray-500">Sphoorthy Engineering College • Academic Year 2026-2027</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                          >
                            📱 Send WhatsApp Notice
                          </a>

                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer bg-blue-600 hover:bg-blue-500"
                          >
                            📄 Print Report
                          </button>
                        </div>
                      </div>
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
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── Mark Student Permission / OD Attendance Modal ─── */}
      {permissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            style={{ backgroundColor: "#ffffff" }}
            className="rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-900"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Mark Student Permission / OD Attendance
                  </h3>
                  <p className="text-xs font-bold text-emerald-800">
                    Section {activeAllocation.section} ({activeAllocation.yearLabel}) • Grant class attendance for permitted students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm">
              {/* Status alerts */}
              {permissionErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{permissionErrorMsg}</span>
                </div>
              )}
              {permissionSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{permissionSuccessMsg}</span>
                </div>
              )}

              {/* Step 1: Date Picker */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-600 tracking-wider mb-1">
                    1. Select Date & Day
                  </label>
                  <p className="text-xs text-gray-400">Date on which the student was given permission</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={permissionDate}
                    onChange={(e) => setPermissionDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 uppercase">
                    {targetDayName}
                  </span>
                </div>
              </div>

              {/* Step 2: Student Multi-Select Box (Just like Training Manage Students) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                      2. Select Students ({selectedStudentIds.length} Selected)
                    </label>
                    <p className="text-xs text-gray-400">Choose the students who took permission</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = modalFilteredStudents.map(s => s.id);
                        setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allIds])));
                      }}
                      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                    >
                      Select All Visible ({modalFilteredStudents.length})
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={permissionStudentSearch}
                    onChange={(e) => setPermissionStudentSearch(e.target.value)}
                    placeholder="Search student by name or roll number..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Students Checkbox Container with internal scroll */}
                <div className="border border-gray-200 rounded-2xl max-h-[190px] overflow-y-auto divide-y divide-gray-100 bg-white">
                  {modalFilteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs font-semibold text-gray-400">
                      No students found matching your search.
                    </div>
                  ) : (
                    modalFilteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentIds(prev =>
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/70" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                            />
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-slate-900 truncate">{s.name}</p>
                              <p className="text-[11px] font-mono text-gray-500">{s.uniqueId || s.unique_id || "—"}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">
                            {s.section || activeAllocation.section}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 3: Class Periods Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                      3. Select Class Periods to Mark Present ({selectedScheduleIds.length} Selected)
                    </label>
                    <p className="text-xs text-gray-400">Choose which lectures or lab periods to grant attendance for</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const allSids = daySchedules.map(s => s.id);
                        setSelectedScheduleIds(allSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                    >
                      All Periods ({daySchedules.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const morningSids = daySchedules.filter(s => (s.start_time || "") < "13:00:00").map(s => s.id);
                        setSelectedScheduleIds(morningSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                    >
                      Morning (9 AM - 1 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const afternoonSids = daySchedules.filter(s => (s.start_time || "") >= "13:00:00").map(s => s.id);
                        setSelectedScheduleIds(afternoonSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
                    >
                      Afternoon (1 PM - 4:30 PM)
                    </button>
                    {selectedScheduleIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleIds([])}
                        className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Periods List */}
                {daySchedules.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    ⚠️ No regular classes scheduled in timetable for {targetDayName} for Sec {activeAllocation.section}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto p-1">
                    {daySchedules.map((sched: any, idx: number) => {
                      const isSelected = selectedScheduleIds.includes(sched.id);
                      const startFmt = (sched.start_time || "00:00").slice(0, 5);
                      const endFmt = (sched.end_time || "00:00").slice(0, 5);
                      const facultyName = sched.qr_mentors?.name || "Assigned Faculty";

                      return (
                        <div
                          key={sched.id}
                          onClick={() => {
                            setSelectedScheduleIds(prev =>
                              prev.includes(sched.id) ? prev.filter(id => id !== sched.id) : [...prev, sched.id]
                            );
                          }}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-400 shadow-xs"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900 truncate">{sched.subject || `Period ${idx + 1}`}</span>
                              <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {startFmt} - {endFmt}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-semibold truncate mt-0.5">{facultyName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Reason / Notes */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-1.5">
                  4. Reason / OD Remarks
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "Official Permission / On-Duty",
                    "College Placement / Training",
                    "Tech Fest / College Event",
                    "Medical / Health Emergency",
                    "Parent Request / Personal Work"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPermissionReason(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        permissionReason === preset
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  placeholder="Enter reason or remarks..."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500 font-bold">
                {selectedStudentIds.length > 0 && selectedScheduleIds.length > 0 ? (
                  <span className="text-emerald-700">
                    ⚡ Will mark <strong>{selectedStudentIds.length * selectedScheduleIds.length}</strong> class attendance record(s) as Present
                  </span>
                ) : (
                  <span>Select student(s) and class(es) above to continue</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(false)}
                  disabled={permissionSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkPermissionAttendance}
                  disabled={permissionSubmitting || selectedStudentIds.length === 0 || selectedScheduleIds.length === 0}
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                  className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white border shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600"
                >
                  {permissionSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Granting Attendance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Mark Present ({selectedStudentIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
