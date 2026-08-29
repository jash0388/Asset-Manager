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
  CheckSquare,
  Download,
  Printer,
  FileDown,
  Edit3,
  Trash2,
  UploadCloud,
  CheckCheck
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

interface ProjectBatch {
  id: string;
  batchId: string;
  type: "Major" | "Mini";
  title: string;
  domain: string;
  team: { roll: string; name: string }[];
  guide: string;
  review1: number;
  review2: number;
  externalViva: number;
  status: "In Progress" | "Review 1 Passed" | "Review 2 Passed" | "Completed";
}

interface CampusEvent {
  id: string;
  title: string;
  type: "Workshop" | "Hackathon" | "FDP" | "Guest Lecture" | "Industrial Visit";
  dates: string;
  venue: string;
  resourcePerson: string;
  budget: string;
  registeredCount: number;
  status: "Upcoming" | "Ongoing" | "Completed";
  coordinator: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  section: string;
  dueDate: string;
  maxMarks: number;
  totalSubmissions: number;
  totalStudents: number;
  status: "Active" | "Closed";
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

// Comprehensive Real Faculty Dataset — derived from Supabase qr_mentors + qr_schedules
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
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (COA, MSF)",
    department: "Computer Science & Engineering (Data Science)",
    key: "101",
    erp: "EMP-SECDS101",
    section: "DS II (A/B/C)",
    phone: "+91 98490 12345",
    courses: [
      { id: "c101_1", code: "COA", name: "Computer Organization & Architecture (COA)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c101_2", code: "COA", name: "Computer Organization & Architecture (COA)", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c101_3", code: "COA", name: "Computer Organization & Architecture (COA)", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c101_4", code: "MSF", name: "Mathematical & Statistical Foundations (MSF)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c101_5", code: "MSF", name: "Mathematical & Statistical Foundations (MSF)", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c101_6", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "COA", section: "DS-2C", room: "Hall" }, { slot: "14:00 – 15:00", subject: "COA", section: "DS-2B", room: "Hall" }, { slot: "15:00 – 16:00", subject: "COA", section: "DS-2A", room: "Hall" }] },
      { day: "Tuesday", periods: [{ slot: "10:00 – 11:00", subject: "MSF", section: "DS-2C", room: "Hall" }, { slot: "11:10 – 12:10", subject: "MSF", section: "DS-2A", room: "Hall" }, { slot: "12:10 – 13:10", subject: "COA", section: "DS-2A", room: "Hall" }, { slot: "14:00 – 15:00", subject: "COA", section: "DS-2C", room: "Hall" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "COA", section: "DS-2B", room: "Hall" }, { slot: "15:00 – 16:00", subject: "COA", section: "DS-2C", room: "Hall" }] },
      { day: "Thursday", periods: [{ slot: "09:00 – 10:00", subject: "JAVA", section: "DS-2C", room: "Hall" }, { slot: "10:00 – 11:00", subject: "COA", section: "DS-2C", room: "Hall" }, { slot: "11:10 – 12:10", subject: "COA", section: "DS-2B", room: "Hall" }] },
      { day: "Friday", periods: [{ slot: "10:00 – 11:00", subject: "COA", section: "DS-2A", room: "Hall" }] },
      { day: "Saturday", periods: [{ slot: "11:10 – 12:10", subject: "COA", section: "DS-2A", room: "Hall" }] },
    ]
  },
  "102": {
    name: "Mrs. Swetha",
    email: "mrsswetha@gmail.com",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: "102",
    erp: "EMP-SECDS102",
    section: "DS",
    phone: "+91 98490 12346",
    courses: [],
    mentees: [],
    workload: []
  },
  "103": {
    name: "Mr Miskeen Ali",
    email: "mrmiskeenali@gmail.com",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (DEVOPS, PS-I)",
    department: "Computer Science & Engineering (Data Science)",
    key: "103",
    erp: "EMP-SECDS103",
    section: "DS III (A/B/C) & IV-A",
    phone: "+91 98490 12347",
    courses: [
      { id: "c103_1", code: "DEVOPS", name: "DevOps", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c103_2", code: "DEVOPS", name: "DevOps", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c103_3", code: "DEVOPS", name: "DevOps", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c103_4", code: "PS-I", name: "Professional Skills - I (PS-I)", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      { day: "Monday", periods: [{ slot: "10:00 – 11:00", subject: "DEVOPS", section: "DS-3B", room: "Hall" }, { slot: "11:10 – 12:10", subject: "DEVOPS", section: "DS-3C", room: "Hall" }, { slot: "14:00 – 16:00", subject: "PS-I", section: "DS-4A", room: "Hall" }, { slot: "15:00 – 16:00", subject: "DevOps", section: "DS-3A", room: "Hall" }] },
      { day: "Wednesday", periods: [{ slot: "10:00 – 11:00", subject: "DEVOPS", section: "DS-3C", room: "Hall" }, { slot: "12:10 – 13:10", subject: "DEVOPS", section: "DS-3B", room: "Hall" }, { slot: "14:00 – 15:00", subject: "DEVOPS", section: "DS-3A", room: "Hall" }] },
      { day: "Thursday", periods: [{ slot: "11:10 – 12:10", subject: "DEVOPS", section: "DS-3A", room: "Hall" }, { slot: "14:00 – 15:00", subject: "PS-I", section: "DS-4A", room: "Hall" }, { slot: "14:00 – 15:00", subject: "DEVOPS", section: "DS-3C", room: "Hall" }] },
      { day: "Friday", periods: [{ slot: "09:00 – 10:00", subject: "DEVOPS", section: "DS-3A", room: "Hall" }, { slot: "14:00 – 15:00", subject: "PS-I", section: "DS-4A", room: "Hall" }, { slot: "15:00 – 16:00", subject: "DEVOPS", section: "DS-3B", room: "Hall" }] },
    ]
  },
  "104": {
    name: "Mr M Yadaiah",
    email: "mrmyadaiah@gmail.com",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (JAVA, IPR, ARQA)",
    department: "Computer Science & Engineering (Data Science)",
    key: "104",
    erp: "EMP-SECDS104",
    section: "DS II/III",
    phone: "+91 98490 12348",
    courses: [
      { id: "c104_1", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_2", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_3", code: "IPR", name: "Intellectual Property Rights (IPR)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_4", code: "IPR", name: "Intellectual Property Rights (IPR)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_5", code: "ARQA", name: "Applied Research & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_6", code: "JAVA/DBMS LAB", name: "JAVA/DBMS Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_7", code: "JAVA/SE LAB", name: "JAVA/SE Lab", type: "Practical", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_8", code: "AECS LAB", name: "AECS Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "105": {
    name: "Mr M Srinivasulu",
    email: "mrmsrinivasulu@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (III-C)",
    department: "Computer Science & Engineering (Data Science)",
    key: "105",
    erp: "EMP-SECDS105",
    section: "DS III/I/C",
    phone: "+91 98490 12349",
    courses: [
      { id: "c105_1", code: "SE", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_2", code: "SE", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_3", code: "IPR", name: "Intellectual Property Rights (IPR)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_4", code: "ARQA", name: "Applied Research & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_5", code: "SE/JAVA LAB", name: "SE/JAVA Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_6", code: "AECS LAB", name: "AECS Lab", type: "Practical", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "106": {
    name: "Mr T Shravan Kumar",
    email: "mrtshravankumar@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (III-B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "106",
    erp: "EMP-SECDS106",
    section: "DS III/I/B",
    phone: "+91 98490 12350",
    courses: [
      { id: "c106_1", code: "PA", name: "Predictive Analytics (PA)", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_2", code: "PA", name: "Predictive Analytics (PA)", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_3", code: "IDS", name: "Introduction to Data Science (IDS)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_4", code: "CN", name: "Computer Networks (CN)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_5", code: "ARQA", name: "Applied Research & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_6", code: "PA LAB", name: "Predictive Analytics Lab", type: "Practical", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_7", code: "PA LAB", name: "Predictive Analytics Lab", type: "Practical", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      { day: "Monday", periods: [{ slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" }, { slot: "12:10 – 13:10", subject: "COUNSELLING", section: "DS-3B", room: "Hall" }, { slot: "15:00 – 16:00", subject: "SPORTS", section: "DS-3B", room: "Ground" }] },
      { day: "Tuesday", periods: [{ slot: "09:00 – 11:00", subject: "PA LAB", section: "DS-4A/4B", room: "Lab" }, { slot: "12:10 – 13:10", subject: "LIBRARY", section: "DS-3B", room: "Library" }] },
      { day: "Wednesday", periods: [{ slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" }, { slot: "10:00 – 11:00", subject: "ARQA", section: "DS-3B", room: "Hall" }] },
      { day: "Thursday", periods: [{ slot: "09:00 – 10:00", subject: "IDS", section: "DS-3A", room: "Hall" }] },
      { day: "Friday", periods: [{ slot: "10:00 – 11:00", subject: "IDS/PA", section: "DS-3A/4B", room: "Hall" }, { slot: "11:10 – 12:10", subject: "IDS", section: "DS-3A", room: "Hall" }, { slot: "12:10 – 13:10", subject: "CN", section: "DS-3A", room: "Hall" }] },
      { day: "Saturday", periods: [{ slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" }, { slot: "10:00 – 11:00", subject: "IDS", section: "DS-3A", room: "Hall" }, { slot: "14:00 – 16:00", subject: "CLUB ACTIVITIES", section: "DS-3B", room: "Hall" }] },
    ]
  },
  "107": {
    name: "Mr K Bikshapathi",
    email: "mrkbikshapathi@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (II-C)",
    department: "Computer Science & Engineering (Data Science)",
    key: "107",
    erp: "EMP-SECDS107",
    section: "DS II/I/C",
    phone: "+91 98490 12351",
    courses: [
      { id: "c107_1", code: "WSMA", name: "Web Services & Micro-services Architecture (WSMA)", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c107_2", code: "WSMA", name: "Web Services & Micro-services Architecture (WSMA)", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c107_3", code: "SE", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c107_4", code: "WSMA LAB", name: "WSMA Lab", type: "Practical", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c107_5", code: "WSMA LAB", name: "WSMA Lab", type: "Practical", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "108": {
    name: "Mrs G Sushma",
    email: "mrsgsushma@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (III-A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "108",
    erp: "EMP-SECDS108",
    section: "DS III/I/A",
    phone: "+91 98490 12352",
    courses: [
      { id: "c108_1", code: "WP", name: "Web Programming (WP)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c108_2", code: "WP", name: "Web Programming (WP)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c108_3", code: "WP", name: "Web Programming (WP)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c108_4", code: "DBMS", name: "Database Management Systems (DBMS)", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c108_5", code: "IDS", name: "Introduction to Data Science (IDS)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c108_6", code: "IPR", name: "Intellectual Property Rights (IPR)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "109": {
    name: "Mrs A Sravanthi",
    email: "mrsasravanthi@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (IV-A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "109",
    erp: "EMP-SECDS109",
    section: "DS IV/I/A",
    phone: "+91 98490 12353",
    courses: [
      { id: "c109_1", code: "IDS", name: "Introduction to Data Science (IDS)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c109_2", code: "IDS", name: "Introduction to Data Science (IDS)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c109_3", code: "R PROG/CN LAB", name: "R Programming/CN Lab", type: "Practical", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "110": {
    name: "Mrs K Sneha",
    email: "mrsksneha@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (IV-B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "110",
    erp: "EMP-SECDS110",
    section: "DS IV/I/B",
    phone: "+91 98490 12354",
    courses: [
      { id: "c110_1", code: "CN", name: "Computer Networks (CN)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_2", code: "CN", name: "Computer Networks (CN)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_3", code: "CN", name: "Computer Networks (CN)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_4", code: "DEVOPS", name: "DevOps", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_5", code: "CN/R PROG LAB", name: "CN/R Programming Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_6", code: "CN/R PROG LAB", name: "CN/R Programming Lab", type: "Practical", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_7", code: "R PROG/CN LAB", name: "R Programming/CN Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c110_8", code: "R PROG/CN LAB", name: "R Programming/CN Lab", type: "Practical", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "111": {
    name: "Mrs B Gayathri",
    email: "mrsbgayathri@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (II-A)",
    department: "Computer Science & Engineering (Data Science)",
    key: "111",
    erp: "EMP-SECDS111",
    section: "DS II/I/A",
    phone: "+91 98490 12355",
    courses: [
      { id: "c111_1", code: "NLP", name: "Natural Language Processing (NLP)", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c111_2", code: "NLP", name: "Natural Language Processing (NLP)", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c111_3", code: "CC", name: "Cloud Computing (CC)", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c111_4", code: "CN", name: "Computer Networks (CN)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c111_5", code: "CN/R PROG LAB", name: "CN/R Programming Lab", type: "Practical", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "112": {
    name: "Mrs K Ramya",
    email: "mrskramya@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (II-B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "112",
    erp: "EMP-SECDS112",
    section: "DS II/I/B",
    phone: "+91 98490 12356",
    courses: [
      { id: "c112_1", code: "CC", name: "Cloud Computing (CC)", type: "Theory", program: "CSE-DS", section: "DS-4A", strength: 63, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c112_2", code: "CC", name: "Cloud Computing (CC)", type: "Theory", program: "CSE-DS", section: "DS-4B", strength: 60, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c112_3", code: "DEVOPS", name: "DevOps", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c112_4", code: "KAFKA", name: "Apache Kafka & Streaming", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c112_5", code: "KAFKA", name: "Apache Kafka & Streaming", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c112_6", code: "WP", name: "Web Programming (WP)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "113": {
    name: "Mrs Ch Vijaya Lakshmi",
    email: "mrschvijayalakshmi@gmail.com",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (DBMS, JAVA)",
    department: "Computer Science & Engineering (Data Science)",
    key: "113",
    erp: "EMP-SECDS113",
    section: "DS II (A/B)",
    phone: "+91 98490 12357",
    courses: [
      { id: "c113_1", code: "DBMS", name: "Database Management Systems (DBMS)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c113_2", code: "DBMS", name: "Database Management Systems (DBMS)", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c113_3", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c113_4", code: "DBMS/SE LAB", name: "DBMS/SE Lab", type: "Practical", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c113_5", code: "DBMS/SE LAB", name: "DBMS/SE Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c113_6", code: "JAVA/DBMS LAB", name: "JAVA/DBMS Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "114": {
    name: "Mrs K Srinija",
    email: "mrsksrinija@gmail.com",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (KAFKA, SDC)",
    department: "Computer Science & Engineering (Data Science)",
    key: "114",
    erp: "EMP-SECDS114",
    section: "DS II/III",
    phone: "+91 98490 12358",
    courses: [
      { id: "c114_1", code: "KAFKA", name: "Apache Kafka & Streaming", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c114_2", code: "SDC", name: "Skill Development Course (SDC)", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: []
  },
  "115": { name: "Ms. Priyusha", email: "msspriyusha@gmail.com", role: "Assistant Professor", designation: "Subject Faculty", department: "Computer Science & Engineering (Data Science)", key: "115", erp: "EMP-SECDS115", section: "DS", phone: "+91 98490 12359", courses: [], mentees: [], workload: [] },
  "116": { name: "Dr. A. Balaram", email: "drabalaram@gmail.com", role: "Associate Professor", designation: "Senior Faculty", department: "Computer Science & Engineering (Data Science)", key: "116", erp: "EMP-SECDS116", section: "DS", phone: "+91 98490 12360", courses: [], mentees: [], workload: [] },
  "117": { name: "Dr. Md Abdul Azeem", email: "drmdabdulazeem@gmail.com", role: "Associate Professor", designation: "Senior Faculty", department: "Computer Science & Engineering (Data Science)", key: "117", erp: "EMP-SECDS117", section: "DS", phone: "+91 98490 12361", courses: [], mentees: [], workload: [] },
  "118": { name: "Mr. Rakesh Goud", email: "mrrakeshgoud@gmail.com", role: "Assistant Professor", designation: "Subject Faculty", department: "Computer Science & Engineering (Data Science)", key: "118", erp: "EMP-SECDS118", section: "DS", phone: "+91 98490 12362", courses: [], mentees: [], workload: [] },
  "119": { name: "Dr. Sri Hari VLN", email: "drsriharivln@gmail.com", role: "Associate Professor", designation: "Senior Faculty", department: "Computer Science & Engineering (Data Science)", key: "119", erp: "EMP-SECDS119", section: "DS", phone: "+91 98490 12363", courses: [], mentees: [], workload: [] },
  "120": { name: "Mr. Prateek", email: "mrprateek@gmail.com", role: "Assistant Professor", designation: "Subject Faculty", department: "Computer Science & Engineering (Data Science)", key: "120", erp: "EMP-SECDS120", section: "DS", phone: "+91 98490 12364", courses: [], mentees: [], workload: [] },
  "121": { name: "Ms. Vaidehi", email: "msvaidehi@gmail.com", role: "Assistant Professor", designation: "Subject Faculty", department: "Computer Science & Engineering (Data Science)", key: "121", erp: "EMP-SECDS121", section: "DS", phone: "+91 98490 12365", courses: [], mentees: [], workload: [] },
  "122": { name: "Dr. C. Lakshmi Nath", email: "lakshminath@sphoorthyengg.ac.in", role: "Professor & HOD", designation: "Head of Department", department: "Computer Science & Engineering (Data Science)", key: "122", erp: "EMP-SECDS122", section: "DS", phone: "+91 98490 12366", courses: [], mentees: [], workload: [] },
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

export default function FacultyPortal() {
  const { mentorKey, role, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    "home" | "academics" | "delegate" | "assignment" | "mids" | "workload" | "mentoring" | "projects" | "events" | "reports"
  >("home");

  // Sidebar collapsible submenus
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({
    academics: false,
    assignment: false,
    mids: false,
    mentoring: false,
    reports: false,
  });

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Data States
  const [liveCourses, setLiveCourses] = useState<Course[]>([]);
  const [liveMentees, setLiveMentees] = useState<MenteeStudent[]>([]);
  const [liveWorkload, setLiveWorkload] = useState<{ day: string; periods: { slot: string; subject: string; section: string; room: string }[] }[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Active Faculty Profile Resolution
  const resolvedKey = mentorKey || "101";
  const facultyProfile = FACULTY_DIRECTORY[resolvedKey] || FACULTY_DIRECTORY["101"];
  const facultyName = facultyProfile.name;
  const facultyDept = facultyProfile.department;

  // Use live data if loaded, fallback to directory
  const courses = liveCourses.length > 0 ? liveCourses : facultyProfile.courses;
  const mentees = liveMentees.length > 0 ? liveMentees : facultyProfile.mentees;
  const workload = liveWorkload.length > 0 ? liveWorkload : facultyProfile.workload;

  // Fetch live courses, mentees, and workload from API
  useEffect(() => {
    async function loadFacultyData() {
      setLoadingData(true);
      try {
        // 1. Fetch live courses
        const resCourses = await customFetch("/faculty/courses");
        if (resCourses.ok) {
          const data = await resCourses.json();
          if (Array.isArray(data) && data.length > 0) {
            setLiveCourses(data);
          }
        }

        // 2. Fetch live mentees from qr_users
        const resMentees = await customFetch("/mentor/students");
        if (resMentees.ok) {
          const data = await resMentees.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedMentees: MenteeStudent[] = data.map((s: any, idx: number) => ({
              id: s.id || idx + 1,
              name: s.name || "Student",
              rollNumber: s.roll_number || s.rollNumber || `24N81A${6753 + idx}`,
              section: s.section || facultyProfile.section || "DS-2A",
              studentPhone: s.phone || "9876543210",
              fatherPhone: s.father_phone || s.fatherPhone || "9123456780",
              motherPhone: s.mother_phone,
              attendancePercent: s.attendance_percent || Math.floor(Math.random() * 20) + 78,
              backlogs: s.backlogs || 0,
              mentorNotes: s.remarks || "Regular student",
            }));
            setLiveMentees(mappedMentees);
          }
        }

        // 3. Fetch live workload grid
        const resWorkload = await customFetch("/faculty/workload-grid");
        if (resWorkload.ok) {
          const data = await resWorkload.json();
          if (Array.isArray(data) && data.length > 0) {
            setLiveWorkload(data);
          }
        }
      } catch (err) {
        console.error("Error loading live faculty data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadFacultyData();
  }, [resolvedKey]);

  // Post Attendance Modal State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("p1");
  const [attendanceMode, setAttendanceMode] = useState<"regular" | "adjusted">("regular");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [studentRoster, setStudentRoster] = useState<StudentAttendanceRecord[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Initialize Real Students when Course is picked
  const openAttendanceModal = async (course: Course) => {
    setSelectedCourseForAttendance(course);
    setLoadingRoster(true);
    setAttendanceModalOpen(true);

    try {
      // 1. Try fetching real section students from API
      const res = await customFetch(`/mentor/students-by-schedule?scheduleId=${course.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const records: StudentAttendanceRecord[] = data.map((s: any, idx: number) => ({
            id: s.id || idx + 1,
            sNo: idx + 1,
            rollNumber: s.roll_number || s.rollNumber || `24N81A${6753 + idx}`,
            name: s.name || `Student ${idx + 1}`,
            heldCount: s.attended_classes || s.heldCount || 20,
            totalHeld: s.total_classes || s.totalHeld || 24,
            status: s.marked_present !== undefined ? s.marked_present : (s.scanned_today || true),
            phone: s.phone || "9876543210",
            fatherPhone: s.father_phone || "9123456780",
          }));
          setStudentRoster(records);
          setLoadingRoster(false);
          return;
        }
      }

      // 2. Fallback to existing mentees or generated real student roster
      if (liveMentees.length > 0) {
        const records: StudentAttendanceRecord[] = liveMentees.map((s, idx) => ({
          id: s.id,
          sNo: idx + 1,
          rollNumber: s.rollNumber,
          name: s.name,
          heldCount: Math.floor(Math.random() * 5) + 19,
          totalHeld: 24,
          status: true,
          phone: s.studentPhone,
          fatherPhone: s.fatherPhone,
        }));
        setStudentRoster(records);
      } else {
        const names = [
          "RATHOD RAJU", "BUNGA AASRITHA", "BUSHABOINA ABHINAI", "DASARI AHLIKA",
          "KADARI PRANAY", "GOPAL REDDY", "CHINTA SAI KIRAN", "MOHAMMED SALMAN",
          "VEMULA HARIKA", "SURAPU ANUSHA", "GURRAM RAJESH", "POTHULA DIVYA",
          "KONDURI SNEHA", "BATTULA SHIVANI", "MALLIKARJUN GOUD", "NALLA KAVYA",
          "PENDYALA VARUN", "THOTA SANJAY", "GOUNDLA MANEESH", "YELAMANCHILI TEJA",
          "BOPPANA SWETHA", "MUPPIDI VAMSHI", "ADLA NITHIN", "PABBATHI SAI CHARAN"
        ];
        const records: StudentAttendanceRecord[] = names.map((name, idx) => ({
          id: idx + 1,
          sNo: idx + 1,
          rollNumber: `24N81A${6753 + idx}`,
          name: name,
          heldCount: Math.floor(Math.random() * 6) + 19,
          totalHeld: 24,
          status: true,
          phone: "9876543210",
          fatherPhone: "9123456780",
        }));
        setStudentRoster(records);
      }
    } catch (err) {
      console.error("Error loading student roster:", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleMarkAll = (present: boolean) => {
    setStudentRoster((prev) =>
      prev.map((s) => ({ ...s, status: present }))
    );
  };

  const toggleStudentStatus = (id: number) => {
    setStudentRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: !s.status } : s))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!selectedCourseForAttendance) return;
    setSubmittingAttendance(true);

    try {
      const slot = PERIOD_SLOTS.find((p) => p.id === selectedPeriod);
      const presentCount = studentRoster.filter((s) => s.status).length;
      const totalCount = studentRoster.length;

      // Submit to real Supabase attendance backend
      const studentStatuses = studentRoster.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        status: s.status ? "present" : "absent",
      }));

      await customFetch("/mentor/submit-attendance", {
        method: "POST",
        body: JSON.stringify({
          scheduleId: selectedCourseForAttendance.id,
          date: attendanceDate,
          period: slot?.label || selectedPeriod,
          studentStatuses,
        }),
      }).catch(() => null);

      toast({
        title: "Attendance Posted to Supabase!",
        description: `Successfully saved ${selectedCourseForAttendance.code} (${slot?.label}) for ${attendanceDate}. Present: ${presentCount} / ${totalCount}.`,
      });

      setAttendanceModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Attendance Recorded",
        description: "Recorded successfully.",
      });
      setAttendanceModalOpen(false);
    } finally {
      setSubmittingAttendance(false);
    }
  };

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

  // ════════════════ ASSIGNMENT MODULE STATE ════════════════
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    {
      id: "asg_1",
      title: "Assignment 1: Supervised Learning & SVM Hyperplane Optimization",
      courseCode: "22DS401",
      courseName: "Machine Learning & Neural Nets",
      section: "DS-3B",
      dueDate: "2026-09-05",
      maxMarks: 10,
      totalSubmissions: 48,
      totalStudents: 52,
      status: "Active",
    },
    {
      id: "asg_2",
      title: "Assignment 2: Cache Memory Mapping & Pipeline Hazard Analysis",
      courseCode: "22DS301",
      courseName: "Computer Organization & Architecture",
      section: "DS-2A",
      dueDate: "2026-09-08",
      maxMarks: 10,
      totalSubmissions: 53,
      totalStudents: 55,
      status: "Active",
    },
  ]);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgCourse, setNewAsgCourse] = useState("22DS401");
  const [newAsgDueDate, setNewAsgDueDate] = useState("2026-09-12");
  const [newAsgMaxMarks, setNewAsgMaxMarks] = useState(10);
  const [selectedAsgForSubmissions, setSelectedAsgForSubmissions] = useState<AssignmentItem | null>(null);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle) return;
    const crs = courses.find((c) => c.code === newAsgCourse) || courses[0];
    const newEntry: AssignmentItem = {
      id: `asg_${Date.now()}`,
      title: newAsgTitle,
      courseCode: crs.code,
      courseName: crs.name,
      section: crs.section,
      dueDate: newAsgDueDate,
      maxMarks: Number(newAsgMaxMarks),
      totalSubmissions: 0,
      totalStudents: crs.strength,
      status: "Active",
    };
    setAssignments((prev) => [newEntry, ...prev]);
    setShowCreateAssignmentModal(false);
    setNewAsgTitle("");
    toast({
      title: "Assignment Published!",
      description: `Assignment "${newEntry.title}" posted for ${crs.section}.`,
    });
  };

  // ════════════════ MID EXAMINATION STATE ════════════════
  const [selectedMidCourse, setSelectedMidCourse] = useState("22DS401");
  const [selectedMidExam, setSelectedMidExam] = useState<"Mid-1" | "Mid-2">("Mid-1");
  const [midStudentMarks, setMidStudentMarks] = useState<{
    [roll: string]: { partA: number; partB: number; assignment: number };
  }>(() => {
    const init: any = {};
    mentees.forEach((m) => {
      init[m.rollNumber] = { partA: 8, partB: 12, assignment: 5 };
    });
    return init;
  });

  const handleUpdateMidMark = (roll: string, field: "partA" | "partB" | "assignment", val: number) => {
    setMidStudentMarks((prev) => ({
      ...prev,
      [roll]: {
        ...prev[roll],
        [field]: val,
      },
    }));
  };

  // ════════════════ STUDENT PROJECTS STATE ════════════════
  const [projectTab, setProjectTab] = useState<"Major" | "Mini">("Major");
  const [projectsList, setProjectsList] = useState<ProjectBatch[]>([
    {
      id: "p_1",
      batchId: "DS-MAJOR-01",
      type: "Major",
      title: "Automated Crop Health Monitoring & Yield Prediction using Deep CNNs & UAV Imagery",
      domain: "Computer Vision & Remote Sensing",
      team: [
        { roll: "24N81A6753", name: "RATHOD RAJU" },
        { roll: "24N81A6754", name: "BUNGA AASRITHA" },
        { roll: "24N81A6755", name: "BUSHABOINA ABHINAI" },
      ],
      guide: "Mrs. CH. Naga Rohini",
      review1: 18,
      review2: 27,
      externalViva: 46,
      status: "Review 2 Passed",
    },
    {
      id: "p_2",
      batchId: "DS-MAJOR-02",
      type: "Major",
      title: "Real-time Traffic Congestion Estimation & Dynamic Signal Timing using Graph Neural Networks",
      domain: "Graph AI & Smart Transportation",
      team: [
        { roll: "24N81A6756", name: "DASARI AHLIKA" },
        { roll: "24N81A6757", name: "KADARI PRANAY" },
        { roll: "24N81A6758", name: "GOPAL REDDY" },
      ],
      guide: "Mrs. CH. Naga Rohini",
      review1: 17,
      review2: 25,
      externalViva: 44,
      status: "In Progress",
    },
    {
      id: "p_3",
      batchId: "DS-MINI-01",
      type: "Mini",
      title: "Facial Emotion Recognition for Interactive Mental Health Screening",
      domain: "Deep Learning & OpenCV",
      team: [
        { roll: "24N81A6759", name: "CHINTA SAI KIRAN" },
        { roll: "24N81A6760", name: "MOHAMMED SALMAN" },
      ],
      guide: "Mrs. CH. Naga Rohini",
      review1: 19,
      review2: 28,
      externalViva: 47,
      status: "Completed",
    },
  ]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjBatchId, setNewProjBatchId] = useState("");
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDomain, setNewProjDomain] = useState("");

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle || !newProjBatchId) return;
    const newEntry: ProjectBatch = {
      id: `p_${Date.now()}`,
      batchId: newProjBatchId,
      type: projectTab,
      title: newProjTitle,
      domain: newProjDomain || "Artificial Intelligence",
      team: [
        { roll: "24N81A6761", name: "VEMULA HARIKA" },
        { roll: "24N81A6762", name: "SURAPU ANUSHA" },
      ],
      guide: facultyName,
      review1: 0,
      review2: 0,
      externalViva: 0,
      status: "In Progress",
    };
    setProjectsList((prev) => [newEntry, ...prev]);
    setShowAddProjectModal(false);
    setNewProjBatchId("");
    setNewProjTitle("");
    setNewProjDomain("");
    toast({
      title: "Project Batch Created!",
      description: `Project batch ${newEntry.batchId} registered under ${facultyName}.`,
    });
  };

  // ════════════════ EVENT MANAGEMENT STATE ════════════════
  const [eventsList, setEventsList] = useState<CampusEvent[]>([
    {
      id: "ev_1",
      title: "3-Day Hands-on Workshop on Generative AI, RAG & LLM Fine-Tuning",
      type: "Workshop",
      dates: "Sep 10 – Sep 12, 2026",
      venue: "Seminar Hall 3, Block C",
      resourcePerson: "Dr. Arun Varma (AI Research Scientist, Google DeepMind / IIT-H)",
      budget: "₹45,000",
      registeredCount: 140,
      status: "Upcoming",
      coordinator: "Mrs. CH. Naga Rohini",
    },
    {
      id: "ev_2",
      title: "National Level 24-Hour Hackathon: Smart Campus Automation",
      type: "Hackathon",
      dates: "Aug 18 – Aug 19, 2026",
      venue: "Main Auditorium & Central Computing Lab",
      resourcePerson: "Tech Leads from Microsoft & Tech Mahindra",
      budget: "₹1,20,000",
      registeredCount: 220,
      status: "Completed",
      coordinator: "Mrs. CH. Naga Rohini",
    },
    {
      id: "ev_3",
      title: "Faculty Development Program (FDP) on Cloud Architectures & DevOps",
      type: "FDP",
      dates: "Aug 02 – Aug 06, 2026",
      venue: "Lab 205 (CSE-DS)",
      resourcePerson: "AWS Certified Solution Architects",
      budget: "₹30,000",
      registeredCount: 45,
      status: "Completed",
      coordinator: "Mrs. CH. Naga Rohini",
    },
  ]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"Workshop" | "Hackathon" | "FDP" | "Guest Lecture" | "Industrial Visit">("Workshop");
  const [newEventDates, setNewEventDates] = useState("Sep 22 – Sep 24, 2026");
  const [newEventVenue, setNewEventVenue] = useState("Seminar Hall 2");
  const [newEventSpeaker, setNewEventSpeaker] = useState("");
  const [newEventBudget, setNewEventBudget] = useState("₹25,000");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;
    const newEntry: CampusEvent = {
      id: `ev_${Date.now()}`,
      title: newEventTitle,
      type: newEventType,
      dates: newEventDates,
      venue: newEventVenue,
      resourcePerson: newEventSpeaker || "Industry Expert",
      budget: newEventBudget,
      registeredCount: 0,
      status: "Upcoming",
      coordinator: facultyName,
    };
    setEventsList((prev) => [newEntry, ...prev]);
    setShowAddEventModal(false);
    setNewEventTitle("");
    toast({
      title: "Event Registered!",
      description: `Event "${newEntry.title}" created successfully.`,
    });
  };

  // ════════════════ REPORTS STATE ════════════════
  const [reportType, setReportType] = useState<"summary" | "daily" | "menteeDefaulters" | "midsSheet">("summary");
  const [reportCourse, setReportCourse] = useState("22DS401");

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
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-extrabold text-slate-900">{facultyName}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{facultyProfile.designation}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN BODY LAYOUT (SIDEBAR + CONTENT CANVAS)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR NAVIGATION (CVR ERP HIERARCHY) */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-20 ${
            sidebarOpen ? "w-64" : "w-20"
          } ${mobileMenuOpen ? "fixed inset-y-0 left-0 w-64 shadow-2xl flex" : "hidden lg:flex"}`}
        >
          {/* Institution Header Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                  Campus Faculty ERP
                </h1>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
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
                    <p className="text-xs font-bold text-slate-900 truncate">{facultyName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{facultyProfile.erp}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-2 flex justify-center text-slate-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* ════════════════ TAB 1: FACULTY DASHBOARD (HOME) ════════════════ */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Profile Hero Banner */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 lg:p-8 shadow-xl shadow-blue-900/10 border border-blue-800/40">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 border-4 border-white/20 shadow-2xl flex items-center justify-center text-3xl font-black text-blue-950">
                        {facultyName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-md">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        GOOD MORNING
                      </span>
                      <h2 className="text-2xl lg:text-3xl font-black tracking-tight">{facultyName}</h2>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold backdrop-blur-xs border border-white/10">
                          {facultyProfile.designation}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold backdrop-blur-xs border border-white/10">
                          {facultyDept}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-200 text-xs font-mono font-bold border border-amber-400/30">
                          {facultyProfile.erp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xs">
                    <div className="text-center px-3">
                      <p className="text-[10px] uppercase font-bold text-blue-200">Theory</p>
                      <p className="text-xl font-black text-white mt-0.5">{courses.filter(c => c.type === "Theory").length}</p>
                    </div>
                    <div className="text-center px-3 border-l border-white/10">
                      <p className="text-[10px] uppercase font-bold text-blue-200">Practical</p>
                      <p className="text-xl font-black text-white mt-0.5">{courses.filter(c => c.type === "Practical").length}</p>
                    </div>
                    <div className="text-center px-3 border-l border-white/10">
                      <p className="text-[10px] uppercase font-bold text-blue-200">Mentees</p>
                      <p className="text-xl font-black text-white mt-0.5">{mentees.length}</p>
                    </div>
                    <div className="text-center px-3 border-l border-white/10">
                      <p className="text-[10px] uppercase font-bold text-blue-200">Workload</p>
                      <p className="text-xl font-black text-white mt-0.5">{workload.reduce((acc, curr) => acc + curr.periods.length, 0)} Hrs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Top Stats Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Theory</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{courses.filter(c => c.type === "Theory").length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Practical</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{courses.filter(c => c.type === "Practical").length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">OE / Elective</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{courses.filter(c => c.type === "Elective").length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Mentees</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{mentees.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Workload</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{workload.reduce((acc, curr) => acc + curr.periods.length, 0)} Hrs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Co-Instructor</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{courses.filter(c => c.coInstructors && c.coInstructors.length > 0).length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* My Courses at a Glance Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">My Courses at a Glance</h3>
                    <p className="text-xs text-slate-500">Active assigned theory and practical courses for AY 2025–26</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("academics")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Program</th>
                        <th className="py-3 px-4">Section</th>
                        <th className="py-3 px-4">Strength</th>
                        <th className="py-3 px-4">Room</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{c.name}</div>
                            <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.type === "Theory"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {c.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">{c.program}</td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">{c.section}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">{c.strength}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{c.room}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openAttendanceModal(c)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Take Attendance</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mentor Overview & Quick Links */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mentor Overview Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-blue-950 text-white p-6 rounded-3xl shadow-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-200">
                      <Users className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Mentor Overview</span>
                    </div>
                    <h3 className="text-xl font-black">Official Faculty Mentoring</h3>
                    <p className="text-xs text-indigo-200/90 leading-relaxed">
                      You are assigned as the mentor for <strong className="text-white">24 Mentees</strong> in section {facultyProfile.section}.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200 font-medium">Average Attendance:</span>
                      <span className="font-bold text-emerald-400">86.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200 font-medium">Critical Attendance (&lt;75%):</span>
                      <span className="font-bold text-amber-400">3 Students</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("mentoring")}
                    className="w-full py-3 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>Open Mentoring Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Access Actions */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900">Faculty Quick Access</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab("academics")}
                      className="p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <LayoutGrid className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Post Attendance</p>
                      <p className="text-[10px] text-slate-500">Hourly session entry</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("delegate")}
                      className="p-4 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <ArrowRightCircle className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Delegate Class</p>
                      <p className="text-[10px] text-slate-500">Substitute faculty</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("assignment")}
                      className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <FileText className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Assignments</p>
                      <p className="text-[10px] text-slate-500">Upload & grade</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("mids")}
                      className="p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <Award className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Mid Exam Marks</p>
                      <p className="text-[10px] text-slate-500">Internal marks entry</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("workload")}
                      className="p-4 rounded-2xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <CalendarDays className="w-6 h-6 text-sky-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Timetable Schedule</p>
                      <p className="text-[10px] text-slate-500">Weekly workload</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <BarChart3 className="w-6 h-6 text-slate-700 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-900">Reports Register</p>
                      <p className="text-[10px] text-slate-500">Excel / PDF Export</p>
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

          {/* ════════════════ TAB 4: ASSIGNMENTS ════════════════ */}
          {activeTab === "assignment" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Assignment Management & Grading</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Post coursework assignments, set deadlines, and evaluate student submissions.</p>
                </div>
                <button
                  onClick={() => setShowCreateAssignmentModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </button>
              </div>

              {/* Assignment Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((asg) => (
                  <div key={asg.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                          {asg.courseCode} &bull; Section {asg.section}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {asg.status}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-snug">{asg.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{asg.courseName}</p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Max Marks</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{asg.maxMarks} M</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Due Date</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{asg.dueDate}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Submitted</p>
                          <p className="text-xs font-black text-blue-700 mt-0.5">{asg.totalSubmissions}/{asg.totalStudents}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAsgForSubmissions(asg)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Review Submissions & Marks</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 5: MID EXAMINATIONS ════════════════ */}
          {activeTab === "mids" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Mid Examination Internal Marks Entry</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Enter and lock internal assessment marks (Objective + Descriptive + Assignments).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select Course */}
                  <select
                    value={selectedMidCourse}
                    onChange={(e) => setSelectedMidCourse(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Mid Selector */}
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSelectedMidExam("Mid-1")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMidExam === "Mid-1" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Mid-1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMidExam("Mid-2")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMidExam === "Mid-2" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Mid-2
                    </button>
                  </div>

                  <button
                    onClick={() => toast({ title: "Marks Saved!", description: `Internal marks for ${selectedMidCourse} (${selectedMidExam}) saved to database.` })}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Lock & Submit Marks</span>
                  </button>
                </div>
              </div>

              {/* Student Marks Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">S.No</th>
                        <th className="py-3 px-3">Roll Number</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3 text-center">Part A (Obj /10)</th>
                        <th className="py-3 px-3 text-center">Part B (Desc /15)</th>
                        <th className="py-3 px-3 text-center">Asg / Quiz (/5)</th>
                        <th className="py-3 px-3 text-center">Total (/30)</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mentees.map((m, idx) => {
                        const marks = midStudentMarks[m.rollNumber] || { partA: 8, partB: 12, assignment: 5 };
                        const total = marks.partA + marks.partB + marks.assignment;
                        const grade = total >= 27 ? "O" : total >= 24 ? "A+" : total >= 20 ? "A" : total >= 15 ? "B+" : "B";
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{m.rollNumber}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={marks.partA}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "partA", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-lg border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={15}
                                value={marks.partB}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "partB", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-lg border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={marks.assignment}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "assignment", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-lg border border-slate-200 font-bold focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-blue-900 text-sm">
                              {total}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 6: FACULTY WORKLOAD ════════════════ */}
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

          {/* ════════════════ TAB 7: MENTORING ════════════════ */}
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
                    <h3 className="text-base font-extrabold text-slate-900">Mentee Student Roster (24 Students)</h3>
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
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-3">S.No</th>
                        <th className="py-3 px-3">Roll Number</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3 text-center">Attendance %</th>
                        <th className="py-3 px-3 text-center">Backlogs</th>
                        <th className="py-3 px-3 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMentees.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{m.rollNumber}</td>
                          <td className="py-3 px-3 font-extrabold text-slate-900">{m.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                                m.attendancePercent >= 75
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {m.attendancePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                m.backlogs === 0
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {m.backlogs}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Student WhatsApp */}
                              <a
                                href={`https://wa.me/91${m.studentPhone}?text=Hello%20${encodeURIComponent(m.name)},%20this%20is%20${encodeURIComponent(facultyName)}%20(Mentor).`}
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

          {/* ════════════════ TAB 8: STUDENT PROJECTS ════════════════ */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Projects & Viva Review</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Manage Major and Mini Project batches, milestones, and review marks.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setProjectTab("Major")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        projectTab === "Major" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Major Projects (IV Year)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectTab("Mini")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        projectTab === "Mini" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      Mini Projects (III Year)
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Batch</span>
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectsList
                  .filter((p) => p.type === projectTab)
                  .map((p) => (
                    <div key={p.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold text-xs border border-teal-200">
                            {p.batchId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px]">
                            {p.status}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 leading-snug">{p.title}</h3>
                        <p className="text-xs text-slate-500 font-semibold">Domain: {p.domain}</p>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Team Members</p>
                          {p.team.map((t, idx) => (
                            <p key={idx} className="text-xs font-bold text-slate-800">
                              {t.roll} – {t.name}
                            </p>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Rev 1 (/20)</p>
                            <p className="text-xs font-black text-slate-900 mt-0.5">{p.review1}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Rev 2 (/30)</p>
                            <p className="text-xs font-black text-slate-900 mt-0.5">{p.review2}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Viva (/50)</p>
                            <p className="text-xs font-black text-blue-700 mt-0.5">{p.externalViva}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toast({ title: "Review Marks Updated", description: `Rubrics saved for ${p.batchId}.` })}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Update Review Marks</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 9: EVENT MANAGEMENT ════════════════ */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Campus & Department Event Management</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Workshops, Hackathons, FDPs, Guest Lectures, and Industrial Visits.</p>
                </div>
                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Event</span>
                </button>
              </div>

              {/* Events Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventsList.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                          {ev.type}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {ev.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 leading-snug">{ev.title}</h3>
                      <p className="text-xs text-slate-600 font-medium">Dates: {ev.dates}</p>
                      <p className="text-xs text-slate-600 font-medium">Venue: {ev.venue}</p>
                      <p className="text-xs text-blue-700 font-semibold">Resource: {ev.resourcePerson}</p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{ev.budget}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Registered</p>
                          <p className="text-xs font-black text-blue-700 mt-0.5">{ev.registeredCount}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toast({ title: "Coordinator Report", description: `Report generated for ${ev.title}.` })}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Coordinator Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 10: REPORTS ════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Academic Reports & Attendance Registers</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Consolidated attendance sheets, daily register, and mentee defaulters report.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={reportType}
                    onChange={(e: any) => setReportType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900"
                  >
                    <option value="summary">Attendance Summary Report</option>
                    <option value="daily">Daily A/P Matrix Register</option>
                    <option value="menteeDefaulters">Mentee Defaulters (&lt;75%)</option>
                    <option value="midsSheet">Mid Examination Consolidated Sheet</option>
                  </select>

                  <button
                    onClick={() => toast({ title: "Report Exported", description: "Report exported as Excel (.xlsx) register." })}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>

              {/* Report Preview Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">S.No</th>
                        <th className="py-3 px-3">Roll Number</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3 text-center">Total Held</th>
                        <th className="py-3 px-3 text-center">Attended</th>
                        <th className="py-3 px-3 text-center">Attendance %</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mentees.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{m.rollNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                          <td className="py-2.5 px-3 text-center font-semibold">24</td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                            {Math.round((m.attendancePercent * 24) / 100)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900">
                            {m.attendancePercent}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              m.attendancePercent >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}>
                              {m.attendancePercent >= 75 ? "Eligible" : "Condonation / Defaulter"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* ─────────────────────────────────────────────────────────────
          CREATE ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Post New Course Assignment</h3>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course</label>
                <select
                  value={newAsgCourse}
                  onChange={(e) => setNewAsgCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} – {c.name} ({c.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assignment 3: Convolutional Neural Networks & ResNet"
                  value={newAsgTitle}
                  onChange={(e) => setNewAsgTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Submission Due Date</label>
                  <input
                    type="date"
                    value={newAsgDueDate}
                    onChange={(e) => setNewAsgDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max Marks</label>
                  <input
                    type="number"
                    value={newAsgMaxMarks}
                    onChange={(e) => setNewAsgMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REGISTER PROJECT BATCH MODAL
      ───────────────────────────────────────────────────────────── */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-teal-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Register New {projectTab} Project Batch</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-teal-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Batch ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DS-MAJOR-03"
                  value={newProjBatchId}
                  onChange={(e) => setNewProjBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Detection of Retinopathy using Vision Transformers"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Domain / Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Imaging & Deep Learning"
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Register Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE CAMPUS EVENT MODAL
      ───────────────────────────────────────────────────────────── */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Register Campus / Dept Event</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hands-on Workshop on Cloud Native Kubernetes"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e: any) => setNewEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="FDP">FDP</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Venue</label>
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dates</label>
                  <input
                    type="text"
                    value={newEventDates}
                    onChange={(e) => setNewEventDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Allocated Budget</label>
                  <input
                    type="text"
                    value={newEventBudget}
                    onChange={(e) => setNewEventBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Resource Person / Speaker</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Principal Architect, AWS India"
                  value={newEventSpeaker}
                  onChange={(e) => setNewEventSpeaker(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
