import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StudentProfileModal from "@/components/StudentProfileModal";
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
  BookOpen,
  X
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
    <div className="min-h-screen flex flex-col font-sans bg-slate-100 text-slate-900">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-300/70 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-md bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight truncate" style={{ fontFamily: "var(--app-font-display)" }}>
                {activeAllocation.name}
              </h1>
              <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                Sec {activeAllocation.section}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {activeAllocation.role} ({activeAllocation.yearLabel}) · CSE Data Science
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setPermissionModalOpen(true);
              setPermissionErrorMsg("");
              setPermissionSuccessMsg("");
            }}
            className="px-3.5 sm:px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Mark attendance for students taking permission / On-Duty"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Permission / OD Attendance</span>
            <span className="sm:hidden">Permission</span>
          </button>

          <button
            onClick={() => navigate("/mentor")}
            className="px-3.5 sm:px-4 py-2 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Take Class Attendance</span>
            <span className="sm:hidden">Take Class</span>
          </button>

          <button
            onClick={logout}
            className="px-3 py-2 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-3 sm:p-4 max-w-6xl mx-auto w-full space-y-4">
        {/* Navigation Switcher Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => navigate("/incharge-dashboard")}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            Class Incharge Portal
          </button>
          <button
            onClick={() => navigate("/mentor")}
            className="px-4 py-2 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            Take Class Attendance
          </button>
        </div>

        {/* Allocation Info Banner */}
        <div className="bg-card border border-slate-300/70 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="min-w-0">
            <p className="eyebrow text-slate-500">Assigned Mentoring Roster</p>
            <h2 className="text-base sm:text-lg font-bold text-slate-950 mt-1 tracking-tight" style={{ fontFamily: "var(--app-font-display)" }}>
              Roll Range: <span className="font-mono">{activeAllocation.rollRange}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Mentored Capacity: <span className="font-mono font-semibold text-slate-800">{activeAllocation.count} Students</span>
            </p>
          </div>

          {/* Year & Scope Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* Year Selector Tabs */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedYearFilter("ALL")}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  selectedYearFilter === "ALL"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                All Years
              </button>
              <button
                onClick={() => setSelectedYearFilter("4")}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  selectedYearFilter === "4"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                4th Yr
              </button>
              <button
                onClick={() => setSelectedYearFilter("3")}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  selectedYearFilter === "3"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                3rd Yr
              </button>
              <button
                onClick={() => setSelectedYearFilter("2")}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer text-xs font-semibold ${
                  selectedYearFilter === "2"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                2nd Yr
              </button>
            </div>

            <button
              onClick={() => setViewScope("MENTORED")}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewScope === "MENTORED"
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              My Mentored ({analyticsList.length})
            </button>
            <button
              onClick={() => setViewScope("FULL_SECTION")}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewScope === "FULL_SECTION"
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              Full Sec {activeAllocation.section}
            </button>
          </div>
        </div>

        {/* Risk Flag Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setRiskFlagFilter("RED")}
            className={`bg-card p-3.5 rounded-lg border text-left transition-all cursor-pointer shadow-xs relative overflow-hidden ${
              riskFlagFilter === "RED" ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300/70"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600" aria-hidden />
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <span className="eyebrow text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                RED FLAG (&lt; 65%)
              </span>
              <span className="stamp border-red-300 bg-red-50 text-red-800">
                Critical
              </span>
            </div>
            <p className="text-[26px] leading-none font-bold text-slate-950 font-mono tabular-nums">{redCount}</p>
            <p className="text-[10.5px] text-slate-500 mt-1.5">Students · Shortage risk — condonation / parent notice</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("YELLOW")}
            className={`bg-card p-3.5 rounded-lg border text-left transition-all cursor-pointer shadow-xs relative overflow-hidden ${
              riskFlagFilter === "YELLOW" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-300/70"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500" aria-hidden />
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <span className="eyebrow text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                YELLOW FLAG (65%–74%)
              </span>
              <span className="stamp border-amber-400 bg-amber-100 text-amber-900">
                Warning
              </span>
            </div>
            <p className="text-[26px] leading-none font-bold text-slate-950 font-mono tabular-nums">{yellowCount}</p>
            <p className="text-[10.5px] text-slate-500 mt-1.5">Students · Recoverable — needs consecutive classes for 75%</p>
          </button>

          <button
            onClick={() => setRiskFlagFilter("GREEN")}
            className={`bg-card p-3.5 rounded-lg border text-left transition-all cursor-pointer shadow-xs relative overflow-hidden ${
              riskFlagFilter === "GREEN" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-300/70"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <span className="eyebrow text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                GREEN FLAG (≥ 75%)
              </span>
              <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                Safe
              </span>
            </div>
            <p className="text-[26px] leading-none font-bold text-slate-950 font-mono tabular-nums">{greenCount}</p>
            <p className="text-[10.5px] text-slate-500 mt-1.5">Students · Good standing — attendance target met</p>
          </button>
        </div>

        {/* Toolbar & Student List */}
        <div className="bg-card border border-slate-300/70 rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={riskFlagFilter}
                onChange={(e: any) => setRiskFlagFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="ALL">All Risk Flags</option>
                <option value="RED">Red Flag (&lt; 65%)</option>
                <option value="YELLOW">Yellow Flag (65%–74%)</option>
                <option value="GREEN">Green Flag (≥ 75%)</option>
              </select>
            </div>
          </div>

          {/* Student Cards Inner Scroll */}
          <div className="space-y-3 pt-1 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar contain-paint">
            {filteredAnalyticsList.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-[13px] text-slate-600">No students found matching your search or risk flag filter.</p>
              </div>
            ) : (
              filteredAnalyticsList.map((item) => (
                <div
                  key={item.student.id}
                  onClick={() => setSelectedStudentForDetails(item.student)}
                  className={`bg-white border border-slate-300/70 rounded-lg p-4 transition-all cursor-pointer space-y-3 group shadow-xs hover:border-slate-400 border-l-4 ${
                    item.flag === "RED"
                      ? "border-l-red-600"
                      : item.flag === "YELLOW"
                      ? "border-l-amber-500"
                      : "border-l-emerald-500"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${
                        item.flag === "RED"
                          ? "bg-red-50 border-red-200 text-red-600"
                          : item.flag === "YELLOW"
                          ? "bg-amber-50 border-amber-200 text-amber-600"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}>
                        {item.flag === "RED" ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : item.flag === "YELLOW" ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-bold text-slate-950 tracking-tight group-hover:text-emerald-700 transition-colors truncate" style={{ fontFamily: "var(--app-font-display)" }}>
                          {item.student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 flex-wrap">
                          <span>Roll: <span className="font-semibold text-slate-800">{item.student.uniqueId || item.student.unique_id || "N/A"}</span></span>
                          <span className="text-slate-300">·</span>
                          <span>Year: <span className="font-semibold text-slate-800">{item.secInfo.yearLabel}</span></span>
                          <span className="text-slate-300">·</span>
                          <span>Sec: <span className="font-semibold text-slate-800">{item.secInfo.name}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`stamp ${
                          item.flag === "RED"
                            ? "border-red-300 bg-red-50 text-red-800"
                            : item.flag === "YELLOW"
                            ? "border-amber-400 bg-amber-100 text-amber-900"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800"
                        }`}>
                          {item.label} ({item.percent}%)
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                          {item.presentDays} / {item.totalWorkingDays} Working Days Attended
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recovery Math Banner */}
                  <div className={`p-3 rounded-md border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    item.flag === "RED"
                      ? "bg-red-50 border-red-200 text-red-900"
                      : item.flag === "YELLOW"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{item.tip}</span>
                    </div>

                    {item.classesNeededFor75 > 0 ? (
                      <span className="font-mono font-semibold text-xs px-3 py-1 rounded-md bg-white border border-slate-300 text-slate-900 shrink-0 whitespace-nowrap">
                        Target +{item.classesNeededFor75} Classes Needed
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-xs px-3 py-1 rounded-md bg-emerald-600 text-white shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Target Met
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* STUDENT PROFILE & ATTENDANCE DETAILS MODAL - REDESIGNED FULL SCREEN */}
      {selectedStudentForDetails && (
        <StudentProfileModal
          student={selectedStudentForDetails}
          onClose={() => setSelectedStudentForDetails(null)}
          initialMonth={studentModalMonth}
          holidays={holidays}
        />
      )}

      {/* ─── Mark Student Permission / OD Attendance Modal ─── */}
      {permissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-900"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>
                    Mark Student Permission / OD Attendance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Section {activeAllocation.section} ({activeAllocation.yearLabel}) · Grant class attendance for permitted students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="w-8 h-8 shrink-0 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm">
              {/* Status alerts */}
              {permissionErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{permissionErrorMsg}</span>
                </div>
              )}
              {permissionSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{permissionSuccessMsg}</span>
                </div>
              )}

              {/* Step 1: Date Picker */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="eyebrow block text-slate-600 mb-1">
                    1. Select Date &amp; Day
                  </label>
                  <p className="text-xs text-slate-500">Date on which the student was given permission</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={permissionDate}
                    onChange={(e) => setPermissionDate(e.target.value)}
                    className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                    {targetDayName}
                  </span>
                </div>
              </div>

              {/* Step 2: Student Multi-Select Box (Just like Training Manage Students) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="eyebrow block text-slate-600">
                      2. Select Students ({selectedStudentIds.length} Selected)
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">Choose the students who took permission</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = modalFilteredStudents.map(s => s.id);
                        setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allIds])));
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Select All Visible ({modalFilteredStudents.length})
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-slate-700 hover:border-slate-400 border border-slate-300 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={permissionStudentSearch}
                    onChange={(e) => setPermissionStudentSearch(e.target.value)}
                    placeholder="Search student by name or roll number..."
                    className="w-full pl-9 pr-4 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Students Checkbox Container with internal scroll */}
                <div className="border border-slate-300 rounded-md max-h-[190px] overflow-y-auto divide-y divide-slate-200 bg-white">
                  {modalFilteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs font-medium text-slate-500">
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
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded accent-emerald-600 border-slate-300 pointer-events-none"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-950 truncate">{s.name}</p>
                              <p className="text-[11px] font-mono text-slate-500">{s.uniqueId || s.unique_id || "—"}</p>
                            </div>
                          </div>
                          <span className="stamp border-slate-300 bg-slate-50 text-slate-700 shrink-0">
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
                    <label className="eyebrow block text-slate-600">
                      3. Select Class Periods to Mark Present ({selectedScheduleIds.length} Selected)
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">Choose which lectures or lab periods to grant attendance for</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const allSids = daySchedules.map(s => s.id);
                        setSelectedScheduleIds(allSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                    >
                      All Periods ({daySchedules.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const morningSids = daySchedules.filter(s => (s.start_time || "") < "13:00:00").map(s => s.id);
                        setSelectedScheduleIds(morningSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                    >
                      Morning (9 AM - 1 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const afternoonSids = daySchedules.filter(s => (s.start_time || "") >= "13:00:00").map(s => s.id);
                        setSelectedScheduleIds(afternoonSids);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                    >
                      Afternoon (1 PM - 4:30 PM)
                    </button>
                    {selectedScheduleIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleIds([])}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-slate-700 hover:border-slate-400 border border-slate-300 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Periods List */}
                {daySchedules.length === 0 ? (
                  <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No regular classes scheduled in timetable for {targetDayName} for Sec {activeAllocation.section}.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto p-0.5">
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
                          className={`p-3 rounded-md border flex items-center gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-400"
                              : "bg-white border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-emerald-600 border-slate-300 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-950 truncate">{sched.subject || `Period ${idx + 1}`}</span>
                              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                                {startFmt} - {endFmt}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{facultyName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Reason / Notes */}
              <div>
                <label className="eyebrow block text-slate-600 mb-1.5">
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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                        permissionReason === preset
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
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
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-semibold min-w-0">
                {selectedStudentIds.length > 0 && selectedScheduleIds.length > 0 ? (
                  <span className="text-emerald-800">
                    Will mark <strong className="font-mono">{selectedStudentIds.length * selectedScheduleIds.length}</strong> class attendance record(s) as Present
                  </span>
                ) : (
                  <span>Select student(s) and class(es) above to continue</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(false)}
                  disabled={permissionSubmitting}
                  className="px-4 py-2.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkPermissionAttendance}
                  disabled={permissionSubmitting || selectedStudentIds.length === 0 || selectedScheduleIds.length === 0}
                  className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {permissionSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Granting Attendance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Mark Present ({selectedStudentIds.length})</span>
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
