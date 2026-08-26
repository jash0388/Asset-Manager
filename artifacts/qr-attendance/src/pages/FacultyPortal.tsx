import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import {
  Home,
  LayoutGrid,
  ArrowRightCircle,
  FileText,
  Award,
  CalendarDays,
  Users,
  FolderGit2,
  Calendar,
  BarChart3,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Bookmark,
  Globe,
  Tv2,
  UserPlus,
  ArrowRight,
  Sparkles,
  Phone,
  MessageSquare,
  History,
  FileSpreadsheet,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Plus,
  Camera,
  Layers,
  GraduationCap,
  ShieldCheck,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  Send,
  Loader2,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  code: string;
  name: string;
  type: "Theory" | "Practical" | "Elective";
  program: string;
  section: string;
  strength: number;
  room: string;
  batch: string;
  addedBy: string;
  coInstructors?: string[];
}

interface StudentAttendanceRecord {
  id: number;
  sNo: number;
  rollNumber: string;
  name: string;
  heldCount: number;
  totalHeld: number;
  status: boolean; // true = Present, false = Absent
  phone?: string;
  fatherPhone?: string;
}

interface MenteeStudent {
  id: number;
  name: string;
  rollNumber: string;
  section: string;
  studentPhone: string;
  fatherPhone: string;
  motherPhone?: string;
  attendancePercent: number;
  backlogs: number;
  mentorNotes?: string;
}

const PERIOD_SLOTS = [
  { id: "p1", label: "09:00 AM – 10:00 AM", start: "09:00", end: "10:00" },
  { id: "p2", label: "10:00 AM – 11:00 AM", start: "10:00", end: "11:00" },
  { id: "p3", label: "11:00 AM – 12:10 PM", start: "11:00", end: "12:10" },
  { id: "p4", label: "12:10 PM – 01:10 PM", start: "12:10", end: "13:10" },
  { id: "p5", label: "12:55 PM – 01:55 PM", start: "12:55", end: "13:55" },
  { id: "p6", label: "01:55 PM – 02:55 PM", start: "13:55", end: "14:55" },
  { id: "p7", label: "02:55 PM – 03:55 PM", start: "14:55", end: "15:55" },
  { id: "p8", label: "07:00 PM – 08:30 PM", start: "19:00", end: "20:30", isEvening: true },
];

