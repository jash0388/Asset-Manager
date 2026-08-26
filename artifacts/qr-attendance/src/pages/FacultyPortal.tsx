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
  FileCheck,
  UserCheck,
  Building2,
  CheckSquare
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

// Comprehensive Real Faculty Dataset (Key 101 to 122 & Incharge Keys)
const FACULTY_DIRECTORY: Record<string, {
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  key: string;
  erp: string;
  section: string;
  phone: string;
  courses: Course[];
  mentees: MenteeStudent[];
  workload: { day: string; periods: { slot: string; subject: string; section: string; room: string }[] }[];
}> = {
  "101": {
    name: "Mrs. CH. Naga Rohini",
    email: "mrschnagarohini@gmail.com",
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "101",
    erp: "EMP-SECDS101",
    section: "DS-3B",
    phone: "+91 98490 12345",
    courses: [
      { id: "c101_1", code: "22DS301", name: "Computer Organization & Architecture (COA)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall 402", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr. Miskeen Ali"] },
      { id: "c101_2", code: "22DS302", name: "COA & Simulation Lab", type: "Practical", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Lab-205", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs. CH. Naga Rohini", "2nd: Mr. M Srinivasulu"] },
      { id: "c101_3", code: "22DS401", name: "Machine Learning & Neural Nets", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 52, room: "Hall 302", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr. Miskeen Ali"] },
    ],
    mentees: [
      { id: 1, name: "RATHOD RAJU", rollNumber: "24N81A6753", section: "DS-3B", studentPhone: "9876543201", fatherPhone: "9123456701", attendancePercent: 88, backlogs: 0, mentorNotes: "Good academic performance, actively participates in coding clubs." },
      { id: 2, name: "BUNGA AASRITHA", rollNumber: "24N81A6754", section: "DS-3B", studentPhone: "9876543202", fatherPhone: "9123456702", attendancePercent: 72, backlogs: 1, mentorNotes: "Needs support in Probability & Statistics." },
      { id: 3, name: "BUSHABOINA ABHINAI", rollNumber: "24N81A6755", section: "DS-3B", studentPhone: "9876543203", fatherPhone: "9123456703", attendancePercent: 94, backlogs: 0, mentorNotes: "Top ranker in class mid exams." },
      { id: 4, name: "DASARI AHLIKA", rollNumber: "24N81A6756", section: "DS-3B", studentPhone: "9876543204", fatherPhone: "9123456704", attendancePercent: 64, backlogs: 2, mentorNotes: "Warned about attendance shortage. Father notified." },
      { id: 5, name: "KADARI PRANAY", rollNumber: "24N81A6757", section: "DS-3B", studentPhone: "9876543205", fatherPhone: "9123456705", attendancePercent: 82, backlogs: 0, mentorNotes: "Consistent attendance and active in lab sessions." },
      { id: 6, name: "GOPAL REDDY", rollNumber: "24N81A6758", section: "DS-3B", studentPhone: "9876543206", fatherPhone: "9123456706", attendancePercent: 89, backlogs: 0, mentorNotes: "Good progress in Mini-project." },
      { id: 7, name: "CHINTA SAI KIRAN", rollNumber: "24N81A6759", section: "DS-3B", studentPhone: "9876543207", fatherPhone: "9123456707", attendancePercent: 78, backlogs: 0, mentorNotes: "Regular for classes." },
      { id: 8, name: "MOHAMMED SALMAN", rollNumber: "24N81A6760", section: "DS-3B", studentPhone: "9876543208", fatherPhone: "9123456708", attendancePercent: 91, backlogs: 0, mentorNotes: "Excellent lab performance." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "COA (2A)", section: "DS-2A", room: "Hall 402" }, { slot: "11:00 – 12:10", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "COA (2A)", section: "DS-2A", room: "Hall 402" }, { slot: "01:55 – 03:55", subject: "COA Lab (2A)", section: "DS-2A", room: "Lab-205" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }, { slot: "12:10 – 01:10", subject: "COA (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Thursday", periods: [{ slot: "10:00 – 11:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }, { slot: "01:55 – 02:55", subject: "Mentoring Slot", section: "DS-3B", room: "Hall 302" }] },
      { day: "Friday", periods: [{ slot: "11:00 – 12:10", subject: "COA (2A)", section: "DS-2A", room: "Hall 402" }, { slot: "01:55 – 02:55", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Doubt Clearance & Seminars", section: "DS-3B", room: "Hall 302" }] },
    ]
  },
  "102": {
    name: "Mrs. Swetha",
    email: "mrsswetha@gmail.com",
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "102",
    erp: "EMP-SECDS102",
    section: "DS-3C",
    phone: "+91 98490 23456",
    courses: [
      { id: "c102_1", code: "22DS303", name: "Formal Languages & Automata Theory (FLAT)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall 306", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr. M Yadaiah"] },
      { id: "c102_2", code: "22DS304", name: "Compiler Design & Tools", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall 306", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Dr. Sri Hari VLN"] },
    ],
    mentees: [
      { id: 1, name: "VEMULA HARIKA", rollNumber: "24N81A67D3", section: "DS-3C", studentPhone: "9876543211", fatherPhone: "9123456711", attendancePercent: 86, backlogs: 0, mentorNotes: "Good in theoretical concepts." },
      { id: 2, name: "SURAPU ANUSHA", rollNumber: "24N81A67D4", section: "DS-3C", studentPhone: "9876543212", fatherPhone: "9123456712", attendancePercent: 92, backlogs: 0, mentorNotes: "Excellent academic scores." },
      { id: 3, name: "GURRAM RAJESH", rollNumber: "24N81A67D5", section: "DS-3C", studentPhone: "9876543213", fatherPhone: "9123456713", attendancePercent: 70, backlogs: 1, mentorNotes: "Needs attendance counseling." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "FLAT (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Tuesday", periods: [{ slot: "09:00 – 10:00", subject: "FLAT (3C)", section: "DS-3C", room: "Hall 306" }, { slot: "12:10 – 01:10", subject: "Compiler Design", section: "DS-3C", room: "Hall 306" }] },
      { day: "Wednesday", periods: [{ slot: "11:00 – 12:10", subject: "FLAT (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Thursday", periods: [{ slot: "09:00 – 10:00", subject: "Compiler Design", section: "DS-3C", room: "Hall 306" }] },
      { day: "Friday", periods: [{ slot: "10:00 – 11:00", subject: "FLAT (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Saturday", periods: [{ slot: "11:00 – 12:10", subject: "Mentoring & Remedial", section: "DS-3C", room: "Hall 306" }] },
    ]
  },
  "103": {
    name: "Mr Miskeen Ali",
    email: "mrmiskeenali@gmail.com",
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "103",
    erp: "EMP-SECDS103",
    section: "DS-3B",
    phone: "+91 98490 34567",
    courses: [
      { id: "c103_1", code: "22DS305", name: "Machine Learning (ML)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 52, room: "Hall 304", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs. CH. Naga Rohini"] },
      { id: "c103_2", code: "22DS306", name: "Machine Learning Lab", type: "Practical", program: "CSE-DS", section: "DS-3B", strength: 52, room: "Lab-208", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mr Miskeen Ali", "2nd: Mr. T Shravan Kumar"] },
    ],
    mentees: [
      { id: 1, name: "POTHULA DIVYA", rollNumber: "24N81A6780", section: "DS-3B", studentPhone: "9876543221", fatherPhone: "9123456721", attendancePercent: 91, backlogs: 0, mentorNotes: "Very attentive in laboratory." },
      { id: 2, name: "KONDURI SNEHA", rollNumber: "24N81A6781", section: "DS-3B", studentPhone: "9876543222", fatherPhone: "9123456722", attendancePercent: 84, backlogs: 0, mentorNotes: "Good progress in ML projects." },
      { id: 3, name: "BATTULA SHIVANI", rollNumber: "24N81A6782", section: "DS-3B", studentPhone: "9876543223", fatherPhone: "9123456723", attendancePercent: 68, backlogs: 1, mentorNotes: "Needs to improve overall attendance." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "11:00 – 12:10", subject: "ML (3B)", section: "DS-3B", room: "Hall 304" }] },
      { day: "Tuesday", periods: [{ slot: "01:55 – 03:55", subject: "ML Lab (3B)", section: "DS-3B", room: "Lab-208" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 304" }] },
      { day: "Thursday", periods: [{ slot: "10:00 – 11:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 304" }] },
      { day: "Friday", periods: [{ slot: "01:55 – 02:55", subject: "ML (3B)", section: "DS-3B", room: "Hall 304" }] },
      { day: "Saturday", periods: [{ slot: "10:00 – 11:00", subject: "ML Project Review", section: "DS-3B", room: "Lab-208" }] },
    ]
  },
  "104": {
    name: "Mr M Yadaiah",
    email: "mrmyadaiah@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Assistant Professor & Class Incharge (3C)",
    department: "Computer Science & Engineering (Data Science)",
    key: "104",
    erp: "EMP-SECDS104",
    section: "DS-3C",
    phone: "+91 98490 45678",
    courses: [
      { id: "c104_1", code: "22DS307", name: "Data Warehousing & Data Mining (DWDM)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall 306", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs. Swetha"] },
      { id: "c104_2", code: "22DS308", name: "Data Mining Lab", type: "Practical", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Lab-206", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mr M Yadaiah", "2nd: Dr. Md Abdul Azeem"] },
    ],
    mentees: [
      { id: 1, name: "MALLIKARJUN GOUD", rollNumber: "24N81A67A6", section: "DS-3C", studentPhone: "9876543231", fatherPhone: "9123456731", attendancePercent: 89, backlogs: 0, mentorNotes: "Regular and disciplined." },
      { id: 2, name: "NALLA KAVYA", rollNumber: "24N81A67A7", section: "DS-3C", studentPhone: "9876543232", fatherPhone: "9123456732", attendancePercent: 95, backlogs: 0, mentorNotes: "Excellent student." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Tuesday", periods: [{ slot: "11:00 – 12:10", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "Data Mining Lab (3C)", section: "DS-3C", room: "Lab-206" }] },
      { day: "Thursday", periods: [{ slot: "12:10 – 01:10", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Incharge Review Meeting", section: "DS-3C", room: "Hall 306" }] },
    ]
  },
  "105": {
    name: "Mr M Srinivasulu",
    email: "mrmsrinivasulu@gmail.com",
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "105",
    erp: "EMP-SECDS105",
    section: "DS-2B",
    phone: "+91 98490 56789",
    courses: [
      { id: "c105_1", code: "22DS201", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall 402", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs. B Gayathri"] },
      { id: "c105_2", code: "22DS202", name: "Software Engineering Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab-204", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mr M Srinivasulu", "2nd: Mrs. K Ramya"] },
    ],
    mentees: [
      { id: 1, name: "PENDYALA VARUN", rollNumber: "25N81A6784", section: "DS-2B", studentPhone: "9876543241", fatherPhone: "9123456741", attendancePercent: 87, backlogs: 0, mentorNotes: "Active learner." },
      { id: 2, name: "THOTA SANJAY", rollNumber: "25N81A6785", section: "DS-2B", studentPhone: "9876543242", fatherPhone: "9123456742", attendancePercent: 76, backlogs: 0, mentorNotes: "Regular in classes." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "SE (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Tuesday", periods: [{ slot: "11:00 – 12:10", subject: "SE (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "SE Lab (2B)", section: "DS-2B", room: "Lab-204" }] },
      { day: "Thursday", periods: [{ slot: "09:00 – 10:00", subject: "SE (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Friday", periods: [{ slot: "10:00 – 11:00", subject: "SE (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Saturday", periods: [{ slot: "10:00 – 11:00", subject: "SE Mentoring Slot", section: "DS-2B", room: "Hall 408" }] },
    ]
  },
  "108": {
    name: "Mrs G Sushma",
    email: "mrsgsushma@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Assistant Professor & Class Incharge (3A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "108",
    erp: "EMP-SECDS108",
    section: "DS-3A",
    phone: "+91 98490 89012",
    courses: [
      { id: "c108_1", code: "22DS309", name: "Operating Systems (OS)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 52, room: "Hall 301", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Ms. Priyusha"] },
      { id: "c108_2", code: "22DS310", name: "Operating Systems Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 52, room: "Lab-202", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs G Sushma", "2nd: Mr Miskeen Ali"] },
    ],
    mentees: [
      { id: 1, name: "GOUNDLA MANEESH", rollNumber: "24N81A6701", section: "DS-3A", studentPhone: "9876543251", fatherPhone: "9123456751", attendancePercent: 93, backlogs: 0, mentorNotes: "Class representative, excellent discipline." },
      { id: 2, name: "YELAMANCHILI TEJA", rollNumber: "24N81A6702", section: "DS-3A", studentPhone: "9876543252", fatherPhone: "9123456752", attendancePercent: 81, backlogs: 0, mentorNotes: "Good academic standing." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "OS Lab (3A)", section: "DS-3A", room: "Lab-202" }] },
      { day: "Thursday", periods: [{ slot: "11:00 – 12:10", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Incharge Review Meeting", section: "DS-3A", room: "Hall 301" }] },
    ]
  },
  "113": {
    name: "Mrs Ch Vijaya Lakshmi",
    email: "mrschvijayalakshmi@gmail.com",
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "113",
    erp: "EMP-SECDS113",
    section: "DS-2A",
    phone: "+91 98490 33445",
    courses: [
      { id: "c113_1", code: "22DS203", name: "Database Management Systems (DBMS)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall 402", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs. B Gayathri"] },
      { id: "c113_2", code: "22DS204", name: "DBMS & SQL Lab", type: "Practical", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Lab-201", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs Ch Vijaya Lakshmi", "2nd: Dr. A Balaram"] },
    ],
    mentees: [
      { id: 1, name: "BOPPANA SWETHA", rollNumber: "25N81A6728", section: "DS-2A", studentPhone: "9876543261", fatherPhone: "9123456761", attendancePercent: 88, backlogs: 0, mentorNotes: "Regular and active in SQL queries." },
      { id: 2, name: "MUPPIDI VAMSHI", rollNumber: "25N81A6729", section: "DS-2A", studentPhone: "9876543262", fatherPhone: "9123456762", attendancePercent: 79, backlogs: 0, mentorNotes: "Good academic progress." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "11:00 – 12:10", subject: "DBMS (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Tuesday", periods: [{ slot: "09:00 – 10:00", subject: "DBMS (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Wednesday", periods: [{ slot: "10:00 – 11:00", subject: "DBMS (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Thursday", periods: [{ slot: "01:55 – 03:55", subject: "DBMS Lab (2A)", section: "DS-2A", room: "Lab-201" }] },
      { day: "Friday", periods: [{ slot: "12:10 – 01:10", subject: "DBMS (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Saturday", periods: [{ slot: "11:00 – 12:10", subject: "DBMS Practice", section: "DS-2A", room: "Hall 402" }] },
    ]
  },
  "3011": {
    name: "Mrs G Sushma",
    email: "mrsgsushma@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (3A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "3011",
    erp: "EMP-SECDS3011",
    section: "DS-3A",
    phone: "+91 98490 89012",
    courses: [
      { id: "c3011_1", code: "22DS309", name: "Operating Systems (OS)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 52, room: "Hall 301", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Ms. Priyusha"] },
      { id: "c3011_2", code: "22DS310", name: "Operating Systems Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 52, room: "Lab-202", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs G Sushma", "2nd: Mr Miskeen Ali"] },
      { id: "c3011_3", code: "22DS311", name: "Web Programming (WP)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 52, room: "Hall 301", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Dr. Sri Hari VLN"] },
    ],
    mentees: [
      { id: 1, name: "GOUNDLA MANEESH", rollNumber: "24N81A6701", section: "DS-3A", studentPhone: "9876543251", fatherPhone: "9123456751", attendancePercent: 93, backlogs: 0, mentorNotes: "Class representative, excellent discipline." },
      { id: 2, name: "YELAMANCHILI TEJA", rollNumber: "24N81A6702", section: "DS-3A", studentPhone: "9876543252", fatherPhone: "9123456752", attendancePercent: 81, backlogs: 0, mentorNotes: "Good academic standing." },
      { id: 3, name: "BODDU SAI CHARAN", rollNumber: "24N81A6703", section: "DS-3A", studentPhone: "9876543253", fatherPhone: "9123456753", attendancePercent: 88, backlogs: 0, mentorNotes: "Active in hackathons." },
      { id: 4, name: "CHILUKA ABHINAV", rollNumber: "24N81A6704", section: "DS-3A", studentPhone: "9876543254", fatherPhone: "9123456754", attendancePercent: 74, backlogs: 1, mentorNotes: "Advised to attend remedial classes." },
      { id: 5, name: "DODDA HARSHITHA", rollNumber: "24N81A6705", section: "DS-3A", studentPhone: "9876543255", fatherPhone: "9123456755", attendancePercent: 95, backlogs: 0, mentorNotes: "Top mid scores." },
      { id: 6, name: "GADDAM SHIVA", rollNumber: "24N81A6706", section: "DS-3A", studentPhone: "9876543256", fatherPhone: "9123456756", attendancePercent: 86, backlogs: 0, mentorNotes: "Regular and attentive." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }, { slot: "10:00 – 11:00", subject: "WP (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }, { slot: "01:55 – 03:55", subject: "OS Lab (3A)", section: "DS-3A", room: "Lab-202" }] },
      { day: "Wednesday", periods: [{ slot: "11:00 – 12:10", subject: "WP (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Thursday", periods: [{ slot: "11:00 – 12:10", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }, { slot: "01:55 – 02:55", subject: "Mentoring Slot", section: "DS-3A", room: "Hall 301" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "OS (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Incharge Review Meeting", section: "DS-3A", room: "Hall 301" }] },
    ]
  },
  "3012": {
    name: "Mr T Shravan Kumar",
    email: "mrtshravankumar@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (3B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "3012",
    erp: "EMP-SECDS3012",
    section: "DS-3B",
    phone: "+91 98490 67890",
    courses: [
      { id: "c3012_1", code: "22DS305", name: "Machine Learning (ML)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 52, room: "Hall 302", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr Miskeen Ali"] },
      { id: "c3012_2", code: "22DS306", name: "Machine Learning Lab", type: "Practical", program: "CSE-DS", section: "DS-3B", strength: 52, room: "Lab-208", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mr T Shravan Kumar", "2nd: Mrs. CH. Naga Rohini"] },
    ],
    mentees: [
      { id: 1, name: "RATHOD RAJU", rollNumber: "24N81A6753", section: "DS-3B", studentPhone: "9876543201", fatherPhone: "9123456701", attendancePercent: 88, backlogs: 0, mentorNotes: "Active learner." },
      { id: 2, name: "BUNGA AASRITHA", rollNumber: "24N81A6754", section: "DS-3B", studentPhone: "9876543202", fatherPhone: "9123456702", attendancePercent: 72, backlogs: 1, mentorNotes: "Good in lab work." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Tuesday", periods: [{ slot: "01:55 – 03:55", subject: "ML Lab (3B)", section: "DS-3B", room: "Lab-208" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Thursday", periods: [{ slot: "12:10 – 01:10", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Friday", periods: [{ slot: "11:00 – 12:10", subject: "ML (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Saturday", periods: [{ slot: "10:00 – 11:00", subject: "Project Review", section: "DS-3B", room: "Lab-208" }] },
    ]
  },
  "3013": {
    name: "Mr M Yadaiah",
    email: "mrmyadaiah@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (3C)",
    department: "Computer Science & Engineering (Data Science)",
    key: "3013",
    erp: "EMP-SECDS3013",
    section: "DS-3C",
    phone: "+91 98490 45678",
    courses: [
      { id: "c3013_1", code: "22DS307", name: "Data Warehousing & Data Mining (DWDM)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall 306", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs. Swetha"] },
      { id: "c3013_2", code: "22DS308", name: "Data Mining Lab", type: "Practical", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Lab-206", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mr M Yadaiah", "2nd: Dr. Md Abdul Azeem"] },
    ],
    mentees: [
      { id: 1, name: "MALLIKARJUN GOUD", rollNumber: "24N81A67A6", section: "DS-3C", studentPhone: "9876543231", fatherPhone: "9123456731", attendancePercent: 89, backlogs: 0, mentorNotes: "Regular and disciplined." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Tuesday", periods: [{ slot: "11:00 – 12:10", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "Data Mining Lab (3C)", section: "DS-3C", room: "Lab-206" }] },
      { day: "Thursday", periods: [{ slot: "12:10 – 01:10", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "DWDM (3C)", section: "DS-3C", room: "Hall 306" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Incharge Review Meeting", section: "DS-3C", room: "Hall 306" }] },
    ]
  },
  "4011": {
    name: "Mrs A Sravanthi",
    email: "mrsasravanthi@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (4A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "4011",
    erp: "EMP-SECDS4011",
    section: "DS-4A",
    phone: "+91 98490 78901",
    courses: [
      { id: "c4011_1", code: "22DS401", name: "Deep Learning & NLP", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 42, room: "Hall 401", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Dr. Sri Hari VLN"] },
      { id: "c4011_2", code: "22DS402", name: "NLP & AI Capstone Lab", type: "Practical", program: "CSE-DS", section: "DS-4A", strength: 42, room: "Lab-203", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs A Sravanthi"] },
    ],
    mentees: [
      { id: 1, name: "KOTHA SRIKANTH", rollNumber: "23N81A6701", section: "DS-4A", studentPhone: "9876543271", fatherPhone: "9123456771", attendancePercent: 91, backlogs: 0, mentorNotes: "Placed in Campus Placement." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "Deep Learning (4A)", section: "DS-4A", room: "Hall 401" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "AI Capstone Lab (4A)", section: "DS-4A", room: "Lab-203" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "NLP (4A)", section: "DS-4A", room: "Hall 401" }] },
    ]
  },
  "4012": {
    name: "Mrs K Sneha",
    email: "mrsksneha@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (4B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "4012",
    erp: "EMP-SECDS4012",
    section: "DS-4B",
    phone: "+91 98490 89012",
    courses: [
      { id: "c4012_1", code: "22DS403", name: "Big Data Analytics", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 39, room: "Hall 403", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Dr. C. Lakshmi Nath"] },
    ],
    mentees: [
      { id: 1, name: "GUNTI NAVEEN", rollNumber: "23N81A6788", section: "DS-4B", studentPhone: "9876543281", fatherPhone: "9123456781", attendancePercent: 87, backlogs: 0, mentorNotes: "Good in Big Data tools." },
    ],
    workload: [
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "Big Data (4B)", section: "DS-4B", room: "Hall 403" }] },
      { day: "Thursday", periods: [{ slot: "09:00 – 10:00", subject: "Big Data (4B)", section: "DS-4B", room: "Hall 403" }] },
    ]
  },
  "2011": {
    name: "Mrs B Gayathri",
    email: "mrsbgayathri@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (2A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "2011",
    erp: "EMP-SECDS2011",
    section: "DS-2A",
    phone: "+91 98490 11223",
    courses: [
      { id: "c2011_1", code: "22DS201", name: "Data Structures (DS)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall 402", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs Ch Vijaya Lakshmi"] },
      { id: "c2011_2", code: "22DS202", name: "Data Structures Lab", type: "Practical", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Lab-205", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: Mrs B Gayathri"] },
    ],
    mentees: [
      { id: 1, name: "BOLLAM ANANYA", rollNumber: "25N81A6701", section: "DS-2A", studentPhone: "9876543291", fatherPhone: "9123456791", attendancePercent: 94, backlogs: 0, mentorNotes: "Excellent student." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "Data Structures (2A)", section: "DS-2A", room: "Hall 402" }] },
      { day: "Wednesday", periods: [{ slot: "01:55 – 03:55", subject: "DS Lab (2A)", section: "DS-2A", room: "Lab-205" }] },
    ]
  },
  "2012": {
    name: "Mrs K Ramya",
    email: "mrskramya@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (2B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "2012",
    erp: "EMP-SECDS2012",
    section: "DS-2B",
    phone: "+91 98490 22334",
    courses: [
      { id: "c2012_1", code: "22DS205", name: "Java Programming", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall 404", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr M Srinivasulu"] },
    ],
    mentees: [
      { id: 1, name: "KANDULA MANISH", rollNumber: "25N81A6756", section: "DS-2B", studentPhone: "9876543301", fatherPhone: "9123456801", attendancePercent: 85, backlogs: 0, mentorNotes: "Attentive in Java." },
    ],
    workload: [
      { day: "Tuesday", periods: [{ slot: "11:00 – 12:10", subject: "Java (2B)", section: "DS-2B", room: "Hall 404" }] },
      { day: "Thursday", periods: [{ slot: "10:00 – 11:00", subject: "Java (2B)", section: "DS-2B", room: "Hall 404" }] },
    ]
  },
  "2013": {
    name: "Mr K Bikshapathi",
    email: "mrkbikshapathi@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (2C)",
    department: "Computer Science & Engineering (Data Science)",
    key: "2013",
    erp: "EMP-SECDS2013",
    section: "DS-2C",
    phone: "+91 98490 33445",
    courses: [
      { id: "c2013_1", code: "22DS207", name: "Discrete Mathematics", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 48, room: "Hall 406", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mrs K Srinija"] },
    ],
    mentees: [
      { id: 1, name: "PADALA SHIVA", rollNumber: "25N81A67E0", section: "DS-2C", studentPhone: "9876543311", fatherPhone: "9123456811", attendancePercent: 82, backlogs: 0, mentorNotes: "Regular in classes." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "Discrete Maths (2C)", section: "DS-2C", room: "Hall 406" }] },
    ]
  }
};

export const OFFICIAL_FACULTY_LIST = Object.entries(FACULTY_DIRECTORY).map(([key, data], idx) => ({
  id: idx + 1,
  name: data.name,
  email: data.email,
  role: data.role,
  yearLabel: data.section,
  section: data.section,
  rollRange: `Key: ${key} | ${data.department}`,
  count: data.mentees.length || 27
}));

// Generic Fallback builder for any key entered
function getFacultyProfile(key: string, name?: string, email?: string) {
  if (FACULTY_DIRECTORY[key]) {
    return FACULTY_DIRECTORY[key];
  }
  const cleanKey = key || "3011";
  const cleanName = name || `Faculty Member (${cleanKey})`;
  const cleanEmail = email || `faculty.${cleanKey}@sphoorthyengg.ac.in`;

  return {
    name: cleanName,
    email: cleanEmail,
    role: "Assistant Professor",
    designation: "Assistant Professor & Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: cleanKey,
    erp: `EMP-SECDS${cleanKey}`,
    section: `DS-3A`,
    phone: "+91 98490 00000",
    courses: [
      { id: `c_${cleanKey}_1`, code: "22DS301", name: "Operating Systems & Cloud Architecture", type: "Theory" as const, program: "CSE-DS", section: "DS-3A", strength: 52, room: "Hall 301", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Ms. Priyusha"] },
      { id: `c_${cleanKey}_2`, code: "22DS302", name: "Operating Systems & Web Lab", type: "Practical" as const, program: "CSE-DS", section: "DS-3A", strength: 52, room: "Lab-202", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["1st: " + cleanName] },
      { id: `c_${cleanKey}_3`, code: "22DS405", name: "Machine Learning & AI Tools", type: "Theory" as const, program: "CSE-DS", section: "DS-3B", strength: 52, room: "Hall 302", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: ["Mr Miskeen Ali"] },
    ],
    mentees: [
      { id: 1, name: "GOUNDLA MANEESH", rollNumber: "24N81A6701", section: "DS-3A", studentPhone: "9876543251", fatherPhone: "9123456751", attendancePercent: 93, backlogs: 0, mentorNotes: "Class representative." },
      { id: 2, name: "YELAMANCHILI TEJA", rollNumber: "24N81A6702", section: "DS-3A", studentPhone: "9876543252", fatherPhone: "9123456752", attendancePercent: 81, backlogs: 0, mentorNotes: "Good academic standing." },
      { id: 3, name: "RATHOD RAJU", rollNumber: "24N81A6753", section: "DS-3B", studentPhone: "9876543201", fatherPhone: "9123456701", attendancePercent: 88, backlogs: 0, mentorNotes: "Good progress." },
      { id: 4, name: "BUNGA AASRITHA", rollNumber: "24N81A6754", section: "DS-3B", studentPhone: "9876543202", fatherPhone: "9123456702", attendancePercent: 72, backlogs: 1, mentorNotes: "Advised to improve." },
      { id: 5, name: "DASARI AHLIKA", rollNumber: "24N81A6756", section: "DS-3B", studentPhone: "9876543204", fatherPhone: "9123456704", attendancePercent: 64, backlogs: 2, mentorNotes: "Attendance shortage warned." },
    ],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "Theory Class (3A)", section: "DS-3A", room: "Hall 301" }, { slot: "11:00 – 12:10", subject: "Elective Class (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "Theory Class (3A)", section: "DS-3A", room: "Hall 301" }, { slot: "01:55 – 03:55", subject: "Practical Lab (3A)", section: "DS-3A", room: "Lab-202" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "Theory Class (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Thursday", periods: [{ slot: "10:00 – 11:00", subject: "Theory Class (3B)", section: "DS-3B", room: "Hall 302" }] },
      { day: "Friday", periods: [{ slot: "11:00 – 12:10", subject: "Theory Class (3A)", section: "DS-3A", room: "Hall 301" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "Mentoring & Guidance", section: "DS-3A", room: "Hall 301" }] },
    ]
  };
}

export default function FacultyPortal() {
  const { mentor, role, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "home" | "academics" | "delegate" | "assignment" | "mids" | "workload" | "mentoring" | "projects" | "events" | "reports"
  >("home");

  // Submenu toggle states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    academics: true,
    assignment: false,
    mids: false,
    workload: false,
    mentoring: true,
    projects: false,
    events: false,
    reports: false,
  });

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Clock
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

  // Dynamically resolve logged in faculty details
  const facultyProfile = useMemo(() => {
    let key = mentor?.key;
    if (!key) {
      const stored = localStorage.getItem("qr_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          key = parsed.key;
        } catch {}
      }
    }
    return getFacultyProfile(key || "3011", mentor?.name, mentor?.email);
  }, [mentor]);

  const facultyName = facultyProfile.name;
  const facultyEmail = facultyProfile.email;
  const facultyRole = facultyProfile.designation;
  const facultyDept = facultyProfile.department;
  const facultyErp = facultyProfile.erp;
  const courses = facultyProfile.courses;
  const mentees = facultyProfile.mentees;
  const workload = facultyProfile.workload;

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
    const names = [
      "RATHOD RAJU", "BUNGA AASRITHA", "BUSHABOINA ABHINAI", "DASARI AHLIKA",
      "KADARI PRANAY", "GOPAL REDDY", "CHINTA SAI KIRAN", "MOHAMMED SALMAN",
      "VEMULA HARIKA", "SURAPU ANUSHA", "GURRAM RAJESH", "POTHULA DIVYA",
      "KONDURI SNEHA", "BATTULA SHIVANI", "MALLIKARJUN GOUD", "NALLA KAVYA",
      "PENDYALA VARUN", "THOTA SANJAY", "GOUNDLA MANEESH", "YELAMANCHILI TEJA",
      "BOPPANA SWETHA", "MUPPIDI VAMSHI", "ADLA NITHIN", "PABBATHI SAI CHARAN"
    ];

    const records: StudentAttendanceRecord[] = names.map((name, idx) => {
      const num = 6701 + idx;
      const roll = `24N81A${num}`;
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
    setStudentRoster((prev) =>
      prev.map((s) => ({ ...s, status: present }))
    );
  };

  // Toggle single student
  const toggleStudentStatus = (id: number) => {
    setStudentRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: !s.status } : s))
    );
  };

  // Submit attendance to backend
  const handleSubmitAttendance = async () => {
    if (!selectedCourseForAttendance) return;
    setSubmittingAttendance(true);

    try {
      const slot = PERIOD_SLOTS.find((p) => p.id === selectedPeriod);
      const presentCount = studentRoster.filter((s) => s.status).length;
      const totalCount = studentRoster.length;

      // Call API or mock confirmation
      await new Promise((r) => setTimeout(r, 800));

      toast({
        title: "Attendance Posted Successfully!",
        description: `Posted ${selectedCourseForAttendance.code} (${slot?.label}) for ${attendanceDate}. Present: ${presentCount} / ${totalCount}.`,
      });

      setAttendanceModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to Post Attendance",
        description: err?.message || "Please check network connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Filtered students for attendance search
  const filteredRoster = useMemo(() => {
    if (!searchStudentQuery.trim()) return studentRoster;
    const q = searchStudentQuery.toLowerCase();
    return studentRoster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
    );
  }, [studentRoster, searchStudentQuery]);

  const totalStudentsCount = studentRoster.length;
  const presentStudentsCount = studentRoster.filter((s) => s.status).length;
  const absentStudentsCount = totalStudentsCount - presentStudentsCount;

  // Delegate Attendance State
  const [delegatedFaculty, setDelegatedFaculty] = useState("");
  const [delegatedCourse, setDelegatedCourse] = useState("");
  const [delegatedDate, setDelegatedDate] = useState("2026-08-27");
  const [delegationsList, setDelegationsList] = useState<
    { id: string; course: string; section: string; date: string; delegatedTo: string; status: "Active" | "Completed" }[]
  >([
    {
      id: "del_1",
      course: "Computer Organization & Architecture",
      section: "DS-2A",
      date: "2026-08-25",
      delegatedTo: "Mr. Miskeen Ali",
      status: "Completed",
    },
  ]);

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatedFaculty || !delegatedCourse) return;
    setDelegationsList((prev) => [
      {
        id: `del_${Date.now()}`,
        course: delegatedCourse,
        section: "DS-2A",
        date: delegatedDate,
        delegatedTo: delegatedFaculty,
        status: "Active",
      },
      ...prev,
    ]);
    toast({
      title: "Attendance Delegated!",
      description: `Class delegated to ${delegatedFaculty} for ${delegatedDate}.`,
    });
    setDelegatedFaculty("");
    setDelegatedCourse("");
  };

  // Mentee Search Filter
  const [menteeSearch, setMenteeSearch] = useState("");
  const filteredMentees = useMemo(() => {
    if (!menteeSearch.trim()) return mentees;
    const q = menteeSearch.toLowerCase();
    return mentees.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.rollNumber.toLowerCase().includes(q)
    );
  }, [mentees, menteeSearch]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* ─────────────────────────────────────────────────────────────
          TOP APP HEADER BAR (LIGHT & CRISP)
      ───────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span
              onClick={() => setActiveTab("home")}
              className="hover:text-blue-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span>Home</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold capitalize">
              {activeTab === "home" ? "Faculty Dashboard" : activeTab}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Scanner Access */}
          <button
            onClick={() => navigate("/mentor")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>QR Scanner View</span>
          </button>

          {/* Logged in Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
              {facultyName.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black text-slate-900 leading-tight">{facultyName}</p>
              <p className="text-[11px] font-semibold text-slate-600 leading-tight">{facultyRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN APP BODY: SIDEBAR + CONTENT CONTAINER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════
            SIDEBAR (LIGHT EXECUTIVE STYLE)
        ═══════════════════════════════════════════════════════════ */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-20 select-none ${
            sidebarOpen ? "w-64" : "w-20"
          } hidden lg:flex`}
        >
          {/* Top Brand Logo Section */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                  FACULTY ERP
                </h1>
                <p className="text-[10px] font-semibold text-slate-600 tracking-wide uppercase">
                  Academic Portal
                </p>
              </div>
            )}
          </div>

          {/* Navigation Menu Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Home Link */}
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Home</span>}
            </button>

            {/* Academics (Collapsible) */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("academics");
                  toggleSubmenu("academics");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "academics"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4 shrink-0 text-blue-600" />
                  {sidebarOpen && <span>Academics</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openSubmenus.academics ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {sidebarOpen && openSubmenus.academics && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab("academics")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                  >
                    • Assigned Courses
                  </button>
                  <button
                    onClick={() => setActiveTab("academics")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                  >
                    • Attendance Posting
                  </button>
                </div>
              )}
            </div>

            {/* Delegate Attendance */}
            <button
              onClick={() => setActiveTab("delegate")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "delegate"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ArrowRightCircle className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Delegate Attendance</span>}
            </button>

            {/* Assignments */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("assignment");
                  toggleSubmenu("assignment");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "assignment"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0 text-emerald-600" />
                  {sidebarOpen && <span>Assignment</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openSubmenus.assignment ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {sidebarOpen && openSubmenus.assignment && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Assignment Master
                  </button>
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Post Marks
                  </button>
                </div>
              )}
            </div>

            {/* Mid Examination */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("mids");
                  toggleSubmenu("mids");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "mids"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 shrink-0 text-amber-600" />
                  {sidebarOpen && <span>Mid Examination</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openSubmenus.mids ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {sidebarOpen && openSubmenus.mids && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab("mids")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Mid Marks Entry
                  </button>
                </div>
              )}
            </div>

            {/* Faculty Workload */}
            <button
              onClick={() => setActiveTab("workload")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "workload"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0 text-sky-600" />
              {sidebarOpen && <span>Faculty Workload</span>}
            </button>

            {/* Mentoring */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("mentoring");
                  toggleSubmenu("mentoring");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "mentoring"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0 text-indigo-600" />
                  {sidebarOpen && <span>Mentoring</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openSubmenus.mentoring ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {sidebarOpen && openSubmenus.mentoring && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab("mentoring")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Assigned Mentees (24)
                  </button>
                  <button
                    onClick={() => setActiveTab("mentoring")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • WhatsApp Connect
                  </button>
                </div>
              )}
            </div>

            {/* Student Projects */}
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FolderGit2 className="w-4 h-4 shrink-0 text-teal-600" />
              {sidebarOpen && <span>Student Projects</span>}
            </button>

            {/* Event Management */}
            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "events"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-amber-600" />
              {sidebarOpen && <span>Event Management</span>}
            </button>

            {/* Reports */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("reports");
                  toggleSubmenu("reports");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "reports"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 shrink-0 text-blue-600" />
                  {sidebarOpen && <span>Reports</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openSubmenus.reports ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {sidebarOpen && openSubmenus.reports && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Attendance Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    • Attendance Report (A/P)
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {facultyName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-900 truncate">{facultyName}</p>
                    <p className="text-[10px] font-semibold text-slate-600 truncate">{facultyErp}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-2 flex justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ═══════════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* ════════════════ TAB 1: HOME (FACULTY DASHBOARD) ════════════════ */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* 1. HERO PROFILE BANNER (LIGHT/HIGH DEFINITION GRADIENT) */}
              <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 lg:p-8 shadow-xl relative overflow-hidden">
                {/* Decorative subtle background waves */}
                <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center">
                  <GraduationCap className="w-80 h-80 text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Side: Avatar + Info */}
                  <div className="flex items-start md:items-center gap-5">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center font-black text-3xl text-white shadow-inner">
                        {facultyName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-sm" title="Active">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black tracking-widest text-blue-200 uppercase bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                        GOOD MORNING
                      </span>
                      <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        {facultyName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs font-semibold text-blue-100 border border-white/10">
                          {facultyRole}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs font-semibold text-blue-100 border border-white/10">
                          {facultyDept}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30 font-mono">
                          {facultyErp}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-blue-200/80 pt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {currentTime || "Thursday, August 27, 2026"}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Quick Stats Badges */}
                  <div className="grid grid-cols-3 gap-2.5 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-center px-3 py-1">
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Theory</p>
                      <p className="text-2xl font-black text-white">{courses.filter(c => c.type === "Theory").length}</p>
                    </div>
                    <div className="text-center px-3 py-1 border-x border-white/10">
                      <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">Practical</p>
                      <p className="text-2xl font-black text-cyan-300">{courses.filter(c => c.type === "Practical").length}</p>
                    </div>
                    <div className="text-center px-3 py-1">
                      <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Mentees</p>
                      <p className="text-2xl font-black text-emerald-300">{mentees.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TOP SUMMARY METRIC CARDS (LIGHT THEME) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* Theory Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Theory</span>
                    <p className="text-2xl font-black text-blue-700 mt-0.5">{courses.filter(c => c.type === "Theory").length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                {/* PE Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">PE</span>
                    <p className="text-2xl font-black text-cyan-700 mt-0.5">0</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                </div>

                {/* OE Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">OE</span>
                    <p className="text-2xl font-black text-emerald-700 mt-0.5">0</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>

                {/* Mentees Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Mentees</span>
                    <p className="text-2xl font-black text-indigo-700 mt-0.5">{mentees.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Workload Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Workload</span>
                    <p className="text-2xl font-black text-amber-700 mt-0.5">14 Hrs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>

                {/* Co-Instructor Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Co-Inst</span>
                    <p className="text-2xl font-black text-teal-700 mt-0.5">2</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* 3. MY COURSES AT A GLANCE TABLE CARD */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      My Courses at a Glance
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {courses.length} Assigned
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab("academics")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <span>View All Courses & Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Courses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Program</th>
                        <th className="py-3 px-3">Section</th>
                        <th className="py-3 px-3">Strength</th>
                        <th className="py-3 px-3">Room</th>
                        <th className="py-3 px-3">Batch</th>
                        <th className="py-3 px-3">Added By</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-blue-900">{course.name}</span>
                              <span className="text-[11px] font-mono text-slate-600 font-semibold">{course.code}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                course.type === "Theory"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {course.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">{course.program}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                              {course.section}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900">{course.strength}</td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">{course.room}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                              {course.batch}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium">{course.addedBy}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openAttendanceModal(course)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Attendance</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. MENTOR OVERVIEW & QUICK LINKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mentor Overview Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span className="font-extrabold text-slate-900 text-sm">Mentor Overview</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("mentoring")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View All Mentees &rarr;
                    </button>
                  </div>

                  <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <div className="w-16 h-16 rounded-xl bg-indigo-100 border border-indigo-200 flex flex-col items-center justify-center text-indigo-900">
                      <span className="text-2xl font-black">{mentees.length}</span>
                      <span className="text-[10px] font-bold uppercase">Mentees</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-indigo-950">Assigned Section: <span className="font-black text-blue-700">{facultyProfile.section}</span></p>
                      <p className="text-[11px] text-slate-600">Counseling & Guidance Group &bull; Bi-weekly Review System</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Avg Attendance: 84%
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Critical Cases: 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Shortcuts */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <span className="font-extrabold text-slate-900 text-sm block">Quick Links</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setActiveTab("academics")}
                      className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-blue-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-5 h-5 text-blue-700" />
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
                      className="p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-indigo-700" />
                      <span>Mentoring</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("workload")}
                      className="p-3 rounded-xl bg-teal-50/70 hover:bg-teal-100 border border-teal-200 text-teal-900 text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CalendarDays className="w-5 h-5 text-teal-700" />
                      <span>Workload</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 2: ACADEMICS & POST ATTENDANCE ════════════════ */}
          {activeTab === "academics" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Academics & Attendance Posting</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Select any assigned theory or practical course to post hourly attendance.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                    Active Semester: AY 2025–26
                  </span>
                </div>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {course.code}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-1.5 leading-snug">
                            {course.name}
                          </h3>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
                            course.type === "Theory"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {course.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase">Section</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{course.section}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase">Strength</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{course.strength}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase">Room</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{course.room}</p>
                        </div>
                      </div>

                      {course.coInstructors && (
                        <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700">Co-Instructors: </span>
                          {course.coInstructors.join(", ")}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openAttendanceModal(course)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Post Attendance</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 3: DELEGATE ATTENDANCE ════════════════ */}
          {activeTab === "delegate" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Delegate Course Attendance</h2>
                <p className="text-xs text-slate-600 mt-0.5">Delegate your class periods to a substitute faculty member during leave or official duty.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Card */}
                <form onSubmit={handleCreateDelegation} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                    Assign Substitute Faculty
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Select Course</label>
                    <select
                      value={delegatedCourse}
                      onChange={(e) => setDelegatedCourse(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.code} – {c.name} ({c.section})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Substitute Faculty</label>
                    <select
                      value={delegatedFaculty}
                      onChange={(e) => setDelegatedFaculty(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Faculty --</option>
                      <option value="Mr. Miskeen Ali">Mr. Miskeen Ali</option>
                      <option value="Mrs. Swetha">Mrs. Swetha</option>
                      <option value="Mr. M Yadaiah">Mr. M Yadaiah</option>
                      <option value="Mr. M Srinivasulu">Mr. M Srinivasulu</option>
                      <option value="Mr. T Shravan Kumar">Mr. T Shravan Kumar</option>
                      <option value="Mrs. G Sushma">Mrs. G Sushma</option>
                      <option value="Mrs. B Gayathri">Mrs. B Gayathri</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Date of Delegation</label>
                    <input
                      type="date"
                      value={delegatedDate}
                      onChange={(e) => setDelegatedDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Confirm & Delegate Class
                  </button>
                </form>

                {/* Delegation History Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                    Active & Past Delegations
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Course</th>
                          <th className="py-2.5 px-3">Section</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Delegated To</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {delegationsList.map((del) => (
                          <tr key={del.id}>
                            <td className="py-3 px-3 font-bold text-slate-900">{del.course}</td>
                            <td className="py-3 px-3">{del.section}</td>
                            <td className="py-3 px-3 text-slate-600">{del.date}</td>
                            <td className="py-3 px-3 font-semibold text-blue-700">{del.delegatedTo}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  del.status === "Active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {del.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 4: MENTORING ════════════════ */}
          {activeTab === "mentoring" && (
            <div className="space-y-6">
              {/* Mentor Information Header Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {facultyName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Official Faculty Mentor</span>
                    <h3 className="text-lg font-extrabold text-slate-900">{facultyName}</h3>
                    <p className="text-xs text-slate-600 font-medium">{facultyDept} &bull; {facultyProfile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Assigned Mentees</p>
                    <p className="text-lg font-black text-blue-700 leading-tight">{mentees.length}</p>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Section</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">{facultyProfile.section}</p>
                  </div>
                </div>
              </div>

              {/* Mentee List Table with WhatsApp triggers */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-extrabold text-slate-900">Mentee Student Roster</h3>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Roll No or Name..."
                      value={menteeSearch}
                      onChange={(e) => setMenteeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">S.No</th>
                        <th className="py-3 px-3">Roll Number</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3 text-center">Attendance %</th>
                        <th className="py-3 px-3 text-center">Backlogs</th>
                        <th className="py-3 px-4 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMentees.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{m.rollNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{m.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                m.attendancePercent >= 75
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {m.attendancePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                m.backlogs === 0 ? "bg-gray-100 text-gray-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {m.backlogs}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Student WhatsApp */}
                              <a
                                href={`https://wa.me/91${m.studentPhone}?text=Hello%20${encodeURIComponent(m.name)},%20this%20is%20your%20Mentor%20${encodeURIComponent(facultyName)}.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                                title="Chat with Student on WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Student WA</span>
                              </a>

                              {/* Father WhatsApp */}
                              <a
                                href={`https://wa.me/91${m.fatherPhone}?text=Respected%20Parent,%20this%20is%20${encodeURIComponent(facultyName)},%20Mentor%20for%20your%20ward%20${encodeURIComponent(m.name)}%20(${m.rollNumber}).`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                                title="Chat with Father on WhatsApp"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Father WA</span>
                              </a>

                              <button
                                onClick={() => {
                                  toast({
                                    title: `Academic Log for ${m.name}`,
                                    description: m.mentorNotes || "No remarks noted yet.",
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all cursor-pointer"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 5: FACULTY WORKLOAD ════════════════ */}
          {activeTab === "workload" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Faculty Weekly Workload Timetable</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Assigned schedule periods and occupied laboratory hours.</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 font-bold border border-blue-200 text-xs">
                  Weekly Total: 14 Periods
                </span>
              </div>

              {/* Timetable Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workload.map((w, idx) => (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-extrabold text-slate-900 text-sm">{w.day}</span>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {w.periods.length} Classes
                      </span>
                    </div>

                    <div className="space-y-2">
                      {w.periods.map((p, pIdx) => (
                        <div key={pIdx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-500">{p.slot}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                              {p.section}
                            </span>
                          </div>
                          <p className="text-xs font-black text-slate-900">{p.subject}</p>
                          <p className="text-[11px] text-slate-500 font-semibold">{p.room}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 6: MID EXAMINATIONS ════════════════ */}
          {activeTab === "mids" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Mid Examination Marks Entry</h2>
              <p className="text-xs text-slate-600">Mid-1 and Mid-2 internal marks entry module for active courses.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.code} &bull; Section {c.section}</p>
                    </div>
                    <button
                      onClick={() => toast({ title: "Mid Marks Entry", description: `Mid-1 Marks portal opened for ${c.code}.` })}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all"
                    >
                      Enter Marks
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 7: REPORTS ════════════════ */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Academic Reports & Attendance Registers</h2>
              <p className="text-xs text-slate-600">Consolidated attendance reports, subject-wise analysis, and monthly attendance sheets.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h4 className="font-bold text-sm text-blue-950">Consolidated Attendance</h4>
                  <p className="text-xs text-slate-600">Download complete monthly attendance register in Excel / CSV format.</p>
                  <button
                    onClick={() => toast({ title: "Report Download", description: "Consolidated Attendance report generated." })}
                    className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    Generate Report
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                  <h4 className="font-bold text-sm text-emerald-950">Daily Attendance Register</h4>
                  <p className="text-xs text-slate-600">View hourly present/absent logs marked by period.</p>
                  <button
                    onClick={() => toast({ title: "Report Download", description: "Daily Attendance log prepared." })}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          POST ATTENDANCE MODAL (EXACT CVR WORKFLOW & REAL SLOTS)
      ───────────────────────────────────────────────────────────── */}
      {attendanceModalOpen && selectedCourseForAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                  Hourly Attendance Portal
                </span>
                <h3 className="text-lg font-extrabold">
                  {selectedCourseForAttendance.name} ({selectedCourseForAttendance.code})
                </h3>
                <p className="text-xs text-blue-100/90 font-medium">
                  Section: {selectedCourseForAttendance.section} &bull; Room: {selectedCourseForAttendance.room}
                </p>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Header (Date, Periods, Radio, Counters) */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-4">
              {/* Top Filters: Mode & Date */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Regular vs Adjusted */}
                <div className="flex items-center gap-4 text-xs font-bold text-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attendance_mode"
                      checked={attendanceMode === "regular"}
                      onChange={() => setAttendanceMode("regular")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Regular Class</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attendance_mode"
                      checked={attendanceMode === "adjusted"}
                      onChange={() => setAttendanceMode("adjusted")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Adjusted Class</span>
                  </label>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Period Selector Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Select Period / Slot
                </span>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_SLOTS.map((slot) => {
                    const isSelected = selectedPeriod === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedPeriod(slot.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {slot.label} {slot.isEvening && "(Evening)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Counter Badges & Master Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-200/70 text-slate-800 font-bold text-xs">
                    Total: {totalStudentsCount}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                    Present: {presentStudentsCount}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-red-100 text-red-800 font-bold text-xs">
                    Absent: {absentStudentsCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll(true)}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll(false)}
                    className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Student Search Bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Roll No or Student Name..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Student Attendance List Table */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">S.No</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Held Attendance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoster.map((s) => {
                    const heldRatio = `${s.heldCount}/${s.totalHeld}`;
                    const heldPct = Math.round((s.heldCount / s.totalHeld) * 100);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">{s.sNo}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{s.rollNumber}</td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          {heldRatio} ({heldPct}%)
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(s.id)}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              s.status
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-red-500 text-white shadow-xs"
                            }`}
                          >
                            {s.status ? "Present" : "Absent"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submittingAttendance}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {submittingAttendance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting Attendance...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
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
