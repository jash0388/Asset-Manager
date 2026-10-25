import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
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
  CheckCheck,
  Lock,
  ArrowRightLeft
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
  isLive?: boolean;
  isAttendanceTaken?: boolean;
  timingStatus?: "live" | "upcoming" | "completed" | "future_day";
  slot?: string;
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
  { id: "p3", label: "11:10 AM – 12:10 PM", start: "11:10", end: "12:10" },
  { id: "p4", label: "12:10 PM – 01:10 PM", start: "12:10", end: "13:10" },
  { id: "p5", label: "02:00 PM – 03:00 PM", start: "14:00", end: "15:00" },
  { id: "p6", label: "03:00 PM – 04:00 PM", start: "15:00", end: "16:00" },
  { id: "p7", label: "04:00 PM – 05:00 PM", start: "16:00", end: "17:00" },
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
    designation: "Subject Faculty (JAVA)",
    department: "Computer Science & Engineering (Data Science)",
    key: "104",
    erp: "EMP-SECDS104",
    section: "DS II/III",
    phone: "+91 98490 12348",
    courses: [
      { id: "c104_1", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_2", code: "JAVA", name: "JAVA Programming", type: "Theory", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_3", code: "JAVA/DBMS LAB", name: "JAVA/DBMS Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab-101", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c104_4", code: "JAVA/SE LAB", name: "JAVA/SE Lab", type: "Practical", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Lab-101", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      {
        day: "Monday",
        periods: [
          { slot: "15:00 – 16:00", subject: "JAVA", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Tuesday",
        periods: [
          { slot: "09:00 – 10:00", subject: "JAVA", section: "DS-2C", room: "Hall" },
          { slot: "11:10 – 13:10", subject: "JAVA/DBMS LAB", section: "DS-2B", room: "Lab-101" },
        ],
      },
      {
        day: "Wednesday",
        periods: [
          { slot: "10:00 – 11:00", subject: "JAVA", section: "DS-2B", room: "Hall" },
          { slot: "11:10 – 13:10", subject: "JAVA/SE LAB", section: "DS-2C", room: "Lab-101" },
          { slot: "14:00 – 15:00", subject: "JAVA", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Thursday",
        periods: [
          { slot: "09:00 – 10:00", subject: "JAVA", section: "DS-2C", room: "Hall" },
          { slot: "10:00 – 11:00", subject: "JAVA", section: "DS-2B", room: "Hall" },
        ],
      },
      {
        day: "Friday",
        periods: [
          { slot: "09:00 – 10:00", subject: "JAVA", section: "DS-2B", room: "Hall" },
          { slot: "15:00 – 16:00", subject: "JAVA", section: "DS-2B", room: "Hall" },
        ],
      },
    ],
  },
  "105": {
    name: "Mr M Srinivasulu",
    email: "mrmsrinivasulu@gmail.com",
    role: "Assistant Professor & Class In-charge",
    designation: "Class In-charge & Mentor (II-B)",
    department: "Computer Science & Engineering (Data Science)",
    key: "105",
    erp: "EMP-SECDS105",
    section: "DS II/I/B",
    phone: "+91 98490 12349",
    courses: [
      { id: "c105_1", code: "SE", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2A", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_2", code: "SE", name: "Software Engineering (SE)", type: "Theory", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Hall", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c105_3", code: "SE/JAVA LAB", name: "SE/JAVA Lab", type: "Practical", program: "CSE-DS", section: "DS-2B", strength: 55, room: "Lab-101", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      {
        day: "Monday",
        periods: [
          { slot: "10:00 – 11:00", subject: "SE", section: "DS-2B", room: "Hall" },
          { slot: "11:10 – 13:10", subject: "SE/JAVA LAB", section: "DS-2B", room: "Lab-101" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2A", room: "Hall" },
        ],
      },
      {
        day: "Tuesday",
        periods: [
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2B", room: "Hall" },
          { slot: "15:00 – 16:00", subject: "SE", section: "DS-2A", room: "Hall" },
        ],
      },
      {
        day: "Thursday",
        periods: [
          { slot: "12:10 – 13:10", subject: "SE", section: "DS-2B", room: "Hall" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2A", room: "Hall" },
        ],
      },
      {
        day: "Friday",
        periods: [
          { slot: "12:10 – 13:10", subject: "SE", section: "DS-2A", room: "Hall" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2B", room: "Hall" },
        ],
      },
    ],
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
      { id: "c106_4", code: "PA LAB", name: "Predictive Analytics Lab", type: "Practical", program: "CSE-DS", section: "DS-4A/4B", strength: 63, room: "Lab-102", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c106_5", code: "R PROG/CN LAB", name: "R Programming/CN Lab", type: "Practical", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Lab-101", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      {
        day: "Monday",
        periods: [
          { slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" },
          { slot: "12:10 – 13:10", subject: "IDS", section: "DS-3A", room: "Hall" },
        ],
      },
      {
        day: "Tuesday",
        periods: [
          { slot: "09:00 – 11:00", subject: "PA LAB", section: "DS-4A/4B", room: "Lab-102" },
          { slot: "14:00 – 16:00", subject: "R PROGRAMMING/CN LAB", section: "DS-3A", room: "Lab-101" },
        ],
      },
      {
        day: "Wednesday",
        periods: [
          { slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" },
        ],
      },
      {
        day: "Thursday",
        periods: [
          { slot: "09:00 – 10:00", subject: "IDS", section: "DS-3A", room: "Hall" },
        ],
      },
      {
        day: "Friday",
        periods: [
          { slot: "10:00 – 11:00", subject: "PA", section: "DS-4A/4B", room: "Hall" },
          { slot: "11:10 – 12:10", subject: "IDS", section: "DS-3A", room: "Hall" },
        ],
      },
      {
        day: "Saturday",
        periods: [
          { slot: "09:00 – 10:00", subject: "PA", section: "DS-4A/4B", room: "Hall" },
          { slot: "10:00 – 11:00", subject: "IDS", section: "DS-3A", room: "Hall" },
        ],
      },
    ],
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
      { id: "c107_4", code: "WSMA LAB", name: "WSMA Lab", type: "Practical", program: "CSE-DS", section: "DS-4A/4B", strength: 63, room: "Lab-102", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c107_5", code: "SE/DBMS LAB", name: "SE/DBMS Lab", type: "Practical", program: "CSE-DS", section: "DS-2C", strength: 45, room: "Lab-101", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      {
        day: "Monday",
        periods: [
          { slot: "10:00 – 11:00", subject: "WSMA", section: "DS-4A/4B", room: "Hall" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Tuesday",
        periods: [
          { slot: "11:10 – 12:10", subject: "SE", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Wednesday",
        periods: [
          { slot: "10:00 – 11:00", subject: "WSMA", section: "DS-4A/4B", room: "Hall" },
        ],
      },
      {
        day: "Thursday",
        periods: [
          { slot: "09:00 – 11:00", subject: "WSMA LAB", section: "DS-4A/4B", room: "Lab-102" },
          { slot: "11:10 – 13:10", subject: "SE/DBMS LAB", section: "DS-2C", room: "Lab-101" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Friday",
        periods: [
          { slot: "09:00 – 10:00", subject: "WSMA", section: "DS-4A/4B", room: "Hall" },
          { slot: "14:00 – 15:00", subject: "SE", section: "DS-2C", room: "Hall" },
        ],
      },
      {
        day: "Saturday",
        periods: [
          { slot: "10:00 – 11:00", subject: "WSMA", section: "DS-4A/4B", room: "Hall" },
        ],
      },
    ],
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
  "123": {
    name: "Mrs. Swathi",
    email: "swathi@sphoorthyengg.ac.in",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty (ARQA)",
    department: "Computer Science & Engineering (Data Science)",
    key: "123",
    erp: "EMP-SECDS123",
    section: "DS III (A/B/C)",
    phone: "+91 98490 12367",
    courses: [
      { id: "c123_1", code: "ARQA", name: "Automated Testing & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3A", strength: 55, room: "Hall 401", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c123_2", code: "ARQA", name: "Automated Testing & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3B", strength: 50, room: "Hall 402", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
      { id: "c123_3", code: "ARQA", name: "Automated Testing & Quality Assurance (ARQA)", type: "Theory", program: "CSE-DS", section: "DS-3C", strength: 54, room: "Hall 417", batch: "Regular", addedBy: "HOD (Data Science)", coInstructors: [] },
    ],
    mentees: [],
    workload: [
      {
        day: "Wednesday",
        periods: [
          { slot: "09:00 – 10:00", subject: "ARQA", section: "DS-3A", room: "Hall 401" },
          { slot: "10:00 – 11:00", subject: "ARQA", section: "DS-3B", room: "Hall 402" },
          { slot: "11:10 – 12:10", subject: "ARQA", section: "DS-3C", room: "Hall 417" },
        ]
      }
    ]
  },
};

// Section-specific official faculty rosters (6 members per section with subjects)
interface SectionTeacher {
  key: string;
  name: string;
  subject: string;
  designation: string;
}

const SECTION_FACULTY_ROSTER: Record<string, SectionTeacher[]> = {
  "DS-2A": [
    { key: "116", name: "Dr. A. Balaram", subject: "JAVA / JAVA LAB", designation: "Assoc. Professor" },
    { key: "118", name: "Mr. Rakesh Goud", subject: "MSF", designation: "Asst. Professor" },
    { key: "105", name: "Mr M Srinivasulu", subject: "SE", designation: "Asst. Professor" },
    { key: "101", name: "Mrs. CH. Naga Rohini", subject: "COA", designation: "Asst. Professor" },
    { key: "113", name: "Mrs Ch Vijaya Lakshmi", subject: "DBMS", designation: "Asst. Professor" },
    { key: "114", name: "Mrs K Srinija", subject: "SDC", designation: "Asst. Professor" },
  ],
  "DS-2B": [
    { key: "118", name: "Mr. Rakesh Goud", subject: "MSF", designation: "Asst. Professor" },
    { key: "105", name: "Mr M Srinivasulu", subject: "SE / SE LAB", designation: "Asst. Professor" },
    { key: "101", name: "Mrs. CH. Naga Rohini", subject: "COA", designation: "Asst. Professor" },
    { key: "113", name: "Mrs Ch Vijaya Lakshmi", subject: "DBMS", designation: "Asst. Professor" },
    { key: "119", name: "Dr. Sri Hari VLN", subject: "CM LAB", designation: "Assoc. Professor" },
    { key: "104", name: "Mr M Yadaiah", subject: "JAVA / DBMS LAB", designation: "Asst. Professor" },
  ],
  "DS-2C": [
    { key: "108", name: "Mrs G Sushma", subject: "DBMS", designation: "Asst. Professor" },
    { key: "101", name: "Mrs. CH. Naga Rohini", subject: "COA", designation: "Asst. Professor" },
    { key: "114", name: "Mrs K Srinija", subject: "SDC / JAVA LAB", designation: "Asst. Professor" },
    { key: "107", name: "Mr K Bikshapathi", subject: "SE", designation: "Asst. Professor" },
    { key: "104", name: "Mr M Yadaiah", subject: "JAVA / JAVA LAB", designation: "Asst. Professor" },
    { key: "118", name: "Mr. Rakesh Goud", subject: "MSF", designation: "Asst. Professor" },
  ],
  "DS-3A": [
    { key: "112", name: "Mrs K Ramya", subject: "KAFKA", designation: "Asst. Professor" },
    { key: "117", name: "Dr. Md Abdul Azeem", subject: "ADA", designation: "Assoc. Professor" },
    { key: "106", name: "Mr T Shravan Kumar", subject: "IDS", designation: "Asst. Professor" },
    { key: "110", name: "Mrs K Sneha", subject: "CN / CN LAB", designation: "Asst. Professor" },
    { key: "123", name: "Mrs. Swathi", subject: "ARQA", designation: "Asst. Professor" },
    { key: "108", name: "Mrs G Sushma", subject: "WP", designation: "Asst. Professor" },
  ],
  "DS-3B": [
    { key: "110", name: "Mrs K Sneha", subject: "CN / CN LAB", designation: "Asst. Professor" },
    { key: "103", name: "Mr Miskeen Ali", subject: "DEVOPS", designation: "Asst. Professor" },
    { key: "108", name: "Mrs G Sushma", subject: "WP", designation: "Asst. Professor" },
    { key: "106", name: "Mr T Shravan Kumar", subject: "IDS", designation: "Asst. Professor" },
    { key: "117", name: "Dr. Md Abdul Azeem", subject: "ADA", designation: "Assoc. Professor" },
    { key: "123", name: "Mrs. Swathi", subject: "ARQA", designation: "Asst. Professor" },
  ],
  "DS-3C": [
    { key: "111", name: "Mrs B Gayathri", subject: "CN", designation: "Asst. Professor" },
    { key: "109", name: "Mrs A Sravanthi", subject: "IDS / R-LAB", designation: "Asst. Professor" },
    { key: "103", name: "Mr Miskeen Ali", subject: "DEVOPS", designation: "Asst. Professor" },
    { key: "114", name: "Mrs K Srinija", subject: "WP", designation: "Asst. Professor" },
    { key: "117", name: "Dr. Md Abdul Azeem", subject: "ADA", designation: "Assoc. Professor" },
    { key: "123", name: "Mrs. Swathi", subject: "ARQA", designation: "Asst. Professor" },
  ],
  "DS-4A": [
    { key: "106", name: "Mr T Shravan Kumar", subject: "PA / PA LAB", designation: "Asst. Professor" },
    { key: "107", name: "Mr K Bikshapathi", subject: "WSMA / WSMA LAB", designation: "Asst. Professor" },
    { key: "122", name: "Dr. C. Lakshmi Nath", subject: "OE", designation: "Professor & HOD" },
    { key: "112", name: "Mrs K Ramya", subject: "CC", designation: "Asst. Professor" },
    { key: "103", name: "Mr Miskeen Ali", subject: "PS-I", designation: "Asst. Professor" },
    { key: "111", name: "Mrs B Gayathri", subject: "NLP", designation: "Asst. Professor" },
  ],
  "DS-4B": [
    { key: "106", name: "Mr T Shravan Kumar", subject: "PA / PA LAB", designation: "Asst. Professor" },
    { key: "107", name: "Mr K Bikshapathi", subject: "WSMA / WSMA LAB", designation: "Asst. Professor" },
    { key: "111", name: "Mrs B Gayathri", subject: "NLP", designation: "Asst. Professor" },
    { key: "122", name: "Dr. C. Lakshmi Nath", subject: "OE", designation: "Professor & HOD" },
    { key: "117", name: "Dr. Md Abdul Azeem", subject: "PS-I", designation: "Assoc. Professor" },
    { key: "112", name: "Mrs K Ramya", subject: "CC", designation: "Asst. Professor" },
  ],
};

function normalizeSectionKey(rawSec?: string): string {
  const s = (rawSec || "").toUpperCase();
  if (s.includes("2A") || s.includes("II-A") || s.includes("2-A")) return "DS-2A";
  if (s.includes("2B") || s.includes("II-B") || s.includes("2-B")) return "DS-2B";
  if (s.includes("2C") || s.includes("II-C") || s.includes("2-C")) return "DS-2C";
  if (s.includes("3A") || s.includes("III-A") || s.includes("3-A")) return "DS-3A";
  if (s.includes("3B") || s.includes("III-B") || s.includes("3-B")) return "DS-3B";
  if (s.includes("3C") || s.includes("III-C") || s.includes("3-C")) return "DS-3C";
  if (s.includes("4A") || s.includes("IV-A") || s.includes("4-A")) return "DS-4A";
  if (s.includes("4B") || s.includes("IV-B") || s.includes("4-B")) return "DS-4B";
  return "DS-2A";
}

// Year-Wise Academic Directory Data (Courses -> Next Section -> Next Students Details -> Next Faculty)
const YEAR_WISE_DIRECTORY_DATA = {
  II: {
    year: "II" as const,
    title: "II Year B.Tech — Computer Science & Engineering (Data Science)",
    academicYear: "2026 – 2027 (Semesters III & IV)",
    batch: "2024 – 2028 Batch",
    courses: [
      { code: "JAVA", title: "Java Programming", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "OOP Concepts, Exception Handling, Collections Framework, Multithreading, Streams" },
      { code: "DBMS", title: "Database Management Systems", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "Relational Algebra, SQL, Normalization (1NF–BCNF), Transactions, Indexing" },
      { code: "SE", title: "Software Engineering", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "SDLC Models, Agile / Scrum, Requirements Engineering, UML Design Patterns" },
      { code: "COA", title: "Computer Organization & Architecture", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Instruction Sets, ALU Design, Pipelining, Memory Hierarchy & Cache Memory" },
      { code: "MSF", title: "Mathematical & Statistical Foundations", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Probability Distributions, Hypothesis Testing, Linear Regression, Matrix Operations" },
      { code: "JAVA/DBMS LAB", title: "Java & Database Systems Laboratory", type: "Practical", credits: 2, hours: "3 Hrs / Week", syllabusBrief: "Hands-on Java Application Development & PostgreSQL Database Integration" },
      { code: "SDC", title: "Skill Development Course", type: "Skill", credits: 2, hours: "2 Hrs / Week", syllabusBrief: "Python for Data Analysis, Pandas, NumPy, Data Cleaning & Pre-processing" },
      { code: "CM LAB", title: "Computational Methods Lab", type: "Practical", credits: 1.5, hours: "2 Hrs / Week", syllabusBrief: "Numerical Methods, Curve Fitting, MATLAB / Scientific Python Implementations" },
    ],
    sections: [
      { name: "Section II-A", key: "DS-2A", room: "Hall 401", incharge: "Dr. A. Balaram", inchargeKey: "116", strength: 58, rollRange: "23071A6701 – 23071A6758", crName: "K. Sai Teja (23071A6724)" },
      { name: "Section II-B", key: "DS-2B", room: "Hall 402", incharge: "Mr M Srinivasulu", inchargeKey: "105", strength: 55, rollRange: "23071A6759 – 23071A67B4", crName: "M. Rahul Reddy (23071A6778)" },
      { name: "Section II-C", key: "DS-2C", room: "Hall 403", incharge: "Mr K Bikshapathi", inchargeKey: "107", strength: 52, rollRange: "23071A67B5 – 23071A67G6", crName: "P. Ananya (23071A67C1)" },
    ],
    students: [
      { rollNo: "23071A6701", name: "A. Harshavardhan", section: "DS-2A", mentor: "Dr. A. Balaram", attendance: 88, status: "Regular" as const },
      { rollNo: "23071A6702", name: "B. Navya Sri", section: "DS-2A", mentor: "Dr. A. Balaram", attendance: 92, status: "Regular" as const },
      { rollNo: "23071A6703", name: "C. Rohit Kumar", section: "DS-2A", mentor: "Mrs. CH. Naga Rohini", attendance: 78, status: "Regular" as const },
      { rollNo: "23071A6704", name: "D. Sneha Latha", section: "DS-2A", mentor: "Mrs. CH. Naga Rohini", attendance: 85, status: "Regular" as const },
      { rollNo: "23071A6705", name: "E. Tarun Teja", section: "DS-2A", mentor: "Mrs Ch Vijaya Lakshmi", attendance: 81, status: "Regular" as const },
      { rollNo: "23071A6759", name: "F. Bhanu Prakash", section: "DS-2B", mentor: "Mr M Srinivasulu", attendance: 84, status: "Regular" as const },
      { rollNo: "23071A6760", name: "G. Keerthana", section: "DS-2B", mentor: "Mr M Srinivasulu", attendance: 90, status: "Regular" as const },
      { rollNo: "23071A6761", name: "H. Vignesh", section: "DS-2B", mentor: "Mr M Yadaiah", attendance: 76, status: "Regular" as const },
      { rollNo: "23071A6762", name: "J. Deepthi", section: "DS-2B", mentor: "Mr M Yadaiah", attendance: 93, status: "Regular" as const },
      { rollNo: "23071A67B5", name: "K. Karthik", section: "DS-2C", mentor: "Mr K Bikshapathi", attendance: 87, status: "Regular" as const },
      { rollNo: "23071A67B6", name: "L. Priyanka", section: "DS-2C", mentor: "Mr K Bikshapathi", attendance: 89, status: "Regular" as const },
      { rollNo: "23071A67B7", name: "M. Sandeep", section: "DS-2C", mentor: "Mrs G Sushma", attendance: 74, status: "Regular" as const },
      { rollNo: "23071A67B8", name: "N. Varshini", section: "DS-2C", mentor: "Mrs G Sushma", attendance: 91, status: "Regular" as const },
    ],
    faculty: [
      { name: "Dr. A. Balaram", key: "116", designation: "Associate Professor & In-Charge (II-A)", courses: "JAVA, JAVA/DBMS LAB", sections: "DS-2A", erp: "EMP-SECDS116", phone: "+91 98490 12360" },
      { name: "Mr M Srinivasulu", key: "105", designation: "Assistant Professor & In-Charge (II-B)", courses: "SE, SE/JAVA LAB", sections: "DS-2A, DS-2B", erp: "EMP-SECDS105", phone: "+91 98490 12349" },
      { name: "Mr K Bikshapathi", key: "107", designation: "Assistant Professor & In-Charge (II-C)", courses: "SE, SE/DBMS LAB", sections: "DS-2C", erp: "EMP-SECDS107", phone: "+91 98490 12351" },
      { name: "Mr M Yadaiah", key: "104", designation: "Assistant Professor", courses: "JAVA, JAVA/DBMS LAB", sections: "DS-2B, DS-2C", erp: "EMP-SECDS104", phone: "+91 98490 12348" },
      { name: "Mrs. CH. Naga Rohini", key: "101", designation: "Assistant Professor", courses: "COA", sections: "DS-2A, DS-2B, DS-2C", erp: "EMP-SECDS101", phone: "+91 98490 12345" },
      { name: "Mrs Ch Vijaya Lakshmi", key: "113", designation: "Assistant Professor", courses: "DBMS", sections: "DS-2A, DS-2B", erp: "EMP-SECDS113", phone: "+91 98490 12357" },
      { name: "Mrs G Sushma", key: "108", designation: "Assistant Professor", courses: "DBMS", sections: "DS-2C", erp: "EMP-SECDS108", phone: "+91 98490 12352" },
      { name: "Mr. Rakesh Goud", key: "118", designation: "Assistant Professor", courses: "MSF", sections: "DS-2A, DS-2B, DS-2C", erp: "EMP-SECDS118", phone: "+91 98490 12362" },
      { name: "Mrs K Srinija", key: "114", designation: "Assistant Professor", courses: "SDC, JAVA LAB", sections: "DS-2A, DS-2C", erp: "EMP-SECDS114", phone: "+91 98490 12358" },
      { name: "Dr. Sri Hari VLN", key: "119", designation: "Associate Professor", courses: "CM LAB", sections: "DS-2B", erp: "EMP-SECDS119", phone: "+91 98490 12363" },
    ],
  },
  III: {
    year: "III" as const,
    title: "III Year B.Tech — Computer Science & Engineering (Data Science)",
    academicYear: "2026 – 2027 (Semesters V & VI)",
    batch: "2023 – 2027 Batch",
    courses: [
      { code: "IDS", title: "Introduction to Data Science", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "Data Science Lifecycle, Exploratory Data Analysis, Feature Engineering, Supervised Learning" },
      { code: "CN", title: "Computer Networks", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "OSI & TCP/IP Reference Models, Routing Protocols (OSPF, BGP), Congestion Control, Sockets" },
      { code: "WP", title: "Web Programming", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Modern JavaScript (ES6+), React.js Component Architecture, Node.js REST APIs" },
      { code: "DEVOPS", title: "DevOps Practices & CI/CD", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Git Version Control, Docker Containers, Kubernetes Cluster Management, Jenkins CI/CD" },
      { code: "ADA", title: "Analysis & Design of Algorithms", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Divide & Conquer, Dynamic Programming, Greedy Algorithms, Graph Algorithms, NP-Completeness" },
      { code: "ARQA", title: "Aptitude, Reasoning & Quantitative Ability", type: "Skill", credits: 2, hours: "2 Hrs / Week", syllabusBrief: "Campus Recruitment Preparation, Quantitative Mathematics, Verbal & Logical Reasoning" },
      { code: "KAFKA", title: "Stream Processing with Apache Kafka", type: "Theory", credits: 2, hours: "2 Hrs / Week", syllabusBrief: "Publish-Subscribe Messaging, Topics & Partitions, Kafka Streams, Real-Time Ingestion" },
      { code: "CN/R PROG LAB", title: "Computer Networks & R Programming Lab", type: "Practical", credits: 2, hours: "3 Hrs / Week", syllabusBrief: "Network Simulation via Cisco Packet Tracer & Statistical Data Modeling in R" },
    ],
    sections: [
      { name: "Section III-A", key: "DS-3A", room: "Hall 411", incharge: "Mrs G Sushma", inchargeKey: "108", strength: 62, rollRange: "22071A6701 – 22071A6762", crName: "N. Sai Charan (22071A6731)" },
      { name: "Section III-B", key: "DS-3B", room: "Hall 412", incharge: "Mr T Shravan Kumar", inchargeKey: "106", strength: 60, rollRange: "22071A6763 – 22071A67C2", crName: "K. Divya Sree (22071A6789)" },
      { name: "Section III-C", key: "DS-3C", room: "Hall 417", incharge: "Mrs A Sravanthi", inchargeKey: "109", strength: 57, rollRange: "22071A67C3 – 22071A67H0", crName: "R. Akhil Varma (22071A67D5)" },
    ],
    students: [
      { rollNo: "22071A6701", name: "A. Vinay Kumar", section: "DS-3A", mentor: "Mrs G Sushma", attendance: 86, status: "Regular" as const },
      { rollNo: "22071A6702", name: "B. Manasa", section: "DS-3A", mentor: "Mrs G Sushma", attendance: 91, status: "Regular" as const },
      { rollNo: "22071A6703", name: "C. Sai Kiran", section: "DS-3A", mentor: "Mrs K Sneha", attendance: 83, status: "Regular" as const },
      { rollNo: "22071A6704", name: "D. Akhila", section: "DS-3A", mentor: "Mrs K Sneha", attendance: 94, status: "Regular" as const },
      { rollNo: "22071A6763", name: "E. Pradeep", section: "DS-3B", mentor: "Mr T Shravan Kumar", attendance: 89, status: "Regular" as const },
      { rollNo: "22071A6764", name: "F. Mounika", section: "DS-3B", mentor: "Mr T Shravan Kumar", attendance: 87, status: "Regular" as const },
      { rollNo: "22071A6765", name: "G. Charan Teja", section: "DS-3B", mentor: "Mr Miskeen Ali", attendance: 79, status: "Regular" as const },
      { rollNo: "22071A67C3", name: "H. Sravani", section: "DS-3C", mentor: "Mrs A Sravanthi", attendance: 92, status: "Regular" as const },
      { rollNo: "22071A67C4", name: "J. Naveen", section: "DS-3C", mentor: "Mrs A Sravanthi", attendance: 85, status: "Regular" as const },
      { rollNo: "22071A67C5", name: "K. Rithika", section: "DS-3C", mentor: "Mrs B Gayathri", attendance: 90, status: "Regular" as const },
    ],
    faculty: [
      { name: "Mr T Shravan Kumar", key: "106", designation: "Assistant Professor & In-Charge (III-B)", courses: "IDS, R PROG LAB", sections: "DS-3A, DS-3B", erp: "EMP-SECDS106", phone: "+91 98490 12350" },
      { name: "Mrs G Sushma", key: "108", designation: "Assistant Professor & In-Charge (III-A)", courses: "WP", sections: "DS-3A, DS-3B", erp: "EMP-SECDS108", phone: "+91 98490 12352" },
      { name: "Mrs A Sravanthi", key: "109", designation: "Assistant Professor & In-Charge (III-C)", courses: "IDS, R-LAB", sections: "DS-3C", erp: "EMP-SECDS109", phone: "+91 98490 12353" },
      { name: "Mrs K Sneha", key: "110", designation: "Assistant Professor", courses: "CN, CN LAB", sections: "DS-3A, DS-3B", erp: "EMP-SECDS110", phone: "+91 98490 12354" },
      { name: "Mrs B Gayathri", key: "111", designation: "Assistant Professor", courses: "CN", sections: "DS-3C", erp: "EMP-SECDS111", phone: "+91 98490 12355" },
      { name: "Mr Miskeen Ali", key: "103", designation: "Assistant Professor", courses: "DEVOPS", sections: "DS-3A, DS-3B, DS-3C", erp: "EMP-SECDS103", phone: "+91 98490 12347" },
      { name: "Dr. Md Abdul Azeem", key: "117", designation: "Associate Professor", courses: "ADA", sections: "DS-3A, DS-3B, DS-3C", erp: "EMP-SECDS117", phone: "+91 98490 12361" },
      { name: "Mrs. Swathi", key: "123", designation: "Assistant Professor", courses: "ARQA", sections: "DS-3A, DS-3B, DS-3C", erp: "EMP-SECDS123", phone: "+91 98490 12367" },
      { name: "Mrs K Srinija", key: "114", designation: "Assistant Professor", courses: "WP", sections: "DS-3C", erp: "EMP-SECDS114", phone: "+91 98490 12358" },
      { name: "Mrs K Ramya", key: "112", designation: "Assistant Professor", courses: "KAFKA", sections: "DS-3A", erp: "EMP-SECDS112", phone: "+91 98490 12356" },
    ],
  },
  IV: {
    year: "IV" as const,
    title: "IV Year B.Tech — Computer Science & Engineering (Data Science)",
    academicYear: "2026 – 2027 (Semesters VII & VIII)",
    batch: "2022 – 2026 Batch",
    courses: [
      { code: "PA", title: "Predictive Analytics", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "Time Series Forecasting, ARIMA, Random Forests, Gradient Boosting (XGBoost), Model Validation" },
      { code: "WSMA", title: "Web Services & Micro-services Architecture", type: "Theory", credits: 4, hours: "4 Hrs / Week", syllabusBrief: "SOAP & RESTful APIs, Spring Boot Microservices, Service Discovery, API Gateway, Docker" },
      { code: "NLP", title: "Natural Language Processing", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Tokenization, POS Tagging, Word Embeddings (Word2Vec, GloVe), Transformers, BERT / GPT" },
      { code: "CC", title: "Cloud Computing", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "AWS / Azure Infrastructure, Serverless Computing, IAM, Cloud Security, Load Balancing" },
      { code: "OE", title: "Open Elective (Managerial Economics)", type: "Theory", credits: 3, hours: "3 Hrs / Week", syllabusBrief: "Demand Analysis, Cost-Volume-Profit Analysis, Market Structures, Project Capital Budgeting" },
      { code: "PS-I", title: "Project Work Stage - I", type: "Practical", credits: 4, hours: "6 Hrs / Week", syllabusBrief: "Capstone Project Problem Formulation, Literature Survey, Architecture Design & Prototype" },
      { code: "PA LAB", title: "Predictive Analytics Laboratory", type: "Practical", credits: 2, hours: "3 Hrs / Week", syllabusBrief: "Scikit-Learn, PyTorch, Model Deployment via FastAPI, Hyper-parameter Tuning" },
      { code: "WSMA LAB", title: "Micro-services Laboratory", type: "Practical", credits: 2, hours: "3 Hrs / Week", syllabusBrief: "Microservice Containerization, Postman Automation, Kafka Event-Driven Architecture" },
    ],
    sections: [
      { name: "Section IV-A", key: "DS-4A", room: "Hall 421", incharge: "Mr K Bikshapathi", inchargeKey: "107", strength: 64, rollRange: "21071A6701 – 21071A6764", crName: "G. Vamshi (21071A6729)" },
      { name: "Section IV-B", key: "DS-4B", room: "Hall 422", incharge: "Mr T Shravan Kumar", inchargeKey: "106", strength: 61, rollRange: "21071A6765 – 21071A67C5", crName: "K. Tejaswini (21071A6784)" },
    ],
    students: [
      { rollNo: "21071A6701", name: "A. Ajay Kumar", section: "DS-4A", mentor: "Mr K Bikshapathi", attendance: 90, status: "Regular" as const },
      { rollNo: "21071A6702", name: "B. Bhavani", section: "DS-4A", mentor: "Mr K Bikshapathi", attendance: 93, status: "Regular" as const },
      { rollNo: "21071A6703", name: "C. Chandra Sekhar", section: "DS-4A", mentor: "Mr T Shravan Kumar", attendance: 84, status: "Regular" as const },
      { rollNo: "21071A6704", name: "D. Divya", section: "DS-4A", mentor: "Mr T Shravan Kumar", attendance: 91, status: "Regular" as const },
      { rollNo: "21071A6765", name: "E. Eswar Prasad", section: "DS-4B", mentor: "Dr. C. Lakshmi Nath", attendance: 88, status: "Regular" as const },
      { rollNo: "21071A6766", name: "F. Fathima Begum", section: "DS-4B", mentor: "Dr. C. Lakshmi Nath", attendance: 95, status: "Regular" as const },
      { rollNo: "21071A6767", name: "G. Goutham", section: "DS-4B", mentor: "Mrs B Gayathri", attendance: 82, status: "Regular" as const },
      { rollNo: "21071A6768", name: "H. Haritha", section: "DS-4B", mentor: "Mrs K Ramya", attendance: 89, status: "Regular" as const },
    ],
    faculty: [
      { name: "Mr T Shravan Kumar", key: "106", designation: "Assistant Professor", courses: "PA, PA LAB", sections: "DS-4A, DS-4B", erp: "EMP-SECDS106", phone: "+91 98490 12350" },
      { name: "Mr K Bikshapathi", key: "107", designation: "Assistant Professor & In-Charge (IV-A)", courses: "WSMA, WSMA LAB", sections: "DS-4A, DS-4B", erp: "EMP-SECDS107", phone: "+91 98490 12351" },
      { name: "Mrs B Gayathri", key: "111", designation: "Assistant Professor", courses: "NLP", sections: "DS-4A, DS-4B", erp: "EMP-SECDS111", phone: "+91 98490 12355" },
      { name: "Mrs K Ramya", key: "112", designation: "Assistant Professor", courses: "CC", sections: "DS-4A, DS-4B", erp: "EMP-SECDS112", phone: "+91 98490 12356" },
      { name: "Dr. C. Lakshmi Nath", key: "122", designation: "Professor & HOD", courses: "OE", sections: "DS-4A, DS-4B", erp: "EMP-SECDS122", phone: "+91 98490 12366" },
      { name: "Mr Miskeen Ali", key: "103", designation: "Assistant Professor", courses: "PS-I", sections: "DS-4A", erp: "EMP-SECDS103", phone: "+91 98490 12347" },
      { name: "Dr. Md Abdul Azeem", key: "117", designation: "Associate Professor", courses: "PS-I", sections: "DS-4B", erp: "EMP-SECDS117", phone: "+91 98490 12361" },
    ],
  },
};

// Comprehensive Master Timetable across All Years & Sections (Yadaiah Solution)
const DEPARTMENT_MASTER_SCHEDULE: Record<
  string,
  Record<string, { subject: string; faculty: string; room: string }[]>
> = {
  Monday: {
    "DS-2A": [
      { subject: "JAVA/DBMS LAB", faculty: "Dr. A. Balaram", room: "Lab-101" },
      { subject: "JAVA/DBMS LAB", faculty: "Dr. A. Balaram", room: "Lab-101" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 401" },
      { subject: "JAVA", faculty: "Dr. A. Balaram", room: "Hall 401" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 401" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 401" },
    ],
    "DS-2B": [
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 402" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 402" },
      { subject: "SE/JAVA LAB", faculty: "Mr M Srinivasulu", room: "Lab-101" },
      { subject: "SE/JAVA LAB", faculty: "Mr M Srinivasulu", room: "Lab-101" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 402" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "DBMS", faculty: "Mrs G Sushma", room: "Hall 403" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 403" },
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 403" },
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 403" },
      { subject: "SE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 403" },
    ],
    "DS-3A": [
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 411" },
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 411" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 411" },
      { subject: "IDS", faculty: "Mr T Shravan Kumar", room: "Hall 411" },
      { subject: "CN/R PROG LAB", faculty: "Mrs K Sneha", room: "Lab-102" },
      { subject: "CN/R PROG LAB", faculty: "Mrs K Sneha", room: "Lab-102" },
    ],
    "DS-3B": [
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 412" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 412" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 412" },
      { subject: "COUNSELLING", faculty: "Mr T Shravan Kumar", room: "Hall 412" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 412" },
      { subject: "SPORTS", faculty: "Mr T Shravan Kumar", room: "Ground" },
    ],
    "DS-3C": [
      { subject: "CN", faculty: "Mrs B Gayathri", room: "Hall 417" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 417" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 417" },
      { subject: "LIBRARY", faculty: "Mr M Yadaiah", room: "Library" },
      { subject: "WP", faculty: "Mrs K Srinija", room: "Hall 417" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 417" },
    ],
    "DS-4A": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 421" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 421" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 421" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
    ],
    "DS-4B": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 422" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 422" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 422" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
    ],
  },
  Tuesday: {
    "DS-2A": [
      { subject: "SE/JAVA LAB", faculty: "Dr. A. Balaram", room: "Lab-101" },
      { subject: "SE/JAVA LAB", faculty: "Dr. A. Balaram", room: "Lab-101" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 401" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 401" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 401" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 401" },
    ],
    "DS-2B": [
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "JAVA/DBMS LAB", faculty: "Mr M Yadaiah", room: "Lab-101" },
      { subject: "JAVA/DBMS LAB", faculty: "Mr M Yadaiah", room: "Lab-101" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 402" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 403" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 403" },
      { subject: "SE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "COUNSELLING", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 403" },
      { subject: "DBMS", faculty: "Mrs G Sushma", room: "Hall 403" },
    ],
    "DS-3A": [
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 411" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 411" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 411" },
      { subject: "COUNSELLING", faculty: "Mrs G Sushma", room: "Hall 411" },
      { subject: "R PROG/CN LAB", faculty: "Mr T Shravan Kumar", room: "Lab-101" },
      { subject: "R PROG/CN LAB", faculty: "Mr T Shravan Kumar", room: "Lab-101" },
    ],
    "DS-3B": [
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 412" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 412" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 412" },
      { subject: "LIBRARY", faculty: "Mr T Shravan Kumar", room: "Library" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 412" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 412" },
    ],
    "DS-3C": [
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 417" },
      { subject: "CN", faculty: "Mrs B Gayathri", room: "Hall 417" },
      { subject: "WP", faculty: "Mrs K Srinija", room: "Hall 417" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 417" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 417" },
      { subject: "SPORTS", faculty: "Mr M Yadaiah", room: "Ground" },
    ],
    "DS-4A": [
      { subject: "PA LAB", faculty: "Mr T Shravan Kumar", room: "Lab-102" },
      { subject: "PA LAB", faculty: "Mr T Shravan Kumar", room: "Lab-102" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 421" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
      { subject: "SPORTS", faculty: "Mrs A Sravanthi", room: "Ground" },
    ],
    "DS-4B": [
      { subject: "PA LAB", faculty: "Mr T Shravan Kumar", room: "Lab-102" },
      { subject: "PA LAB", faculty: "Mr T Shravan Kumar", room: "Lab-102" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 422" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
      { subject: "SPORTS", faculty: "Mrs K Sneha", room: "Ground" },
    ],
  },
  Wednesday: {
    "DS-2A": [
      { subject: "DBMS/SE LAB", faculty: "Mrs Ch Vijaya Lakshmi", room: "Lab-101" },
      { subject: "DBMS/SE LAB", faculty: "Mrs Ch Vijaya Lakshmi", room: "Lab-101" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 401" },
      { subject: "JAVA", faculty: "Dr. A. Balaram", room: "Hall 401" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 401" },
      { subject: "SPORTS", faculty: "Mrs B Gayathri", room: "Ground" },
    ],
    "DS-2B": [
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 402" },
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 402" },
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 402" },
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 402" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 402" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "JAVA/SE LAB", faculty: "Mr M Yadaiah", room: "Lab-101" },
      { subject: "JAVA/SE LAB", faculty: "Mr M Yadaiah", room: "Lab-101" },
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 403" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 403" },
    ],
    "DS-3A": [
      { subject: "ARQA", faculty: "Mrs. Swathi", room: "Hall 411" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 411" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 411" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 411" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 411" },
      { subject: "SPORTS", faculty: "Mrs G Sushma", room: "Ground" },
    ],
    "DS-3B": [
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 412" },
      { subject: "ARQA", faculty: "Mrs. Swathi", room: "Hall 412" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 412" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 412" },
      { subject: "CN/R PROG LAB", faculty: "Mrs K Sneha", room: "Lab-101" },
      { subject: "CN/R PROG LAB", faculty: "Mrs K Sneha", room: "Lab-101" },
    ],
    "DS-3C": [
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 417" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 417" },
      { subject: "ARQA", faculty: "Mrs. Swathi", room: "Hall 417" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 417" },
      { subject: "WP", faculty: "Mrs K Srinija", room: "Hall 417" },
      { subject: "CN", faculty: "Mrs B Gayathri", room: "Hall 417" },
    ],
    "DS-4A": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 421" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 421" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 421" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 421" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
    ],
    "DS-4B": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 422" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 422" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 422" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 422" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
    ],
  },
  Thursday: {
    "DS-2A": [
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 401" },
      { subject: "SDC", faculty: "Mrs K Srinija", room: "Hall 401" },
      { subject: "JAVA", faculty: "Dr. A. Balaram", room: "Hall 401" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 401" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 401" },
      { subject: "COUNSELLING", faculty: "Mrs B Gayathri", room: "Hall 401" },
    ],
    "DS-2B": [
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 402" },
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 402" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 402" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 402" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 402" },
      { subject: "COUNSELLING", faculty: "Mrs K Ramya", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 403" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 403" },
      { subject: "SE/DBMS LAB", faculty: "Mr K Bikshapathi", room: "Lab-101" },
      { subject: "SE/DBMS LAB", faculty: "Mr K Bikshapathi", room: "Lab-101" },
      { subject: "SE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 403" },
    ],
    "DS-3A": [
      { subject: "IDS", faculty: "Mr T Shravan Kumar", room: "Hall 411" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 411" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 411" },
      { subject: "LIBRARY", faculty: "Mrs G Sushma", room: "Library" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 411" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 411" },
    ],
    "DS-3B": [
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 412" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 412" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 412" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 412" },
      { subject: "R PROG/CN LAB", faculty: "Mrs A Sravanthi", room: "Lab-101" },
      { subject: "R PROG/CN LAB", faculty: "Mrs A Sravanthi", room: "Lab-101" },
    ],
    "DS-3C": [
      { subject: "CN/R PROG LAB", faculty: "Mrs B Gayathri", room: "Lab-102" },
      { subject: "CN/R PROG LAB", faculty: "Mrs B Gayathri", room: "Lab-102" },
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 417" },
      { subject: "WP", faculty: "Mrs K Srinija", room: "Hall 417" },
    ],
    "DS-4A": [
      { subject: "WSMA LAB", faculty: "Mr K Bikshapathi", room: "Lab-102" },
      { subject: "WSMA LAB", faculty: "Mr K Bikshapathi", room: "Lab-102" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 421" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
    ],
    "DS-4B": [
      { subject: "WSMA LAB", faculty: "Mr K Bikshapathi", room: "Lab-102" },
      { subject: "WSMA LAB", faculty: "Mr K Bikshapathi", room: "Lab-102" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 422" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
    ],
  },
  Friday: {
    "DS-2A": [
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 401" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 401" },
      { subject: "JAVA", faculty: "Dr. A. Balaram", room: "Hall 401" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 401" },
      { subject: "APTITUDE", faculty: "Mr K Bikshapathi", room: "Hall 401" },
      { subject: "APTITUDE", faculty: "Mr K Bikshapathi", room: "Hall 401" },
    ],
    "DS-2B": [
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 402" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 402" },
      { subject: "DBMS", faculty: "Mrs Ch Vijaya Lakshmi", room: "Hall 402" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 402" },
      { subject: "SE", faculty: "Mr M Srinivasulu", room: "Hall 402" },
      { subject: "JAVA", faculty: "Mr M Yadaiah", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 403" },
      { subject: "DBMS", faculty: "Mrs G Sushma", room: "Hall 403" },
      { subject: "DBMS/JAVA LAB", faculty: "Mrs G Sushma", room: "Lab-101" },
      { subject: "DBMS/JAVA LAB", faculty: "Mrs G Sushma", room: "Lab-101" },
      { subject: "SE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "SPORTS", faculty: "Mr K Bikshapathi", room: "Ground" },
    ],
    "DS-3A": [
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 411" },
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 411" },
      { subject: "IDS", faculty: "Mr T Shravan Kumar", room: "Hall 411" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 411" },
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
    ],
    "DS-3B": [
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 412" },
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 412" },
      { subject: "CN", faculty: "Mrs K Sneha", room: "Hall 412" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 412" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 412" },
      { subject: "DEVOPS", faculty: "Mr Miskeen Ali", room: "Hall 412" },
    ],
    "DS-3C": [
      { subject: "R PROG/CN LAB", faculty: "Mrs A Sravanthi", room: "Lab-101" },
      { subject: "R PROG/CN LAB", faculty: "Mrs A Sravanthi", room: "Lab-101" },
      { subject: "COUNSELLING", faculty: "Mr M Yadaiah", room: "Hall 417" },
      { subject: "IDS", faculty: "Mrs A Sravanthi", room: "Hall 417" },
      { subject: "CN", faculty: "Mrs B Gayathri", room: "Hall 417" },
      { subject: "ADA", faculty: "Dr. Md Abdul Azeem", room: "Hall 417" },
    ],
    "DS-4A": [
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 421" },
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 421" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 421" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 421" },
      { subject: "PS-I", faculty: "Mr Miskeen Ali", room: "Hall 421" },
      { subject: "COUNSELLING", faculty: "Mrs A Sravanthi", room: "Hall 421" },
    ],
    "DS-4B": [
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 422" },
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 422" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 422" },
      { subject: "LIBRARY", faculty: "Mrs K Sneha", room: "Library" },
      { subject: "CC", faculty: "Mrs K Ramya", room: "Hall 422" },
      { subject: "COUNSELLING", faculty: "Mrs K Sneha", room: "Hall 422" },
    ],
  },
  Saturday: {
    "DS-2A": [
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "CM LAB", faculty: "Dr. Sri Hari VLN", room: "Lab-102" },
      { subject: "COA", faculty: "Mrs. CH. Naga Rohini", room: "Hall 401" },
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 401" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs B Gayathri", room: "Hall 401" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs B Gayathri", room: "Hall 401" },
    ],
    "DS-2B": [
      { subject: "APTITUDE", faculty: "Mrs K Ramya", room: "Hall 402" },
      { subject: "APTITUDE", faculty: "Mrs K Ramya", room: "Hall 402" },
      { subject: "DBMS/SE LAB", faculty: "Mrs Ch Vijaya Lakshmi", room: "Lab-101" },
      { subject: "DBMS/SE LAB", faculty: "Mrs Ch Vijaya Lakshmi", room: "Lab-101" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs K Ramya", room: "Hall 402" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs K Ramya", room: "Hall 402" },
    ],
    "DS-2C": [
      { subject: "MSF", faculty: "Mr. Rakesh Goud", room: "Hall 403" },
      { subject: "DBMS", faculty: "Mrs G Sushma", room: "Hall 403" },
      { subject: "APTITUDE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "APTITUDE", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr K Bikshapathi", room: "Hall 403" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr K Bikshapathi", room: "Hall 403" },
    ],
    "DS-3A": [
      { subject: "WP", faculty: "Mrs G Sushma", room: "Hall 411" },
      { subject: "IDS", faculty: "Mr T Shravan Kumar", room: "Hall 411" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 411" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 411" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs G Sushma", room: "Hall 411" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs G Sushma", room: "Hall 411" },
    ],
    "DS-3B": [
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
      { subject: "AECS LAB", faculty: "Ms. Vaidehi", room: "Lab-103" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 412" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 412" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr T Shravan Kumar", room: "Hall 412" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr T Shravan Kumar", room: "Hall 412" },
    ],
    "DS-3C": [
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 417" },
      { subject: "KAFKA", faculty: "Mrs K Ramya", room: "Hall 417" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 417" },
      { subject: "IPR", faculty: "Mr. Prateek", room: "Hall 417" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr M Yadaiah", room: "Hall 417" },
      { subject: "CLUB ACTIVITIES", faculty: "Mr M Yadaiah", room: "Hall 417" },
    ],
    "DS-4A": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 421" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 421" },
      { subject: "OE", faculty: "Dr. C. Lakshmi Nath", room: "Hall 421" },
      { subject: "LIBRARY", faculty: "Mrs A Sravanthi", room: "Library" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs A Sravanthi", room: "Hall 421" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs A Sravanthi", room: "Hall 421" },
    ],
    "DS-4B": [
      { subject: "PA", faculty: "Mr T Shravan Kumar", room: "Hall 422" },
      { subject: "WSMA", faculty: "Mr K Bikshapathi", room: "Hall 422" },
      { subject: "NLP", faculty: "Mrs B Gayathri", room: "Hall 422" },
      { subject: "PS-I", faculty: "Dr. Md Abdul Azeem", room: "Hall 422" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs K Sneha", room: "Hall 422" },
      { subject: "CLUB ACTIVITIES", faculty: "Mrs K Sneha", room: "Hall 422" },
    ],
  },
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

// IST (Asia/Kolkata) date string, YYYY-MM-DD. The server files attendance by IST
// day, so a UTC "today" misfiles submissions made between 00:00 and 05:30 IST.
function istDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export default function FacultyPortal() {
  const { mentor, role, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    "home" | "academics" | "delegate" | "assignment" | "mids" | "workload" | "mentoring" | "projects" | "events" | "reports" | "history" | "student_history" | "directory"
  >("home");

  // ── Class-Wise Attendance History State ──
  const [historyFromDate, setHistoryFromDate] = useState(() => istDate(-14));
  const [historyToDate, setHistoryToDate] = useState(() => istDate());
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "marked" | "skipped">("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Live Real-Time Clock & Date ──
  const [liveClock, setLiveClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDateStr = useMemo(() => {
    return liveClock.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  }, [liveClock]);

  const liveTimeStr = useMemo(() => {
    return liveClock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  }, [liveClock]);

  // ── Student-Wise History (Attendance Book) State ──
  const [selectedBookSection, setSelectedBookSection] = useState<string>("");
  const [selectedBookCourse, setSelectedBookCourse] = useState<string>("");
  const [bookFromDate, setBookFromDate] = useState(() => istDate(-14));
  const [bookToDate, setBookToDate] = useState(() => istDate());
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookData, setBookData] = useState<{
    section: string;
    courseCode: string;
    fromDate: string;
    toDate: string;
    dates: string[];
    students: any[];
  } | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

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
  const [attendanceAlreadyRecorded, setAttendanceAlreadyRecorded] = useState(false);

  // Master Day Timetable State (Yadaiah Solution)
  const [selectedDayForMasterTable, setSelectedDayForMasterTable] = useState<string>(() => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = dayNames[new Date().getDay()];
    return DEPARTMENT_MASTER_SCHEDULE[today] ? today : "Monday";
  });
  const [masterTableSearch, setMasterTableSearch] = useState<string>("");

  // Year-Wise Academic Directory State (Srinidhi Review Solution)
  const [selectedDirectoryYear, setSelectedDirectoryYear] = useState<"II" | "III" | "IV">("II");
  const [directorySectionFilter, setDirectorySectionFilter] = useState<string>("all");
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>("");
  const [directoryActiveTab, setDirectoryActiveTab] = useState<"all" | "courses" | "sections" | "students" | "faculty">("all");

  // Active Faculty Profile Resolution — reads logged-in mentor from auth context or localStorage
  const storedProfile = useMemo(() => {
    try {
      const raw = localStorage.getItem("qr_profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const resolvedKey = String(mentor?.key || storedProfile?.key || "").trim() || "101";
  const facultyProfile = FACULTY_DIRECTORY[resolvedKey] || {
    name: mentor?.name || storedProfile?.name || "Faculty Mentor",
    email: mentor?.email || storedProfile?.email || "",
    role: "Assistant Professor & Subject Faculty",
    designation: "Subject Faculty",
    department: "Computer Science & Engineering (Data Science)",
    key: resolvedKey,
    erp: `EMP-SECDS${resolvedKey}`,
    section: mentor?.section || "DS",
    phone: "+91 98490 12345",
    courses: [],
    mentees: [],
    workload: []
  };
  const facultyName = mentor?.name || storedProfile?.name || facultyProfile.name;
  const facultyDept = facultyProfile.department || "Computer Science & Engineering (Data Science)";

  // Use live data if loaded, fallback to directory
  const courses = liveCourses.length > 0 ? liveCourses : facultyProfile.courses;
  const mentees = liveMentees.length > 0 ? liveMentees : facultyProfile.mentees;
  const workload = liveWorkload.length > 0 ? liveWorkload : facultyProfile.workload;

  // Today's Classes State (Auto-filtered from Timetable with Real-Time Period Locking)
  type TodayClassItem = {
    id: string;
    scheduleId: number;
    secondaryScheduleId?: number | null;
    scheduleIds?: number[];
    isDoubleHourLab?: boolean;
    reassignmentStatus?: string;
    reassignment?: any;
    code: string;
    name: string;
    type: string;
    program: string;
    section: string;
    rawSection: string;
    year: string;
    room: string;
    startTime: string;
    endTime: string;
    startTimeFormatted?: string;
    endTimeFormatted?: string;
    slot: string;
    strength: number;
    isAttendanceTaken: boolean;
    attendedCount: number | null;
    session: any;
    isLive: boolean;
    timingStatus?: "live" | "upcoming" | "completed" | "future_day";
    isLocked?: boolean;
    unlocksAt?: string;
    statusLabel?: string;
  };

  const getInitialISTDate = () => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCodes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayIndex = ist.getUTCDay();
    const dateStr = ist.toISOString().split("T")[0];
    const hours = ist.getUTCHours();
    const mins = ist.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const timeStr = `${String(h12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm} IST`;
    return {
      date: dateStr,
      dayCode: dayCodes[dayIndex],
      dayName: days[dayIndex],
      currentTime: timeStr,
    };
  };

  const initialIST = getInitialISTDate();

  const [todayClassesInfo, setTodayClassesInfo] = useState<{
    date: string;
    dayCode: string;
    dayName: string;
    currentTime?: string;
    totalScheduledToday: number;
    attendanceTakenCount: number;
    classes: TodayClassItem[];
    nextWorkingDay?: {
      dayCode: string;
      dayName: string;
      classes: TodayClassItem[];
    } | null;
  }>({
    date: initialIST.date,
    dayCode: initialIST.dayCode,
    dayName: initialIST.dayName,
    currentTime: initialIST.currentTime,
    totalScheduledToday: 0,
    attendanceTakenCount: 0,
    classes: [],
    nextWorkingDay: null,
  });

  const [todayClassesLoaded, setTodayClassesLoaded] = useState(false);

  // Effective today classes: uses live API data directly, consolidating 2-hour lab periods (Srinija feedback)
  const effectiveTodayClasses: TodayClassItem[] = useMemo(() => {
    if (todayClassesInfo?.classes && todayClassesInfo.classes.length > 0) {
      const rawList = [...todayClassesInfo.classes];
      const merged: TodayClassItem[] = [];

      for (let i = 0; i < rawList.length; i++) {
        const current = rawList[i];
        const next = rawList[i + 1];

        const isLab = (current.code || "").toUpperCase().includes("LAB") || (current.name || "").toUpperCase().includes("LAB") || current.type === "Practical";

        if (
          isLab &&
          next &&
          (next.code === current.code || next.name === current.name) &&
          next.section === current.section &&
          !current.isDoubleHourLab &&
          !next.isDoubleHourLab
        ) {
          // Merge two consecutive periods for the same lab into one single 2-hour card
          const currentStart = current.slot ? current.slot.split("–")[0].trim() : "11:10 AM";
          const nextEnd = next.slot && next.slot.includes("–") ? next.slot.split("–")[1].trim() : next.slot;
          merged.push({
            ...current,
            id: current.id,
            scheduleId: Number(current.scheduleId || current.id) || 0,
            secondaryScheduleId: next.scheduleId ? Number(next.scheduleId) : (next.id ? Number(next.id) : null),
            slot: `${currentStart} – ${nextEnd}`,
            isDoubleHourLab: true,
            isAttendanceTaken: current.isAttendanceTaken || next.isAttendanceTaken,
            attendedCount: current.attendedCount ?? next.attendedCount,
          });
          i++; // Skip the duplicate second hour
        } else {
          merged.push(current);
        }
      }

      return merged.sort((a, b) => {
        const aIsLive = a.timingStatus === "live" || a.isLive;
        const bIsLive = b.timingStatus === "live" || b.isLive;
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;

        const aIsUpcoming = a.timingStatus === "upcoming" || a.isLocked;
        const bIsUpcoming = b.timingStatus === "upcoming" || b.isLocked;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        return 0;
      });
    }

    return [];
  }, [todayClassesInfo.classes]);

  // ── Refetch all live faculty data in parallel (blazing fast) ──
  const refetchFacultyAll = useCallback(async () => {
    setLoadingData(true);
    try {
      await Promise.allSettled([
        // 1. Today's live classes and real attendance status
        customFetch<any>("/api/faculty/today-classes")
          .then((todayData) => {
            if (todayData && Array.isArray(todayData.classes)) {
              setTodayClassesInfo(todayData);
            }
          })
          .catch((e) => console.warn("Could not load /api/faculty/today-classes:", e)),

        // 2. Live courses
        customFetch<Course[]>("/api/faculty/courses")
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setLiveCourses(data);
            }
          })
          .catch((e) => console.warn("Could not load /api/faculty/courses:", e)),

        // 3. Live mentees
        customFetch<any[]>("/api/mentor/students")
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const mappedMentees: MenteeStudent[] = data.map((s: any, idx: number) => ({
                id: s.id || s.user?.id || idx + 1,
                name: s.name || s.user?.name || `Student ${idx + 1}`,
                rollNumber: s.rollNumber || s.uniqueId || s.unique_id || s.user?.uniqueId || s.roll_number || `24N81A${6753 + idx}`,
                section: s.section || s.user?.section || facultyProfile.section || "DS III/I/B",
                studentPhone: s.phone || s.user?.phone || "9876543210",
                fatherPhone: s.fatherPhone || s.father_phone || s.user?.fatherPhone || "9123456780",
                motherPhone: s.motherPhone || s.mother_phone,
                attendancePercent: s.attendancePercent ?? s.attendance_percent ?? 0,
                backlogs: s.backlogs ?? 0,
                mentorNotes: s.remarks || "Regular student",
              }));
              setLiveMentees(mappedMentees);
            }
          })
          .catch((e) => console.warn("Could not load /api/mentor/students:", e)),

        // 4. Workload grid
        customFetch<any[]>("/api/faculty/workload-grid")
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setLiveWorkload(data);
            }
          })
          .catch((e) => console.warn("Could not load /api/faculty/workload-grid:", e)),
      ]);
    } catch (err) {
      console.error("Error loading live faculty data:", err);
    } finally {
      setLoadingData(false);
      setTodayClassesLoaded(true);
    }
  }, [facultyProfile.section]);

  // Fetch live courses, mentees, workload, and today's classes from API
  useEffect(() => {
    refetchFacultyAll();
  }, [resolvedKey, refetchFacultyAll]);

  // ── Fetch Class-Wise Attendance History ──
  const fetchAttendanceHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await customFetch<any[]>(
        `/api/faculty/attendance-history?from=${historyFromDate}&to=${historyToDate}&status=${historyStatusFilter}`
      );
      if (Array.isArray(data)) {
        setHistoryRecords(data);
      }
    } catch (e) {
      console.warn("Could not load attendance history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Fetch Student-Wise History (Attendance Book) ──
  const fetchStudentAttendanceBook = async () => {
    setLoadingBook(true);
    try {
      const sec = selectedBookSection || (courses[0]?.section || "DS-4A");
      const code = selectedBookCourse || (courses[0]?.code || "ALL");
      const data = await customFetch<any>(
        `/api/faculty/student-attendance-book?section=${encodeURIComponent(sec)}&courseCode=${encodeURIComponent(code)}&from=${bookFromDate}&to=${bookToDate}`
      );
      if (data && Array.isArray(data.students)) {
        setBookData(data);
      }
    } catch (e) {
      console.warn("Could not load student attendance book:", e);
    } finally {
      setLoadingBook(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchAttendanceHistory();
    }
  }, [activeTab, historyFromDate, historyToDate, historyStatusFilter]);

  useEffect(() => {
    if (activeTab === "student_history") {
      fetchStudentAttendanceBook();
    }
  }, [activeTab, selectedBookSection, selectedBookCourse, bookFromDate, bookToDate]);

  // Set default book course when courses load
  useEffect(() => {
    if (courses.length > 0 && !selectedBookSection) {
      setSelectedBookSection(courses[0].section);
      setSelectedBookCourse(courses[0].code);
    }
  }, [courses]);

  // ── Subject-Wise Class Counts & Attendance Summary Breakdown ──
  const historySubjectSummary = useMemo(() => {
    const map = new Map<
      string,
      { subject: string; code: string; section: string; total: number; marked: number; skipped: number; totalPresent: number }
    >();

    historyRecords.forEach((r) => {
      const key = `${r.subject}_${r.section}`;
      if (!map.has(key)) {
        map.set(key, {
          subject: r.subject,
          code: r.code,
          section: r.section,
          total: 0,
          marked: 0,
          skipped: 0,
          totalPresent: 0,
        });
      }
      const item = map.get(key)!;
      item.total++;
      if (r.status === "marked") {
        item.marked++;
        item.totalPresent += (r.presentCount || 0);
      } else if (r.status === "skipped") {
        item.skipped++;
      }
    });

    return Array.from(map.values());
  }, [historyRecords]);

  // ── Filtered Attendance History Records ──
  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((r) => {
      if (historyStatusFilter !== "all" && r.status !== historyStatusFilter) return false;
      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.toLowerCase().trim();
      return (
        r.subject?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.section?.toLowerCase().includes(q) ||
        r.date?.toLowerCase().includes(q) ||
        r.dayName?.toLowerCase().includes(q) ||
        r.slot?.toLowerCase().includes(q) ||
        r.room?.toLowerCase().includes(q)
      );
    });
  }, [historyRecords, historyStatusFilter, historySearchQuery]);

  // ── Download Class-Wise Attendance History CSV ──
  const downloadHistoryCSV = () => {
    const toExport = filteredHistoryRecords.length > 0 ? filteredHistoryRecords : historyRecords;
    if (!toExport || toExport.length === 0) {
      toast({ title: "No Data", description: "No records found in this date range to export." });
      return;
    }
    const headers = ["Date", "Day", "Time Slot", "Subject", "Course Code", "Section", "Room", "Status", "Present Count", "Total Strength"];
    const rows = toExport.map((r) => [
      `"${r.date}"`,
      `"${r.dayName}"`,
      `"${r.slot}"`,
      `"${r.subject}"`,
      `"${r.code}"`,
      `"${r.section}"`,
      `"${r.room}"`,
      `"${r.status === "marked" ? "Marked" : r.status === "skipped" ? "Skipped / Unmarked" : "Upcoming"}"`,
      r.presentCount || 0,
      r.totalStrength || 55,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_Attendance_History_${historyFromDate}_to_${historyToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast({ title: "✓ History Downloaded", description: `Exported ${toExport.length} records.` });
  };

  // ── Download Student-Wise Attendance Book Register CSV ──
  const downloadAttendanceBookCSV = () => {
    if (!bookData || !bookData.students || bookData.students.length === 0) {
      toast({ title: "No Data", description: "No student records to export." });
      return;
    }
    const dateHeaders = (bookData.dates || []).map((d) => `"${d}"`);
    const headers = ["S.No", "Roll Number", "Student Name", "Section", ...dateHeaders, "Total Classes", "Present Count", "Absent Count", "Attendance %"];
    const rows = bookData.students.map((s) => {
      const dateCols = (bookData.dates || []).map((d) => `"${s.attendanceByDate?.[d] || "-"}"`);
      return [
        s.sNo,
        `"${s.rollNumber}"`,
        `"${s.name}"`,
        `"${s.section}"`,
        ...dateCols,
        s.totalClasses,
        s.presentCount,
        s.absentCount,
        `"${s.percentage}%"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Book_${bookData.section}_${bookData.fromDate}_to_${bookData.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast({ title: "✓ Attendance Book Downloaded", description: `Exported ${bookData.students.length} students across ${(bookData.dates || []).length} class dates.` });
  };

  // ── Print Cumulative Attendance Register / Save PDF (Sneha Feedback) ──
  const handlePrintCumulativeAttendance = () => {
    if (!bookData || !bookData.students || bookData.students.length === 0) {
      toast({ title: "No Data", description: "No student records to print." });
      return;
    }
    window.print();
  };

  // Post Attendance Modal State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("slot_0");
  const [attendanceMode, setAttendanceMode] = useState<"regular" | "adjusted">("regular");
  const [attendanceDate, setAttendanceDate] = useState(istDate());
  const [studentRoster, setStudentRoster] = useState<StudentAttendanceRecord[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Today's Day Name
  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  }, []);

  // Today's Live Class Slots for the selected course
  const todaysClassSlots = useMemo(() => {
    if (!selectedCourseForAttendance) return [];
    const todayWork = (workload || []).find(
      (w) => (w?.day || "").toLowerCase() === (todayDayName || "").toLowerCase()
    );
    if (todayWork && Array.isArray(todayWork.periods) && todayWork.periods.length > 0) {
      const courseCodeUpper = (selectedCourseForAttendance.code || "").toUpperCase().replace(/\s+/g, "");
      const courseNameUpper = (selectedCourseForAttendance.name || "").toUpperCase();
      
      const matching = todayWork.periods.filter((p) => {
        const pSubj = (p?.subject || "").toUpperCase().replace(/\s+/g, "");
        return pSubj.includes(courseCodeUpper) || courseCodeUpper.includes(pSubj) || (p?.subject && courseNameUpper.includes(p.subject.toUpperCase()));
      });

      if (matching.length > 0) {
        return matching.map((p, idx) => ({
          id: `slot_${idx}`,
          label: p?.slot || "09:00 AM – 10:00 AM",
          room: p?.room || "Hall 412",
          subject: p?.subject || selectedCourseForAttendance.name,
          section: p?.section || selectedCourseForAttendance.section,
          isTodayLive: true,
        }));
      }

      return todayWork.periods.map((p, idx) => ({
        id: `slot_${idx}`,
        label: p?.slot || "09:00 AM – 10:00 AM",
        room: p?.room || "Hall 412",
        subject: p?.subject || selectedCourseForAttendance.name,
        section: p?.section || selectedCourseForAttendance.section,
        isTodayLive: true,
      }));
    }

    // Default fallback if no class scheduled today in timetable
    return [
      {
        id: "slot_0",
        label: "09:00 AM – 10:00 AM",
        room: selectedCourseForAttendance.room || "Hall",
        subject: selectedCourseForAttendance.name,
        section: selectedCourseForAttendance.section,
        isTodayLive: true,
      },
      {
        id: "slot_1",
        label: "11:10 AM – 12:10 PM",
        room: selectedCourseForAttendance.room || "Hall",
        subject: selectedCourseForAttendance.name,
        section: selectedCourseForAttendance.section,
        isTodayLive: true,
      },
    ];
  }, [selectedCourseForAttendance, workload, todayDayName]);

  // Initialize Real Students when Course is picked
  const openAttendanceModal = async (course: Course, recordDate?: string) => {
    setSelectedCourseForAttendance(course);
    setSelectedPeriod("slot_0");
    setLoadingRoster(true);
    setAttendanceModalOpen(true);
    setAttendanceAlreadyRecorded(false);

    const targetDate = recordDate || todayClassesInfo?.date || istDate();

    try {
      // 1. Try fetching real section students from API
      try {
        const data = await customFetch<any[]>(
          `/api/faculty/section-students?section=${encodeURIComponent(course.section || "")}&scheduleId=${encodeURIComponent(course.id || "")}&date=${encodeURIComponent(targetDate)}`
        );
        if (Array.isArray(data) && data.length > 0) {
          const isRecorded = data[0]?.isRecorded === true;
          setAttendanceAlreadyRecorded(isRecorded);
          const records: StudentAttendanceRecord[] = data.map((s: any, idx: number) => ({
            id: s.id || idx + 1,
            sNo: idx + 1,
            rollNumber: s.rollNumber || s.unique_id || s.uniqueId || `Student-${idx + 1}`,
            name: s.name || `Student ${idx + 1}`,
            heldCount: s.heldCount || 22,
            totalHeld: s.totalHeld || 24,
            status: s.status !== undefined ? s.status : true,
            phone: s.phone || "9876543210",
            fatherPhone: s.fatherPhone || s.father_phone || "9123456780",
          }));
          setStudentRoster(records);
          setLoadingRoster(false);
          return;
        }
      } catch (e) {
        console.warn("Could not load /api/faculty/section-students:", e);
      }

      // 2. Try fetching from /mentor/students fallback
      try {
        const mData = await customFetch<any[]>(`/api/mentor/students?section=${encodeURIComponent(course.section || "")}`);
        if (Array.isArray(mData) && mData.length > 0) {
          const records: StudentAttendanceRecord[] = mData.map((s: any, idx: number) => ({
            id: s.id || s.user?.id || idx + 1,
            sNo: idx + 1,
            rollNumber: s.rollNumber || s.uniqueId || s.user?.uniqueId || `Student-${idx + 1}`,
            name: s.name || s.user?.name || `Student ${idx + 1}`,
            heldCount: 22,
            totalHeld: 24,
            status: true,
            phone: s.phone || s.user?.phone || "9876543210",
            fatherPhone: s.fatherPhone || s.user?.fatherPhone || "9123456780",
          }));
          setStudentRoster(records);
          setLoadingRoster(false);
          return;
        }
      } catch (e) {
        console.warn("Could not load /api/mentor/students fallback:", e);
      }

      // 3. Fallback to live mentees only if they match this course section
      const matchingMentees = liveMentees.filter((m) => {
        if (!m.section) return false;
        const normCourse = (course.section || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
        const normMentee = m.section.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
        return normMentee.includes(normCourse) || normCourse.includes(normMentee);
      });
      if (matchingMentees.length > 0) {
        const records: StudentAttendanceRecord[] = matchingMentees.map((s, idx) => ({
          id: s.id,
          sNo: idx + 1,
          rollNumber: s.rollNumber,
          name: s.name,
          heldCount: 22,
          totalHeld: 24,
          status: true,
          phone: s.studentPhone,
          fatherPhone: s.fatherPhone,
        }));
        setStudentRoster(records);
      } else {
        setStudentRoster([]);
      }
    } catch (err) {
      console.error("Error loading student roster:", err);
      setStudentRoster([]);
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
      const currentSlotObj = todaysClassSlots.find((p) => p.id === selectedPeriod) || todaysClassSlots[0];
      const presentCount = studentRoster.filter((s) => s.status).length;
      const totalCount = studentRoster.length;

      // Submit to real Supabase attendance backend (including 2nd period for 2-hour labs)
      const secSchedId = (selectedCourseForAttendance as any).secondaryScheduleId;
      await customFetch("/api/mentor/submit-attendance", {
        method: "POST",
        body: JSON.stringify({
          scheduleId: parseInt(selectedCourseForAttendance.id) || 1,
          secondaryScheduleId: secSchedId ? parseInt(secSchedId) : undefined,
          date: attendanceDate,
          period: currentSlotObj?.label || selectedCourseForAttendance.slot || "Live Class",
          students: studentRoster.map((s) => ({
            studentId: s.id,
            markedPresent: s.status,
          })),
        }),
      });

      toast({
        title: "✓ Attendance Posted to Supabase!",
        description: `Successfully saved ${selectedCourseForAttendance.code} (${currentSlotObj?.label}) for ${attendanceDate}. Present: ${presentCount} / ${totalCount}.`,
      });

      // Refetch today's classes to immediately reflect the attendance status
      try {
        const refreshed = await customFetch<any>("/api/faculty/today-classes");
        if (refreshed && Array.isArray(refreshed.classes)) {
          setTodayClassesInfo(refreshed);
        }
      } catch {}

      setAttendanceModalOpen(false);
    } catch (err: any) {
      // Submission failed — the roster was NOT saved. Keep the modal open so
      // the faculty member can retry instead of silently losing attendance.
      let msg = err?.message || err?.error || "Could not reach the server.";
      if (typeof msg === "string" && (msg.includes("<") || msg.includes("<!DOCTYPE"))) {
        msg = "Server error — attendance NOT saved. Please retry.";
      }
      toast({
        variant: "destructive",
        title: "Attendance NOT Saved",
        description: `${msg} Nothing was recorded for ${selectedCourseForAttendance?.code ?? "this class"} — please try again.`,
      });
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

  // Class Reassignment / Delegation State & Faculty-to-Faculty Approval Workflow
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignCourse, setReassignCourse] = useState<Course | null>(null);
  const [reassignToFacultyKey, setReassignToFacultyKey] = useState("108");
  const [reassignSubject, setReassignSubject] = useState("");
  const [reassignReason, setReassignReason] = useState("Official Duty / Department Meeting");
  const [reassignCustomReason, setReassignCustomReason] = useState("");
  const [submittingReassignment, setSubmittingReassignment] = useState(false);
  const [cancellingReassignment, setCancellingReassignment] = useState(false);
  const [reassignmentsList, setReassignmentsList] = useState<any[]>([]);
  const [loadingReassignments, setLoadingReassignments] = useState(false);
  const [processingReassignId, setProcessingReassignId] = useState<string | null>(null);

  // Poll / fetch live reassignment requests for current faculty
  const fetchMyReassignments = useCallback(async () => {
    try {
      setLoadingReassignments(true);
      const res = await customFetch<any>(`/api/faculty/reassignments?facultyKey=${resolvedKey}`);
      if (Array.isArray(res)) {
        setReassignmentsList(res);
      } else if (res && Array.isArray(res.reassignments)) {
        setReassignmentsList(res.reassignments);
      }
    } catch (e) {
      console.warn("Could not fetch reassignments:", e);
    } finally {
      setLoadingReassignments(false);
    }
  }, [resolvedKey]);

  useEffect(() => {
    fetchMyReassignments();
    const timer = setInterval(fetchMyReassignments, 12000);
    return () => clearInterval(timer);
  }, [fetchMyReassignments]);

  const incomingRequests = useMemo(() => {
    return reassignmentsList.filter(
      (r: any) =>
        (r.toFacultyKey === resolvedKey ||
          (r.toFacultyName && facultyName && r.toFacultyName.toLowerCase().includes(facultyName.toLowerCase().replace(/^(mr|mrs|dr)\.?\s+/i, "")))) &&
        r.status === "pending"
    );
  }, [reassignmentsList, resolvedKey, facultyName]);

  const outgoingPendingRequests = useMemo(() => {
    return reassignmentsList.filter(
      (r: any) => r.fromFacultyKey === resolvedKey && r.status === "pending"
    );
  }, [reassignmentsList, resolvedKey]);

  const handleAcceptReassignment = async (reassignId: string) => {
    setProcessingReassignId(reassignId);
    try {
      await customFetch(`/api/faculty/reassignments/${reassignId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "accept", decidedBy: facultyName }),
      });
      toast({
        title: "Reassignment Accepted!",
        description: "The class period has been approved and added to your schedule.",
      });
      fetchMyReassignments();
      refetchFacultyAll();
      queryClient.invalidateQueries({ queryKey: ["faculty-today-classes"] });
      queryClient.invalidateQueries({ queryKey: ["layout-reassignments"] });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err?.message || "Could not accept reassignment request.",
        variant: "destructive",
      });
    } finally {
      setProcessingReassignId(null);
    }
  };

  const handleDeclineReassignment = async (reassignId: string) => {
    setProcessingReassignId(reassignId);
    try {
      await customFetch(`/api/faculty/reassignments/${reassignId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "decline", decidedBy: facultyName }),
      });
      toast({
        title: "Reassignment Declined",
        description: "The request has been declined.",
      });
      fetchMyReassignments();
      refetchFacultyAll();
      queryClient.invalidateQueries({ queryKey: ["faculty-today-classes"] });
      queryClient.invalidateQueries({ queryKey: ["layout-reassignments"] });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err?.message || "Could not decline reassignment request.",
        variant: "destructive",
      });
    } finally {
      setProcessingReassignId(null);
    }
  };

  const openReassignModal = (course: Course) => {
    setReassignCourse(course);
    const secKey = normalizeSectionKey(course.section);
    const roster = SECTION_FACULTY_ROSTER[secKey] || SECTION_FACULTY_ROSTER["DS-2A"];
    const otherFaculty = roster.find((f) => f.key !== resolvedKey) || roster[0];
    if (otherFaculty) {
      setReassignToFacultyKey(otherFaculty.key);
      setReassignSubject(otherFaculty.subject);
    }
    setReassignModalOpen(true);
  };

  const handleSendReassignment = async () => {
    if (!reassignCourse) return;
    setSubmittingReassignment(true);

    const targetFaculty = Object.values(FACULTY_DIRECTORY).find(
      (f) => f.key === reassignToFacultyKey
    );
    const targetName = targetFaculty?.name || "Substitute Faculty";

    const classSlot =
      effectiveTodayClasses.find((c) => c.code === reassignCourse.code || c.id === reassignCourse.id)?.slot ||
      "10:00 – 11:00";

    const reasonText = reassignReason === "Other" ? (reassignCustomReason || "Other Duty") : reassignReason;

    try {
      await customFetch("/api/faculty/reassignments", {
        method: "POST",
        body: JSON.stringify({
          date: attendanceDate || istDate(),
          slot: classSlot,
          scheduleId: reassignCourse.id,
          fromFacultyKey: resolvedKey || "106",
          fromFacultyName: facultyName || "Faculty Member",
          toFacultyKey: reassignToFacultyKey,
          toFacultyName: targetName,
          subject: reassignSubject || targetFaculty?.courses?.[0]?.code || reassignCourse.name,
          originalSubject: reassignCourse.name,
          year: reassignCourse.section?.includes("4") ? "IV" : reassignCourse.section?.includes("3") ? "III" : "II",
          section: reassignCourse.section,
          room: reassignCourse.room,
          reason: reasonText,
        }),
      });

      toast({
        title: "Reassignment Request Sent!",
        description: `Request sent to ${targetName} for ${reassignSubject || reassignCourse.name}. Waiting for their acceptance.`,
      });

      setReassignModalOpen(false);
      setAttendanceModalOpen(false);
      fetchMyReassignments();
      refetchFacultyAll();
      queryClient.invalidateQueries({ queryKey: ["faculty-today-classes"] });
      queryClient.invalidateQueries({ queryKey: ["layout-reassignments"] });
    } catch (err: any) {
      toast({
        title: "Reassignment Failed",
        description: err?.message || "Could not send reassignment request.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReassignment(false);
    }
  };

  const handleCancelReassignment = async (reassignId?: string) => {
    const idToCancel = reassignId || (reassignCourse as any)?.reassignment?.id || reassignCourse?.id;
    setCancellingReassignment(true);
    try {
      await customFetch(`/api/faculty/reassignments/${idToCancel || "active"}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          id: idToCancel,
          scheduleId: reassignCourse?.id,
          date: attendanceDate,
        }),
      });
      toast({
        title: "Request Cancelled",
        description: "Your substitution request has been cancelled.",
      });
      setReassignModalOpen(false);
      refetchFacultyAll();
      queryClient.invalidateQueries({ queryKey: ["faculty-today-classes"] });
      queryClient.invalidateQueries({ queryKey: ["layout-reassignments"] });
    } catch (err: any) {
      toast({
        title: "Cancel Failed",
        description: err?.message || "Could not cancel request.",
        variant: "destructive",
      });
    } finally {
      setCancellingReassignment(false);
    }
  };

  // Delegate Attendance State (Legacy tab)
  const [delegatedFaculty, setDelegatedFaculty] = useState("");
  const [delegatedCourse, setDelegatedCourse] = useState("");
  const [delegatedDate, setDelegatedDate] = useState(istDate());
  const [delegationsList, setDelegationsList] = useState<
    { id: string; course: string; section: string; date: string; delegatedTo: string; status: "Active" | "Completed" }[]
  >([]);

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatedFaculty || !delegatedCourse) return;
    setDelegationsList((prev) => [
      {
        id: `del_${Date.now()}`,
        course: delegatedCourse,
        section: facultyProfile.section || "DS",
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
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgCourse, setNewAsgCourse] = useState(courses[0]?.code || "COA");
  const [newAsgDueDate, setNewAsgDueDate] = useState("2026-09-12");
  const [newAsgMaxMarks, setNewAsgMaxMarks] = useState(10);
  const [selectedAsgForSubmissions, setSelectedAsgForSubmissions] = useState<AssignmentItem | null>(null);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle) return;
    const crs = courses.find((c) => c.code === newAsgCourse) || courses[0] || { code: "CRS", name: "Course", section: "DS", strength: 50 };
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
  const [selectedMidCourse, setSelectedMidCourse] = useState(courses[0]?.code || "COA");
  const [selectedMidExam, setSelectedMidExam] = useState<"Mid-1" | "Mid-2">("Mid-1");
  const [midStudentMarks, setMidStudentMarks] = useState<{
    [roll: string]: { partA: number; partB: number; assignment: number };
  }>({});

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
  const [projectsList, setProjectsList] = useState<ProjectBatch[]>([]);
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
      domain: newProjDomain || "Computer Science",
      team: [],
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
  const [eventsList, setEventsList] = useState<CampusEvent[]>([]);
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
          TOP APP HEADER BAR (DESKTOP ONLY)
      ───────────────────────────────────────────────────────────── */}
      <header className="hidden md:flex h-16 bg-white border-b border-slate-300 sticky top-0 z-30 items-center justify-between px-4 lg:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <span
              onClick={() => setActiveTab("home")}
              className="hover:text-emerald-700 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4 text-emerald-600" />
              <span>Home</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold capitalize" style={{ fontFamily: "var(--app-font-display)" }}>
              {activeTab === "home" ? "Faculty Dashboard" : activeTab}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/mentor")}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 hover:border-emerald-400 border border-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>QR Scanner View</span>
          </button>

          {/* Logged in Profile Badge */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-md bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs font-mono">
              {facultyName.charAt(0)}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>{facultyName}</p>
              <p className="text-[10px] text-slate-500 font-mono">{facultyProfile.designation}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE-ONLY VIEW (FOCUSED EXCLUSIVELY ON DATE, TIME & LIVE ATTENDANCE - CLEAN WHITE THEME)
      ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden flex-1 overflow-y-auto bg-slate-50 text-slate-900 p-4 space-y-4 min-h-screen">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-300 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs font-mono">
              {facultyName.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight" style={{ fontFamily: "var(--app-font-display)" }}>{facultyName}</h2>
              <p className="text-[11px] font-mono text-slate-500">Key {resolvedKey || "106"} &bull; CSE-DS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchFacultyAll()}
              className="p-2.5 rounded-md bg-white text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-all border border-slate-300 cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
              title="Reload / Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-emerald-600" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-md bg-white text-slate-700 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors border border-slate-300 cursor-pointer shadow-xs"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Date & Real-Time Clock Card */}
        <div className="relative overflow-hidden rounded-lg bg-white p-5 shadow-xs border border-slate-300">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
          <div className="flex items-center justify-between">
            <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Today&apos;s Live Attendance</span>
            </span>
            <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="mt-3">
            <p className="eyebrow text-slate-500">
              {liveDateStr || todayClassesInfo.dayName}
            </p>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1 font-mono">
              {liveTimeStr || todayClassesInfo.currentTime}
            </h1>
          </div>
        </div>

        {/* Today's Classes List (Attendance ONLY) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="eyebrow text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Today&apos;s Live Periods ({effectiveTodayClasses.length})</span>
            </h3>
            <span className="text-[11px] font-mono font-semibold text-slate-500">
              {effectiveTodayClasses.filter(c => c.isAttendanceTaken).length} / {effectiveTodayClasses.length} Recorded
            </span>
          </div>

          {!todayClassesLoaded && loadingData ? (
            <div className="rounded-lg bg-white border border-slate-300 p-6 space-y-3 shadow-xs">
              <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3" />
              <div className="h-8 bg-slate-200 rounded animate-pulse w-full" />
            </div>
          ) : effectiveTodayClasses.length > 0 ? (
            effectiveTodayClasses.map((cls) => {
              const isLive = cls.timingStatus === "live" || cls.isLive;
              const isLocked = cls.isLocked && !isLive;
              const isEndedAndUnmarked = !isLive && !isLocked && !cls.isAttendanceTaken;

              const courseObj: Course = {
                id: cls.id,
                code: cls.code,
                name: cls.name,
                type: cls.type === "Practical" ? "Practical" : "Theory",
                program: cls.program || "CSE-DS",
                section: cls.section,
                strength: cls.strength,
                room: cls.room,
                batch: "Regular",
                addedBy: "HOD (Data Science)",
                isLive: isLive,
                isAttendanceTaken: cls.isAttendanceTaken,
                timingStatus: cls.timingStatus,
              };

              return (
                <div
                  key={cls.id}
                  className={`rounded-lg p-4 transition-all border ${
                    isLive
                      ? "bg-emerald-50/50 border-emerald-400 shadow-xs ring-1 ring-emerald-300"
                      : "bg-white border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                          {cls.slot}
                        </span>
                        {isLive ? (
                          <span className="stamp bg-emerald-600 text-white border-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live Now
                          </span>
                        ) : isLocked ? (
                          <span className="stamp border-slate-300 bg-slate-50 text-slate-600 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Upcoming
                          </span>
                        ) : cls.isAttendanceTaken ? (
                          <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Recorded
                          </span>
                        ) : (
                          <span className="stamp border-amber-400 bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Ended (Not Marked)
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>{cls.name}</h4>
                      <p className="text-xs text-slate-600">
                        Section: <span className="text-slate-900 font-semibold font-mono">{cls.section}</span> &bull; Room: <span className="text-slate-900 font-semibold font-mono">{cls.room}</span>
                      </p>
                    </div>

                    {cls.isAttendanceTaken && (
                      <div className="shrink-0 text-right">
                        <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{cls.attendedCount ? `${cls.attendedCount} Present` : "Recorded"}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    {isLocked ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled
                          className="flex-1 py-2.5 rounded-md bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed select-none"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked until {cls.unlocksAt}</span>
                        </button>
                        {cls.reassignmentStatus === "pending" ? (
                          <button
                            type="button"
                            onClick={() => openReassignModal(courseObj)}
                            className="px-3.5 py-2.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-400 text-amber-800 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title="Reassignment request is pending HOD approval — Click to view or cancel"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Pending Approval</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReassignModal(courseObj)}
                            className="px-3.5 py-2.5 rounded-md bg-white hover:border-blue-400 border border-blue-300 text-blue-700 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title="Reassign this upcoming class"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reassign</span>
                          </button>
                        )}
                      </div>
                    ) : isLive ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAttendanceModal(courseObj, todayClassesInfo?.date)}
                          className="flex-1 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Post Live Attendance</span>
                        </button>
                        {cls.reassignmentStatus === "pending" ? (
                          <button
                            type="button"
                            onClick={() => openReassignModal(courseObj)}
                            className="px-3.5 py-2.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-400 text-amber-800 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title="Reassignment request is pending HOD approval — Click to view or cancel"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Pending Approval</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReassignModal(courseObj)}
                            className="px-3.5 py-2.5 rounded-md bg-white hover:border-blue-400 border border-blue-300 text-blue-700 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title="Reassign this class"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reassign</span>
                          </button>
                        )}
                      </div>
                    ) : cls.isAttendanceTaken ? (
                      <button
                        onClick={() => openAttendanceModal(courseObj, todayClassesInfo?.date)}
                        className="w-full py-2.5 rounded-md font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs bg-white text-slate-800 hover:border-slate-400 border border-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Recorded Attendance</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-md bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed select-none"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Class Ended &bull; Attendance Closed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg bg-white border border-slate-300 p-8 text-center space-y-2 shadow-xs">
              <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900">No live classes scheduled for today</p>
              {todayClassesInfo.nextWorkingDay && (
                <p className="text-xs text-slate-600 font-medium">
                  Next classes on {todayClassesInfo.nextWorkingDay.dayName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DESKTOP FULL PORTAL LAYOUT (SIDEBAR + CONTENT CANVAS)
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        {/* SIDEBAR NAVIGATION (CVR ERP HIERARCHY) */}
        <aside
          className={`bg-white border-r border-slate-300 flex flex-col shrink-0 transition-all duration-300 z-20 ${
            sidebarOpen ? "w-64" : "w-20"
          } ${mobileMenuOpen ? "fixed inset-y-0 left-0 w-64 shadow-xl flex" : "hidden lg:flex"}`}
        >
          {/* Institution Header Brand */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate" style={{ fontFamily: "var(--app-font-display)" }}>
                  Campus Faculty ERP
                </h1>
                <p className="eyebrow text-slate-500 mt-0.5">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "home"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "academics"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4 shrink-0" />
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
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Assigned Courses
                  </button>
                  <button
                    onClick={() => setActiveTab("academics")}
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Attendance Posting
                  </button>
                  <button
                    onClick={() => setActiveTab("directory")}
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Year-Wise Directory
                  </button>
                </div>
              )}
            </div>

            {/* Delegate Attendance with Live Approval Badge */}
            <button
              onClick={() => setActiveTab("delegate")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "delegate"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowRightCircle className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Delegate Attendance</span>}
              </div>
              {sidebarOpen && incomingRequests.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${activeTab === "delegate" ? "bg-white text-emerald-800" : "bg-amber-100 text-amber-800 border border-amber-400"}`}>
                  {incomingRequests.length}
                </span>
              )}
            </button>

            {/* Year-Wise Academic Directory (Srinidhi Review) */}
            <button
              onClick={() => setActiveTab("directory")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "directory"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Year-Wise Directory</span>}
            </button>

            {/* Assignments */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("assignment");
                  toggleSubmenu("assignment");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "assignment"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0" />
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
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Assignment Master
                  </button>
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "mids"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 shrink-0" />
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
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Mid Marks Entry
                  </button>
                </div>
              )}
            </div>

            {/* Faculty Workload */}
            <button
              onClick={() => setActiveTab("workload")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "workload"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Faculty Workload</span>}
            </button>

            {/* Class In-Charge */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("mentoring");
                  toggleSubmenu("mentoring");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "mentoring"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>Class In-Charge</span>}
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
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • Assigned Students ({mentees.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("mentoring")}
                    className="w-full text-left py-1.5 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    • WhatsApp Connect
                  </button>
                </div>
              )}
            </div>

            {/* Student Projects */}
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "projects"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FolderGit2 className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Student Projects</span>}
            </button>

            {/* Event Management */}
            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                activeTab === "events"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Event Management</span>}
            </button>

            {/* Attendance History */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("history");
                  toggleSubmenu("reports");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "history" || activeTab === "student_history"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>Attendance History</span>}
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
                    onClick={() => setActiveTab("history")}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      activeTab === "history"
                        ? "text-emerald-800 bg-emerald-50 border border-emerald-300"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    • Class-Wise History
                  </button>
                  <button
                    onClick={() => setActiveTab("student_history")}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      activeTab === "student_history"
                        ? "text-emerald-800 bg-emerald-50 border border-emerald-300"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    • Student-Wise History (Book)
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    {facultyName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{facultyName}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{facultyProfile.erp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => refetchFacultyAll()}
                    className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Reload / Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-emerald-600" : ""}`} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => refetchFacultyAll()}
                  className="w-full py-1.5 flex justify-center text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Reload / Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-emerald-600" : ""}`} />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-1.5 flex justify-center text-slate-500 hover:text-red-700 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* ════════════════ TAB 1: FACULTY DASHBOARD (HOME) ════════════════ */}
          {activeTab === "home" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="flex items-end justify-between gap-4 pb-4 border-b border-slate-300/70">
                <div>
                  <p className="eyebrow text-slate-500">
                    {(() => { const h = liveClock.getHours(); return h < 12 ? "GOOD MORNING" : h < 17 ? "GOOD AFTERNOON" : "GOOD EVENING"; })()} &middot; FACULTY PORTAL
                  </p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                    {facultyName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                      {facultyProfile.designation}
                    </span>
                    <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                      {facultyDept}
                    </span>
                    <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                      {facultyProfile.erp}
                    </span>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-3 shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs font-mono">
                    {facultyName.charAt(0)}
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 text-right leading-relaxed">
                    {liveDateStr || todayClassesInfo.dayName}
                    <br />
                    <span className="text-emerald-700 font-bold">{liveTimeStr || todayClassesInfo.currentTime}</span>
                  </p>
                </div>
              </div>

              {/* INCOMING REASSIGNMENT REQUESTS (Srinidhi Review: Faculty-to-Faculty Approval Workflow) */}
              {incomingRequests.length > 0 && (
                <div className="bg-white border border-amber-400 rounded-lg shadow-xs animate-in slide-in-from-top-2 overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-md bg-amber-100 border border-amber-400 text-amber-800 flex items-center justify-center shrink-0">
                          <ArrowRightLeft className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>
                              Incoming Class Reassignment Requests
                            </h3>
                            <span className="stamp bg-amber-500 text-white border-amber-500">
                              {incomingRequests.length} Awaiting Your Approval
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            A colleague requested you to substitute their class period. Accept or decline to approve the schedule swap.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("delegate")}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-600 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Manage in Delegate Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {incomingRequests.map((req: any) => (
                        <div
                          key={req.id}
                          className="p-4 rounded-md bg-amber-50/60 border border-amber-300 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                                From: {req.fromFacultyName || "Faculty Colleague"}
                              </span>
                              <span className="stamp border-slate-300 bg-white text-slate-600">
                                {req.date}
                              </span>
                            </div>
                            <div className="pt-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {req.subject || req.originalSubject}
                                </span>
                                {req.originalSubject && req.originalSubject !== req.subject && (
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    (Original: {req.originalSubject})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium">
                                Section {req.section} • Room {req.room || "TBA"} • Slot {req.timeSlot || req.period || "Scheduled Slot"}
                              </p>
                              {req.reason && (
                                <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded border border-amber-200">
                                  &ldquo;{req.reason}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                            <button
                              onClick={() => handleAcceptReassignment(req.id)}
                              disabled={processingReassignId === req.id}
                              className="flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              {processingReassignId === req.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Accept &amp; Approve</span>
                            </button>
                            <button
                              onClick={() => handleDeclineReassignment(req.id)}
                              disabled={processingReassignId === req.id}
                              className="py-2 px-3 rounded-md bg-white hover:bg-red-50 hover:border-red-300 text-red-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="sr-only sm:not-sr-only">Decline</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6 Top Stats Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" aria-hidden />
                  <p className="eyebrow text-slate-500">Theory</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{courses.filter(c => c.type === "Theory").length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
                  <p className="eyebrow text-slate-500">Practical</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{courses.filter(c => c.type === "Practical").length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-500" aria-hidden />
                  <p className="eyebrow text-slate-500">OE / Elective</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{courses.filter(c => c.type === "Elective").length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" aria-hidden />
                  <p className="eyebrow text-slate-500">Mentees</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{mentees.length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400" aria-hidden />
                  <p className="eyebrow text-slate-500">Workload</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{workload.reduce((acc, curr) => acc + curr.periods.length, 0)} Hrs</p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500" aria-hidden />
                  <p className="eyebrow text-slate-500">Co-Instructor</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{courses.filter(c => c.coInstructors && c.coInstructors.length > 0).length}</p>
                </div>
              </div>

              {/* Today's Scheduled Live Classes & Attendance Table */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="stamp bg-emerald-600 text-white border-emerald-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Today&apos;s Live Timetable — {todayClassesInfo.dayName}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        {todayClassesInfo.date}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>Today&apos;s Live Classes &amp; Attendance</h3>
                    <p className="text-xs text-slate-500">Live timetable periods scheduled for today with real-time hourly attendance status</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("academics")}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-600 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View Academics Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="py-2.5 px-4 eyebrow text-slate-600">Period / Slot</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600">Subject &amp; Code</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600">Type</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600">Section</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600">Room</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600 text-center">Attendance Status</th>
                        <th className="py-2.5 px-4 eyebrow text-slate-600 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {effectiveTodayClasses.length > 0 ? (
                        effectiveTodayClasses.map((cls) => {
                          const courseObj: Course = {
                            id: cls.id,
                            code: cls.code,
                            name: cls.name,
                            type: cls.type === "Practical" ? "Practical" : "Theory",
                            program: cls.program || "CSE-DS",
                            section: cls.section,
                            strength: cls.strength,
                            room: cls.room,
                            batch: "Regular",
                            addedBy: "HOD (Data Science)",
                          };

                          return (
                            <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{cls.slot}</span>
                                  {cls.isLive && (
                                    <span className="stamp bg-emerald-600 text-white border-emerald-600 animate-pulse">
                                      Live
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{cls.name}</div>
                                <span className="stamp border-blue-300 bg-blue-50 text-blue-800 mt-0.5">
                                  {cls.code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`stamp ${
                                    cls.type === "Theory"
                                      ? "border-blue-300 bg-blue-50 text-blue-800"
                                      : "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  }`}
                                >
                                  {cls.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{cls.section}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-600">{cls.room}</td>
                              <td className="py-3.5 px-4 text-center">
                                {cls.isAttendanceTaken ? (
                                  <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Posted ({cls.attendedCount ?? cls.strength} Present)</span>
                                  </span>
                                ) : cls.isLocked || cls.timingStatus === "upcoming" ? (
                                  <span className="stamp border-indigo-300 bg-indigo-50 text-indigo-800">
                                    <Lock className="w-3 h-3 text-indigo-600" />
                                    <span>Locked ({cls.startTimeFormatted || cls.unlocksAt})</span>
                                  </span>
                                ) : (
                                  <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                                    <Clock className="w-3 h-3" />
                                    <span>{cls.isLive ? "Live Now" : "Pending Entry"}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {cls.isLocked || cls.timingStatus === "upcoming" ? (
                                  <button
                                    disabled
                                    className="px-3 py-1.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1 mx-auto select-none"
                                  >
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Locked</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openAttendanceModal(courseObj, todayClassesInfo?.date)}
                                    className={`px-3 py-1.5 rounded-md font-semibold text-xs shadow-xs transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                                      cls.isAttendanceTaken
                                        ? "bg-white hover:border-emerald-500 text-emerald-800 border border-emerald-300"
                                        : cls.isLive
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    }`}
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>{cls.isAttendanceTaken ? "Edit Attendance" : cls.isLive ? "Post Live" : "Take Attendance"}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-10 text-center">
                            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <span className="text-[13px] text-slate-500 font-medium">
                              No live classes scheduled on the timetable for today ({todayClassesInfo.dayName}).
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mentor Overview & Quick Links */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Mentor Overview Card */}
                <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs p-6 space-y-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="eyebrow">Mentor Overview</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>Official Faculty Mentoring</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You are assigned as the mentor for <strong className="text-slate-900">24 Mentees</strong> in section <span className="font-mono text-slate-900">{facultyProfile.section}</span>.
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Average Attendance:</span>
                      <span className="font-bold text-emerald-700 font-mono">86.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Critical Attendance (&lt;75%):</span>
                      <span className="font-bold text-amber-700 font-mono">3 Students</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("mentoring")}
                    className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Open Mentoring Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Access Actions */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>Faculty Quick Access</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab("academics")}
                      className="p-4 rounded-md bg-white hover:border-emerald-400 hover:bg-emerald-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <LayoutGrid className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Post Attendance</p>
                      <p className="text-[10px] text-slate-500">Hourly session entry</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("delegate")}
                      className="p-4 rounded-md bg-white hover:border-blue-400 hover:bg-blue-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <ArrowRightCircle className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Delegate Class</p>
                      <p className="text-[10px] text-slate-500">Substitute faculty</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("assignment")}
                      className="p-4 rounded-md bg-white hover:border-emerald-400 hover:bg-emerald-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Assignments</p>
                      <p className="text-[10px] text-slate-500">Upload &amp; grade</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("mids")}
                      className="p-4 rounded-md bg-white hover:border-amber-400 hover:bg-amber-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <Award className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Mid Exam Marks</p>
                      <p className="text-[10px] text-slate-500">Internal marks entry</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("workload")}
                      className="p-4 rounded-md bg-white hover:border-blue-400 hover:bg-blue-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <CalendarDays className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Timetable Schedule</p>
                      <p className="text-[10px] text-slate-500">Weekly workload</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className="p-4 rounded-md bg-white hover:border-slate-400 hover:bg-slate-50 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <BarChart3 className="w-5 h-5 text-slate-700 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Reports Register</p>
                      <p className="text-[10px] text-slate-500">Excel / PDF Export</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("directory")}
                      className="p-4 rounded-md bg-white hover:border-purple-400 hover:bg-purple-50/40 border border-slate-300 text-left space-y-2 transition-all group cursor-pointer"
                    >
                      <GraduationCap className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Year-Wise Directory</p>
                      <p className="text-[10px] text-slate-500">Curriculum &amp; faculty</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* ════════ DEPARTMENT MASTER DAY TIMETABLE (Yadaiah Solution) ════════ */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
                          Department Master Day Timetable
                          <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                            All Years &amp; Sections
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Complete central schedule for CSE (Data Science). Real-time view for cross-checking faculty assignments, room allotments, and slot coordination.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Day Selector Pills & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-300">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                        const isSelected = selectedDayForMasterTable === day;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDayForMasterTable(day)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={masterTableSearch}
                        onChange={(e) => setMasterTableSearch(e.target.value)}
                        placeholder="Filter faculty or subject..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Day Schedule Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="py-3 px-4 w-32 border-r border-slate-300 eyebrow text-slate-600">Section</th>
                        <th className="py-3 px-3 text-center border-r border-slate-300">
                          <div className="eyebrow text-slate-600">Period 1</div>
                          <div className="text-[10px] text-slate-500 font-mono">09:00 – 10:00</div>
                        </th>
                        <th className="py-3 px-3 text-center border-r border-slate-300">
                          <div className="eyebrow text-slate-600">Period 2</div>
                          <div className="text-[10px] text-slate-500 font-mono">10:00 – 11:00</div>
                        </th>
                        <th className="py-3 px-3 text-center border-r border-slate-300">
                          <div className="eyebrow text-slate-600">Period 3</div>
                          <div className="text-[10px] text-slate-500 font-mono">11:10 – 12:10</div>
                        </th>
                        <th className="py-3 px-3 text-center border-r border-slate-300">
                          <div className="eyebrow text-slate-600">Period 4</div>
                          <div className="text-[10px] text-slate-500 font-mono">12:10 – 13:10</div>
                        </th>
                        <th className="py-3.5 px-2 text-center bg-slate-200/70 border-r border-slate-300 text-slate-600 w-16">
                          <div className="eyebrow">LUNCH</div>
                          <div className="text-[9px] font-mono text-slate-500">13:10–14:00</div>
                        </th>
                        <th className="py-3 px-3 text-center border-r border-slate-300">
                          <div className="eyebrow text-slate-600">Period 5</div>
                          <div className="text-[10px] text-slate-500 font-mono">14:00 – 15:00</div>
                        </th>
                        <th className="py-3 px-3 text-center">
                          <div className="eyebrow text-slate-600">Period 6</div>
                          <div className="text-[10px] text-slate-500 font-mono">15:00 – 16:00</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {(() => {
                        const daySchedule = DEPARTMENT_MASTER_SCHEDULE[selectedDayForMasterTable] || {};
                        const sectionKeys = Object.keys(daySchedule);

                        if (sectionKeys.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-10 text-center">
                                <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <span className="text-[13px] text-slate-500 font-medium">
                                  No classes scheduled for {selectedDayForMasterTable}.
                                </span>
                              </td>
                            </tr>
                          );
                        }

                        return sectionKeys.map((sec) => {
                          const periods = daySchedule[sec] || [];
                          const isIIYear = sec.startsWith("DS-2");
                          const isIIIYear = sec.startsWith("DS-3");
                          const yearBadgeClass = isIIYear
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : isIIIYear
                            ? "border-blue-300 bg-blue-50 text-blue-800"
                            : "border-purple-300 bg-purple-50 text-purple-800";
                          const yearLabel = isIIYear ? "II Year" : isIIIYear ? "III Year" : "IV Year";

                          return (
                            <tr key={sec} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 border-r border-slate-200 bg-slate-50/50">
                                <div className="flex flex-col">
                                  <span className="text-xs font-mono font-bold text-slate-800">{sec}</span>
                                  <span className={`stamp mt-1 ${yearBadgeClass} w-fit`}>
                                    {yearLabel}
                                  </span>
                                </div>
                              </td>

                              {/* Periods 1 to 4 */}
                              {[0, 1, 2, 3].map((pIdx) => {
                                const slot = periods[pIdx];
                                if (!slot) {
                                  return (
                                    <td key={pIdx} className="py-2.5 px-2 text-center text-slate-300 border-r border-slate-200">
                                      —
                                    </td>
                                  );
                                }
                                const isLab = slot.subject.toUpperCase().includes("LAB") || slot.room.toUpperCase().includes("LAB");
                                const matchesSearch = masterTableSearch && (
                                  slot.subject.toLowerCase().includes(masterTableSearch.toLowerCase()) ||
                                  slot.faculty.toLowerCase().includes(masterTableSearch.toLowerCase()) ||
                                  slot.room.toLowerCase().includes(masterTableSearch.toLowerCase())
                                );
                                const isCurrentFaculty = facultyName && slot.faculty.toLowerCase().includes(facultyName.toLowerCase().replace(/^(mr|mrs|dr)\.?\s+/i, ""));

                                return (
                                  <td
                                    key={pIdx}
                                    className={`py-2 px-2.5 border-r border-slate-200 transition-all ${
                                      matchesSearch
                                        ? "bg-amber-50 ring-2 ring-amber-400/60"
                                        : isCurrentFaculty
                                        ? "bg-emerald-50 ring-1 ring-emerald-300"
                                        : ""
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[11px] font-bold truncate ${isLab ? "text-indigo-700" : "text-slate-900"}`}>
                                          {slot.subject}
                                        </span>
                                        {isLab && (
                                          <span className="stamp border-indigo-300 bg-indigo-50 text-indigo-800">
                                            LAB
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-600 font-medium truncate" title={slot.faculty}>
                                        {slot.faculty}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-mono">{slot.room}</p>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Lunch Column */}
                              <td className="py-2 px-1 text-center bg-slate-100/60 border-r border-slate-200">
                                <span className="rotate-180 writing-mode-vertical inline-block tracking-widest text-[9px] py-1 text-slate-500 font-mono">
                                  BREAK
                                </span>
                              </td>

                              {/* Periods 5 and 6 */}
                              {[4, 5].map((pIdx) => {
                                const slot = periods[pIdx];
                                if (!slot) {
                                  return (
                                    <td key={pIdx} className="py-2.5 px-2 text-center text-slate-300 border-r border-slate-200 last:border-r-0">
                                      —
                                    </td>
                                  );
                                }
                                const isLab = slot.subject.toUpperCase().includes("LAB") || slot.room.toUpperCase().includes("LAB");
                                const matchesSearch = masterTableSearch && (
                                  slot.subject.toLowerCase().includes(masterTableSearch.toLowerCase()) ||
                                  slot.faculty.toLowerCase().includes(masterTableSearch.toLowerCase()) ||
                                  slot.room.toLowerCase().includes(masterTableSearch.toLowerCase())
                                );
                                const isCurrentFaculty = facultyName && slot.faculty.toLowerCase().includes(facultyName.toLowerCase().replace(/^(mr|mrs|dr)\.?\s+/i, ""));

                                return (
                                  <td
                                    key={pIdx}
                                    className={`py-2 px-2.5 border-r border-slate-200 last:border-r-0 transition-all ${
                                      matchesSearch
                                        ? "bg-amber-50 ring-2 ring-amber-400/60"
                                        : isCurrentFaculty
                                        ? "bg-emerald-50 ring-1 ring-emerald-300"
                                        : ""
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[11px] font-bold truncate ${isLab ? "text-indigo-700" : "text-slate-900"}`}>
                                          {slot.subject}
                                        </span>
                                        {isLab && (
                                          <span className="stamp border-indigo-300 bg-indigo-50 text-indigo-800">
                                            LAB
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-600 font-medium truncate" title={slot.faculty}>
                                        {slot.faculty}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-mono">{slot.room}</p>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Footer Legend */}
                <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                      <span className="font-medium text-slate-700">Practical / Lab Session (2-Hour Merged Block)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span className="font-medium text-slate-700">Theory Lecture (1-Hour Period)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="font-medium text-slate-700">Matching Search Filter</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Department Master Timetable • CSE (Data Science)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 2: ACADEMICS & POST ATTENDANCE ════════════════ */}
          {activeTab === "academics" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Today's Timetable Header Banner */}
              <div className="pb-4 border-b border-slate-300/70">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="stamp bg-emerald-600 text-white border-emerald-600 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>Today&apos;s Schedule: {todayClassesInfo.dayName}</span>
                      </span>
                      <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                        {todayClassesInfo.date}
                      </span>
                      <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{todayClassesInfo.currentTime || "Live IST"}</span>
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>Today&apos;s Scheduled Live Classes</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live periods are active during class hours. Future classes remain locked until their scheduled timetable start time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold text-xs font-mono">
                      {effectiveTodayClasses.length} Classes Today
                    </span>
                    <span className="px-3.5 py-2 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{todayClassesInfo.attendanceTakenCount} Posted</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Scheduled Class Cards */}
              {effectiveTodayClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {effectiveTodayClasses.map((cls) => {
                    const courseObj: Course = {
                      id: cls.id,
                      code: cls.code,
                      name: cls.name,
                      type: cls.type === "Practical" ? "Practical" : "Theory",
                      program: cls.program || "CSE-DS",
                      section: cls.section,
                      strength: cls.strength,
                      room: cls.room,
                      batch: "Regular",
                      addedBy: "HOD (Data Science)",
                    };

                    const isUpcomingLocked = cls.isLocked || cls.timingStatus === "upcoming";
                    const isLiveNow = cls.isLive || cls.timingStatus === "live";

                    return (
                      <div
                        key={cls.id}
                        className={`bg-white rounded-lg border p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                          isLiveNow
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : isUpcomingLocked
                            ? "border-slate-300 bg-slate-50/40"
                            : cls.isAttendanceTaken
                            ? "border-emerald-300 bg-emerald-50/20"
                            : "border-slate-300/70 hover:border-slate-400"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Slot Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-800 font-mono">
                                {cls.slot}
                              </span>
                            </div>

                            {isLiveNow && (
                              <span className="stamp bg-emerald-600 text-white border-emerald-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                <span>Live Class Now</span>
                              </span>
                            )}

                            {isUpcomingLocked && (
                              <span className="stamp border-indigo-300 bg-indigo-50 text-indigo-800 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-indigo-600" />
                                <span>Upcoming Today</span>
                              </span>
                            )}

                            {!isLiveNow && !isUpcomingLocked && (
                              cls.isAttendanceTaken ? (
                                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Recorded ({cls.attendedCount} Present)</span>
                                </span>
                              ) : (
                                <span className="stamp border-amber-400 bg-amber-100 text-amber-800 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Ended (Not Marked)</span>
                                </span>
                              )
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-3 pt-1">
                            <div>
                              <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                                {cls.code}
                              </span>
                              <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug" style={{ fontFamily: "var(--app-font-display)" }}>
                                {cls.name}
                              </h3>
                            </div>
                            <span
                              className={`stamp shrink-0 ${
                                cls.type === "Theory"
                                  ? "border-blue-300 bg-blue-50 text-blue-800"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {cls.type}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Section</p>
                              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">{cls.section}</p>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Strength</p>
                              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">{cls.strength}</p>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Room</p>
                              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">{cls.room}</p>
                            </div>
                          </div>

                          {/* Attendance Status Callout */}
                          <div className="pt-1">
                            {cls.isAttendanceTaken ? (
                              <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold">Attendance Posted in System</p>
                                    <p className="text-[11px] text-emerald-800 font-medium">
                                      {cls.attendedCount !== null ? `${cls.attendedCount} / ${cls.strength} Students Marked Present` : "Recorded in System"}
                                    </p>
                                  </div>
                                </div>
                                <span className="stamp bg-emerald-600 text-white border-emerald-600">
                                  Recorded
                                </span>
                              </div>
                            ) : isUpcomingLocked ? (
                              <div className="flex items-center justify-between p-3 rounded-md bg-indigo-50/60 border border-indigo-200 text-indigo-900">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold">Attendance Locked</p>
                                    <p className="text-[11px] text-indigo-700 font-medium">
                                      Unlocks at {cls.startTimeFormatted || cls.unlocksAt} when period begins
                                    </p>
                                  </div>
                                </div>
                                <span className="stamp border-indigo-300 bg-indigo-100 text-indigo-800">
                                  Locked
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 border border-amber-300 text-amber-900">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold">
                                      {isLiveNow ? "Live Class Active" : "Class Concluded (Pending Entry)"}
                                    </p>
                                    <p className="text-[11px] text-amber-700 font-medium">
                                      Take hourly attendance for today&apos;s period
                                    </p>
                                  </div>
                                </div>
                                <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                                  Pending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button: Locked if Upcoming, Active if Live, View if Recorded, Closed if Ended */}
                        {isUpcomingLocked ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled
                              className="flex-1 py-3 rounded-md font-semibold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-xs select-none"
                              title={`Attendance entry unlocks at ${cls.startTimeFormatted || cls.unlocksAt}`}
                            >
                              <Lock className="w-4 h-4 text-slate-400" />
                              <span>Locked until Class Time ({cls.startTimeFormatted || cls.unlocksAt})</span>
                            </button>
                            {cls.reassignmentStatus === "pending" ? (
                              <button
                                type="button"
                                onClick={() => openReassignModal(courseObj)}
                                className="px-4 py-3 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-400 text-amber-800 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                title="Reassignment request is pending HOD approval — Click to view or cancel"
                              >
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                <span>Pending Approval</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReassignModal(courseObj)}
                                className="px-4 py-3 rounded-md bg-white hover:border-blue-400 border border-blue-300 text-blue-700 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                title="Reassign this upcoming class to substitute faculty"
                              >
                                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                                <span>Reassign</span>
                              </button>
                            )}
                          </div>
                        ) : isLiveNow ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openAttendanceModal(courseObj, todayClassesInfo?.date)}
                              className="flex-1 py-3 rounded-md font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Post Live Attendance Now</span>
                            </button>
                            {cls.reassignmentStatus === "pending" ? (
                              <button
                                type="button"
                                onClick={() => openReassignModal(courseObj)}
                                className="px-4 py-3 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-400 text-amber-800 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                title="Reassignment request is pending HOD approval — Click to view or cancel"
                              >
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                <span>Pending Approval</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReassignModal(courseObj)}
                                className="px-4 py-3 rounded-md bg-white hover:border-blue-400 border border-blue-300 text-blue-700 active:scale-95 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                title="Reassign this class"
                              >
                                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                                <span>Reassign</span>
                              </button>
                            )}
                          </div>
                        ) : cls.isAttendanceTaken ? (
                          <button
                            onClick={() => openAttendanceModal(courseObj, todayClassesInfo?.date)}
                            className="w-full py-3 rounded-md font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-white hover:border-emerald-500 text-emerald-800 border border-emerald-300"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Attendance Recorded (View List)</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-3 rounded-md font-semibold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-xs select-none"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Class Ended &bull; Attendance Closed</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-slate-300/70 p-10 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-md border border-slate-200 bg-slate-50 text-slate-600 mx-auto flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>
                      No Scheduled Classes on Timetable for Today ({todayClassesInfo.dayName}, {todayClassesInfo.date})
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      You do not have any classes scheduled for {todayClassesInfo.dayName}. Below are your upcoming classes for the next working day.
                    </p>
                  </div>

                  {/* Next Working Day Upcoming Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="stamp border-blue-300 bg-blue-50 text-blue-800 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Upcoming Timetable: {todayClassesInfo.nextWorkingDay?.dayName || "Monday"} Schedule</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (Attendance unlocks when class time arrives)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(todayClassesInfo.nextWorkingDay?.classes && todayClassesInfo.nextWorkingDay.classes.length > 0
                        ? todayClassesInfo.nextWorkingDay.classes
                        : courses
                      ).map((cls: any) => (
                        <div key={cls.id} className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="text-xs font-mono font-semibold text-slate-700 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{cls.slot || "Scheduled Period"}</span>
                            </span>
                            <span className="stamp border-blue-300 bg-blue-50 text-blue-800 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-blue-600" />
                              <span>Upcoming on {todayClassesInfo.nextWorkingDay?.dayName || "Monday"}</span>
                            </span>
                          </div>

                          <div>
                            <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                              {cls.code}
                            </span>
                            <h4 className="font-bold text-slate-900 mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>{cls.name}</h4>
                            <p className="text-xs text-slate-600 mt-1">Section: <span className="font-mono text-slate-900">{cls.section}</span> &bull; Room: <span className="font-mono text-slate-900">{cls.room}</span></p>
                          </div>

                          <button
                            disabled
                            className="w-full py-2.5 rounded-md bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 select-none"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Locked — Scheduled for {todayClassesInfo.nextWorkingDay?.dayName || "Monday"}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TAB 3: DELEGATE ATTENDANCE ════════════════ */}
          {activeTab === "delegate" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="pb-4 border-b border-slate-300/70">
                <p className="eyebrow text-slate-500">Substitution Hub</p>
                <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Delegate Course Attendance</h1>
                <p className="text-xs text-slate-500 mt-0.5">Delegate your class periods to a substitute faculty member during leave or official duty.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Form Card */}
                <form onSubmit={handleCreateDelegation} className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3" style={{ fontFamily: "var(--app-font-display)" }}>
                    Assign Substitute Faculty
                  </h3>

                  <div className="space-y-1.5">
                    <label className="eyebrow text-slate-600">Select Course</label>
                    <select
                      value={delegatedCourse}
                      onChange={(e) => setDelegatedCourse(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
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
                    <label className="eyebrow text-slate-600">Substitute Faculty</label>
                    <select
                      value={delegatedFaculty}
                      onChange={(e) => setDelegatedFaculty(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
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
                    <label className="eyebrow text-slate-600">Date of Delegation</label>
                    <input
                      type="date"
                      value={delegatedDate}
                      onChange={(e) => setDelegatedDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm &amp; Delegate Class
                  </button>
                </form>

                {/* Delegation History Table */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3" style={{ fontFamily: "var(--app-font-display)" }}>
                    Active &amp; Past Delegations
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Course</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Section</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Date</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Delegated To</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {delegationsList.map((del) => (
                          <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900">{del.course}</td>
                            <td className="py-3 px-3 font-mono">{del.section}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{del.date}</td>
                            <td className="py-3 px-3 font-semibold text-blue-700">{del.delegatedTo}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`stamp ${
                                  del.status === "Active"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : "border-slate-300 bg-slate-100 text-slate-600"
                                }`}
                              >
                                {del.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {delegationsList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-10 text-center">
                              <ArrowRightCircle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                              <p className="text-[13px] font-semibold text-slate-600">No delegations yet</p>
                              <span className="text-xs text-slate-500">
                                Assign a substitute faculty member and it will be listed here.
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── INCOMING REASSIGNMENT REQUESTS (FACULTY-TO-FACULTY APPROVAL WORKFLOW) ── */}
              <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-md border border-amber-400 bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>
                        Incoming Class Period Requests (Requires Your Approval)
                      </h3>
                      <p className="text-xs text-slate-500">
                        When a colleague sends a substitution request, you must accept it to activate the period swap.
                      </p>
                    </div>
                  </div>
                  <span className="stamp border-slate-300 bg-slate-100 text-slate-700 shrink-0 self-start sm:self-auto">
                    {incomingRequests.length} Pending Approval
                  </span>
                </div>

                {incomingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {incomingRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-md bg-amber-50/70 border border-amber-300 space-y-3 flex flex-col justify-between shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                              From: {req.fromFacultyName || "Faculty Colleague"}
                            </span>
                            <span className="stamp border-slate-300 bg-white text-slate-600">
                              {req.date}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {req.subject || req.originalSubject}
                              </span>
                              {req.originalSubject && req.originalSubject !== req.subject && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  (Orig: {req.originalSubject})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              Section {req.section} • Room {req.room || "TBA"} • Slot {req.timeSlot || req.period || "Live Timetable"}
                            </p>
                            {req.reason && (
                              <p className="text-[11px] text-slate-600 italic mt-1.5 bg-white p-2.5 rounded border border-amber-200">
                                Reason: &ldquo;{req.reason}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                          <button
                            onClick={() => handleAcceptReassignment(req.id)}
                            disabled={processingReassignId === req.id}
                            className="flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            {processingReassignId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept Request</span>
                          </button>
                          <button
                            onClick={() => handleDeclineReassignment(req.id)}
                            disabled={processingReassignId === req.id}
                            className="py-2 px-3 rounded-md bg-white hover:bg-red-50 hover:border-red-300 text-red-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500 space-y-1.5 bg-slate-50/50 rounded-md border border-dashed border-slate-300">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                    <p className="text-xs font-bold text-slate-900">No pending substitution requests</p>
                    <p className="text-[11px] text-slate-500">
                      When a faculty member assigns a class to you, it will appear here for your approval.
                    </p>
                  </div>
                )}
              </div>

              {/* ── OUTGOING CLASS PERIOD REASSIGNMENTS SENT BY YOU ── */}
              <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>
                      Outgoing Class Period Reassignments Sent by You
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track the status of class periods you requested colleagues to cover.
                    </p>
                  </div>
                  {courses.length > 0 && (
                    <button
                      onClick={() => openReassignModal(courses[0])}
                      className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Reassign a Period</span>
                    </button>
                  )}
                </div>

                {reassignmentsList.filter((r: any) => r.fromFacultyKey === resolvedKey).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Subject / Course</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Section &amp; Room</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Date &amp; Slot</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600">Substitute Faculty</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Status</th>
                          <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reassignmentsList
                          .filter((r: any) => r.fromFacultyKey === resolvedKey)
                          .map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {r.subject || r.originalSubject}
                                </span>
                                {r.originalSubject && r.originalSubject !== r.subject && (
                                  <span className="text-[10px] text-slate-500">
                                    Original: {r.originalSubject}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-700 font-mono">
                                Sec {r.section} • {r.room || "Room TBA"}
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                {r.date} {r.timeSlot ? `• ${r.timeSlot}` : ""}
                              </td>
                              <td className="py-3 px-3 font-semibold text-blue-700">
                                {r.toFacultyName || "Faculty Member"}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`stamp inline-flex items-center gap-1 ${
                                    r.status === "approved"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : r.status === "declined"
                                      ? "border-red-300 bg-red-50 text-red-800"
                                      : "border-amber-400 bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {r.status === "approved" ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Accepted &amp; Approved</span>
                                    </>
                                  ) : r.status === "declined" ? (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      <span>Declined</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                      <span>Pending Colleague Acceptance</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {r.status === "pending" ? (
                                  <button
                                    onClick={() => handleCancelReassignment(r.id)}
                                    className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-[11px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Cancel
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-1.5 bg-slate-50/50 rounded-md border border-dashed border-slate-300">
                    <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-900">No reassignment requests sent</p>
                    <p className="text-[11px] text-slate-500">
                      You haven&apos;t sent any period reassignment requests.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 4: ASSIGNMENTS ════════════════ */}
          {activeTab === "assignment" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-300/70">
                <div>
                  <p className="eyebrow text-slate-500">Coursework</p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Assignment Management &amp; Grading</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Post coursework assignments, set deadlines, and evaluate student submissions.</p>
                </div>
                <button
                  onClick={() => setShowCreateAssignmentModal(true)}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </button>
              </div>

              {/* Assignment Cards List */}
              {assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((asg) => (
                    <div key={asg.id} className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                            {asg.courseCode} &bull; Section {asg.section}
                          </span>
                          <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                            {asg.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug" style={{ fontFamily: "var(--app-font-display)" }}>{asg.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{asg.courseName}</p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <p className="eyebrow text-slate-500">Max Marks</p>
                            <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{asg.maxMarks} M</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <p className="eyebrow text-slate-500">Due Date</p>
                            <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{asg.dueDate}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <p className="eyebrow text-slate-500">Submitted</p>
                            <p className="text-xs font-bold text-blue-700 mt-1 font-mono">{asg.totalSubmissions}/{asg.totalStudents}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedAsgForSubmissions(asg)}
                        className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Review Submissions &amp; Marks</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-300/70 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>No Coursework Assignments Created Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Post course assignments, define rubrics and deadlines, and track student submissions.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assignment</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TAB 5: MID EXAMINATIONS ════════════════ */}
          {activeTab === "mids" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="pb-4 border-b border-slate-300/70 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-slate-500">Internal Assessment</p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Mid Examination Internal Marks Entry</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Enter and lock internal assessment marks (Objective + Descriptive + Assignments).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Select Course */}
                  <select
                    value={selectedMidCourse}
                    onChange={(e) => setSelectedMidCourse(e.target.value)}
                    className="px-3 py-2 rounded-md border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Mid Selector */}
                  <div className="flex items-center gap-1 p-1 rounded-md border border-slate-300 bg-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedMidExam("Mid-1")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        selectedMidExam === "Mid-1" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Mid-1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMidExam("Mid-2")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        selectedMidExam === "Mid-2" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Mid-2
                    </button>
                  </div>

                  <button
                    onClick={() => toast({ title: "Marks Saved!", description: `Internal marks for ${selectedMidCourse} (${selectedMidExam}) saved to database.` })}
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Lock &amp; Submit Marks</span>
                  </button>
                </div>
              </div>

              {/* Student Marks Table */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="py-2.5 px-3 eyebrow text-slate-600">S.No</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600">Roll Number</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600">Student Name</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Part A (Obj /10)</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Part B (Desc /15)</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Asg / Quiz (/5)</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Total (/30)</th>
                        <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mentees.map((m, idx) => {
                        const marks = midStudentMarks[m.rollNumber] || { partA: 8, partB: 12, assignment: 5 };
                        const total = marks.partA + marks.partB + marks.assignment;
                        const grade = total >= 27 ? "O" : total >= 24 ? "A+" : total >= 20 ? "A" : total >= 15 ? "B+" : "B";
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{m.rollNumber}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{m.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={marks.partA}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "partA", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-md border border-slate-300 bg-white font-mono font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={15}
                                value={marks.partB}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "partB", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-md border border-slate-300 bg-white font-mono font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={marks.assignment}
                                onChange={(e) => handleUpdateMidMark(m.rollNumber, "assignment", Number(e.target.value))}
                                className="w-14 text-center py-1 rounded-md border border-slate-300 bg-white font-mono font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-800 text-sm font-mono">
                              {total}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`stamp ${
                                  total >= 27
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : total >= 20
                                    ? "border-blue-300 bg-blue-50 text-blue-800"
                                    : "border-amber-400 bg-amber-100 text-amber-800"
                                }`}
                              >
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {mentees.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-10 text-center">
                            <Users className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                            <span className="text-[13px] text-slate-500 font-medium">
                              No mentees assigned yet — internal marks entry requires an assigned student roster.
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 6: FACULTY WORKLOAD ════════════════ */}
          {activeTab === "workload" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-end justify-between pb-4 border-b border-slate-300/70">
                <div>
                  <p className="eyebrow text-slate-500">Weekly Schedule</p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Faculty Weekly Workload Timetable</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned schedule periods and occupied laboratory hours.</p>
                </div>
                <span className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold font-mono text-xs shrink-0">
                  Weekly Total: {workload.reduce((acc, curr) => acc + curr.periods.length, 0)} Periods
                </span>
              </div>

              {/* Timetable Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workload.map((w, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-slate-300/70 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-950 text-sm" style={{ fontFamily: "var(--app-font-display)" }}>{w.day}</span>
                      <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                        {w.periods.length} Classes
                      </span>
                    </div>

                    <div className="space-y-2">
                      {w.periods.map((p, pIdx) => (
                        <div key={pIdx} className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-semibold text-slate-500">{p.slot}</span>
                            <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                              {p.section}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{p.subject}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{p.room}</p>
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
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Mentor Information Header Banner */}
              <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs font-mono">
                    {facultyName.charAt(0)}
                  </div>
                  <div>
                    <span className="eyebrow text-slate-500 block">Official Class In-Charge</span>
                    <h1 className="text-lg font-bold text-slate-950 mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>{facultyName}</h1>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{facultyDept} &bull; <span className="font-mono">{facultyProfile.phone}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-md border border-slate-300 text-center">
                    <p className="eyebrow text-slate-500">Assigned Students</p>
                    <p className="text-lg font-bold text-emerald-700 leading-tight font-mono">{mentees.length}</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md border border-slate-300 text-center">
                    <p className="eyebrow text-slate-500">Section</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight font-mono">{facultyProfile.section}</p>
                  </div>
                </div>
              </div>

              {/* Student List Table with WhatsApp triggers */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>Assigned Students Roster ({mentees.length} Students)</h3>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Roll No or Name..."
                      value={menteeSearch}
                      onChange={(e) => setMenteeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="py-3 px-3 eyebrow text-slate-600">S.No</th>
                        <th className="py-3 px-3 eyebrow text-slate-600">Roll Number</th>
                        <th className="py-3 px-3 eyebrow text-slate-600">Student Name</th>
                        <th className="py-3 px-3 eyebrow text-slate-600 text-center">Attendance %</th>
                        <th className="py-3 px-3 eyebrow text-slate-600 text-center">Backlogs</th>
                        <th className="py-3 px-3 eyebrow text-slate-600 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredMentees.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900">{m.rollNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{m.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`stamp font-mono ${
                                m.attendancePercent >= 75
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-red-300 bg-red-50 text-red-800"
                              }`}
                            >
                              {m.attendancePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`stamp font-mono ${
                                m.backlogs === 0
                                  ? "border-slate-300 bg-slate-100 text-slate-600"
                                  : "border-amber-400 bg-amber-100 text-amber-800"
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
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
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
                                className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
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
                                className="px-2.5 py-1 rounded-md bg-white hover:border-slate-400 text-slate-800 font-semibold text-[11px] border border-slate-300 transition-colors cursor-pointer"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredMentees.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center">
                            <Search className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                            <span className="text-[13px] text-slate-500 font-medium">
                              No students match your search query.
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 8: STUDENT PROJECTS ════════════════ */}
          {activeTab === "projects" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-300/70">
                <div>
                  <p className="eyebrow text-slate-500">Project Batches</p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Student Projects &amp; Viva Review</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage Major and Mini Project batches, milestones, and review marks.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 p-1 rounded-md border border-slate-300 bg-slate-100">
                    <button
                      type="button"
                      onClick={() => setProjectTab("Major")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        projectTab === "Major" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Major Projects (IV Year)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectTab("Mini")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        projectTab === "Mini" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Mini Projects (III Year)
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Batch</span>
                  </button>
                </div>
              </div>

              {/* Projects List */}
              {projectsList.filter((p) => p.type === projectTab).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectsList
                    .filter((p) => p.type === projectTab)
                    .map((p) => (
                      <div key={p.id} className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="stamp border-purple-300 bg-purple-50 text-purple-800">
                              {p.batchId}
                            </span>
                            <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                              {p.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug" style={{ fontFamily: "var(--app-font-display)" }}>{p.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">Domain: {p.domain}</p>

                          <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                            <p className="eyebrow text-slate-500">Team Members</p>
                            {p.team.map((t, idx) => (
                              <p key={idx} className="text-xs font-semibold text-slate-800 font-mono">
                                {t.roll} – {t.name}
                              </p>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                            <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Rev 1 (/20)</p>
                              <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{p.review1}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Rev 2 (/30)</p>
                              <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{p.review2}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                              <p className="eyebrow text-slate-500">Viva (/50)</p>
                              <p className="text-xs font-bold text-blue-700 mt-1 font-mono">{p.externalViva}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toast({ title: "Review Marks Updated", description: `Rubrics saved for ${p.batchId}.` })}
                          className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          <span>Update Review Marks</span>
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-300/70 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-md border border-purple-200 bg-purple-50 text-purple-700 mx-auto flex items-center justify-center">
                    <FolderGit2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>No {projectTab} Project Batches Registered</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      There are currently no active {projectTab.toLowerCase()} project batches registered under your guidance for AY 2025–26.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register {projectTab} Project Batch</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TAB 9: EVENT MANAGEMENT ════════════════ */}
          {activeTab === "events" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-300/70">
                <div>
                  <p className="eyebrow text-slate-500">Campus Calendar</p>
                  <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>Campus &amp; Department Event Management</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Workshops, Hackathons, FDPs, Guest Lectures, and Industrial Visits.</p>
                </div>
                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Event</span>
                </button>
              </div>

              {/* Events Cards */}
              {eventsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventsList.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                            {ev.type}
                          </span>
                          <span className={`stamp ${
                            ev.status === "Completed" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-blue-300 bg-blue-50 text-blue-800"
                          }`}>
                            {ev.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug" style={{ fontFamily: "var(--app-font-display)" }}>{ev.title}</h3>
                        <p className="text-xs text-slate-600 font-medium">Dates: <span className="font-mono">{ev.dates}</span></p>
                        <p className="text-xs text-slate-600 font-medium">Venue: {ev.venue}</p>
                        <p className="text-xs text-blue-700 font-semibold">Resource: {ev.resourcePerson}</p>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-center">
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <p className="eyebrow text-slate-500">Budget</p>
                            <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{ev.budget}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <p className="eyebrow text-slate-500">Registered</p>
                            <p className="text-xs font-bold text-blue-700 mt-1 font-mono">{ev.registeredCount}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toast({ title: "Coordinator Report", description: `Report generated for ${ev.title}.` })}
                        className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Coordinator Report</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-300/70 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-md border border-amber-200 bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>No Campus Events Registered Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Organize workshops, hackathons, or FDP guest lectures under your department.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TAB 10: CLASS-WISE ATTENDANCE HISTORY ════════════════ */}
          {activeTab === "history" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header & Date-Range Controls */}
              <div className="pb-4 border-b border-slate-300/70">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="stamp border-blue-300 bg-blue-50 text-blue-800">Period-Wise Logs</span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {historyFromDate} to {historyToDate}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>Class-Wise Attendance History</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Comprehensive daily logs of all scheduled periods with marked &amp; skipped attendance tracking.</p>
                  </div>

                  {/* Export Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={downloadHistoryCSV}
                      disabled={loadingHistory || historyRecords.length === 0}
                      className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download History (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Filters Row: Date Range, Search & Status Filter */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 text-xs">
                      <span className="font-semibold text-slate-500">From:</span>
                      <input
                        type="date"
                        value={historyFromDate}
                        onChange={(e) => setHistoryFromDate(e.target.value)}
                        className="bg-transparent font-mono font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 text-xs">
                      <span className="font-semibold text-slate-500">To:</span>
                      <input
                        type="date"
                        value={historyToDate}
                        onChange={(e) => setHistoryToDate(e.target.value)}
                        className="bg-transparent font-mono font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const d = new Date();
                        const today = d.toISOString().split("T")[0];
                        setHistoryFromDate(today);
                        setHistoryToDate(today);
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:border-slate-400 border border-slate-300 text-slate-800 transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        const today = d.toISOString().split("T")[0];
                        d.setDate(d.getDate() - 7);
                        setHistoryFromDate(d.toISOString().split("T")[0]);
                        setHistoryToDate(today);
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:border-slate-400 border border-slate-300 text-slate-800 transition-colors cursor-pointer"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        const today = d.toISOString().split("T")[0];
                        d.setDate(1);
                        setHistoryFromDate(d.toISOString().split("T")[0]);
                        setHistoryToDate(today);
                      }}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:border-slate-400 border border-slate-300 text-slate-800 transition-colors cursor-pointer"
                    >
                      This Month
                    </button>
                  </div>

                  {/* Search Bar & Status Toggle Pills */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Live Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search subject, section, date, slot..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>

                    <div className="flex items-center gap-1 p-1 rounded-md border border-slate-300 bg-slate-100 text-xs">
                      <button
                        onClick={() => setHistoryStatusFilter("all")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          historyStatusFilter === "all" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                        }`}
                      >
                        All ({historyRecords.length})
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter("marked")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          historyStatusFilter === "marked" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                        }`}
                      >
                        Marked ({historyRecords.filter(r => r.status === "marked").length})
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter("skipped")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          historyStatusFilter === "skipped" ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-300 text-slate-700"
                        }`}
                      >
                        Skipped ({historyRecords.filter(r => r.status === "skipped").length})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject-Wise Hourly Class Attendance Overview Breakdown */}
              {historySubjectSummary.length > 0 && (
                <div className="bg-white p-5 rounded-lg border border-slate-300/70 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="eyebrow text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Subject-Wise Hourly Attendance Summary (Held vs Scheduled)</span>
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Click any subject card to filter logs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {historySubjectSummary.map((sub, idx) => {
                      const deliveryPct = sub.total > 0 ? Math.round((sub.marked / sub.total) * 100) : 0;
                      const isSelected =
                        historySearchQuery.toLowerCase() === sub.code.toLowerCase() ||
                        historySearchQuery.toLowerCase() === sub.subject.toLowerCase();

                      return (
                        <div
                          key={idx}
                          onClick={() => setHistorySearchQuery(isSelected ? "" : sub.code)}
                          className={`p-4 rounded-md border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-800 border-slate-300/70 hover:border-slate-400 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`stamp font-mono ${
                                isSelected ? "bg-white/20 text-white border-white/30" : "border-blue-300 bg-blue-50 text-blue-800"
                              }`}>
                                {sub.code}
                              </span>
                              <h5 className="font-bold text-sm mt-1.5 leading-snug">{sub.subject}</h5>
                              <p className={`text-xs font-medium mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                                Section: <span className="font-mono">{sub.section}</span>
                              </p>
                            </div>
                            <span className={`stamp font-mono ${
                              isSelected
                                ? "bg-white text-emerald-800 border-white"
                                : deliveryPct >= 75
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-amber-400 bg-amber-100 text-amber-800"
                            }`}>
                              {deliveryPct}% Held
                            </span>
                          </div>

                          <div className={`grid grid-cols-3 gap-1 pt-2 border-t text-center text-[10px] font-semibold ${
                            isSelected ? "border-white/30 text-emerald-100" : "border-slate-200 text-slate-500"
                          }`}>
                            <div>
                              <p className="uppercase tracking-wider">Scheduled</p>
                              <p className={`text-sm font-bold font-mono ${isSelected ? "text-white" : "text-slate-900"}`}>{sub.total}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wider">Marked</p>
                              <p className={`text-sm font-bold font-mono ${isSelected ? "text-white" : "text-emerald-600"}`}>{sub.marked}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wider">Skipped</p>
                              <p className={`text-sm font-bold font-mono ${isSelected ? "text-white" : "text-amber-600"}`}>{sub.skipped}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" aria-hidden />
                  <p className="eyebrow text-slate-500">Total Periods</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">{filteredHistoryRecords.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
                  <p className="eyebrow text-slate-500">Attendance Taken</p>
                  <p className="text-[22px] font-bold text-emerald-700 mt-1.5 font-mono tabular-nums">
                    {filteredHistoryRecords.filter(r => r.status === "marked").length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400" aria-hidden />
                  <p className="eyebrow text-slate-500">Skipped / Pending</p>
                  <p className="text-[22px] font-bold text-amber-700 mt-1.5 font-mono tabular-nums">
                    {filteredHistoryRecords.filter(r => r.status === "skipped").length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300/70 shadow-xs relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" aria-hidden />
                  <p className="eyebrow text-slate-500">Compliance Rate</p>
                  <p className="text-[22px] font-bold text-slate-950 mt-1.5 font-mono tabular-nums">
                    {filteredHistoryRecords.length > 0
                      ? Math.round((filteredHistoryRecords.filter(r => r.status === "marked").length / filteredHistoryRecords.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Class-Wise Attendance Records Table */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden">
                {loadingHistory ? (
                  <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-9 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredHistoryRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-4 eyebrow text-slate-600">Date &amp; Day</th>
                          <th className="py-2.5 px-4 eyebrow text-slate-600">Time Slot</th>
                          <th className="py-2.5 px-4 eyebrow text-slate-600">Subject &amp; Code</th>
                          <th className="py-2.5 px-4 eyebrow text-slate-600">Section &amp; Room</th>
                          <th className="py-2.5 px-4 eyebrow text-slate-600 text-center">Attendance Status</th>
                          <th className="py-2.5 px-4 eyebrow text-slate-600 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredHistoryRecords.map((rec) => {
                          const courseObj: Course = {
                            id: String(rec.scheduleId || rec.id),
                            code: rec.code,
                            name: rec.subject,
                            type: "Theory",
                            program: "CSE-DS",
                            section: rec.section,
                            strength: rec.totalStrength || 55,
                            room: rec.room,
                            batch: "Regular",
                            addedBy: "HOD (Data Science)",
                          };

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                <div>{rec.date}</div>
                                <span className="text-[11px] font-medium text-slate-500 font-sans">{rec.dayName}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{rec.slot}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{rec.subject}</div>
                                <span className="stamp border-blue-300 bg-blue-50 text-blue-800 mt-0.5">
                                  {rec.code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold font-mono text-slate-800">{rec.section}</div>
                                <span className="text-[11px] text-slate-500 font-mono">{rec.room}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {rec.status === "marked" ? (
                                  <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Recorded ({rec.presentCount} Present)</span>
                                  </span>
                                ) : rec.status === "skipped" ? (
                                  <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Skipped / Not Taken</span>
                                  </span>
                                ) : (
                                  <span className="stamp border-slate-300 bg-slate-100 text-slate-600">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Upcoming</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => openAttendanceModal(courseObj, rec.date)}
                                  className={`px-3 py-1.5 rounded-md font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                    rec.status === "marked"
                                      ? "bg-white text-slate-700 hover:border-slate-400 border border-slate-300"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                                  }`}
                                >
                                  {rec.status === "marked" ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Edit / View</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Post Late Attendance</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-14 text-center space-y-2">
                    <CalendarDays className="w-10 h-10 mx-auto text-slate-400" />
                    <p className="text-sm font-bold text-slate-900">No attendance records found for this filter.</p>
                    <p className="text-xs text-slate-500">Try adjusting your search query, date range, or status filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 11: STUDENT-WISE ATTENDANCE BOOK ════════════════ */}
          {activeTab === "student_history" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header & Register Controls */}
              <div className="pb-4 border-b border-slate-300/70">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">Master Register</span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {bookData?.section || "Course Register"} &bull; {bookFromDate} to {bookToDate}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-1.5" style={{ fontFamily: "var(--app-font-display)" }}>
                      Student-Wise Attendance Book Register
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Physical attendance book matrix with dates across columns, student roster, daily &apos;P&apos; / &apos;A&apos; markers, and cumulative attendance %.
                    </p>
                  </div>

                  {/* Download & Print Register Buttons (Sneha Feedback) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handlePrintCumulativeAttendance}
                      disabled={loadingBook || !bookData || !bookData.students || bookData.students.length === 0}
                      className="px-4 py-2.5 rounded-md bg-white hover:border-slate-400 disabled:opacity-50 border border-slate-300 text-slate-800 font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      title="Print official cumulative attendance register or Save as PDF"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Cumulative Attendance (PDF)</span>
                    </button>
                    <button
                      onClick={downloadAttendanceBookCSV}
                      disabled={loadingBook || !bookData || !bookData.students || bookData.students.length === 0}
                      className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Register (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls: Course Dropdown, Date Range, Search */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Course / Section Dropdown */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 text-xs">
                      <span className="font-semibold text-slate-500">Class:</span>
                      <select
                        value={`${selectedBookCourse}___${selectedBookSection}`}
                        onChange={(e) => {
                          const parts = e.target.value.split("___");
                          setSelectedBookCourse(parts[0]);
                          setSelectedBookSection(parts[1] || "");
                        }}
                        className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={`${c.code}___${c.section}`}>
                            {c.name} ({c.section})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Date */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 text-xs">
                      <span className="font-semibold text-slate-500">From:</span>
                      <input
                        type="date"
                        value={bookFromDate}
                        onChange={(e) => setBookFromDate(e.target.value)}
                        className="bg-transparent font-mono font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>

                    {/* To Date */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 text-xs">
                      <span className="font-semibold text-slate-500">To:</span>
                      <input
                        type="date"
                        value={bookToDate}
                        onChange={(e) => setBookToDate(e.target.value)}
                        className="bg-transparent font-mono font-semibold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={fetchStudentAttendanceBook}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    >
                      Apply Range
                    </button>
                  </div>

                  {/* Student Search Box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Roll No or Name..."
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Book Matrix Grid */}
              <div className="bg-white rounded-lg border border-slate-300/70 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      Showing {bookData?.students?.length || 0} Students &bull; {(() => {
                        const allDatesInRange: string[] = [];
                        const start = new Date(bookFromDate + "T00:00:00");
                        const end = new Date(bookToDate + "T00:00:00");
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                          allDatesInRange.push(d.toISOString().split("T")[0]);
                        }
                        return allDatesInRange.length;
                      })()} Days &bull; {(bookData?.dates || []).length} Classes Conducted
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>P = Present</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-red-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>A = Absent</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span>- = No Class</span>
                    </span>
                  </div>
                </div>

                {loadingBook ? (
                  <div className="p-6 space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-8 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : bookData && bookData.students && bookData.students.length > 0 ? (() => {
                  // Generate ALL dates in the selected range
                  const allDatesInRange: string[] = [];
                  const start = new Date(bookFromDate + "T00:00:00");
                  const end = new Date(bookToDate + "T00:00:00");
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    allDatesInRange.push(d.toISOString().split("T")[0]);
                  }
                  const conductedDatesSet = new Set(bookData.dates || []);

                  return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="py-3 px-3 border border-slate-300 sticky left-0 bg-slate-100 z-10 eyebrow text-slate-600">S.No</th>
                          <th className="py-3 px-3 border border-slate-300 sticky left-10 bg-slate-100 z-10 eyebrow text-slate-600">Roll Number</th>
                          <th className="py-3 px-3 border border-slate-300 sticky left-32 bg-slate-100 z-10 min-w-[160px] eyebrow text-slate-600">Student Name</th>
                          {allDatesInRange.map((d) => {
                            const isConducted = conductedDatesSet.has(d);
                            const dayNum = new Date(d + "T00:00:00").getDate();
                            const monthNum = new Date(d + "T00:00:00").getMonth() + 1;
                            return (
                              <th key={d} className={`py-3 px-2 border border-slate-300 text-center font-mono whitespace-nowrap min-w-[38px] ${isConducted ? "bg-blue-50 text-blue-900" : "bg-slate-50 text-slate-400"}`}>
                                <div className="flex flex-col items-center leading-tight">
                                  <span className="text-[9px]">{monthNum}/{dayNum}</span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="py-3 px-2 border border-slate-300 text-center bg-blue-50 text-blue-900 eyebrow">Held</th>
                          <th className="py-3 px-2 border border-slate-300 text-center bg-emerald-50 text-emerald-900 eyebrow">P</th>
                          <th className="py-3 px-2 border border-slate-300 text-center bg-red-50 text-red-900 eyebrow">A</th>
                          <th className="py-3 px-3 border border-slate-300 text-center bg-indigo-50 text-indigo-900 eyebrow">Att %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {bookData.students
                          .filter((s) =>
                            !bookSearchQuery.trim() ||
                            s.name?.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                            s.rollNumber?.toLowerCase().includes(bookSearchQuery.toLowerCase())
                          )
                          .map((st, idx) => (
                            <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 border border-slate-200 font-mono text-slate-500 sticky left-0 bg-white">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 border border-slate-200 font-mono font-semibold text-slate-900 sticky left-10 bg-white whitespace-nowrap">
                                {st.rollNumber}
                              </td>
                              <td className="py-2.5 px-3 border border-slate-200 font-semibold text-slate-900 sticky left-32 bg-white whitespace-nowrap">
                                {st.name}
                              </td>
                              {allDatesInRange.map((d) => {
                                const isConducted = conductedDatesSet.has(d);
                                const val = st.attendanceByDate?.[d] || "-";
                                return (
                                  <td key={d} className={`py-2.5 px-2 border border-slate-200 text-center font-mono font-bold ${!isConducted ? "bg-slate-50/60" : ""}`}>
                                    {isConducted ? (
                                      val === "P" ? (
                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                          P
                                        </span>
                                      ) : val === "A" ? (
                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">
                                          A
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-2 border border-slate-200 text-center font-mono font-semibold text-slate-700 bg-blue-50/40">
                                {st.totalClasses}
                              </td>
                              <td className="py-2.5 px-2 border border-slate-200 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                {st.presentCount}
                              </td>
                              <td className="py-2.5 px-2 border border-slate-200 text-center font-mono font-bold text-red-700 bg-red-50/40">
                                {st.absentCount}
                              </td>
                              <td className="py-2.5 px-3 border border-slate-200 text-center bg-indigo-50/40">
                                <span
                                  className={`stamp font-mono ${
                                    st.percentage >= 75
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : st.percentage >= 65
                                      ? "border-amber-400 bg-amber-100 text-amber-800"
                                      : "border-red-300 bg-red-50 text-red-800"
                                  }`}
                                >
                                  {st.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  );
                })() : (
                  <div className="py-14 text-center space-y-2">
                    <Users className="w-10 h-10 mx-auto text-slate-400" />
                    <p className="text-sm font-bold text-slate-900">No students found in this course register.</p>
                    <p className="text-xs text-slate-500">Select a class section and date range to load the attendance book.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ TAB 9: YEAR-WISE ACADEMIC DIRECTORY (SRINIDHI REVIEW) ════════════════ */}
          {activeTab === "directory" && (() => {
            const curYearData = YEAR_WISE_DIRECTORY_DATA[selectedDirectoryYear];
            const q = directorySearchQuery.trim().toLowerCase();

            // Filter Courses
            const filteredCourses = curYearData.courses.filter((c) => {
              if (!q) return true;
              return (
                c.code.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q) ||
                c.type.toLowerCase().includes(q) ||
                c.syllabusBrief.toLowerCase().includes(q)
              );
            });

            // Filter Sections
            const filteredSections = curYearData.sections.filter((sec) => {
              if (directorySectionFilter !== "all" && sec.key !== directorySectionFilter) {
                return false;
              }
              if (!q) return true;
              return (
                sec.name.toLowerCase().includes(q) ||
                sec.key.toLowerCase().includes(q) ||
                sec.room.toLowerCase().includes(q) ||
                sec.incharge.toLowerCase().includes(q) ||
                sec.crName.toLowerCase().includes(q)
              );
            });

            // Filter Students
            const filteredStudents = curYearData.students.filter((st) => {
              if (directorySectionFilter !== "all" && st.section !== directorySectionFilter) {
                return false;
              }
              if (!q) return true;
              return (
                st.name.toLowerCase().includes(q) ||
                st.rollNo.toLowerCase().includes(q) ||
                st.mentor.toLowerCase().includes(q) ||
                st.section.toLowerCase().includes(q)
              );
            });

            // Filter Faculty
            const filteredFaculty = curYearData.faculty.filter((fac) => {
              if (directorySectionFilter !== "all" && !fac.sections.includes(directorySectionFilter)) {
                return false;
              }
              if (!q) return true;
              return (
                fac.name.toLowerCase().includes(q) ||
                fac.courses.toLowerCase().includes(q) ||
                fac.designation.toLowerCase().includes(q) ||
                fac.erp.toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* ── Directory Header Banner with Year Switcher ── */}
                <div className="pb-4 border-b border-slate-300/70">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="stamp border-purple-300 bg-purple-50 text-purple-800 flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3" />
                          <span>Department Academic Catalog</span>
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {curYearData.batch}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-[26px] font-bold tracking-tight text-slate-950 mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                        {curYearData.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        {curYearData.academicYear} • Structured catalog of Courses, Sections, Students &amp; Faculty
                      </p>
                    </div>

                    {/* Year Selector Buttons */}
                    <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-slate-300 bg-slate-100 shrink-0">
                      {(["II", "III", "IV"] as const).map((yr) => {
                        const isSelected = selectedDirectoryYear === yr;
                        return (
                          <button
                            key={yr}
                            onClick={() => {
                              setSelectedDirectoryYear(yr);
                              setDirectorySectionFilter("all");
                            }}
                            className={`px-4 py-2 rounded-md font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            <span>{yr} Year B.Tech</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-200 text-xs">
                    <div className="bg-white rounded-lg p-3 border border-slate-300/70 shadow-xs relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" aria-hidden />
                      <span className="eyebrow text-slate-500 block">Curriculum Courses</span>
                      <span className="text-lg font-bold text-slate-950 mt-1 block font-mono">{curYearData.courses.length} Subjects</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-300/70 shadow-xs relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" aria-hidden />
                      <span className="eyebrow text-slate-500 block">Class Sections</span>
                      <span className="text-lg font-bold text-slate-950 mt-1 block font-mono">{curYearData.sections.length} Sections</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-300/70 shadow-xs relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400" aria-hidden />
                      <span className="eyebrow text-slate-500 block">Total Cohort Strength</span>
                      <span className="text-lg font-bold text-slate-950 mt-1 block font-mono">
                        {curYearData.sections.reduce((acc, curr) => acc + curr.strength, 0)} Students
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-300/70 shadow-xs relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-500" aria-hidden />
                      <span className="eyebrow text-slate-500 block">Designated Faculty</span>
                      <span className="text-lg font-bold text-slate-950 mt-1 block font-mono">{curYearData.faculty.length} Faculty</span>
                    </div>
                  </div>
                </div>

                {/* ── Sub-navigation & Live Filter Controls ── */}
                <div className="bg-white p-4 rounded-lg border border-slate-300/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all", label: "All Overview", icon: Layers },
                      { id: "courses", label: "1. Courses", icon: BookOpen },
                      { id: "sections", label: "2. Sections", icon: Building2 },
                      { id: "students", label: "3. Students", icon: Users },
                      { id: "faculty", label: "4. Faculty", icon: GraduationCap },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const active = directoryActiveTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setDirectoryActiveTab(tab.id as any)}
                          className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search and Section Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Section Filter */}
                    <select
                      value={directorySectionFilter}
                      onChange={(e) => setDirectorySectionFilter(e.target.value)}
                      className="px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="all">All Sections ({curYearData.sections.length})</option>
                      {curYearData.sections.map((sec) => (
                        <option key={sec.key} value={sec.key}>
                          {sec.name} ({sec.key})
                        </option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div className="relative min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={directorySearchQuery}
                        onChange={(e) => setDirectorySearchQuery(e.target.value)}
                        placeholder="Search directory..."
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                      {directorySearchQuery && (
                        <button
                          onClick={() => setDirectorySearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ════════════ 1. COURSES & CURRICULUM ════════════ */}
                {(directoryActiveTab === "all" || directoryActiveTab === "courses") && (
                  <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          1
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Academic Courses &amp; Curriculum — {selectedDirectoryYear} Year</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Prescribed course catalog, contact hours, credits and syllabus topics
                          </p>
                        </div>
                      </div>
                      <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                        {filteredCourses.length} Subjects
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Course Code</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Subject Title</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Type</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Credits</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Weekly Hours</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Key Syllabus Modules</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredCourses.map((c) => (
                            <tr key={c.code} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-blue-700">
                                {c.code}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                {c.title}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`stamp ${
                                    c.type === "Theory"
                                      ? "border-blue-300 bg-blue-50 text-blue-800"
                                      : c.type === "Practical"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : "border-purple-300 bg-purple-50 text-purple-800"
                                  }`}
                                >
                                  {c.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                                {c.credits} Credits
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {c.hours}
                              </td>
                              <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={c.syllabusBrief}>
                                {c.syllabusBrief}
                              </td>
                            </tr>
                          ))}
                          {filteredCourses.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-10 text-center">
                                <BookOpen className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                                <span className="text-[13px] text-slate-500 font-medium">
                                  No courses match the current search / filters.
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ════════════ 2. CLASS SECTIONS & ROOMS ════════════ */}
                {(directoryActiveTab === "all" || directoryActiveTab === "sections") && (
                  <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          2
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span>Class Sections &amp; Classrooms — {selectedDirectoryYear} Year</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Class in-charge faculty, allocated room halls, and student cohort roll ranges
                          </p>
                        </div>
                      </div>
                      <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                        {filteredSections.length} Sections
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSections.map((sec) => (
                        <div
                          key={sec.key}
                          className="p-5 rounded-md bg-white border border-slate-300/70 hover:border-slate-400 transition-all space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                                {sec.key.replace("DS-", "")}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{sec.name}</h4>
                                <span className="text-[10px] font-mono text-slate-500">{sec.key}</span>
                              </div>
                            </div>
                            <span className="stamp border-slate-300 bg-slate-100 text-slate-800">
                              {sec.room}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Class In-Charge:</span>
                              <span className="font-semibold text-slate-900">{sec.incharge}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Cohort Strength:</span>
                              <span className="font-bold text-slate-900 font-mono">{sec.strength} Students</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Roll Range:</span>
                              <span className="font-mono text-[11px] font-semibold text-slate-700">{sec.rollRange}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-slate-500">Class Rep (CR):</span>
                              <span className="font-medium text-slate-800 text-[11px]">{sec.crName}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setDirectorySectionFilter(sec.key);
                                setDirectoryActiveTab("students");
                              }}
                              className="w-full py-2 rounded-md bg-white hover:border-slate-400 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>View Section Roster</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredSections.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 py-10 text-center">
                          <Building2 className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                          <span className="text-[13px] text-slate-500 font-medium">
                            No sections match the current search / filters.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ════════════ 3. STUDENTS DETAILS & ROSTER ════════════ */}
                {(directoryActiveTab === "all" || directoryActiveTab === "students") && (
                  <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          3
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span>Students Details &amp; Roster — {selectedDirectoryYear} Year</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Student roll numbers, designated faculty mentors, and attendance standing
                          </p>
                        </div>
                      </div>
                      <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                        {filteredStudents.length} Students Shown
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Roll Number</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Student Name</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Section</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Faculty Mentor</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Attendance %</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((st) => (
                              <tr key={st.rollNo} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                                  {st.rollNo}
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-900">
                                  {st.name}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                                    {st.section}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-700">
                                  {st.mentor}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`stamp font-mono ${
                                      st.attendance >= 85
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                        : st.attendance >= 75
                                        ? "border-blue-300 bg-blue-50 text-blue-800"
                                        : "border-amber-400 bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {st.attendance}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="stamp border-slate-300 bg-slate-50 text-slate-600">
                                    {st.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-10 text-center">
                                <Users className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                                <span className="text-[13px] text-slate-500 font-medium">
                                  No students match the selected section / search criteria.
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ════════════ 4. ASSIGNED FACULTY ════════════ */}
                {(directoryActiveTab === "all" || directoryActiveTab === "faculty") && (
                  <div className="bg-white rounded-lg border border-slate-300/70 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md bg-indigo-500 text-white flex items-center justify-center font-bold text-xs font-mono">
                          4
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                            <span>Assigned Faculty Directory — {selectedDirectoryYear} Year</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Official subject teachers, course allocations, employee ERP IDs &amp; contacts
                          </p>
                        </div>
                      </div>
                      <span className="stamp border-slate-300 bg-slate-100 text-slate-700">
                        {filteredFaculty.length} Faculty
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Faculty Name</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Designation / Role</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Assigned Courses</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Sections</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">ERP Employee ID</th>
                            <th className="py-2.5 px-3 eyebrow text-slate-600">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredFaculty.map((fac) => (
                            <tr key={fac.key} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                {fac.name}
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-medium">
                                {fac.designation}
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                                {fac.courses}
                              </td>
                              <td className="py-3 px-3">
                                <span className="stamp border-indigo-300 bg-indigo-50 text-indigo-800">
                                  {fac.sections}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">
                                {fac.erp}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                                {fac.phone}
                              </td>
                            </tr>
                          ))}
                          {filteredFaculty.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-10 text-center">
                                <GraduationCap className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                                <span className="text-[13px] text-slate-500 font-medium">
                                  No faculty match the current search / filters.
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          POST ATTENDANCE MODAL (EXACT CVR WORKFLOW & REAL SLOTS)
      ───────────────────────────────────────────────────────────── */}
      {attendanceModalOpen && selectedCourseForAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-3 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-300 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="eyebrow text-slate-500 block">
                    Hourly Attendance Portal
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                    {selectedCourseForAttendance.name} ({selectedCourseForAttendance.code})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Section: <span className="font-mono text-slate-800">{selectedCourseForAttendance.section}</span> &bull; Room: <span className="font-mono text-slate-800">{selectedCourseForAttendance.room}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedCourseForAttendance.timingStatus !== "completed" && !selectedCourseForAttendance.isAttendanceTaken && (
                  <button
                    type="button"
                    onClick={() => openReassignModal(selectedCourseForAttendance)}
                    className="px-3 py-1.5 rounded-md bg-white hover:border-blue-400 text-blue-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-blue-300"
                    title="Reassign this class period to another faculty"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reassign</span>
                  </button>
                )}

                <button
                  onClick={() => setAttendanceModalOpen(false)}
                  className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Header (Date, Periods, Radio, Counters) — DESKTOP ONLY */}
            <div className="hidden md:block p-5 border-b border-slate-200 bg-slate-50 space-y-4">
              {/* Top Filters: Mode & Date */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Regular vs Adjusted */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attendance_mode"
                      checked={attendanceMode === "regular"}
                      onChange={() => setAttendanceMode("regular")}
                      className="text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>Regular Class</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attendance_mode"
                      checked={attendanceMode === "adjusted"}
                      onChange={() => setAttendanceMode("adjusted")}
                      className="text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>Adjusted Class</span>
                  </label>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Period Selector — Only Today's Live Class Slots */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Today&apos;s Live Class Slots ({todayDayName})</span>
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Auto-filtered from Timetable
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {todaysClassSlots.map((slot) => {
                    const isSelected = selectedPeriod === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedPeriod(slot.id)}
                        className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30"
                            : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                        <span className="font-mono">{slot.label}</span>
                        {slot.isTodayLive && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected ? "bg-white/20 text-white" : "border-emerald-300 bg-emerald-50 text-emerald-800 border"
                          }`}>
                            Live Class
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Counter Badges & Master Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="stamp border-slate-300 bg-white text-slate-700">
                    Total: {totalStudentsCount}
                  </span>
                  <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                    Present: {presentStudentsCount}
                  </span>
                  <span className="stamp border-red-300 bg-red-50 text-red-800">
                    Absent: {absentStudentsCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll(true)}
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll(false)}
                    className="px-3 py-1 rounded-md bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Compact Sub-Header — Student Counts & Quick Actions */}
            <div className="md:hidden px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                  {presentStudentsCount} Present
                </span>
                <span className="stamp border-red-300 bg-red-50 text-red-800">
                  {absentStudentsCount} Absent
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleMarkAll(true)}
                  className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll(false)}
                  className="px-3 py-1 rounded-md bg-red-50 border border-red-300 text-red-700 text-xs font-semibold active:scale-95 cursor-pointer"
                >
                  All Absent
                </button>
              </div>
            </div>

            {/* Student Search Bar */}
            <div className="px-4 md:px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Roll No or Student Name..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 font-mono shrink-0">
                {filteredRoster.length} students
              </span>
            </div>

            {/* Student Attendance List Container */}
            <div className="flex-1 overflow-y-auto px-3 md:px-5 py-2">
              {loadingRoster ? (
                <div className="space-y-2 py-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-200 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-900">No students found</p>
                  <p className="text-xs text-slate-500">No students in this roster match your search.</p>
                </div>
              ) : (
              <>
              {/* MOBILE VIEW: Touch-Friendly Student Cards */}
              <div className="block md:hidden space-y-2 pb-2">
                {filteredRoster.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => toggleStudentStatus(s.id)}
                    className={`p-3.5 rounded-md border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      s.status
                        ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                        : "bg-white border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">#{s.sNo}</span>
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {s.rollNumber}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{s.name}</h4>
                    </div>

                    {/* Sleek Capsule Toggle Switch for Mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStudentStatus(s.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 shadow-xs border cursor-pointer active:scale-95 ${
                        s.status
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-red-50 text-red-700 border-red-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                          s.status ? "bg-emerald-600 justify-end" : "bg-red-500 justify-start"
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></div>
                      </div>
                      <span className="w-12 text-left text-[11px] font-bold">
                        {s.status ? "Present" : "Absent"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Full Data Table */}
              <table className="hidden md:table w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 z-10">
                  <tr>
                    <th className="py-2.5 px-3 eyebrow text-slate-600">S.No</th>
                    <th className="py-2.5 px-3 eyebrow text-slate-600">Roll Number</th>
                    <th className="py-2.5 px-3 eyebrow text-slate-600">Student Name</th>
                    <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Attendance %</th>
                    <th className="py-2.5 px-3 eyebrow text-slate-600 text-center">Status (Toggle A / P)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRoster.map((s) => {
                    const heldRatio = `${s.heldCount}/${s.totalHeld}`;
                    const heldPct = Math.round((s.heldCount / s.totalHeld) * 100);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{s.sNo}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{s.rollNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600">
                          {heldRatio} ({heldPct}%)
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {/* Interactive Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(s.id)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                              s.status
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                            }`}
                          >
                            <div
                              className={`w-7 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                                s.status ? "bg-emerald-600 justify-end" : "bg-red-500 justify-start"
                              }`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></div>
                            </div>
                            <span>{s.status ? "Present" : "Absent"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-300 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:border-slate-400 transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedCourseForAttendance?.timingStatus === "completed" && !selectedCourseForAttendance?.isAttendanceTaken && !selectedCourseForAttendance?.isLive ? (
                <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-400 px-3.5 py-1.5 rounded-md flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Class Ended &bull; Attendance Submission Closed</span>
                </div>
              ) : attendanceAlreadyRecorded ? (
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Already Recorded</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitAttendance}
                    disabled={submittingAttendance}
                    className="px-4 py-2 rounded-md bg-white hover:border-emerald-500 hover:text-emerald-800 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300"
                  >
                    {submittingAttendance ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={submittingAttendance}
                  className="px-6 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REASSIGN CLASS MODAL (SUBSTITUTE FACULTY REQUEST TO HOD)
      ───────────────────────────────────────────────────────────── */}
      {reassignModalOpen && reassignCourse && (() => {
        const existingPendingReassignment =
          (reassignCourse as any)?.reassignment ||
          effectiveTodayClasses.find(
            (c) =>
              (c.id === reassignCourse.id || c.code === reassignCourse.code) &&
              c.reassignmentStatus === "pending"
          )?.reassignment;

        const isPendingView = Boolean(
          existingPendingReassignment &&
          (existingPendingReassignment.status === "pending" || (reassignCourse as any).reassignmentStatus === "pending")
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-3 lg:p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-300 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <span className="eyebrow text-slate-500 block">
                      {isPendingView ? "Request Sent • Pending Approval" : "Substitution Request"}
                    </span>
                    <h3 className="text-base font-bold text-slate-950 mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
                      <span>{isPendingView ? "Class Reassignment Status" : "Reassign Class Period"}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setReassignModalOpen(false)}
                  className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Class Summary Box */}
                <div className="p-4 rounded-md bg-slate-50 border border-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-slate-600">
                      Selected Class Period
                    </span>
                    <span className="stamp border-slate-300 bg-white text-slate-700">
                      {attendanceDate}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>{reassignCourse.name} ({reassignCourse.code})</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 pt-1">
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono">
                      Section: {reassignCourse.section}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono">
                      Room: {reassignCourse.room}
                    </span>
                  </div>
                </div>

                {isPendingView ? (
                  /* ── Pending State View with Cancel Button ── */
                  <div className="space-y-4">
                    <div className="p-4 rounded-md bg-amber-50 border border-amber-400 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="stamp border-amber-400 bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                          <span>Request Sent • Waiting for Colleague Acceptance</span>
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-md border border-amber-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Reassigned To (Substitute):</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {existingPendingReassignment?.toFacultyName || "Substitute Faculty"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">From Faculty:</span>
                          <span className="font-semibold text-slate-800">
                            {existingPendingReassignment?.fromFacultyName || facultyName}
                          </span>
                        </div>
                        {existingPendingReassignment?.reason && (
                          <div>
                            <span className="font-semibold text-slate-500 block">Reason:</span>
                            <p className="font-medium text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                              {existingPendingReassignment.reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                        Your substitution request has been sent to {existingPendingReassignment?.toFacultyName || "the assigned colleague"}. Once they click &quot;Accept&quot;, this period is approved and transferred to their timetable. You can cancel at any time before acceptance.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── Normal Reassignment Form ── */
                  <div className="space-y-3">
                    {/* From Faculty */}
                    <div>
                      <label className="eyebrow block text-slate-600 mb-1">
                        From Faculty (Assigning Out):
                      </label>
                      <div className="px-3.5 py-2.5 rounded-md bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>{facultyName || "Faculty Member"}</span>
                        <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                          Key {resolvedKey || "106"}
                        </span>
                      </div>
                    </div>

                    {/* To Faculty Selector (Srinidhi Review: ONLY Related Section/Year Members) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="eyebrow text-slate-600">
                          Reassign To Faculty (Section {normalizeSectionKey(reassignCourse.section)} Only):
                        </label>
                        <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                          {(() => {
                            const secKey = normalizeSectionKey(reassignCourse.section);
                            const roster = SECTION_FACULTY_ROSTER[secKey] || [];
                            return `${roster.length} Section Teachers`;
                          })()}
                        </span>
                      </div>
                      <select
                        value={reassignToFacultyKey}
                        onChange={(e) => {
                          const chosenKey = e.target.value;
                          setReassignToFacultyKey(chosenKey);
                          const secKey = normalizeSectionKey(reassignCourse.section);
                          const roster = SECTION_FACULTY_ROSTER[secKey] || [];
                          const matched = roster.find((f) => f.key === chosenKey);
                          if (matched) {
                            setReassignSubject(matched.subject);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white cursor-pointer"
                      >
                        {(() => {
                          const secKey = normalizeSectionKey(reassignCourse.section);
                          const roster = SECTION_FACULTY_ROSTER[secKey] || SECTION_FACULTY_ROSTER["DS-2A"];
                          return roster.map((fac) => {
                            const isSelf = fac.key === resolvedKey;
                            return (
                              <option key={fac.key} value={fac.key} disabled={isSelf}>
                                {fac.name} — {fac.subject} ({fac.designation}){isSelf ? " — (You)" : ""}
                              </option>
                            );
                          });
                        })()}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Showing only official teaching faculty assigned to Section {normalizeSectionKey(reassignCourse.section)}.
                      </p>
                    </div>

                    {/* Subject to be Taught (Lakshmi Mam Feedback: Changes with Faculty Name) */}
                    <div>
                      <label className="eyebrow block text-slate-600 mb-1">
                        Subject to be Taught by Substitute:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={reassignSubject}
                          onChange={(e) => setReassignSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                          placeholder="Subject title / code"
                        />
                        <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800 shrink-0">
                          Auto-swapped
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Automatically updated to match the substitute faculty&apos;s curriculum ({reassignSubject || "Course"}).
                      </p>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="eyebrow block text-slate-600 mb-1">
                        Reason for Reassignment:
                      </label>
                      <select
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white cursor-pointer"
                      >
                        <option value="Official Duty / Department Meeting">Official Duty / Department Meeting</option>
                        <option value="Medical Leave / Emergency">Medical Leave / Emergency</option>
                        <option value="Lab Exam / External Evaluation Duty">Lab Exam / External Evaluation Duty</option>
                        <option value="Faculty Development Program (FDP)">Faculty Development Program (FDP)</option>
                        <option value="Other">Other Reason (Specify below)</option>
                      </select>
                    </div>

                    {reassignReason === "Other" && (
                      <div>
                        <input
                          type="text"
                          placeholder="Enter specific reason..."
                          value={reassignCustomReason}
                          onChange={(e) => setReassignCustomReason(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                        />
                      </div>
                    )}

                    {/* Workflow Note (Srinidhi Review: Faculty-to-Faculty Approval Workflow) */}
                    <div className="p-3.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] text-blue-950 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5 text-blue-900">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Faculty-to-Faculty Reassignment &amp; Approval Workflow</span>
                      </p>
                      <p className="text-blue-800 leading-relaxed">
                        Once submitted, this request is dispatched to the substitute faculty member. When they accept the request in their portal, the period swap will be approved and activated on both timetables.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-300 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:border-slate-400 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {isPendingView ? (
                  <button
                    type="button"
                    onClick={() => handleCancelReassignment(existingPendingReassignment?.id)}
                    disabled={cancellingReassignment}
                    className="px-5 py-2.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
                  >
                    {cancellingReassignment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cancelling Request...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Cancel Reassignment Request</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendReassignment}
                    disabled={submittingReassignment}
                    className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
                  >
                    {submittingReassignment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Request to HOD</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────
          CREATE ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-4 bg-white border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>Post New Course Assignment</h3>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Course</label>
                <select
                  value={newAsgCourse}
                  onChange={(e) => setNewAsgCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} – {c.name} ({c.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assignment 3: Convolutional Neural Networks & ResNet"
                  value={newAsgTitle}
                  onChange={(e) => setNewAsgTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Submission Due Date</label>
                  <input
                    type="date"
                    value={newAsgDueDate}
                    onChange={(e) => setNewAsgDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Max Marks</label>
                  <input
                    type="number"
                    value={newAsgMaxMarks}
                    onChange={(e) => setNewAsgMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold hover:border-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-4 bg-white border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>Register New {projectTab} Project Batch</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Batch ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DS-MAJOR-03"
                  value={newProjBatchId}
                  onChange={(e) => setNewProjBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Detection of Retinopathy using Vision Transformers"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Domain / Tech Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Imaging & Deep Learning"
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold hover:border-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-4 bg-white border-b border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>Register Campus / Dept Event</h3>
              <button onClick={() => setShowAddEventModal(false)} className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hands-on Workshop on Cloud Native Kubernetes"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e: any) => setNewEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="FDP">FDP</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Venue</label>
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Dates</label>
                  <input
                    type="text"
                    value={newEventDates}
                    onChange={(e) => setNewEventDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="eyebrow text-slate-600">Allocated Budget</label>
                  <input
                    type="text"
                    value={newEventBudget}
                    onChange={(e) => setNewEventBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="eyebrow text-slate-600">Resource Person / Speaker</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Principal Architect, AWS India"
                  value={newEventSpeaker}
                  onChange={(e) => setNewEventSpeaker(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold hover:border-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
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