export default function FacultyPortal() {
  const { mentor, role, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "home" | "academics" | "delegate" | "assignment" | "mids" | "workload" | "mentoring" | "projects" | "events" | "reports"
  >("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    assignment: false,
    mids: false,
    reports: false,
  });

  // Current Date / Time
  const [currentTime, setCurrentTime] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setCurrentTime(d.toLocaleDateString("en-US", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Faculty Details (Logged in or Default)
  const facultyName = mentor?.name || "Mrs. CH. Naga Rohini";
  const facultyEmail = mentor?.email || "mrschnagarohini@gmail.com";
  const facultyRole = mentor?.role || "Senior Assistant Professor";
  const facultyDept = "B.Tech - CSE (Data Science)";
  const facultyErp = mentor?.key ? `EMP: SECDS${mentor.key}` : "ERP: SECDS101";

  // Sample Courses Assigned
  const [courses] = useState<Course[]>([
    {
      id: "c1",
      code: "22DS301",
      name: "Machine Learning & Neural Nets",
      type: "Theory",
      program: "CSE-DS",
      section: "DS-3B",
      strength: 62,
      room: "LH-302",
      batch: "Regular",
      addedBy: "HOD (Data Science)",
      coInstructors: ["Mr. Miskeen Ali"],
    },
    {
      id: "c2",
      code: "22CY302",
      name: "Malware Analysis and Detection",
      type: "Theory",
      program: "CSE-DS",
      section: "DS-3B",
      strength: 64,
      room: "LH-304",
      batch: "Regular",
      addedBy: "HOD (Data Science)",
      coInstructors: ["Mr. T Shravan Kumar"],
    },
    {
      id: "c3",
      code: "22DT434",
      name: "Big Data Analytics Lab",
      type: "Practical",
      program: "CSE-DS",
      section: "DS-3A",
      strength: 61,
      room: "PG-322",
      batch: "Regular",
      addedBy: "HOD (Data Science)",
      coInstructors: ["1st: Dr. Raghavendra", "2nd: Mrs. CH. Naga Rohini", "3rd: Mr. Amarnath Goud"],
    },
    {
      id: "c4",
      code: "22DS435",
      name: "Cloud Computing & DevOps Lab",
      type: "Practical",
      program: "CSE-DS",
      section: "DS-2B",
      strength: 58,
      room: "PG-320",
      batch: "Regular",
      addedBy: "HOD (Data Science)",
      coInstructors: ["1st: Mrs. CH. Naga Rohini", "2nd: Mr. M Srinivasulu"],
    },
  ]);

  // Attendance Posting Modal State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>("2026-08-27");
  const [attendanceMode, setAttendanceMode] = useState<"regular" | "adjusted">("regular");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Student Attendance Roster List (inside modal)
  const [studentRoster, setStudentRoster] = useState<StudentAttendanceRecord[]>([]);

  // Initialize Sample Students when Course is picked
  const openAttendanceModal = (course: Course) => {
    setSelectedCourseForAttendance(course);
    // Generate sample roster
    const names = [
      "RATHOD RAJU", "BUNGA AASRITHA", "BUSHABOINA ABHINAI", "DASARI AHLIKA",
      "KADARI PRANAY", "GOPAL REDDY", "CHINTA SAI KIRAN", "MOHAMMED SALMAN",
      "VEMULA HARIKA", "SURAPU ANUSHA", "GURRAM RAJESH", "POTHULA DIVYA",
      "KONDURI SNEHA", "BATTULA SHIVANI", "MALLIKARJUN GOUD", "NALLA KAVYA",
      "PENDYALA VARUN", "THOTA SANJAY", "GOUNDLA MANEESH", "YELAMANCHILI TEJA",
      "BOPPANA SWETHA", "MUPPIDI VAMSHI", "ADLA NITHIN", "PABBATHI SAI CHARAN"
    ];

    const records: StudentAttendanceRecord[] = names.map((name, idx) => {
      const num = 6200 + idx + 1;
      const roll = `23N81A${num}`;
      const held = Math.floor(Math.random() * 6) + 19;
      return {
        id: idx + 1,
        sNo: idx + 1,
        rollNumber: roll,
        name: name,
        heldCount: held,
        totalHeld: 24,
        status: true, // Default present
        phone: "9876543210",
        fatherPhone: "9123456780",
      };
    });

    setStudentRoster(records);
    setAttendanceModalOpen(true);
  };

  // Toggle all students present/absent
  const handleMarkAll = (present: boolean) => {
    setStudentRoster((prev) => prev.map((s) => ({ ...s, status: present })));
  };

  // Toggle single student
  const handleToggleStudent = (id: number) => {
    setStudentRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: !s.status } : s))
    );
  };

  // Submit Attendance Handler
  const handleSubmitAttendance = async () => {
    setSubmittingAttendance(true);
    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast({
        title: "Attendance Posted Successfully!",
        description: `Marked ${studentRoster.filter((s) => s.status).length} Present, ${
          studentRoster.filter((s) => !s.status).length
        } Absent for ${selectedCourseForAttendance?.code} (${selectedPeriod.toUpperCase()}).`,
      });
      setAttendanceModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Error submitting attendance",
        description: "Please check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Mentees State
  const [menteesList] = useState<MenteeStudent[]>([
    {
      id: 1,
      name: "ABINAYAA AKILAN",
      rollNumber: "23N81A6753",
      section: "23-CSE-DS-B",
      studentPhone: "7093013526",
      fatherPhone: "9866683526",
      motherPhone: "Not set",
      attendancePercent: 86.4,
      backlogs: 0,
      mentorNotes: "Good academic performance, actively participates in coding clubs.",
    },
    {
      id: 2,
      name: "BUSHABOINA ABHINAI",
      rollNumber: "23N81A6754",
      section: "23-CSE-DS-B",
      studentPhone: "9948211029",
      fatherPhone: "9848123901",
      attendancePercent: 78.2,
      backlogs: 1,
      mentorNotes: "Needs support in Probability & Statistics.",
    },
    {
      id: 3,
      name: "DASARI AHLIKA",
      rollNumber: "23N81A6755",
      section: "23-CSE-DS-B",
      studentPhone: "8309112445",
      fatherPhone: "9440182234",
      attendancePercent: 91.0,
      backlogs: 0,
      mentorNotes: "Top ranker in class mid exams.",
    },
    {
      id: 4,
      name: "KADARI PRANAY",
      rollNumber: "23N81A6756",
      section: "23-CSE-DS-B",
      studentPhone: "9182345671",
      fatherPhone: "9849012345",
      attendancePercent: 64.5,
      backlogs: 2,
      mentorNotes: "Warned about attendance shortage. Father notified.",
    },
  ]);

  // Filtered Students in Attendance Modal
  const filteredModalStudents = useMemo(() => {
    if (!searchStudentQuery.trim()) return studentRoster;
    const q = searchStudentQuery.toLowerCase();
    return studentRoster.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
    );
  }, [studentRoster, searchStudentQuery]);

  const presentCount = useMemo(() => studentRoster.filter((s) => s.status).length, [studentRoster]);
  const absentCount = useMemo(() => studentRoster.filter((s) => !s.status).length, [studentRoster]);

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ─── DARK NAVY SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1528] text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 p-2 flex items-center justify-center shadow-lg border border-blue-500/30">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider text-white uppercase leading-tight">
                Sphoorthy
              </h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Faculty Portal
              </p>
              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-950 text-blue-300 border border-blue-800/60">
                ERP 2026-27
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 text-xs">
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Main Menu
          </div>

          {/* Home */}
          <button
            onClick={() => {
              setActiveTab("home");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* Academics */}
          <button
            onClick={() => {
              setActiveTab("academics");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "academics"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Academics</span>
          </button>

          {/* Delegate Attendance */}
          <button
            onClick={() => {
              setActiveTab("delegate");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "delegate"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>Delegate Attendance</span>
          </button>

          {/* Assignment (Collapsible) */}
          <div>
            <button
              onClick={() => toggleSubmenu("assignment")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>Assignment</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  expandedMenus.assignment ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedMenus.assignment && (
              <div className="pl-8 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("assignment");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Assignment 1
                </button>
                <button
                  onClick={() => {
                    setActiveTab("assignment");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Assignment 2
                </button>
                <button
                  onClick={() => {
                    setActiveTab("assignment");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Presentation
                </button>
              </div>
            )}
          </div>

          {/* Mid Examination (Collapsible) */}
          <div>
            <button
              onClick={() => toggleSubmenu("mids")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4" />
                <span>Mid Examination</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  expandedMenus.mids ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedMenus.mids && (
              <div className="pl-8 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("mids");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Mid 1 Marks Entry
                </button>
                <button
                  onClick={() => {
                    setActiveTab("mids");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Mid 2 Marks Entry
                </button>
                <button
                  onClick={() => {
                    setActiveTab("mids");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Improvements
                </button>
              </div>
            )}
          </div>

          {/* Faculty Workload */}
          <button
            onClick={() => {
              setActiveTab("workload");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "workload"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Tv2 className="w-4 h-4" />
            <span>Faculty Workload</span>
          </button>

          {/* Mentoring */}
          <button
            onClick={() => {
              setActiveTab("mentoring");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "mentoring"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mentoring</span>
          </button>

          {/* Student Projects */}
          <button
            onClick={() => {
              setActiveTab("projects");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "projects"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Student Projects</span>
          </button>

          {/* Event Management */}
          <button
            onClick={() => {
              setActiveTab("events");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "events"
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Event Management</span>
          </button>

          {/* Reports (Collapsible) */}
          <div>
            <button
              onClick={() => toggleSubmenu("reports")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  expandedMenus.reports ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedMenus.reports && (
              <div className="pl-8 pr-2 py-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("reports");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Attendance Summary
                </button>
                <button
                  onClick={() => {
                    setActiveTab("reports");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Publish History
                </button>
                <button
                  onClick={() => {
                    setActiveTab("reports");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-[11px] font-medium cursor-pointer"
                >
                  Attendance Report (A/P)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-blue-500/40">
              {facultyName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{facultyName}</p>
              <p className="text-[10px] text-amber-400 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                {facultyRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm border border-rose-700/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Home className="w-3.5 h-3.5 text-blue-700" />
                <span>/</span>
                <span className="capitalize font-bold text-slate-800">{activeTab}</span>
                <span>/</span>
                <span className="text-slate-400">Faculty Dashboard</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                {facultyName.charAt(0)}
              </div>
              <div className="text-left leading-tight pr-1">
                <p className="text-xs font-bold text-slate-900">{facultyName}</p>
                <p className="text-[10px] text-slate-500">{facultyRole}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View Content Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* ════════════════ TAB 1: HOME (DASHBOARD) ════════════════ */}
          {activeTab === "home" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* HERO PROFILE BANNER */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 shadow-xl border border-blue-700/50">
                {/* Background decorative circles */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
                <div className="absolute right-32 top-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Faculty Avatar with Camera Icon */}
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-black shadow-xl overflow-hidden ring-4 ring-blue-400/20">
                        <span className="bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent">
                          {facultyName.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Faculty Profile Details */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold tracking-widest uppercase text-blue-200 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-400/30">
                        GOOD MORNING
                      </span>
                      <h2 className="text-2xl font-black tracking-tight text-white">{facultyName}</h2>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/10 backdrop-blur-xs border border-white/20 text-blue-100">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
                          {facultyRole}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/10 backdrop-blur-xs border border-white/20 text-blue-100">
                          <BuildingIcon />
                          {facultyDept}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-950/70 border border-blue-400/40 text-amber-300">
                          {facultyErp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-blue-200/80 pt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-300" />
                        <span>{currentTime || "Thursday, 27 August 2026"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Metric Strip */}
                  <div className="hidden lg:flex items-center gap-6 border-l border-white/15 pl-8 py-2">
                    <div className="text-center">
                      <p className="text-3xl font-black text-white font-mono">2</p>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Theory</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-white font-mono">0</p>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">PE</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-white font-mono">0</p>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">OE</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-amber-300 font-mono">24</p>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Mentees</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-emerald-300 font-mono">6</p>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Workload</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 METRICS CARDS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Theory */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Theory</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">2</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Lecture courses</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. PE */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">PE</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">0</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Professional Elective</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. OE */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">OE</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">0</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Open Elective</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. Mentees */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Mentees</span>
                    <p className="text-2xl font-black text-purple-700 mt-0.5">24</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Assigned mentees</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* 5. Workload */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Workload</span>
                    <p className="text-2xl font-black text-amber-600 mt-0.5">6</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">This week's entries</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Tv2 className="w-5 h-5" />
                  </div>
                </div>

                {/* 6. Co-Instructor */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500">Co-Instructor</span>
                    <p className="text-2xl font-black text-teal-700 mt-0.5">4</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Additional faculty</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* MY COURSES AT A GLANCE TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-5 h-5 text-blue-700" />
                    <h3 className="text-sm font-extrabold text-slate-900">My Courses at a Glance</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-900 text-white text-xs font-bold">
                    2 Theory
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-200">
                        <th className="py-3 px-6">COURSE</th>
                        <th className="py-3 px-4">TYPE</th>
                        <th className="py-3 px-4">SECTION</th>
                        <th className="py-3 px-4">STRENGTH</th>
                        <th className="py-3 px-6 text-right">GO TO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {courses
                        .filter((c) => c.type === "Theory")
                        .map((course) => (
                          <tr
                            key={course.id}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                            onClick={() => openAttendanceModal(course)}
                          >
                            <td className="py-3.5 px-6">
                              <span className="font-extrabold text-slate-900 font-mono text-xs group-hover:text-blue-700 transition-colors block">
                                {course.code}
                              </span>
                              <span className="text-slate-500 text-xs">{course.name}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-900 text-white">
                                {course.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                24-CSE-DS-{course.section.slice(-1)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-sm">
                              {course.strength}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAttendanceModal(course);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-700 text-blue-700 hover:text-white font-bold text-xs transition-all shadow-2xs cursor-pointer"
                              >
                                <span>Attendance</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MENTOR OVERVIEW & QUICK LINKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mentor Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Mentor Overview</span>
                      </div>
                      <button
                        onClick={() => setActiveTab("mentoring")}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-purple-100/70 border border-purple-200 flex flex-col items-center justify-center text-purple-900">
                        <span className="text-2xl font-black font-mono leading-none">24</span>
                        <span className="text-[9px] font-bold uppercase mt-0.5">Total</span>
                      </div>
                      <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs font-extrabold text-slate-800">24 Assigned Mentees</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          B.Tech - CSE (Data Science) - 23-CSE-DS-B
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm mb-4">
                    <ExternalLink className="w-4 h-4 text-blue-700" />
                    <span>Quick Links</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <button
                      onClick={() => setActiveTab("academics")}
                      className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-blue-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LayoutGrid className="w-5 h-5 text-blue-700" />
                      <span>View Courses</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("mids")}
                      className="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-amber-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Award className="w-5 h-5 text-amber-700" />
                      <span>Exam Marks</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("mentoring")}
                      className="p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200 text-purple-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-purple-700" />
                      <span>Mentoring</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("workload")}
                      className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Tv2 className="w-5 h-5 text-emerald-700" />
                      <span>Faculty Workload</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 sm:col-span-1"
                    >
                      <BarChart3 className="w-5 h-5 text-slate-700" />
                      <span>Reports</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 2: ACADEMICS ════════════════ */}
          {activeTab === "academics" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Assigned Course Load <span className="text-slate-400 font-mono">2026-2027</span>
                    </h2>
                    <p className="text-xs text-slate-500">Manage theory, practical, and elective courses</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-700 text-white font-bold text-xs">
                    6 Courses Total
                  </span>
                </div>
              </div>

              {/* Theory Courses Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-blue-50/40">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Theory Courses</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-200">
                        <th className="py-3 px-6">COURSE</th>
                        <th className="py-3 px-4">TYPE</th>
                        <th className="py-3 px-4">PROGRAM</th>
                        <th className="py-3 px-4">SECTION</th>
                        <th className="py-3 px-4">STRENGTH</th>
                        <th className="py-3 px-4">ROOM</th>
                        <th className="py-3 px-4">BATCH</th>
                        <th className="py-3 px-6 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {courses
                        .filter((c) => c.type === "Theory")
                        .map((course) => (
                          <tr key={course.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-3.5 px-6">
                              <p className="font-extrabold text-slate-900 font-mono text-xs">{course.code}</p>
                              <p className="text-slate-500 text-xs">{course.name}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {course.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">{course.program}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200">
                                {course.section}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{course.strength}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{course.room}</td>
                            <td className="py-3.5 px-4 text-slate-600">{course.batch}</td>
                            <td className="py-3.5 px-6 text-right">
                              <button
                                onClick={() => openAttendanceModal(course)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Attendance</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Practical Courses Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-rose-50/30">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Layers className="w-4 h-4 text-rose-700" />
                    <span>Practical Courses</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-200">
                        <th className="py-3 px-6">COURSE</th>
                        <th className="py-3 px-4">TYPE</th>
                        <th className="py-3 px-4">SECTION</th>
                        <th className="py-3 px-4">STRENGTH</th>
                        <th className="py-3 px-4">ROOM</th>
                        <th className="py-3 px-6">CO-INSTRUCTORS</th>
                        <th className="py-3 px-6 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {courses
                        .filter((c) => c.type === "Practical")
                        .map((course) => (
                          <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-6">
                              <p className="font-extrabold text-slate-900 font-mono text-xs">{course.code}</p>
                              <p className="text-slate-500 text-xs">{course.name}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                {course.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200">
                                {course.section}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{course.strength}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{course.room}</td>
                            <td className="py-3.5 px-6">
                              <div className="flex flex-wrap gap-1">
                                {course.coInstructors?.map((inst, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200"
                                  >
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <button
                                onClick={() => openAttendanceModal(course)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Attendance</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 3: MENTORING ════════════════ */}
          {activeTab === "mentoring" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Mentor Information Header Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {facultyName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">Mentor Information</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        Name: <strong className="font-bold">{facultyName}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        Designation: <strong className="font-bold">{facultyRole}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        Contact: <strong className="font-bold font-mono">9550224068</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                        Mentees: <strong className="font-bold font-mono">24</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-all cursor-pointer shadow-xs">
                    + Add / Remove Mentees
                  </button>
                  <button className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mentee Group WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Assigned Students (Total: 24) Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>Your Assigned Students (Total: 24)</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">B.Tech - CSE (Data Science)</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {menteesList.map((mentee) => (
                    <div
                      key={mentee.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Student Info */}
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{mentee.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold text-blue-700">{mentee.rollNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {mentee.section}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mentee.attendancePercent >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {mentee.attendancePercent}% Attendance
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Numbers */}
                      <div className="text-xs space-y-0.5 font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <p>
                          <span className="text-slate-400">Student:</span>{" "}
                          <strong className="font-mono text-slate-900">{mentee.studentPhone}</strong>
                        </p>
                        <p>
                          <span className="text-slate-400">Father:</span>{" "}
                          <strong className="font-mono text-slate-900">{mentee.fatherPhone}</strong>
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={`https://wa.me/91${mentee.studentPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3 h-3" /> Student
                        </a>
                        <a
                          href={`https://wa.me/91${mentee.fatherPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3 h-3" /> Father
                        </a>
                        <button className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-[11px] transition-all cursor-pointer">
                          Attendance History
                        </button>
                        <button className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] transition-all cursor-pointer">
                          Consolidated
                        </button>
                        <button className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-all cursor-pointer">
                          Results
                        </button>
                        <button className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[11px] transition-all cursor-pointer">
                          Backlogs ({mentee.backlogs})
                        </button>
                        <button className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all cursor-pointer">
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 4: FACULTY WORKLOAD ════════════════ */}
          {activeTab === "workload" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Workload Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-black text-2xl flex items-center justify-center font-mono shadow-md">
                    6
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      TOTAL OCCUPIED
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">per Week</h3>
                  </div>
                </div>

                {/* Horizontal Stat Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 font-bold border border-blue-200">
                    3 Theory
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                    3 Practical
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 font-bold border border-purple-200">
                    0 Extra
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 font-bold border border-rose-200">
                    0 Cancel
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-900 font-bold border border-cyan-200">
                    6 Total
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 font-bold border border-indigo-200">
                    17 Allotted
                  </span>
                </div>
              </div>

              {/* Weekly Timetable Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <CalendarDays className="w-4 h-4 text-blue-700" />
                    <span>Weekly Workload Schedule</span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">Semester I (2026-27)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-600 font-bold text-[11px]">
                        <th className="py-3 px-3 border border-slate-200 w-28 bg-slate-100">Day / Time</th>
                        <th className="py-3 px-2 border border-slate-200">09:00 - 10:00</th>
                        <th className="py-3 px-2 border border-slate-200">10:00 - 11:00</th>
                        <th className="py-3 px-2 border border-slate-200">11:00 - 12:10</th>
                        <th className="py-3 px-2 border border-slate-200">12:10 - 01:10</th>
                        <th className="py-3 px-2 border border-slate-200">12:55 - 01:55</th>
                        <th className="py-3 px-2 border border-slate-200">01:55 - 02:55</th>
                        <th className="py-3 px-2 border border-slate-200">02:55 - 03:55</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {/* Monday */}
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50 border border-slate-200">
                          Monday
                        </td>
                        <td
                          colSpan={3}
                          className="p-1.5 border border-slate-200 bg-emerald-700 text-white rounded-md font-bold text-[11px]"
                        >
                          <span className="text-[9px] uppercase tracking-widest text-emerald-200 block">PRACTICAL</span>
                          22DT434 - Big Data Analytics Lab (PG-322)
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-1.5 border border-slate-200 bg-blue-800 text-white rounded-md font-bold text-[11px]">
                          <span className="text-[9px] uppercase tracking-widest text-blue-200 block">THEORY</span>
                          22CY302 - Malware Analysis (LH-304)
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                      </tr>

                      {/* Tuesday */}
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50 border border-slate-200">
                          Tuesday
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-1.5 border border-slate-200 bg-blue-800 text-white rounded-md font-bold text-[11px]">
                          <span className="text-[9px] uppercase tracking-widest text-blue-200 block">THEORY</span>
                          22CY302 - Malware Analysis (LH-304)
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-1.5 border border-slate-200 bg-blue-800 text-white rounded-md font-bold text-[11px]">
                          <span className="text-[9px] uppercase tracking-widest text-blue-200 block">THEORY</span>
                          22DS301 - Machine Learning (LH-302)
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                      </tr>

                      {/* Wednesday */}
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50 border border-slate-200">
                          Wednesday
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                      </tr>

                      {/* Thursday */}
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50 border border-slate-200">
                          Thursday
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                      </tr>

                      {/* Friday */}
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50 border border-slate-200">
                          Friday
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-1.5 border border-slate-200 bg-blue-800 text-white rounded-md font-bold text-[11px]">
                          <span className="text-[9px] uppercase tracking-widest text-blue-200 block">THEORY</span>
                          22DS301 - Machine Learning (LH-302)
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                        <td className="p-2 border border-slate-200 text-slate-300 font-light">+</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 5: REPORTS / SUMMARY ════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-blue-700" />
                    <h3 className="text-sm font-extrabold text-slate-900">Attendance Summary & Reports</h3>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700">Course</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                      <option>22CY302 - Malware Analysis (DS-3B)</option>
                      <option>22DS301 - Machine Learning (DS-3B)</option>
                      <option>22DT434 - Big Data Analytics Lab (DS-3A)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Section</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                      <option>DS 3B</option>
                      <option>DS 3A</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">From Date</label>
                    <input
                      type="date"
                      defaultValue="2026-08-01"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">To Date</label>
                    <input
                      type="date"
                      defaultValue="2026-08-27"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other menu tabs (Assignments, Mids, Projects, Events, Delegate) */}
          {(activeTab === "delegate" ||
            activeTab === "assignment" ||
            activeTab === "mids" ||
            activeTab === "projects" ||
            activeTab === "events") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 capitalize">{activeTab} Module</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This academic module is active and synced with the Central ERP server for Semester 2026-27.
              </p>
              <button
                onClick={() => setActiveTab("home")}
                className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ════════════════ POST ATTENDANCE MODAL ════════════════ */}
      {attendanceModalOpen && selectedCourseForAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedCourseForAttendance.code}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedCourseForAttendance.name} | Sem {selectedCourseForAttendance.section}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Date & Period Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Calendar Input */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">CALENDAR:</span>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-mono font-bold text-xs text-slate-800"
                    />

                    <div className="flex items-center gap-3 ml-2 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="attMode"
                          checked={attendanceMode === "regular"}
                          onChange={() => setAttendanceMode("regular")}
                          className="text-blue-600"
                        />
                        <span>Regular</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="attMode"
                          checked={attendanceMode === "adjusted"}
                          onChange={() => setAttendanceMode("adjusted")}
                          className="text-blue-600"
                        />
                        <span>Adjusted</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Period Pills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    PERIODS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PERIOD_SLOTS.map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setSelectedPeriod(period.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                          selectedPeriod === period.id
                            ? "bg-blue-900 text-white border-blue-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Roll List Header & Summary Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Student Roll List</h4>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-xs">
                    Total: {studentRoster.length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                    Present: {presentCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                    Absent: {absentCount}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleMarkAll(true)}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleMarkAll(false)}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll Number or Name..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Student Table Roster */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs text-slate-500 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">S.NO</th>
                        <th className="py-2.5 px-4">ROLL NUMBER</th>
                        <th className="py-2.5 px-4">NAME</th>
                        <th className="py-2.5 px-4 text-center">HELD</th>
                        <th className="py-2.5 px-6 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredModalStudents.map((s, idx) => (
                        <tr
                          key={s.id}
                          onClick={() => handleToggleStudent(s.id)}
                          className={`transition-colors cursor-pointer ${
                            s.status ? "hover:bg-emerald-50/40" : "bg-rose-50/40 hover:bg-rose-50/70"
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            {s.rollNumber}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{s.name}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`font-mono text-[11px] font-bold ${
                              (s.heldCount / s.totalHeld) >= 0.75 ? "text-emerald-700" : "text-rose-700"
                            }`}>
                              {s.heldCount}/{s.totalHeld} ({Math.round((s.heldCount / s.totalHeld) * 100)}%)
                            </span>
                          </td>
                          <td className="py-2.5 px-6 text-right">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStudent(s.id);
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                s.status ? "bg-blue-700" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  s.status ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAttendance}
                onClick={handleSubmitAttendance}
                className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingAttendance ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
