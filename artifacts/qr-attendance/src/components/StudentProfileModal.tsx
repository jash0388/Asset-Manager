import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status: "inside" | "left";
  durationMinutes?: number | null;
  user?: any;
};

export interface StudentProfileModalProps {
  student: {
    id: number;
    name?: string;
    full_name?: string;
    username?: string;
    uniqueId?: string;
    unique_id?: string;
    role?: string;
    section?: string | null;
    batch?: string | null;
    [key: string]: any;
  } | null;
  onClose: () => void;
  initialMonth?: string;
  holidays?: Record<string, string>;
}

// ─── Section Helper ────────────────────────────────────────────────────────
export function getSectionDisplayName(sectionStr: string | null | undefined): { name: string; yearLabel: string } {
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
}

// ─── Time Formatting Helper ────────────────────────────────────────────────
function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  try {
    if (timeStr.includes("T")) {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    }
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    }
  } catch {}
  return timeStr;
}

function isLateTime(timeStr: string | null | undefined): boolean {
  if (!timeStr) return false;
  try {
    let hours = 0;
    let mins = 0;
    if (timeStr.includes("T")) {
      const d = new Date(timeStr);
      const istHours = d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60);
      const istMins = (d.getUTCMinutes() + 30) % 60;
      hours = istHours % 24;
      mins = istMins;
    } else {
      const parts = timeStr.split(":");
      hours = parseInt(parts[0], 10);
      mins = parseInt(parts[1], 10);
    }
    return hours > 9 || (hours === 9 && mins > 35);
  } catch {
    return false;
  }
}

// ─── Custom Month Selector ─────────────────────────────────────────────────
export function CustomMonthSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, month] = value.split("-").map(Number);
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());

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
        className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
      >
        <Calendar className="w-4 h-4 text-blue-600" />
        <span>{monthNames[(month || 1) - 1]} {year}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 p-4 shadow-xl z-30 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 font-mono">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {monthNames.map((name, idx) => {
                const isSelected = currentYear === year && idx + 1 === month;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2 px-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs font-black"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {name}
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

