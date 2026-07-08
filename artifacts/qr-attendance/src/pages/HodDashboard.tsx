import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Clock,
  MapPin,
  ArrowRightLeft,
  GraduationCap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type StudentUser = {
  id: number;
  name: string;
  uniqueId: string;
  role: string;
  section: string | null;
  batch: string | null;
};

type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status: "inside" | "left";
};

type SectionStats = {
  sectionKey: string;     // e.g. "DS II/I/A"
  displayName: string;    // e.g. "2A"
  batch: string;          // e.g. "2025"
  yearLabel: string;      // e.g. "2nd Year"
  totalStudents: StudentUser[];
  presentStudents: { student: StudentUser; record: AttendanceRecord }[];
  absentStudents: StudentUser[];
};

export default function HodDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<{
    title: string;
    description: string;
    studentsList: Array<{
      student: StudentUser;
      record?: AttendanceRecord;
      status: "present" | "absent";
    }>;
  }>({
    title: "",
    description: "",
    studentsList: []
  });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Fetch all students
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<StudentUser[]>({
    queryKey: ["users"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  // Fetch today's attendance records
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-today", selectedDate],
    queryFn: () => customFetch<AttendanceRecord[]>("/api/attendance/today"),
    refetchInterval: 5000, // auto-refresh every 5 seconds!
  });

  const studentsOnly = allUsers.filter(u => u.role === "student");

  // Helper to map section name to code (e.g. "DS II/I/A" -> "2A")
  const getSectionDisplayName = (sectionStr: string | null | undefined): { name: string; yearLabel: string } => {
    if (!sectionStr) return { name: "Other", yearLabel: "Other" };
    
    const parts = sectionStr.split("/");
    const sectionLetter = parts[parts.length - 1] || "A"; // e.g. "A"
    
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
  };

  // Compile section statistics
  const sectionsMap = new Map<string, SectionStats>();

  studentsOnly.forEach(s => {
    const sec = s.section || "Unassigned";
    const batch = s.batch || "Unknown";
    const { name: displayName, yearLabel } = getSectionDisplayName(s.section);
    
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, {
        sectionKey: sec,
        displayName,
        batch,
        yearLabel,
        totalStudents: [],
        presentStudents: [],
        absentStudents: []
      });
    }
    
    sectionsMap.get(sec)!.totalStudents.push(s);
  });

  // Map attendance to sections
  const attendanceByUserId = new Map<number, AttendanceRecord>();
  attendanceRecords.forEach(r => {
    attendanceByUserId.set(r.userId, r);
  });

  sectionsMap.forEach((stats) => {
    stats.totalStudents.forEach(s => {
      const record = attendanceByUserId.get(s.id);
      if (record) {
        stats.presentStudents.push({ student: s, record });
      } else {
        stats.absentStudents.push(s);
      }
    });
  });

  const allSectionsList = Array.from(sectionsMap.values());

  // Sort sections: Year 2 first (A, B, C), Year 3 next, Year 4 last
  const sortOrder = ["DS II/I/A", "DS II/I/B", "DS II/I/C", "DS III/I/A", "DS III/I/B", "DS III/I/C", "DS III/I/D", "DS IV/I/A", "DS IV/I/B", "DS IV/I/C"];
  allSectionsList.sort((a, b) => {
    const indexA = sortOrder.indexOf(a.sectionKey);
    const indexB = sortOrder.indexOf(b.sectionKey);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.sectionKey.localeCompare(b.sectionKey);
  });

  // Group by yearLabel
  const yearGroups = ["2nd Year", "3rd Year", "4th Year"];

  // Total sums
  let overallTotalPresent = 0;
  let overallTotalAbsent = 0;
  let overallTotalStudents = 0;

  allSectionsList.forEach(s => {
    overallTotalPresent += s.presentStudents.length;
    overallTotalAbsent += s.absentStudents.length;
    overallTotalStudents += s.totalStudents.length;
  });

  const overallDeptPercentage = overallTotalStudents > 0 
    ? ((overallTotalPresent / overallTotalStudents) * 100).toFixed(3) 
    : "0.000";

  // Handle cell click to open drill-down
  const handleCellClick = (type: "PR" | "AB" | "Total", sectionStats: SectionStats) => {
    let title = "";
    let description = "";
    let list: Array<{ student: StudentUser; record?: AttendanceRecord; status: "present" | "absent" }> = [];

    const secName = sectionStats.sectionKey.replace(/\//g, " ");

    if (type === "PR") {
      title = `Present Students — Section ${sectionStats.displayName}`;
      description = `Showing ${sectionStats.presentStudents.length} present students in ${secName}`;
      list = sectionStats.presentStudents.map(p => ({
        student: p.student,
        record: p.record,
        status: "present"
      }));
    } else if (type === "AB") {
      title = `Absent Students — Section ${sectionStats.displayName}`;
      description = `Showing ${sectionStats.absentStudents.length} absent students in ${secName}`;
      list = sectionStats.absentStudents.map(s => ({
        student: s,
        status: "absent"
      }));
    } else {
      title = `All Students — Section ${sectionStats.displayName}`;
      description = `Showing total roster of ${sectionStats.totalStudents.length} students in ${secName}`;
      list = sectionStats.totalStudents.map(s => {
        const pRecord = sectionStats.presentStudents.find(p => p.student.id === s.id);
        return {
          student: s,
          record: pRecord?.record,
          status: pRecord ? "present" : "absent"
        };
      });
    }

    setDrawerConfig({ title, description, studentsList: list });
    setStudentSearchQuery("");
    setDrawerOpen(true);
  };

  const filteredDrawerStudents = drawerConfig.studentsList.filter(item => {
    const q = studentSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.student.name.toLowerCase().includes(q) || item.student.uniqueId.toLowerCase().includes(q);
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

  const getPercentageColor = (percent: number) => {
    if (percent < 40) return "text-red-500 font-bold";
    if (percent < 60) return "text-orange-400 font-semibold";
    return "text-green-400 font-semibold";
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              HOD Dashboard
            </h1>
            <p className="text-slate-400 font-medium mt-1">Department of Data Science (DS)</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-md">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">{selectedDate}</span>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{overallTotalStudents}</span>
              <span className="text-xs text-slate-400">enrolled</span>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-green-400">{overallTotalPresent}</span>
              <span className="text-xs text-slate-400">active</span>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Today</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-red-400">{overallTotalAbsent}</span>
              <span className="text-xs text-slate-400">missed</span>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-850 p-5 shadow-xl rounded-2xl flex flex-col justify-between border-l-4 border-l-blue-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department %</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-blue-400">{overallDeptPercentage}%</span>
              <span className="text-xs text-slate-450">attendance</span>
            </div>
          </Card>
        </div>

        {/* Main Grid View */}
        {usersLoading || attendanceLoading ? (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">Loading student rosters & attendance records...</p>
          </div>
        ) : (
          <Card className="bg-slate-900/50 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900 text-slate-350 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">DS (Section)</th>
                    <th className="py-4 px-6 text-center">PR (Present)</th>
                    <th className="py-4 px-6 text-center">AB (Absent)</th>
                    <th className="py-4 px-6 text-center">Total</th>
                    <th className="py-4 px-6 text-center">% of Present</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {yearGroups.map(year => {
                    const sectionsInYear = allSectionsList.filter(s => s.yearLabel === year);
                    if (sectionsInYear.length === 0) return null;

                    // Compute year overall
                    let yearPresent = 0;
                    let yearAbsent = 0;
                    let yearTotal = 0;

                    sectionsInYear.forEach(s => {
                      yearPresent += s.presentStudents.length;
                      yearAbsent += s.absentStudents.length;
                      yearTotal += s.totalStudents.length;
                    });

                    const yearPercentage = yearTotal > 0 
                      ? ((yearPresent / yearTotal) * 100).toFixed(3) 
                      : "0.000";

                    return (
                      <>
                        {sectionsInYear.map(s => {
                          const percent = s.totalStudents.length > 0 
                            ? (s.presentStudents.length / s.totalStudents.length) * 100 
                            : 0;

                          return (
                            <tr key={s.sectionKey} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="py-4 px-6 font-bold text-white text-base">{s.displayName}</td>
                              
                              <td 
                                onClick={() => handleCellClick("PR", s)}
                                className="py-4 px-6 text-center text-green-400 font-semibold cursor-pointer hover:bg-green-500/10 active:scale-[0.98] transition-transform text-lg"
                              >
                                {s.presentStudents.length}
                              </td>
                              
                              <td 
                                onClick={() => handleCellClick("AB", s)}
                                className="py-4 px-6 text-center text-red-400 font-semibold cursor-pointer hover:bg-red-500/10 active:scale-[0.98] transition-transform text-lg"
                              >
                                {s.absentStudents.length}
                              </td>
                              
                              <td 
                                onClick={() => handleCellClick("Total", s)}
                                className="py-4 px-6 text-center text-slate-300 font-medium cursor-pointer hover:bg-slate-700/20 active:scale-[0.98] transition-transform text-lg"
                              >
                                {s.totalStudents.length}
                              </td>
                              
                              <td className="py-4 px-6 text-center font-mono">
                                <span className={getPercentageColor(percent)}>
                                  {percent.toFixed(3)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Overall row for this specific year */}
                        <tr className="bg-blue-950/20 border-y border-slate-800">
                          <td className="py-4 px-6 font-black text-blue-400 text-base italic">Overall ({year})</td>
                          <td className="py-4 px-6 text-center text-green-400 font-bold text-lg">{yearPresent}</td>
                          <td className="py-4 px-6 text-center text-red-400 font-bold text-lg">{yearAbsent}</td>
                          <td className="py-4 px-6 text-center text-slate-200 font-bold text-lg">{yearTotal}</td>
                          <td className="py-4 px-6 text-center font-mono font-black text-blue-400 text-lg">
                            {yearPercentage}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                  
                  {/* Department level summary footer */}
                  <tr className="bg-slate-900 border-t border-slate-850">
                    <td colSpan={4} className="py-6 px-6 font-black text-white text-lg tracking-wider text-right pr-12">
                      Overall Department %
                    </td>
                    <td className="py-6 px-6 text-center font-mono font-black text-blue-400 text-xl border-l border-slate-850">
                      {overallDeptPercentage}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Detailed student listing slide-over sheet */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl bg-slate-900 border-l border-slate-800/80 p-0 flex flex-col h-full text-slate-100">
            <SheetHeader className="p-6 border-b border-slate-800">
              <SheetTitle className="text-2xl font-bold text-white tracking-tight">
                {drawerConfig.title}
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-sm mt-1">
                {drawerConfig.description}
              </SheetDescription>
            </SheetHeader>

            {/* Search filter */}
            <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search student name or roll number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                />
              </div>
            </div>

            {/* Students list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2">
              {filteredDrawerStudents.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No students match your query.
                </div>
              ) : (
                filteredDrawerStudents.map((item, idx) => {
                  const s = item.student;
                  const record = item.record;
                  
                  return (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{s.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{s.uniqueId}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 text-right">
                        {item.status === "present" ? (
                          <>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-950/60 text-green-400 border border-green-900/40">
                              <CheckCircle className="w-3 h-3" />
                              {record?.exitTime ? "Left Campus" : "Still on Campus"}
                            </span>
                            <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> In: {formatTime(record?.entryTime)}</span>
                              {record?.exitTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /> Out: {formatTime(record?.exitTime)}</span>}
                            </div>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-900/40">
                            <XCircle className="w-3 h-3" />
                            Absent
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SheetContent>
        </Sheet>
        
      </div>
    </Layout>
  );
}