// ─── Main Student Profile Modal Component ──────────────────────────────────
export default function StudentProfileModal({
  student,
  onClose,
  initialMonth,
  holidays: propHolidays,
}: StudentProfileModalProps) {
  if (!student) return null;

  // Month state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);

  // Native Browser Back Button and Escape Key Integration
  useEffect(() => {
    // Push a distinct history state entry so pressing the browser Back button cleanly closes this modal
    window.history.pushState({ modal: "student-profile", studentId: student.id }, "", window.location.href);

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseWithHistory();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    // Lock background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [student.id]);

  const handleCloseWithHistory = () => {
    if (window.history.state?.modal === "student-profile") {
      window.history.back();
    } else {
      onClose();
    }
  };

  // Fetch monthly records for this student
  const { data: attendanceData, isLoading } = useQuery<{ records: AttendanceRecord[]; hourlyRecords: any[] }>({
    queryKey: ["student-profile-monthly", student.id, student.uniqueId, selectedMonth],
    queryFn: () => customFetch(`/api/attendance/user/${student.id}?month=${selectedMonth}`),
    enabled: Boolean(student.id),
  });

  const studentMonthlyRecords = attendanceData?.records || [];
  const studentHourlyRecords = attendanceData?.hourlyRecords || [];

  // Holidays
  const holidays = useMemo(() => {
    if (propHolidays) return propHolidays;
    try {
      const saved = localStorage.getItem("qr_hod_holidays");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      "2026-08-15": "Independence Day",
      "2026-01-26": "Republic Day",
      "2026-10-02": "Gandhi Jayanti",
      "2026-12-25": "Christmas",
    };
  }, [propHolidays]);

  // Student info resolution
  const studentName = student.name || student.full_name || student.username || student.uniqueId || "Student";
  const rollNumber = student.uniqueId || student.unique_id || "N/A";
  const sectionInfo = getSectionDisplayName(student.section);

  // Calculations
  const [sYearStr, sMonthStr] = selectedMonth.split("-");
  const sYearNum = parseInt(sYearStr, 10);
  const sMonthNum = parseInt(sMonthStr, 10);
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

  let presentCount = 0;
  let absentCount = 0;
  let holidayCount = 0;
  let workingDaysCount = 0;

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
        presentCount++;
      } else {
        status = "*";
        holidayCount++;
      }
    } else {
      workingDaysCount++;
      if (isPresent) {
        status = "P";
        presentCount++;
      } else {
        status = "A";
        absentCount++;
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
      record,
    });
  }

  const calcWorkingDays = workingDaysCount > 0 ? workingDaysCount : 1;
  const monthlyPercent = Math.floor((presentCount / calcWorkingDays) * 100);

  // Campus Stay Duration calculation
  const presentDaysWithDuration = (studentMonthlyRecords || []).filter((r) => r.durationMinutes && r.durationMinutes > 0);
  const totalDurationMinutes = presentDaysWithDuration.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
  const avgDurationMinutes = presentDaysWithDuration.length > 0 ? Math.round(totalDurationMinutes / presentDaysWithDuration.length) : 0;
  const avgDurationStr = avgDurationMinutes > 0 ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m` : "No checkout logs";

  // Hourly records for selected day
  const hourlyForSelectedDay = (studentHourlyRecords || []).filter((hr: any) => {
    if (!hr.date || !selectedDayDetail) return false;
    return hr.date.slice(0, 10) === selectedDayDetail.dateStr;
  });

  // Direct CSV Download
  const handleDownloadCSV = () => {
    const csvRows = [];
    csvRows.push([`CAMPUS ATTENDANCE REGISTER — ${studentName} (${selectedMonth})`]);
    csvRows.push([`Roll Number: ${rollNumber}`, `Section: ${sectionInfo.name}`, `Department: CSE Data Science`]);
    csvRows.push([]);
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
      else if (d.status === "*") statusLabel = `Holiday (${d.holidayReason || "Sunday"})`;
      else if (d.status === "—") statusLabel = "Future Date";

      csvRows.push([
        d.dateStr,
        d.dayOfWeek,
        statusLabel,
        entryTimeStr,
        exitTimeStr,
        durationStr,
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_Attendance_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-profile-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto min-h-screen font-sans"
    >
      <div className="w-full max-w-7xl mx-auto min-h-full px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 flex flex-col justify-start">
        {/* Main Full-Screen Dashboard Card */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-6 sm:space-y-8 p-5 sm:p-8 md:p-10 animate-in fade-in duration-150">
          
          {/* ════════ TOP HEADER ════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 border border-blue-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 id="student-profile-title" className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {studentName}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    STUDENT PROFILE
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  Department of CSE Data Science
                </p>
              </div>
            </div>

            {/* Top Close Button (Primary) */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleCloseWithHistory}
                aria-label="Close Profile"
                className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer font-bold text-xs sm:text-sm shadow-xs active:scale-95"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-rose-600" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* ════════ STUDENT INFORMATION CARDS ════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Roll Number</p>
              <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                {rollNumber}
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section & Year</p>
              <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                Sec {sectionInfo.name} ({sectionInfo.yearLabel})
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</p>
              <p className="text-base sm:text-lg font-black text-blue-700 mt-1">
                CSE Data Science
              </p>
            </div>
          </div>

          {/* ════════ ATTENDANCE SUMMARY (4-CARD DASHBOARD ROW) ════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Attendance Breakdown & Gauge */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance %</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{monthlyPercent}%</span>
                  <span className="text-[10px] font-bold text-slate-500">Monthly</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                    monthlyPercent >= 75
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : monthlyPercent >= 65
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}>
                    {monthlyPercent >= 75 ? "≥75% Compliant" : monthlyPercent >= 65 ? "65%–74% Warning" : "<65% Shortage"}
                  </span>
                </div>
              </div>

              {/* Mini Circular Gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="74" height="74" viewBox="0 0 36 36" className="transform -rotate-90">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      monthlyPercent >= 75 ? "text-emerald-500" : monthlyPercent >= 65 ? "text-amber-500" : "text-rose-500"
                    }
                    strokeDasharray={`${monthlyPercent}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-[11px] font-black text-slate-800">
                  {monthlyPercent}%
                </div>
              </div>
            </div>

            {/* Card 2: Present Days */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Present Days (P)</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{presentCount} Days</p>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-2">
                Attended out of {calcWorkingDays} working days
              </p>
            </div>

            {/* Card 3: Absent Days */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Absent Days (A)</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{absentCount} Days</p>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-2">
                Missed classes / sessions
              </p>
            </div>

            {/* Card 4: Avg Daily Campus Stay */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Avg Daily Campus Stay</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{avgDurationStr}</p>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-2">
                Calculated from gate logs
              </p>
            </div>
          </div>

          {/* ════════ MONTH / ACTIONS TOOLBAR ════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Month:
              </label>
              <CustomMonthSelector
                value={selectedMonth}
                onChange={(val) => {
                  setSelectedMonth(val);
                  setSelectedDayDetail(null);
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-[0.98] self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Register (.csv)</span>
            </button>
          </div>

          {/* ════════ DAILY ATTENDANCE REGISTER ════════ */}
          <div className="space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                  Daily Attendance Register
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Click any date box to view exact Entry &amp; Exit scan timestamps for that day
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Present (P)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Absent (A)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Holiday (*)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Future (—)
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-bold">Loading monthly attendance register...</span>
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[560px] sm:min-w-0 grid grid-cols-7 gap-2 sm:gap-2.5">
                  {monthDaysList.map((d) => {
                    const isSelected = selectedDayDetail?.dateStr === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDayDetail(isSelected ? null : d)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] sm:min-h-[72px] ${
                          isSelected
                            ? "ring-2 ring-blue-600 bg-blue-50/70 border-blue-400 shadow-md scale-[1.02] z-10"
                            : "hover:border-slate-400 hover:shadow-2xs"
                        } ${
                          d.status === "P"
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : d.status === "*"
                            ? "bg-amber-50/80 border-amber-200 text-amber-950"
                            : d.status === "—"
                            ? "bg-slate-50 border-slate-200 text-slate-400"
                            : "bg-rose-50/80 border-rose-200 text-rose-950"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs sm:text-sm font-bold text-slate-800">
                            {d.dayNum} <span className="text-[10px] font-semibold text-slate-500">{d.dayOfWeek}</span>
                          </span>
                          {d.record?.entryTime && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Gate scan logged" />
                          )}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-center w-full ${
                            d.status === "P"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : d.status === "*"
                              ? "bg-amber-500 text-slate-950 shadow-2xs"
                              : d.status === "—"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-rose-600 text-white shadow-2xs"
                          }`}>
                            {d.status === "P" ? "PRESENT" : d.status === "*" ? "HOLIDAY" : d.status === "—" ? "FUTURE" : "ABSENT"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ════════ ENTRY / EXIT DETAILS PANEL ════════ */}
          {selectedDayDetail ? (
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-slate-900 space-y-4 animate-in fade-in duration-100 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Inspection Log: <span className="font-mono text-blue-900">{selectedDayDetail.dateStr}</span> ({selectedDayDetail.dayOfWeek})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    selectedDayDetail.status === "P"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : selectedDayDetail.status === "*"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : selectedDayDetail.status === "—"
                      ? "bg-slate-200 text-slate-800 border-slate-300"
                      : "bg-rose-100 text-rose-900 border-rose-300"
                  }`}>
                    {selectedDayDetail.status === "P"
                      ? "🟢 PRESENT"
                      : selectedDayDetail.status === "*"
                      ? `🟨 HOLIDAY (${selectedDayDetail.holidayReason || "Sunday"})`
                      : selectedDayDetail.status === "—"
                      ? "🗓️ FUTURE DATE"
                      : "🔴 ABSENT"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDayDetail(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-blue-100/50 cursor-pointer"
                  >
                    Close Log
                  </button>
                </div>
              </div>

              {selectedDayDetail.record ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Gate Entry Time (In)</span>
                      {isLateTime(selectedDayDetail.record.entryTime) && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black tracking-wider">LATE</span>
                      )}
                    </p>
                    <p className="text-base font-bold text-emerald-700 mt-1">
                      {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gate Exit Time (Out)</p>
                    <p className="text-base font-bold text-blue-700 mt-1">
                      {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campus Stay Duration</p>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {selectedDayDetail.record.durationMinutes
                        ? `${Math.floor(selectedDayDetail.record.durationMinutes / 60)}h ${selectedDayDetail.record.durationMinutes % 60}m`
                        : selectedDayDetail.record.status === "inside"
                        ? "Still on Campus"
                        : "Completed"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-600 italic">
                  {selectedDayDetail.status === "*"
                    ? `College was closed on this day (${selectedDayDetail.holidayReason || "Sunday"}). No attendance recorded.`
                    : selectedDayDetail.status === "—"
                    ? "This date is in the future. Attendance will be recorded when the student scans on this date."
                    : "No QR scan logs found for this date (Absent)."}
                </div>
              )}

              {/* Hourly Period Breakdown */}
              <div className="space-y-2 pt-2 border-t border-blue-200/80">
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  Hourly Period Attendance
                </h4>
                {hourlyForSelectedDay.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {hourlyForSelectedDay.map((hr: any) => (
                      <div key={hr.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">
                            {hr.qr_schedules?.subject || "Subject"}
                          </p>
                          <p className="text-[10.5px] text-slate-500 font-mono">
                            Period: {hr.qr_schedules?.start_time?.slice(0, 5)} - {hr.qr_schedules?.end_time?.slice(0, 5)}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          hr.marked_present
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}>
                          {hr.marked_present ? "PRESENT" : "ABSENT"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No individual period records logged for this date.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center font-medium">
              💡 Click on any date card above (Present, Absent, Holiday, or Future) to inspect exact gate entry/exit logs and hourly class attendance.
            </div>
          )}

          {/* ════════ BOTTOM ACTIONS ════════ */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-slate-500 font-medium">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700">ESC</kbd> or click Close to return to dashboard
            </p>
            <button
              type="button"
              onClick={handleCloseWithHistory}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer border border-slate-200 active:scale-95 shadow-xs"
            >
              Close Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
