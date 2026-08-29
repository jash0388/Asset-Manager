import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { OFFICIAL_FACULTY_LIST } from "./MentorApp";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  GraduationCap,
  ListFilter,
  Grid3X3,
  ClipboardList,
  UserPlus,
  Plus,
  UserCheck,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  Flag,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  Lock,
  Unlock,
  LayoutGrid,
  LayoutList,
  List,
  Coffee,
  MapPin,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Send,
  MessageSquare,
  MessageCircle,
  AlertOctagon,
  CheckSquare,
  Square,
  BarChart2,
  Flame,
  SlidersHorizontal,
  ShieldAlert,
  FileEdit,
  History as HistoryIcon,
  X,
  BookOpen,
  FlaskConical,
  Printer,
  Building,
  Mail,
  Phone,
  Award,
  School,
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
  user?: StudentUser;
  durationMinutes?: number | null;
};

type SectionStats = {
  sectionKey: string;     // e.g. "DS II/I/A"
  displayName: string;    // e.g. "2A"
  batch: string;          // e.g. "2025"
  yearLabel: string;      // e.g. "2nd Year"
  totalStudents: StudentUser[];
  presentStudents: { student: StudentUser; record?: AttendanceRecord; isClassPresentOnly?: boolean }[];
  absentStudents: StudentUser[];
};

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

interface SectionMetadata {
  sectionKey: string;
  yearNumber: string;
  yearLabel: string;
  sectionLetter: string;
  degree: string;
  branch: string;
  classIncharge: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  lectureHall: string;
  labRoom: string;
  totalStudents: number;
  rollRange: string;
  semester: string;
  academicYear: string;
  wefDate: string;
  mentors: string[];
}

export const SECTION_METADATA_REGISTRY: Record<string, SectionMetadata> = {
  "2A": {
    sectionKey: "2A",
    yearNumber: "II",
    yearLabel: "2nd Year",
    sectionLetter: "A",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mrs. B. Gayathri",
      designation: "Assistant Professor & Class In-charge",
      email: "mrsbgayathri@gmail.com",
      phone: "+91 98480 11221",
    },
    lectureHall: "Hall 402",
    labRoom: "Programming Lab 2 (Lab-205)",
    totalStudents: 55,
    rollRange: "25N81A6701 TO 25N81A6755",
    semester: "III Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mrs. B. Gayathri", "Mrs Ch Vijaya Lakshmi"],
  },
  "2B": {
    sectionKey: "2B",
    yearNumber: "II",
    yearLabel: "2nd Year",
    sectionLetter: "B",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mrs. K. Ramya",
      designation: "Assistant Professor & Class In-charge",
      email: "mrskramya@gmail.com",
      phone: "+91 98480 22332",
    },
    lectureHall: "Hall 408",
    labRoom: "Programming Lab 2 (Lab-205)",
    totalStudents: 55,
    rollRange: "25N81A6756 TO 25N81A67B3",
    semester: "III Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mrs. K. Ramya", "Mr M Srinivasulu"],
  },
  "2C": {
    sectionKey: "2C",
    yearNumber: "II",
    yearLabel: "2nd Year",
    sectionLetter: "C",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mr. K. Bikshapathi",
      designation: "Assistant Professor & Class In-charge",
      email: "mrkbikshapathi@gmail.com",
      phone: "+91 98480 33443",
    },
    lectureHall: "Hall 410",
    labRoom: "Programming Lab 2 (Lab-205)",
    totalStudents: 45,
    rollRange: "25N81A67B4 TO 25N81A67G0",
    semester: "III Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mr. K. Bikshapathi", "Mrs K Srinija"],
  },
  "3A": {
    sectionKey: "3A",
    yearNumber: "III",
    yearLabel: "3rd Year",
    sectionLetter: "A",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mrs. G. Sushma",
      designation: "Assistant Professor & Class In-charge",
      email: "mrsgsushma@gmail.com",
      phone: "+91 98480 44554",
    },
    lectureHall: "Hall 412",
    labRoom: "Data Science Lab 1 (Lab-101) & Networks Lab",
    totalStudents: 55,
    rollRange: "24N81A6701 TO 24N81A6755",
    semester: "V Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mrs. G. Sushma", "Ms. Priyusha"],
  },
  "3B": {
    sectionKey: "3B",
    yearNumber: "III",
    yearLabel: "3rd Year",
    sectionLetter: "B",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mr. T. Shravan Kumar",
      designation: "Assistant Professor & Class In-charge",
      email: "mrtshravankumar@gmail.com",
      phone: "+91 98480 55665",
    },
    lectureHall: "Hall 413",
    labRoom: "Data Science Lab 1 (Lab-101) & Networks Lab",
    totalStudents: 52,
    rollRange: "24N81A6756 TO 24N81A67A5",
    semester: "V Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mr. T. Shravan Kumar", "Mrs. CH. Naga Rohini", "Mr Miskeen Ali"],
  },
  "3C": {
    sectionKey: "3C",
    yearNumber: "III",
    yearLabel: "3rd Year",
    sectionLetter: "C",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mr. M. Yadaiah",
      designation: "Assistant Professor & Class In-charge",
      email: "mrmyadaiah@gmail.com",
      phone: "+91 98480 66776",
    },
    lectureHall: "Hall 417",
    labRoom: "Data Science Lab 1 (Lab-101) & Networks Lab",
    totalStudents: 54,
    rollRange: "24N81A67A6 TO 24N81A67F9",
    semester: "V Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mr. M. Yadaiah", "Mrs. Swetha"],
  },
  "4A": {
    sectionKey: "4A",
    yearNumber: "IV",
    yearLabel: "4th Year",
    sectionLetter: "A",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mrs. A. Sravanthi",
      designation: "Assistant Professor & Class In-charge",
      email: "mrsasravanthi@gmail.com",
      phone: "+91 98480 77887",
    },
    lectureHall: "Hall 418",
    labRoom: "Mobile App & Cloud Lab (Lab-102)",
    totalStudents: 42,
    rollRange: "23N81A6701 TO 23N81A6743",
    semester: "VII Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mrs. A. Sravanthi"],
  },
  "4B": {
    sectionKey: "4B",
    yearNumber: "IV",
    yearLabel: "4th Year",
    sectionLetter: "B",
    degree: "B.Tech",
    branch: "Computer Science & Engineering (Data Science)",
    classIncharge: {
      name: "Mrs. K. Sneha",
      designation: "Assistant Professor & Class In-charge",
      email: "mrsksneha@gmail.com",
      phone: "+91 98480 88998",
    },
    lectureHall: "Hall 403",
    labRoom: "Mobile App & Cloud Lab (Lab-102)",
    totalStudents: 39,
    rollRange: "23N81A6744 TO 23N81A67C8",
    semester: "VII Semester",
    academicYear: "2025 – 2026",
    wefDate: "01-08-2025",
    mentors: ["Mrs. K. Sneha"],
  },
};

export const MASTER_SUBJECT_DIRECTORY: Record<string, {
  fullName: string;
  code: string;
  type: "theory" | "practical" | "activity";
  defaultRoom: string;
  credits: number;
}> = {
  // II Year
  "JAVA": { fullName: "Java Programming", code: "CS301PC", type: "theory", defaultRoom: "LH-201", credits: 3 },
  "DBMS": { fullName: "Database Management Systems", code: "CS302PC", type: "theory", defaultRoom: "LH-201", credits: 4 },
  "SE": { fullName: "Software Engineering", code: "CS303PC", type: "theory", defaultRoom: "LH-201", credits: 3 },
  "COA": { fullName: "Computer Organization & Architecture", code: "CS304PC", type: "theory", defaultRoom: "LH-201", credits: 3 },
  "MSF": { fullName: "Mathematical & Statistical Foundations for DS", code: "MA305BS", type: "theory", defaultRoom: "LH-201", credits: 4 },
  "SDC": { fullName: "Skill Development Course (Python / DS)", code: "CS306SC", type: "theory", defaultRoom: "LH-202", credits: 2 },
  "CM LAB": { fullName: "Computational Mathematics Lab", code: "MA307BS", type: "practical", defaultRoom: "Computing Lab", credits: 2 },
  "JAVA/DBMS LAB": { fullName: "Java & DBMS Laboratory", code: "CS307PC", type: "practical", defaultRoom: "Programming Lab 2", credits: 2 },
  "SE/JAVA LAB": { fullName: "Software Engineering & Java Lab", code: "CS308PC", type: "practical", defaultRoom: "Programming Lab 2", credits: 2 },
  "DBMS/SE LAB": { fullName: "DBMS & Software Engineering Lab", code: "CS307PC", type: "practical", defaultRoom: "Data Science Lab 1", credits: 2 },
  "JAVA/SE LAB": { fullName: "Java & Software Engineering Lab", code: "CS307PC", type: "practical", defaultRoom: "Programming Lab 2", credits: 2 },
  "SE/DBMS LAB": { fullName: "Software Engineering & DBMS Lab", code: "CS308PC", type: "practical", defaultRoom: "Programming Lab 2", credits: 2 },
  "DBMS/JAVA LAB": { fullName: "DBMS & Java Programming Lab", code: "CS308PC", type: "practical", defaultRoom: "Data Science Lab 1", credits: 2 },
  "APTITUDE": { fullName: "Quantitative Aptitude & Placement Training", code: "TP308SC", type: "theory", defaultRoom: "LH-201", credits: 1 },

  // III Year
  "CN": { fullName: "Computer Networks", code: "CS501PC", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "ADA": { fullName: "Analysis & Design of Algorithms", code: "CS502PC", type: "theory", defaultRoom: "LH-302", credits: 4 },
  "DEVOPS": { fullName: "DevOps & Cloud Automation", code: "CS503PC", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "IDS": { fullName: "Information & Data Security", code: "DS504PE", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "WP": { fullName: "Web Programming", code: "DS505PE", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "ARQA": { fullName: "Automated Testing & Quality Assurance", code: "DS506PE", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "KAFKA": { fullName: "Apache Kafka & Big Data Streams", code: "DS507PC", type: "theory", defaultRoom: "LH-302", credits: 3 },
  "CN/R PROGRAMMING LAB": { fullName: "Computer Networks & R Programming Lab", code: "DS508PC", type: "practical", defaultRoom: "Data Science Lab 1", credits: 2 },
  "R PROGRAMMING/CN LAB": { fullName: "R Programming & Computer Networks Lab", code: "DS508PC", type: "practical", defaultRoom: "Data Science Lab 1", credits: 2 },
  "AECS LAB": { fullName: "Advanced English Communication Skills Lab", code: "EN509HS", type: "practical", defaultRoom: "Language Lab", credits: 1 },
  "IPR": { fullName: "Intellectual Property Rights & Patents", code: "MC510MC", type: "theory", defaultRoom: "LH-301", credits: 0 },

  // IV Year
  "PA": { fullName: "Predictive Analytics", code: "DS701PE", type: "theory", defaultRoom: "LH-401", credits: 3 },
  "PA LAB": { fullName: "Predictive Analytics Laboratory", code: "DS702PC", type: "practical", defaultRoom: "Data Science Lab 2", credits: 2 },
  "WSMA": { fullName: "Web Services & Mobile Applications", code: "CS701PC", type: "theory", defaultRoom: "LH-401", credits: 3 },
  "WSMA LAB": { fullName: "Web Services & Mobile App Lab", code: "CS706PC", type: "practical", defaultRoom: "Mobile App Lab", credits: 2 },
  "CC": { fullName: "Cloud Computing & Virtualization", code: "CS702PC", type: "theory", defaultRoom: "LH-401", credits: 3 },
  "NLP": { fullName: "Natural Language Processing", code: "DS703PE", type: "theory", defaultRoom: "LH-401", credits: 3 },
  "OE": { fullName: "Open Elective (Professional Practice & Ethics)", code: "OE704OE", type: "theory", defaultRoom: "LH-402", credits: 3 },
  "PS-I": { fullName: "Project Stage - I (Industry Review)", code: "DS705PW", type: "practical", defaultRoom: "Project Lab", credits: 3 },

  // Institutional Activities
  "SPORTS": { fullName: "Sports & Physical Education", code: "ACT01", type: "activity", defaultRoom: "College Ground", credits: 0 },
  "SPORTS/LIBRARY": { fullName: "Sports & Library Hour", code: "ACT02", type: "activity", defaultRoom: "Central Library", credits: 0 },
  "LIBRARY": { fullName: "Digital Library & Research Hour", code: "ACT02", type: "activity", defaultRoom: "Central Library", credits: 0 },
  "COUNSELLING": { fullName: "Mentor-Mentee Academic Counselling", code: "ACT03", type: "activity", defaultRoom: "Classroom", credits: 0 },
  "CLUB ACTIVITIES": { fullName: "Technical Club & Hackathon Projects", code: "ACT04", type: "activity", defaultRoom: "Innovation Cell", credits: 0 },
  "FREE": { fullName: "Free Period / Self Study", code: "FREE", type: "activity", defaultRoom: "Library / Class", credits: 0 },
};

// Exact Department Timetable Schedule Provided by User
export const DEPARTMENT_EXACT_TIMETABLE: Record<string, Record<string, string[]>> = {
  "2A": {
    "MON": ["JAVA/DBMS LAB", "JAVA/DBMS LAB", "MSF", "JAVA", "SE", "COA"],
    "TUE": ["SE/JAVA LAB", "SE/JAVA LAB", "MSF", "COA", "DBMS", "SPORTS/LIBRARY"],
    "WED": ["DBMS/SE LAB", "DBMS/SE LAB", "MSF", "JAVA", "DBMS", "SE"],
    "THUR": ["SDC", "Free", "JAVA", "DBMS", "SE", "COUNSELLING"],
    "FRI": ["DBMS", "COA", "JAVA", "SE", "APTITUDE", "Free"],
    "SAT": ["CM LAB", "CM LAB", "COA", "MSF", "CLUB ACTIVITIES", "Free"],
  },
  "2B": {
    "MON": ["MSF", "SE", "SE/JAVA LAB", "SE/JAVA LAB", "COA", "DBMS"],
    "TUE": ["CM LAB", "CM LAB", "JAVA/DBMS LAB", "JAVA/DBMS LAB", "SE", "DBMS"],
    "WED": ["COA", "JAVA", "SDC", "SDC", "MSF", "SPORTS/LIBRARY"],
    "THUR": ["DBMS", "JAVA", "COA", "SE", "MSF", "COUNSELLING"],
    "FRI": ["JAVA", "MSF", "DBMS", "DBMS/SE LAB", "SE", "JAVA"],
    "SAT": ["APTITUDE", "Free", "DBMS/SE LAB", "DBMS/SE LAB", "CLUB ACTIVITIES", "Free"],
  },
  "2C": {
    "MON": ["DBMS", "COA", "SDC", "SDC", "SE", "JAVA"],
    "TUE": ["JAVA", "MSF", "SE", "COUNSELLING", "COA", "DBMS"],
    "WED": ["CM LAB", "CM LAB", "JAVA/SE LAB", "JAVA/SE LAB", "JAVA", "COA"],
    "THUR": ["JAVA", "COA", "SE/DBMS LAB", "SE/DBMS LAB", "SE", "MSF"],
    "FRI": ["MSF", "SE", "DBMS/JAVA LAB", "DBMS/JAVA LAB", "DBMS", "SPORTS/LIBRARY"],
    "SAT": ["MSF", "DBMS", "APTITUDE", "Free", "CLUB ACTIVITIES", "Free"],
  },
  "3A": {
    "MON": ["KAFKA", "KAFKA", "ADA", "CN", "CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB"],
    "TUE": ["CN", "WP", "DEVOPS", "COUNSELLING", "R PROGRAMMING/CN LAB", "R PROGRAMMING/CN LAB"],
    "WED": ["ARQA", "CN", "CN", "ADA", "DEVOPS", "SPORTS"],
    "THUR": ["IDS", "WP", "DEVOPS", "LIBRARY", "ADA", "WP"],
    "FRI": ["DEVOPS", "IDS", "IDS", "CN", "AECS LAB", "AECS LAB"],
    "SAT": ["WP", "Free", "IPR", "Free", "CLUB ACTIVITIES", "Free"],
  },
  "3B": {
    "MON": ["CN", "DEVOPS", "WP", "COUNSELLING", "ADA", "SPORTS"],
    "TUE": ["WP", "IDS", "CN", "LIBRARY", "DEVOPS", "ADA"],
    "WED": ["IDS", "ARQA", "WP", "DEVOPS", "CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB"],
    "THUR": ["ADA", "WP", "CN", "IDS", "R PROGRAMMING/CN LAB", "R PROGRAMMING/CN LAB"],
    "FRI": ["KAFKA", "KAFKA", "CN", "ADA", "IDS", "DEVOPS"],
    "SAT": ["AECS LAB", "AECS LAB", "IPR", "Free", "CLUB ACTIVITIES", "Free"],
  },
  "3C": {
    "MON": ["CN", "IDS", "DEVOPS", "LIBRARY", "WP", "ADA"],
    "TUE": ["DEVOPS", "CN", "WP", "ADA", "IDS", "SPORTS"],
    "WED": ["ADA", "DEVOPS", "ARQA", "IDS", "WP", "CN"],
    "THUR": ["CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB", "AECS LAB", "AECS LAB", "DEVOPS", "WP"],
    "FRI": ["R PROGRAMMING/CN LAB", "R PROGRAMMING/CN LAB", "COUNSELLING", "IDS", "CN", "ADA"],
    "SAT": ["KAFKA", "Free", "IPR", "Free", "CLUB ACTIVITIES", "Free"],
  },
  "4A": {
    "MON": ["PA", "WSMA", "OE", "CC", "PS-I", "PS-I"],
    "TUE": ["PA Lab", "PA Lab", "CC", "NLP", "PS-I", "SPORTS"],
    "WED": ["PA", "WSMA", "OE", "NLP", "CC", "COUNSELLING"],
    "THUR": ["WSMA Lab", "WSMA Lab", "NLP", "CC", "PS-I", "Free"],
    "FRI": ["WSMA", "PA", "NLP", "OE", "PS-I", "Free"],
    "SAT": ["PA", "WSMA", "OE", "LIBRARY", "CLUB ACTIVITIES", "Free"],
  },
  "4B": {
    "MON": ["PA", "WSMA", "NLP", "OE", "PS-I", "PS-I"],
    "TUE": ["PA LAB", "PA LAB", "OE", "CC", "PS-I", "SPORTS"],
    "WED": ["PA", "WSMA", "CC", "OE", "NLP", "PS-I"],
    "THUR": ["WSMA LAB", "WSMA LAB", "CC", "NLP", "PS-I", "COUNSELLING"],
    "FRI": ["WSMA", "PA", "OE", "LIBRARY", "CC", "Free"],
    "SAT": ["PA", "WSMA", "NLP", "PS-I", "CLUB ACTIVITIES", "Free"],
  },
};

export const SECTION_FACULTY_ALLOCATION_MATRIX: Record<string, Record<string, string>> = {
  // II YEAR
  "2A": {
    "MSF": "Mr. Rakesh Goud",
    "COA": "Mrs. CH. Naga Rohini",
    "JAVA": "Dr. A. Balaram",
    "JAVA/DBMS LAB": "Dr. A. Balaram & Mrs. Ch. Vijaya Lakshmi",
    "SE/JAVA LAB": "Dr. A. Balaram & Mr. M. Srinivasulu",
    "DBMS/SE LAB": "Mrs. Ch. Vijaya Lakshmi & Mr. M. Srinivasulu",
    "JAVA/SE LAB": "Dr. A. Balaram & Mr. M. Srinivasulu",
    "DBMS/JAVA LAB": "Mrs. Ch. Vijaya Lakshmi & Dr. A. Balaram",
    "DBMS": "Mrs. Ch. Vijaya Lakshmi",
    "SE": "Mr. M. Srinivasulu",
    "CM LAB": "Dr. Sri Hari VLN",
    "SDC": "Mrs. K. Srinija",
    "APTITUDE": "Mr. K. Bikshapathi",
    "COUNSELLING": "Mrs. B. Gayathri",
    "SPORTS/LIBRARY": "—",
    "LIBRARY": "—",
    "SPORTS": "—",
    "CLUB ACTIVITIES": "Mrs. B. Gayathri",
  },
  "2B": {
    "MSF": "Mr. Rakesh Goud",
    "COA": "Mrs. CH. Naga Rohini",
    "JAVA": "Mr. M. Yadaiah",
    "JAVA/DBMS LAB": "Mr. M. Yadaiah & Mrs. Ch. Vijaya Lakshmi",
    "SE/JAVA LAB": "Mr. M. Srinivasulu & Mr. M. Yadaiah",
    "DBMS/SE LAB": "Mrs. Ch. Vijaya Lakshmi & Mr. M. Srinivasulu",
    "JAVA/SE LAB": "Mr. M. Yadaiah & Mr. M. Srinivasulu",
    "DBMS/JAVA LAB": "Mrs. Ch. Vijaya Lakshmi & Mr. M. Yadaiah",
    "DBMS": "Mrs. Ch. Vijaya Lakshmi",
    "SE": "Mr. M. Srinivasulu",
    "CM LAB": "Dr. Sri Hari VLN",
    "SDC": "Mrs. K. Srinija",
    "APTITUDE": "Mrs. K. Ramya",
    "COUNSELLING": "Mrs. K. Ramya",
    "SPORTS/LIBRARY": "—",
    "LIBRARY": "—",
    "SPORTS": "—",
    "CLUB ACTIVITIES": "Mrs. K. Ramya",
  },
  "2C": {
    "MSF": "Mr. Rakesh Goud",
    "COA": "Mrs. CH. Naga Rohini",
    "JAVA": "Mr. M. Yadaiah",
    "JAVA/SE LAB": "Mr. M. Yadaiah & Mr. K. Bikshapathi",
    "DBMS/JAVA LAB": "Mrs. G. Sushma & Mr. M. Yadaiah",
    "JAVA/DBMS LAB": "Mr. M. Yadaiah & Mrs. G. Sushma",
    "SE/DBMS LAB": "Mr. K. Bikshapathi & Mrs. G. Sushma",
    "DBMS/SE LAB": "Mrs. G. Sushma & Mr. K. Bikshapathi",
    "SE/JAVA LAB": "Mr. K. Bikshapathi & Mr. M. Yadaiah",
    "DBMS": "Mrs. G. Sushma",
    "SE": "Mr. K. Bikshapathi",
    "CM LAB": "Dr. Sri Hari VLN",
    "SDC": "Mrs. K. Srinija",
    "APTITUDE": "Mr. K. Bikshapathi",
    "COUNSELLING": "Mr. K. Bikshapathi",
    "SPORTS/LIBRARY": "—",
    "LIBRARY": "—",
    "SPORTS": "—",
    "CLUB ACTIVITIES": "Mr. K. Bikshapathi",
  },

  // III YEAR
  "3A": {
    "CN": "Mrs. K. Sneha",
    "CN/R PROGRAMMING LAB": "Mrs. K. Sneha",
    "R PROGRAMMING/CN LAB": "Mrs. K. Sneha",
    "ADA": "Dr. Md Abdul Azeem",
    "WP": "Mrs. G. Sushma",
    "DEVOPS": "Mr. Miskeen Ali",
    "IDS": "Mr. T. Shravan Kumar",
    "KAFKA": "Mrs. K. Ramya",
    "ARQA": "Mr. M. Yadaiah",
    "AECS LAB": "Mr. M. Yadaiah",
    "IPR": "Mr. M. Yadaiah",
    "LIBRARY": "—",
    "COUNSELLING": "Mrs. G. Sushma",
    "SPORTS": "—",
    "SPORTS/LIBRARY": "—",
    "CLUB ACTIVITIES": "Mrs. G. Sushma",
  },
  "3B": {
    "CN": "Mrs. K. Sneha",
    "CN LAB": "Mrs. K. Sneha",
    "WP": "Mrs. G. Sushma",
    "IDS": "Mrs. A. Sravanthi",
    "ADA": "Dr. Md Abdul Azeem",
    "DEVOPS": "Mr. Mohammed Miskeen Ali",
    "KAFKA": "Mrs. K. Ramya",
    "CN/R PROGRAMMING LAB": "Mrs. K. Sneha & Mrs. A. Sravanthi",
    "R PROGRAMMING/CN LAB": "Mrs. A. Sravanthi & Mrs. K. Sneha",
    "R PROGRAMMING LAB": "Mrs. A. Sravanthi",
    "AECS LAB": "Ms. Vaidehi",
    "IPR": "Mr. Prateek",
    "ARQA": "Mr. T. Shravan Kumar",
    "COUNSELLING": "Mr. Miskeen Ali + Mrs. Naga Rohini",
    "SPORTS": "—",
    "LIBRARY": "—",
    "SPORTS/LIBRARY": "—",
    "CLUB ACTIVITIES": "Mr. T. Shravan Kumar",
  },
  "3C": {
    "CN": "Mrs. K. Sneha",
    "CN/R PROGRAMMING LAB": "Mrs. K. Sneha",
    "R PROGRAMMING/CN LAB": "Mrs. K. Sneha",
    "ADA": "Dr. Md Abdul Azeem",
    "WP": "Mrs. G. Sushma",
    "IDS": "Mrs. A. Sravanthi",
    "DEVOPS": "Mr. Miskeen Ali",
    "KAFKA": "Mrs. K. Ramya",
    "ARQA": "Mr. M. Srinivasulu",
    "AECS LAB": "Mr. M. Srinivasulu",
    "IPR": "Mr. M. Srinivasulu",
    "LIBRARY": "—",
    "SPORTS": "—",
    "SPORTS/LIBRARY": "—",
    "COUNSELLING": "Mr. M. Srinivasulu",
    "CLUB ACTIVITIES": "Mr. M. Srinivasulu",
  },

  // IV YEAR
  "4A": {
    "PA": "Mr. T. Shravan Kumar",
    "PA LAB": "Mr. T. Shravan Kumar",
    "PA Lab": "Mr. T. Shravan Kumar",
    "WSMA": "Mr. K. Bikshapathi",
    "WSMA LAB": "Mr. K. Bikshapathi",
    "WSMA Lab": "Mr. K. Bikshapathi",
    "NLP": "Mrs. B. Gayathri",
    "CC": "Mrs. K. Ramya",
    "OE": "Dr. C. Lakshmi Nath",
    "PS-I": "Mr. Miskeen Ali",
    "SPORTS": "—",
    "LIBRARY": "—",
    "SPORTS/LIBRARY": "—",
    "COUNSELLING": "Mrs. A. Sravanthi",
    "CLUB ACTIVITIES": "Mrs. A. Sravanthi",
  },
  "4B": {
    "PA": "Mr. T. Shravan Kumar",
    "PA LAB": "Mr. T. Shravan Kumar",
    "PA Lab": "Mr. T. Shravan Kumar",
    "WSMA": "Mr. K. Bikshapathi",
    "WSMA LAB": "Mr. K. Bikshapathi",
    "WSMA Lab": "Mr. K. Bikshapathi",
    "NLP": "Mrs. B. Gayathri",
    "CC": "Mrs. K. Ramya",
    "OE": "Dr. C. Lakshmi Nath",
    "PS-I": "Dr. Md Abdul Azeem",
    "SPORTS": "—",
    "LIBRARY": "—",
    "SPORTS/LIBRARY": "—",
    "COUNSELLING": "Mrs. K. Sneha",
    "CLUB ACTIVITIES": "Mrs. K. Sneha",
  },
};

export function getSectionFacultyForSubject(
  subject: string,
  sectionKey: string,
  dayKey?: string,
  slotIdx?: number,
  overrides?: Record<string, Record<string, string>>
): string {
  const norm = (subject || "").trim().toUpperCase();
  const sec = sectionKey || "3B";

  // No faculty needed for Library, Sports, Free period
  if (
    norm.includes("LIBRARY") ||
    norm.includes("SPORTS") ||
    norm === "FREE" ||
    norm === "FREE PERIOD" ||
    norm === "SELF STUDY"
  ) {
    return "—";
  }

  // 1. Check specific slot override e.g. "3B:MON:0"
  if (overrides && dayKey !== undefined && slotIdx !== undefined) {
    const slotKey = `${sec}:${dayKey}:${slotIdx}`;
    if (overrides[sec]?.[slotKey]) {
      return overrides[sec][slotKey];
    }
  }

  // 2. Check section subject-level override e.g. "3B:CN"
  if (overrides?.[sec]?.[subject]) {
    return overrides[sec][subject];
  }
  if (overrides?.[sec]?.[norm]) {
    return overrides[sec][norm];
  }

  // 3. Fallback to static official matrix
  const secAlloc = SECTION_FACULTY_ALLOCATION_MATRIX[sec];
  if (secAlloc) {
    if (secAlloc[subject]) return secAlloc[subject];
    if (secAlloc[norm]) return secAlloc[norm];
    for (const [k, v] of Object.entries(secAlloc)) {
      if (norm === k.toUpperCase() || norm.includes(k.toUpperCase()) || k.toUpperCase().includes(norm)) {
        return v;
      }
    }
  }
  return "Faculty Assigned";
}

export function getTimetableSubjectDetails(rawSubject: string, section?: string, year?: string) {
  const norm = (rawSubject || "").trim().toUpperCase();
  const direct = MASTER_SUBJECT_DIRECTORY[norm];
  if (direct) {
    return direct;
  }

  for (const [key, value] of Object.entries(MASTER_SUBJECT_DIRECTORY)) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }

  const isLab = norm.includes("LAB") || norm.includes("PRACTICAL") || norm.includes("/");
  return {
    fullName: rawSubject || "Special Academic Session",
    code: isLab ? "DS-LAB" : "DS-TH",
    type: isLab ? "practical" as const : "theory" as const,
    defaultRoom: isLab ? "Data Science Lab 1" : "LH-302",
    credits: isLab ? 2 : 3,
  };
}

export default function HodDashboard() {
  const [activeTab, setActiveTab] = useState<"summary" | "logs" | "mentors" | "schedules" | "flags" | "student-analytics">((): any => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "flags") return "flags";
    if (tab === "student-analytics") return "student-analytics";
    return "summary";
  });

  const [riskFlagFilter, setRiskFlagFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [riskYearFilter, setRiskYearFilter] = useState("ALL");
  const [riskSectionFilter, setRiskSectionFilter] = useState("ALL");
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [riskSortOrder, setRiskSortOrder] = useState<"lowest" | "highest" | "roll" | "name">("lowest");
  const [riskViewMode, setRiskViewMode] = useState<"table" | "card">("table");
  const [riskPage, setRiskPage] = useState(1);
  const [riskPageSize, setRiskPageSize] = useState<number>(25);

  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState("");
  const [analyticsYearFilter, setAnalyticsYearFilter] = useState("ALL");
  const [analyticsSectionFilter, setAnalyticsSectionFilter] = useState("ALL");
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">("ALL");
  const [analyticsSortOrder, setAnalyticsSortOrder] = useState<"name" | "roll" | "lowest" | "highest">("name");
  const [analyticsViewMode, setAnalyticsViewMode] = useState<"table" | "card">("table");
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const [analyticsPageSize, setAnalyticsPageSize] = useState<number>(25);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "flags") {
        setActiveTab("flags");
      } else if (tab === "student-analytics") {
        setActiveTab("student-analytics");
      } else if (!params.has("tab")) {
        setActiveTab("summary");
      }
    };
    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [logDate, setLogDate] = useState(() => {
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
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logViewMode, setLogViewMode] = useState<"problems" | "late" | "unscanned" | "all" | "comparison" | "trend">("all");
  const [selectedMentorFilter, setSelectedMentorFilter] = useState("All");
  const [logSortField, setLogSortField] = useState<"severity" | "name" | "uniqueId" | "section" | "entryTime" | "exitTime" | "duration" | "status">("entryTime");
  const [logSortOrder, setLogSortOrder] = useState<"asc" | "desc">("desc");
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(25);

  // Bulk Parent Notification States
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false);
  const [bulkMessageType, setBulkMessageType] = useState<"late" | "unscanned" | "custom">("late");
  const [bulkCustomMessage, setBulkCustomMessage] = useState("");
  const [bulkBroadcastChannel, setBulkBroadcastChannel] = useState<"whatsapp" | "sms" | "app">("whatsapp");
  const [bulkBroadcastSending, setBulkBroadcastSending] = useState(false);
  const [bulkBroadcastSuccess, setBulkBroadcastSuccess] = useState(false);

  // Remarks / Excuses State
  const [remarkModalData, setRemarkModalData] = useState<{ student: StudentUser; record?: AttendanceRecord; isLate: boolean; isUnscanned: boolean } | null>(null);
  const [remarkInput, setRemarkInput] = useState("");
  const [remarkPreset, setRemarkPreset] = useState("College Bus Delayed");
  const [remarkIsExcused, setRemarkIsExcused] = useState(true);
  const [remarksMap, setRemarksMap] = useState<Record<string, { text: string; preset: string; isExcused: boolean; updatedAt: string }>>(() => {
    try {
      const saved = localStorage.getItem("hod_student_remarks_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [mentorsSearchQuery, setMentorsSearchQuery] = useState("");
  const [mentorsYearFilter, setMentorsYearFilter] = useState("All");
  const [mentorsSectionFilter, setMentorsSectionFilter] = useState("All");
  const [mentorsRoleFilter, setMentorsRoleFilter] = useState("All");
  const [mentorsViewMode, setMentorsViewMode] = useState<"table" | "card">("table");
  const [mentorsPage, setMentorsPage] = useState(1);
  const [mentorsPageSize, setMentorsPageSize] = useState<number>(25);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [selectedMentorForModal, setSelectedMentorForModal] = useState<any | null>(null);
  const [editMentorModalOpen, setEditMentorModalOpen] = useState(false);
  const [mentorEditData, setMentorEditData] = useState<{ id: number; name: string; email: string; role: string; section: string; key: string } | null>(null);
  const [editKeyInput, setEditKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [schedulesSearchQuery, setSchedulesSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("All");
  const [selectedTimetableSection, setSelectedTimetableSection] = useState<string>("3B");
  const [timetableViewMode, setTimetableViewMode] = useState<"grid" | "list">("grid");
  const [timetablePrintModalOpen, setTimetablePrintModalOpen] = useState(false);

  // Timetable print / download schedule helper
  const handleDownloadSchedule = () => {
    setTimetablePrintModalOpen(true);
  };

  // Class Reassignment Requests & Approvals State
  const [processingReassignId, setProcessingReassignId] = useState<string | null>(null);

  const { data: reassignmentsData, refetch: refetchReassignments } = useQuery<{
    total: number;
    pendingCount: number;
    acceptedCount: number;
    declinedCount: number;
    reassignments: any[];
  }>({
    queryKey: ["admin-reassignments"],
    queryFn: () => customFetch("/api/admin/reassignments"),
    refetchInterval: 4000,
  });

  const handleReassignmentAction = async (id: string, action: "accept" | "decline") => {
    setProcessingReassignId(id);
    try {
      await customFetch(`/api/admin/reassignments/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      refetchReassignments();
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
    } catch (err: any) {
      console.error("Failed to process reassignment action", err);
    } finally {
      setProcessingReassignId(null);
    }
  };

  // Fetch all students
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<StudentUser[]>({
    queryKey: ["users"],
    queryFn: () => customFetch<StudentUser[]>("/api/users"),
  });

  // Fetch Monthly Attendance Records for Flag Calculations across the month
  const [monthForFlags] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: monthlyAttendanceForFlags = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["hod-attendance-month-flags", monthForFlags],
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
      if (dObj.getDay() !== 0) {
        working++;
      }
    }
    return Math.max(1, working);
  }, [monthForFlags]);

  const studentPresentCounts = useMemo(() => {
    const map = new Map<number, number>();
    (monthlyAttendanceForFlags || []).forEach((r: any) => {
      const uid = r.userId || r.user_id || r.user?.id;
      if (uid) {
        map.set(uid, (map.get(uid) || 0) + 1);
      }
    });
    return map;
  }, [monthlyAttendanceForFlags]);

  const hodStudents = useMemo(() => {
    return allUsers.filter((u) => u.role === "student");
  }, [allUsers]);

  const hodStudentAnalyticsList = useMemo(() => {
    return hodStudents.map((student) => {
      const presentDays = studentPresentCounts.get(student.id) || 0;
      const calcWorking = totalMonthWorkingDays > 0 ? totalMonthWorkingDays : 1;
      const percent = Math.min(100, Math.floor((presentDays / calcWorking) * 100));

      const classesNeededFor75 = Math.max(0, 3 * totalMonthWorkingDays - 4 * presentDays);
      const classesNeededFor65 = Math.max(0, Math.ceil((0.65 * totalMonthWorkingDays - presentDays) / 0.35));

      let flag: "GREEN" | "YELLOW" | "RED" = "GREEN";
      let label = "Compliant";
      let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      let dotColor = "🟢";
      let tip = "Compliant (≥ 75%). Safe academic standing.";

      if (percent < 65) {
        flag = "RED";
        label = "Critical (<65%)";
        badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
        dotColor = "🔴";
        tip = `Critical shortage (< 65%). Needs ${classesNeededFor65} classes for 65% condonation, and ${classesNeededFor75} classes to reach 75% threshold.`;
      } else if (percent < 75) {
        flag = "YELLOW";
        label = "Borderline (65%–74%)";
        badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
        dotColor = "🟡";
        tip = `Borderline warning. Needs ${classesNeededFor75} consecutive classes to reach 75% threshold.`;
      }

      const str = (student.section || "").trim();
      const parts = str.split("/");
      const sectionLetter = (parts[parts.length - 1] || "A").trim().toUpperCase();
      let yearLabel = "Department";
      let yearNum = "Other";
      let secName = student.section || "A";

      if (str.includes("IV") || str.includes("4")) {
        yearLabel = "4th Year"; yearNum = "4"; secName = `4${sectionLetter}`;
      } else if (str.includes("III") || str.includes("3")) {
        yearLabel = "3rd Year"; yearNum = "3"; secName = `3${sectionLetter}`;
      } else if (str.includes("II") || str.includes("2")) {
        yearLabel = "2nd Year"; yearNum = "2"; secName = `2${sectionLetter}`;
      }

      return {
        student,
        presentDays,
        totalWorkingDays: totalMonthWorkingDays,
        percent,
        flag,
        label,
        badgeColor,
        dotColor,
        tip,
        classesNeededFor75,
        classesNeededFor65,
        secInfo: { name: secName, yearLabel, yearNum }
      };
    });
  }, [hodStudents, studentPresentCounts, totalMonthWorkingDays]);

  const hodRedCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "RED").length, [hodStudentAnalyticsList]);
  const hodYellowCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "YELLOW").length, [hodStudentAnalyticsList]);
  const hodGreenCount = useMemo(() => hodStudentAnalyticsList.filter((s) => s.flag === "GREEN").length, [hodStudentAnalyticsList]);

  const filteredHodAnalyticsList = useMemo(() => {
    let result = hodStudentAnalyticsList.filter((item) => {
      const q = riskSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.student.name.toLowerCase().includes(q) ||
        (item.student.uniqueId || "").toLowerCase().includes(q);

      const matchesFlag = riskFlagFilter === "ALL" || item.flag === riskFlagFilter;
      const matchesYear = riskYearFilter === "ALL" || item.secInfo.yearNum === riskYearFilter;
      const matchesSection = riskSectionFilter === "ALL" || item.secInfo.name === riskSectionFilter;

      return matchesSearch && matchesFlag && matchesYear && matchesSection;
    });

    if (riskSortOrder === "lowest") {
      result.sort((a, b) => a.percent - b.percent);
    } else if (riskSortOrder === "highest") {
      result.sort((a, b) => b.percent - a.percent);
    } else if (riskSortOrder === "roll") {
      result.sort((a, b) => (a.student.uniqueId || "").localeCompare(b.student.uniqueId || ""));
    } else if (riskSortOrder === "name") {
      result.sort((a, b) => a.student.name.localeCompare(b.student.name));
    }

    return result;
  }, [hodStudentAnalyticsList, riskSearchQuery, riskFlagFilter, riskYearFilter, riskSectionFilter, riskSortOrder]);

  const paginatedRiskList = useMemo(() => {
    if (riskPageSize === -1) return filteredHodAnalyticsList;
    const start = (riskPage - 1) * riskPageSize;
    return filteredHodAnalyticsList.slice(start, start + riskPageSize);
  }, [filteredHodAnalyticsList, riskPage, riskPageSize]);

  const totalRiskPages = useMemo(() => {
    if (riskPageSize === -1) return 1;
    return Math.ceil(filteredHodAnalyticsList.length / riskPageSize) || 1;
  }, [filteredHodAnalyticsList, riskPageSize]);

  const filteredAnalyticsList = useMemo(() => {
    return hodStudentAnalyticsList.filter((item) => {
      const s = item.student;
      const q = analyticsSearchQuery.toLowerCase().trim();
      if (q) {
        const matchName = (s.name || (s as any).full_name || "").toLowerCase().includes(q);
        const matchRoll = (s.uniqueId || "").toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }
      if (analyticsStatusFilter !== "ALL" && item.flag !== analyticsStatusFilter) {
        return false;
      }
      if (analyticsYearFilter !== "ALL" && item.secInfo.yearNum !== analyticsYearFilter) {
        return false;
      }
      if (analyticsSectionFilter !== "ALL") {
        const matchSec = item.secInfo.name === analyticsSectionFilter || 
                         item.secInfo.name.endsWith(analyticsSectionFilter) ||
                         (s.section || "").toUpperCase().includes(analyticsSectionFilter);
        if (!matchSec) return false;
      }
      return true;
    }).sort((a, b) => {
      if (analyticsSortOrder === "lowest") return a.percent - b.percent;
      if (analyticsSortOrder === "highest") return b.percent - a.percent;
      if (analyticsSortOrder === "roll") return (a.student.uniqueId || "").localeCompare(b.student.uniqueId || "");
      return (a.student.name || "").localeCompare(b.student.name || "");
    });
  }, [hodStudentAnalyticsList, analyticsSearchQuery, analyticsStatusFilter, analyticsYearFilter, analyticsSectionFilter, analyticsSortOrder]);

  const paginatedAnalyticsList = useMemo(() => {
    if (analyticsPageSize === -1) return filteredAnalyticsList;
    const start = (analyticsPage - 1) * analyticsPageSize;
    return filteredAnalyticsList.slice(start, start + analyticsPageSize);
  }, [filteredAnalyticsList, analyticsPage, analyticsPageSize]);

  const totalAnalyticsPages = useMemo(() => {
    if (analyticsPageSize === -1) return 1;
    return Math.ceil(filteredAnalyticsList.length / analyticsPageSize) || 1;
  }, [filteredAnalyticsList, analyticsPageSize]);

  // Fetch summary attendance records for selected date
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-summary", selectedDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${selectedDate}&to=${selectedDate}`),
    refetchInterval: 5000,
  });

  // Fetch custom date attendance logs
  const { data: detailedLogs = [], isLoading: logsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-logs", logDate],
    queryFn: () => customFetch<AttendanceRecord[]>(`/api/attendance?from=${logDate}&to=${logDate}`),
    refetchInterval: activeTab === "logs" ? 5000 : undefined,
  });

  // Fetch class presence (marked present in hourly classes by faculty)
  const { data: todayClassPresence = [] } = useQuery<any[]>({
    queryKey: ["admin-today-class-presence", selectedDate],
    queryFn: () => customFetch<any[]>(`/api/admin/today-class-presence?date=${selectedDate}`),
    refetchInterval: 5000,
  });

  const classPresentUserIds = useMemo(() => {
    const set = new Set<number>();
    (todayClassPresence || []).forEach(r => {
      const uid = Number(r.user_id || r.userId || r.user?.id);
      if (uid && !isNaN(uid)) set.add(uid);
    });
    return set;
  }, [todayClassPresence]);

  const queryClient = useQueryClient();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [scheduleToAssign, setScheduleToAssign] = useState<any | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  // Click-to-reassign slot modal state
  const [reassignSlotModalOpen, setReassignSlotModalOpen] = useState(false);
  const [slotToReassign, setSlotToReassign] = useState<{
    sectionKey: string;
    dayKey: string;
    dayLabel: string;
    slotIdx: number;
    periodName: string;
    timeLabel: string;
    subject: string;
    currentFaculty: string;
    room: string;
  } | null>(null);

  const [editedSubjectInput, setEditedSubjectInput] = useState("");
  const [customSubjectOverrides, setCustomSubjectOverrides] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem("HOD_TIMETABLE_SUBJECT_OVERRIDES");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customFacultyOverrides, setCustomFacultyOverrides] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem("HOD_TIMETABLE_FACULTY_OVERRIDES");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedFacultyName, setSelectedFacultyName] = useState("");
  const [customFacultyTextInput, setCustomFacultyTextInput] = useState("");
  const [applyToAllSlotsOfSubject, setApplyToAllSlotsOfSubject] = useState(false);
  const [savingReassignment, setSavingReassignment] = useState(false);
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState("");

  const DEPARTMENT_FACULTY_LIST = [
    "Dr. Md Abdul Azeem",
    "Mrs. G. Sushma",
    "Mrs. K. Sneha",
    "Mrs. A. Sravanthi",
    "Mr. Mohammed Miskeen Ali",
    "Mr. T. Shravan Kumar",
    "Mr. M. Yadaiah",
    "Mr. M. Srinivasulu",
    "Mrs. B. Gayathri",
    "Mrs. K. Ramya",
    "Mrs. Ch. Vijaya Lakshmi",
    "Mr. K. Bikshapathi",
    "Mrs. K. Srinija",
    "Mrs. CH. Naga Rohini",
    "Mrs. Swetha",
    "Ms. Priyusha",
    "Ms. Vaidehi",
    "Mr. Prateek",
    "Mr. Rakesh Goud",
    "Dr. Sri Hari VLN",
    "Dr. C. Lakshmi Nath",
    "Dr. A. Balaram",
  ];

  const SLOT_TIME_MAP = [
    { start: "09:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "11:00:00" },
    { start: "11:10:00", end: "12:10:00" },
    { start: "12:10:00", end: "13:10:00" },
    { start: "14:00:00", end: "15:00:00" },
    { start: "15:00:00", end: "16:00:00" },
  ];

  const handleOpenSlotReassign = (slotData: {
    sectionKey: string;
    dayKey: string;
    dayLabel: string;
    slotIdx: number;
    periodName: string;
    timeLabel: string;
    subject: string;
    currentFaculty: string;
    room: string;
  }) => {
    setSlotToReassign(slotData);
    setEditedSubjectInput(slotData.subject);
    setSelectedFacultyName(slotData.currentFaculty);
    setCustomFacultyTextInput("");
    setApplyToAllSlotsOfSubject(false);
    setReassignSuccessMsg("");
    setReassignSlotModalOpen(true);
  };

  const handleSaveSlotReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotToReassign) return;

    const newFaculty = (customFacultyTextInput.trim() || selectedFacultyName.trim());
    const newSubject = editedSubjectInput.trim() || slotToReassign.subject;
    if (!newFaculty) return;

    setSavingReassignment(true);

    try {
      const sec = slotToReassign.sectionKey;
      const originalSubj = slotToReassign.subject;
      const slotKey = `${sec}:${slotToReassign.dayKey}:${slotToReassign.slotIdx}`;
      const timeInfo = SLOT_TIME_MAP[slotToReassign.slotIdx] || { start: "09:00:00", end: "10:00:00" };

      // 1. Sync to Supabase PostgreSQL database via backend API
      let mentorIdToSend: number | undefined = undefined;
      const matchedMentor = mentorsTracking.find((m: any) => 
        m.name?.toLowerCase().includes(newFaculty.toLowerCase()) || newFaculty.toLowerCase().includes(m.name?.toLowerCase())
      );
      if (matchedMentor) {
        mentorIdToSend = matchedMentor.id;
      }

      await customFetch("/api/admin/schedules/sync-slot", {
        method: "POST",
        body: JSON.stringify({
          sectionKey: sec,
          year: sec.startsWith("2") ? "II" : sec.startsWith("3") ? "III" : "IV",
          dayOfWeek: slotToReassign.dayKey,
          startTime: timeInfo.start,
          endTime: timeInfo.end,
          subject: newSubject,
          originalSubject: originalSubj,
          mentorId: mentorIdToSend,
          facultyName: newFaculty,
          applyToSubject: applyToAllSlotsOfSubject,
        }),
      });

      // 2. Update React State & localStorage for instant UI updates
      setCustomFacultyOverrides((prev) => {
        const next = { ...prev };
        if (!next[sec]) next[sec] = {};

        if (applyToAllSlotsOfSubject) {
          next[sec][originalSubj] = newFaculty;
          next[sec][originalSubj.toUpperCase()] = newFaculty;
          if (newSubject !== originalSubj) {
            next[sec][newSubject] = newFaculty;
            next[sec][newSubject.toUpperCase()] = newFaculty;
          }
        } else {
          next[sec][slotKey] = newFaculty;
        }

        try {
          localStorage.setItem("HOD_TIMETABLE_FACULTY_OVERRIDES", JSON.stringify(next));
        } catch (err) {
          console.error("Failed to save faculty overrides", err);
        }

        return next;
      });

      setCustomSubjectOverrides((prev) => {
        const next = { ...prev };
        if (!next[sec]) next[sec] = {};
        next[sec][slotKey] = newSubject;
        try {
          localStorage.setItem("HOD_TIMETABLE_SUBJECT_OVERRIDES", JSON.stringify(next));
        } catch (err) {
          console.error("Failed to save subject overrides", err);
        }
        return next;
      });

      // Invalidate queries so admin schedules list refetches from database
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-with-status"] });

      setReassignSuccessMsg(`✅ Database Updated! ${newSubject} assigned to ${newFaculty}`);
      setTimeout(() => {
        setReassignSlotModalOpen(false);
        setReassignSuccessMsg("");
        setSavingReassignment(false);
      }, 700);
    } catch (err: any) {
      alert(err?.data?.error || err?.message || "Failed to save and sync schedule to database");
      setSavingReassignment(false);
    }
  };

  const [newClassModalOpen, setNewClassModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMentorId, setNewMentorId] = useState<number | "">("");
  const [newSection, setNewSection] = useState("A");
  const [newYear, setNewYear] = useState("II");
  const [newDay, setNewDay] = useState("MON");
  const [newStartTime, setNewStartTime] = useState("09:00:00");
  const [newEndTime, setNewEndTime] = useState("10:00:00");
  const [creatingClass, setCreatingClass] = useState(false);

  // Export Monthly Attendance Register state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateMode, setExportDateMode] = useState<"month" | "range">("month");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exportFromDate, setExportFromDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [exportToDate, setExportToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [exportType, setExportType] = useState<"department" | "year" | "section" | "student">("department");
  const [exportYear, setExportYear] = useState("2nd Year");
  const [exportSection, setExportSection] = useState("2A");
  const [exportStudentId, setExportStudentId] = useState<number | "">("");
  const [exportRollQuery, setExportRollQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Selected student for detail view modal
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [studentModalMonth, setStudentModalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    dayOfWeek: string;
    status: "P" | "A" | "*" | "—";
    record?: AttendanceRecord;
    holidayReason?: string;
  } | null>(null);

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

  // Holiday Management State (persisted in localStorage)
  const [holidays, setHolidays] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("qr_hod_holidays");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      "2026-08-15": "Independence Day",
      "2026-01-26": "Republic Day",
      "2026-10-02": "Gandhi Jayanti",
      "2026-12-25": "Christmas"
    };
  });
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) return;
    const updated = {
      ...holidays,
      [newHolidayDate]: newHolidayReason || "Official Holiday"
    };
    setHolidays(updated);
    try {
      localStorage.setItem("qr_hod_holidays", JSON.stringify(updated));
    } catch (e) {}
    setNewHolidayDate("");
    setNewHolidayReason("");
  };

  const handleRemoveHoliday = (dateKey: string) => {
    const updated = { ...holidays };
    delete updated[dateKey];
    setHolidays(updated);
    try {
      localStorage.setItem("qr_hod_holidays", JSON.stringify(updated));
    } catch (e) {}
  };

  // Fetch mentors with keys for HOD Dashboard
  const { data: mentorsTracking = [], isLoading: mentorsLoading } = useQuery<any[]>({
    queryKey: ["admin-mentors-tracking"],
    queryFn: () => customFetch<any[]>("/api/admin/mentors-tracking"),
  });

  // Fetch timetables/schedules for HOD Dashboard
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<any[]>({
    queryKey: ["admin-schedules"],
    queryFn: () => customFetch<any[]>("/api/admin/schedules"),
    enabled: activeTab === "schedules",
  });

  // Extract unique available sections for timetable filter pills (e.g. 2A, 2B, 3A, 3B, 4A, 4B)
  const availableTimetableSections = useMemo(() => {
    const set = new Set<string>();
    (schedules || []).forEach((s: any) => {
      let yr = (s.year || "").toString().trim();
      if (yr === "II" || yr === "2nd Year" || yr === "2") yr = "2";
      else if (yr === "III" || yr === "3rd Year" || yr === "3") yr = "3";
      else if (yr === "IV" || yr === "4th Year" || yr === "4") yr = "4";

      const sec = (s.section || "").toString().trim().toUpperCase();
      if (yr && sec) {
        set.add(`${yr}${sec}`);
      } else if (sec) {
        set.add(sec);
      }
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ["2A", "2B", "3A", "3B", "4A", "4B"];
  }, [schedules]);

  // Fetch Schedule Overrides (Master Unlocks & Extended Times)
  const { data: scheduleOverrides = [] } = useQuery<any[]>({
    queryKey: ["admin-schedule-overrides", selectedDate],
    queryFn: () => customFetch<any[]>(`/api/admin/schedule-overrides?date=${selectedDate}`),
    refetchInterval: 3000,
    enabled: activeTab === "schedules",
  });

  const handleToggleScheduleOverride = async (scheduleId: number, currentUnlocked: boolean, currentExtendedMins: number) => {
    try {
      await customFetch("/api/admin/schedule-override", {
        method: "POST",
        body: JSON.stringify({
          scheduleId,
          date: selectedDate,
          isUnlocked: !currentUnlocked,
          extendedMinutes: currentExtendedMins,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-overrides", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
    } catch (err: any) {
      alert("Failed to update schedule override settings");
    }
  };

  const handleExtendScheduleTime = async (scheduleId: number, currentUnlocked: boolean, minutesToAdd: number) => {
    try {
      await customFetch("/api/admin/schedule-override", {
        method: "POST",
        body: JSON.stringify({
          scheduleId,
          date: selectedDate,
          isUnlocked: true, // Auto unlock when extending buffer time
          extendedMinutes: minutesToAdd,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-overrides", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
    } catch (err: any) {
      alert("Failed to extend schedule attendance time");
    }
  };

  const handleOpenAssignModal = (schedule: any) => {
    setScheduleToAssign(schedule);
    setSelectedMentorId(schedule.mentor_id || (mentorsTracking[0]?.id ?? ""));
    setAssignSuccessMsg("");
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleToAssign || !selectedMentorId) return;
    setAssigning(true);
    try {
      await customFetch(`/api/admin/schedules/${scheduleToAssign.id}`, {
        method: "PUT",
        body: JSON.stringify({ mentorId: Number(selectedMentorId) }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      setAssignSuccessMsg("Faculty assigned successfully!");
      setTimeout(() => {
        setAssignModalOpen(false);
        setAssignSuccessMsg("");
      }, 800);
    } catch (err: any) {
      alert(err?.data?.error || "Failed to assign faculty");
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorId || !newSubject || !newSection || !newYear || !newDay) return;
    setCreatingClass(true);
    try {
      await customFetch("/api/admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          mentorId: Number(newMentorId),
          dayOfWeek: newDay,
          startTime: newStartTime,
          endTime: newEndTime,
          section: newSection,
          subject: newSubject,
          year: newYear,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      setNewClassModalOpen(false);
      setNewSubject("");
    } catch (err: any) {
      alert(err?.data?.error || "Failed to create class schedule");
    } finally {
      setCreatingClass(false);
    }
  };

  const studentsOnly = allUsers.filter(u => u.role === "student");

  // Helper to map section name to code (e.g. "DS II/I/A" -> "2A")
  const getSectionDisplayName = (sectionStr: string | null | undefined): { name: string; yearLabel: string } => {
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
  };

  // Generate and Download Attendance Register CSV (Month or Date Range)
  const handleGenerateCsv = async () => {
    setIsExporting(true);
    try {
      let startDateStr = "";
      let endDateStr = "";
      let periodLabel = "";

      if (exportDateMode === "month") {
        const [yearStr, monthStr] = exportMonth.split("-");
        const yearNum = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        startDateStr = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
        endDateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        periodLabel = monthName.toUpperCase();
      } else {
        startDateStr = exportFromDate;
        endDateStr = exportToDate;
        periodLabel = `${exportFromDate} TO ${exportToDate}`;
      }

      // Helper to format local date YYYY-MM-DD without UTC timezone shift
      const formatDateLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Generate date array between startDateStr and endDateStr (inclusive) using noon local time
      const dateList: { dateStr: string; dayNum: number; dayOfWeek: string; displayLabel: string; isSundayOrHoliday: boolean }[] = [];
      const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);

      const curr = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);

      while (curr <= end) {
        const dateStr = formatDateLocal(curr);
        const dayNum = curr.getDate();
        const dayOfWeekStr = daysOfWeek[curr.getDay()];

        const isSunday = curr.getDay() === 0;
        const isDeclaredHoliday = Boolean(holidays[dateStr]);
        const isSundayOrHoliday = isSunday || isDeclaredHoliday;

        // Display label: e.g. "1 Sun", "2 Mon", "3 Tue"...
        const displayLabel = `${dayNum} ${dayOfWeekStr}`;

        dateList.push({ dateStr, dayNum, dayOfWeek: dayOfWeekStr, displayLabel, isSundayOrHoliday });
        curr.setDate(curr.getDate() + 1);
      }

      const rangeRecords = await customFetch<AttendanceRecord[]>(`/api/attendance?from=${startDateStr}&to=${endDateStr}`);

      const attendanceMap = new Map<number, Set<string>>();
      (rangeRecords || []).forEach(r => {
        const uId = r.userId || (r as any).user_id;
        if (!uId || !r.date) return;

        const rawDateStr = typeof r.date === "string" ? r.date.slice(0, 10) : formatDateLocal(new Date(r.date));
        if (!rawDateStr) return;

        if (!attendanceMap.has(uId)) {
          attendanceMap.set(uId, new Set<string>());
        }
        attendanceMap.get(uId)!.add(rawDateStr);
      });

      let targetStudents = [...studentsOnly];

      if (exportType === "year") {
        targetStudents = targetStudents.filter(s => getSectionDisplayName(s.section).yearLabel === exportYear);
      } else if (exportType === "section") {
        targetStudents = targetStudents.filter(s => getSectionDisplayName(s.section).name === exportSection);
      } else if (exportType === "student") {
        if (exportStudentId) {
          targetStudents = targetStudents.filter(s => s.id === Number(exportStudentId));
        }
      }

      targetStudents.sort((a, b) => {
        const secA = getSectionDisplayName(a.section).name;
        const secB = getSectionDisplayName(b.section).name;
        if (secA !== secB) return secA.localeCompare(secB);
        return a.name.localeCompare(b.name);
      });

      const csvRows: string[][] = [];

      csvRows.push([`ATTENDANCE REGISTER`]);
      csvRows.push([`PERIOD: ${periodLabel}`, `SCOPE: ${exportType.toUpperCase()}`]);
      csvRows.push([`LEGEND: P = Present, A = Absent, * = Sunday / Holiday`]);
      csvRows.push([]);

      const headerRow = ["Serial No.", "Roll No / Unique ID", "Student Name", "Year", "Section"];
      dateList.forEach(d => headerRow.push(d.displayLabel));
      headerRow.push("Total Present (P)", "Total Absent (A)", "Attendance %");
      csvRows.push(headerRow);

      const todayStr = formatDateLocal(new Date());

      targetStudents.forEach((student, idx) => {
        const secInfo = getSectionDisplayName(student.section);
        const studentDatesPresent = attendanceMap.get(student.id) || new Set<string>();

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalWorkingDays = 0;

        const studentRow = [
          String(idx + 1),
          `"${(student.uniqueId || "").replace(/"/g, '""')}"`,
          `"${(student.name || "").replace(/"/g, '""')}"`,
          secInfo.yearLabel,
          secInfo.name
        ];

        dateList.forEach(d => {
          const isPresent = studentDatesPresent.has(d.dateStr);
          const isFuture = d.dateStr > todayStr;

          if (isFuture) {
            studentRow.push("");
          } else if (d.isSundayOrHoliday) {
            if (isPresent) {
              studentRow.push("P");
              totalPresent++;
            } else {
              studentRow.push("*");
            }
          } else {
            totalWorkingDays++;
            if (isPresent) {
              studentRow.push("P");
              totalPresent++;
            } else {
              studentRow.push("A");
              totalAbsent++;
            }
          }
        });

        const calcDays = totalWorkingDays > 0 ? totalWorkingDays : 1;
        const percent = calcDays > 0 ? Math.floor((totalPresent / calcDays) * 100) : 0;

        studentRow.push(String(totalPresent), String(totalAbsent), `${percent}%`);
        csvRows.push(studentRow);
      });

      const csvContent = csvRows.map(e => e.join(",")).join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const scopeLabel = exportType === "section" ? exportSection : exportType === "year" ? exportYear : exportType === "student" ? "Individual" : "Department";
      const periodFileStr = exportDateMode === "month" ? exportMonth : `${exportFromDate}_to_${exportToDate}`;
      link.setAttribute("download", `Attendance_Register_${scopeLabel}_${periodFileStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (err: any) {
      alert("Failed to export attendance register: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
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

  // Map today's attendance to sections
  const attendanceByUserId = new Map<number, AttendanceRecord>();
  attendanceRecords.forEach(r => {
    attendanceByUserId.set(r.userId, r);
  });

  sectionsMap.forEach((stats) => {
    stats.totalStudents.forEach(s => {
      const record = attendanceByUserId.get(s.id);
      const isClassPresent = classPresentUserIds.has(s.id);

      if (record || isClassPresent) {
        stats.presentStudents.push({
          student: s,
          record,
          isClassPresentOnly: !record && isClassPresent
        });
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
    ? Math.round((overallTotalPresent / overallTotalStudents) * 100) 
    : 0;

  // Handle cell click to open drill-down
  const handleCellClick = (type: "PR" | "AB" | "Total", sectionStats: SectionStats) => {
    let title = "";
    let description = "";
    let list: Array<{ student: StudentUser; record?: AttendanceRecord; status: "present" | "in_class" | "absent" }> = [];

    const secName = sectionStats.sectionKey.replace(/\//g, " ");

    if (type === "PR") {
      title = `Present Students — Section ${sectionStats.displayName}`;
      description = `Showing ${sectionStats.presentStudents.length} present students in ${secName} (Includes gate scans & in-class lecture attendance)`;
      list = sectionStats.presentStudents.map(p => ({
        student: p.student,
        record: p.record,
        status: p.isClassPresentOnly ? "in_class" : "present"
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
        const pObj = sectionStats.presentStudents.find(p => p.student.id === s.id);
        return {
          student: s,
          record: pObj?.record,
          status: pObj ? (pObj.isClassPresentOnly ? "in_class" : "present") : "absent"
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

  // Deduplicate and consolidate detailed logs so each student appears only once per date
  const consolidatedLogs = useMemo(() => {
    const logsMap = new Map<number, AttendanceRecord>();

    detailedLogs.forEach((log) => {
      if (!log.userId) return;

      const existing = logsMap.get(log.userId);
      if (!existing) {
        logsMap.set(log.userId, { ...log });
      } else {
        const earliestEntry = (() => {
          if (!log.entryTime) return existing.entryTime;
          if (!existing.entryTime) return log.entryTime;
          return new Date(log.entryTime).getTime() < new Date(existing.entryTime).getTime()
            ? log.entryTime
            : existing.entryTime;
        })();

        const latestExit = (() => {
          if (!log.exitTime) return existing.exitTime;
          if (!existing.exitTime) return log.exitTime;
          return new Date(log.exitTime).getTime() > new Date(existing.exitTime).getTime()
            ? log.exitTime
            : existing.exitTime;
        })();

        const isInside = existing.status === "inside" || log.status === "inside";
        const finalStatus = isInside ? "inside" : "left";
        const finalExitTime = isInside ? null : latestExit;

        let durationMinutes: number | null = null;
        if (earliestEntry && finalExitTime) {
          durationMinutes = Math.floor(Math.abs(new Date(finalExitTime).getTime() - new Date(earliestEntry).getTime()) / 60000);
        } else if (existing.durationMinutes || log.durationMinutes) {
          durationMinutes = (existing.durationMinutes || 0) + (log.durationMinutes || 0);
        }

        logsMap.set(log.userId, {
          ...existing,
          entryTime: earliestEntry,
          exitTime: finalExitTime,
          status: finalStatus,
          durationMinutes,
        });
      }
    });

    return Array.from(logsMap.values());
  }, [detailedLogs]);

  // Department eligible students calculation
  const deptStudents = useMemo(() => {
    return allUsers.filter(u => u.role === "student");
  }, [allUsers]);

  const eligibleSectionStudents = useMemo(() => {
    if (selectedSectionFilter === "All") return deptStudents;
    return deptStudents.filter(u => {
      const { name: dName } = getSectionDisplayName(u.section);
      return dName === selectedSectionFilter;
    });
  }, [deptStudents, selectedSectionFilter]);

  // All logs matching current section
  const sectionLogs = useMemo(() => {
    return consolidatedLogs.filter(log => {
      const sUser = log.user;
      if (!sUser) return false;
      if (selectedSectionFilter !== "All") {
        const { name: dName } = getSectionDisplayName(sUser.section);
        if (dName !== selectedSectionFilter) return false;
      }
      return true;
    });
  }, [consolidatedLogs, selectedSectionFilter]);

  const isLateTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return false;
    try {
      const d = new Date(timeStr);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const seconds = d.getSeconds();
      const ms = d.getMilliseconds();
      return (seconds === 59 && ms === 999) || (hours === 22 && minutes === 0) || (hours === 3 && minutes === 30) || (hours > 9 || (hours === 9 && minutes > 30));
    } catch {
      return false;
    }
  };

  const getMinutesLate = (timeStr: string | null | undefined) => {
    if (!timeStr) return 0;
    try {
      const d = new Date(timeStr);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const startMin = 9 * 60; // 9:00 AM
      const currentMin = hours * 60 + minutes;
      return Math.max(0, currentMin - startMin);
    } catch {
      return 0;
    }
  };

  const formatLateDuration = (minutes: number) => {
    if (minutes <= 0) return "On time";
    if (minutes < 60) return `+${minutes}m late`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `+${h}h ${m}m late` : `+${h}h late`;
  };

  // Helper to map student to mentor from OFFICIAL_FACULTY_LIST
  const getMentorForStudent = (student: StudentUser) => {
    if (!student) return null;
    const { name: secName } = getSectionDisplayName(student.section);
    const roll = (student.uniqueId || "").toUpperCase();

    const mentor = OFFICIAL_FACULTY_LIST.find(m => {
      if (m.section && m.section === secName) return true;
      if (m.rollRange && roll && m.rollRange.includes(roll)) return true;
      return false;
    });
    return mentor || null;
  };

  // Student monthly frequency counts for late comers & absences
  const studentLateCounts = useMemo(() => {
    const map = new Map<number, number>();
    monthlyAttendanceForFlags.forEach(rec => {
      if (rec.userId && isLateTime(rec.entryTime)) {
        map.set(rec.userId, (map.get(rec.userId) || 0) + 1);
      }
    });
    return map;
  }, [monthlyAttendanceForFlags]);

  const studentAbsentCounts = useMemo(() => {
    const map = new Map<number, number>();
    deptStudents.forEach(st => {
      const present = studentPresentCounts.get(st.id) || 0;
      const abs = Math.max(0, totalMonthWorkingDays - present);
      map.set(st.id, abs);
    });
    return map;
  }, [deptStudents, studentPresentCounts, totalMonthWorkingDays]);

  // Comprehensive Problem Area Items list
  const allProblemItems = useMemo(() => {
    return eligibleSectionStudents.map(st => {
      const rec = consolidatedLogs.find(l => l.userId === st.id);
      const isLate = rec ? isLateTime(rec.entryTime) : false;
      const isUnscanned = !rec;
      const minutesLate = rec ? getMinutesLate(rec.entryTime) : 0;
      const monthlyLate = studentLateCounts.get(st.id) || 0;
      const monthlyAbs = studentAbsentCounts.get(st.id) || 0;
      const mentor = getMentorForStudent(st);
      const remarkKey = `${st.id}_${logDate}`;
      const remark = remarksMap[remarkKey];

      let severityScore = 1;
      let severityLabel: "Chronic Offender" | "High Concern" | "Repeat Late" | "1st Late" | "Unscanned" | "Punctual" = "Punctual";

      if (isUnscanned) {
        if (monthlyAbs >= 5) {
          severityScore = 4;
          severityLabel = "Chronic Offender";
        } else {
          severityScore = 3;
          severityLabel = "Unscanned";
        }
      } else if (isLate) {
        if (monthlyLate >= 3 || minutesLate >= 60) {
          severityScore = 4;
          severityLabel = "Chronic Offender";
        } else if (monthlyLate === 2 || minutesLate >= 30) {
          severityScore = 3;
          severityLabel = "Repeat Late";
        } else {
          severityScore = 2;
          severityLabel = "1st Late";
        }
      }

      return {
        student: st,
        record: rec,
        status: isUnscanned ? "unscanned" : isLate ? "late" : (rec?.status === "left" || rec?.exitTime) ? "left" : "inside",
        isLate,
        isUnscanned,
        minutesLate,
        monthlyLate,
        monthlyAbs,
        mentor,
        remark,
        severityScore,
        severityLabel,
      };
    });
  }, [eligibleSectionStudents, consolidatedLogs, logDate, remarksMap, studentLateCounts, studentAbsentCounts]);

  // Statistics for Problem Areas Toolbar
  const problemStats = useMemo(() => {
    const totalEnrolled = eligibleSectionStudents.length;
    const scannedCount = allProblemItems.filter(i => !i.isUnscanned).length;
    const lateCount = allProblemItems.filter(i => i.isLate).length;
    const chronicLateCount = allProblemItems.filter(i => i.severityScore === 4).length;
    const unscannedCount = allProblemItems.filter(i => i.isUnscanned).length;
    const excusedCount = allProblemItems.filter(i => i.remark?.isExcused).length;
    const onCampusCount = allProblemItems.filter(i => i.status === "inside").length;
    const leftCount = allProblemItems.filter(i => i.status === "left").length;
    const punctualityRate = scannedCount > 0 ? Math.round(((scannedCount - lateCount) / scannedCount) * 100) : 0;
    const attendanceRate = totalEnrolled > 0 ? Math.round((scannedCount / totalEnrolled) * 100) : 0;

    return {
      totalEnrolled,
      scannedCount,
      lateCount,
      chronicLateCount,
      unscannedCount,
      excusedCount,
      onCampusCount,
      leftCount,
      punctualityRate,
      attendanceRate,
    };
  }, [eligibleSectionStudents, allProblemItems]);

  // Filtered Problem Items
  const filteredProblemItems = useMemo(() => {
    return allProblemItems.filter(item => {
      // Mentor filter
      if (selectedMentorFilter !== "All") {
        if (item.mentor?.name !== selectedMentorFilter && !item.mentor?.email?.includes(selectedMentorFilter)) {
          return false;
        }
      }

      // View Mode filter
      if (logViewMode === "problems") {
        if (!item.isLate && !item.isUnscanned) return false;
      } else if (logViewMode === "late") {
        if (!item.isLate) return false;
      } else if (logViewMode === "unscanned") {
        if (!item.isUnscanned) return false;
      } else if (logViewMode === "all") {
        // Show all
      }

      // Multi-field search
      const q = logSearchQuery.toLowerCase().trim();
      if (q) {
        const { name: dName } = getSectionDisplayName(item.student.section);
        const nameMatch = (item.student.name || "").toLowerCase().includes(q);
        const rollMatch = (item.student.uniqueId || "").toLowerCase().includes(q);
        const secMatch = (item.student.section || "").toLowerCase().includes(q) || dName.toLowerCase().includes(q);
        const mentorMatch = (item.mentor?.name || "").toLowerCase().includes(q);
        const remarkMatch = (item.remark?.text || "").toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !secMatch && !mentorMatch && !remarkMatch) return false;
      }

      return true;
    });
  }, [allProblemItems, selectedMentorFilter, logViewMode, logSearchQuery]);

  // Sort Problem Items
  const sortedProblemItems = useMemo(() => {
    return [...filteredProblemItems].sort((a, b) => {
      if (logSortField === "severity") {
        if (b.severityScore !== a.severityScore) {
          return logSortOrder === "asc" ? a.severityScore - b.severityScore : b.severityScore - a.severityScore;
        }
        return logSortOrder === "asc" ? a.minutesLate - b.minutesLate : b.minutesLate - a.minutesLate;
      } else if (logSortField === "name") {
        const cmp = a.student.name.localeCompare(b.student.name);
        return logSortOrder === "asc" ? cmp : -cmp;
      } else if (logSortField === "uniqueId") {
        const cmp = (a.student.uniqueId || "").localeCompare(b.student.uniqueId || "");
        return logSortOrder === "asc" ? cmp : -cmp;
      } else if (logSortField === "section") {
        const cmp = (a.student.section || "").localeCompare(b.student.section || "");
        return logSortOrder === "asc" ? cmp : -cmp;
      } else if (logSortField === "entryTime") {
        const aTime = a.record?.entryTime ? new Date(a.record.entryTime).getTime() : 0;
        const bTime = b.record?.entryTime ? new Date(b.record.entryTime).getTime() : 0;
        return logSortOrder === "asc" ? aTime - bTime : bTime - aTime;
      } else if (logSortField === "duration") {
        const aDur = a.record?.durationMinutes || 0;
        const bDur = b.record?.durationMinutes || 0;
        return logSortOrder === "asc" ? aDur - bDur : bDur - aDur;
      }
      return 0;
    });
  }, [filteredProblemItems, logSortField, logSortOrder]);

  // Paginated Problem Items
  const totalPages = Math.max(1, Math.ceil(sortedProblemItems.length / logPageSize));
  const safeCurrentPage = Math.min(logCurrentPage, totalPages);
  const paginatedProblemItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * logPageSize;
    return sortedProblemItems.slice(start, start + logPageSize);
  }, [sortedProblemItems, safeCurrentPage, logPageSize]);

  // Section comparison breakdown
  const sectionComparisonStats = useMemo(() => {
    const sections = ["2A", "2B", "2C", "3A", "3B", "3C", "3D", "4A", "4B"];
    return sections.map(secName => {
      const secStudents = deptStudents.filter(u => getSectionDisplayName(u.section).name === secName);
      const total = secStudents.length;
      const mentor = OFFICIAL_FACULTY_LIST.find(m => m.section === secName) || null;

      let scanned = 0;
      let late = 0;
      let inside = 0;
      let left = 0;

      secStudents.forEach(st => {
        const rec = consolidatedLogs.find(l => l.userId === st.id);
        if (rec) {
          scanned++;
          if (isLateTime(rec.entryTime)) late++;
          if (rec.status === "left" || rec.exitTime) left++;
          else inside++;
        }
      });

      const unscanned = Math.max(0, total - scanned);
      const punctualityRate = scanned > 0 ? Math.round(((scanned - late) / scanned) * 100) : 0;
      const attendanceRate = total > 0 ? Math.round((scanned / total) * 100) : 0;

      const status: "critical" | "warning" | "good" = late > 4 || unscanned > 6
        ? "critical"
        : late > 2 || unscanned > 3
        ? "warning"
        : "good";

      return {
        secName,
        mentor,
        total,
        scanned,
        late,
        unscanned,
        inside,
        left,
        punctualityRate,
        attendanceRate,
        status,
      };
    });
  }, [deptStudents, consolidatedLogs]);

  // 6-Day Weekly Trend
  const weeklyTrendData = useMemo(() => {
    const days: Array<{ dayName: string; dateStr: string; lateCount: number; unscannedCount: number; scannedCount: number; punctuality: number }> = [];
    const curr = new Date(logDate || new Date());

    for (let i = 5; i >= 0; i--) {
      const d = new Date(curr);
      d.setDate(curr.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });

      const dayRecords = monthlyAttendanceForFlags.filter(r => r.date === dStr);
      const late = dayRecords.filter(r => isLateTime(r.entryTime)).length;
      const scanned = dayRecords.length;
      const unscanned = Math.max(0, deptStudents.length - scanned);
      const punctuality = scanned > 0 ? Math.round(((scanned - late) / scanned) * 100) : 0;

      days.push({
        dayName,
        dateStr: dStr,
        lateCount: late,
        unscannedCount: unscanned,
        scannedCount: scanned,
        punctuality,
      });
    }
    return days;
  }, [logDate, monthlyAttendanceForFlags, deptStudents.length]);

  const handleSort = (field: "severity" | "name" | "uniqueId" | "section" | "entryTime" | "exitTime" | "duration" | "status") => {
    if (logSortField === field) {
      setLogSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setLogSortField(field);
      setLogSortOrder("asc");
    }
    setLogCurrentPage(1);
  };

  const handleExportProblemCsv = () => {
    const headers = ["Student Name", "Roll Number", "Section", "Mentor", "Date", "Status", "Entry Time", "Delay", "Repeat Offenses (Month)", "Remark", "Excused"];
    const rows = sortedProblemItems.map(item => {
      const { name: sDisplayName } = getSectionDisplayName(item.student.section);
      const statusText = item.isUnscanned
        ? "Not Scanned (Absent)"
        : item.isLate
        ? `Late (${formatLateDuration(item.minutesLate)})`
        : (item.status === "left" || item.record?.exitTime ? "Left" : "Present / On Campus");

      return [
        `"${(item.student.name || "").replace(/"/g, '""')}"`,
        `"${item.student.uniqueId || ""}"`,
        `"${sDisplayName}"`,
        `"${item.mentor?.name || "Not Assigned"}"`,
        `"${logDate}"`,
        `"${statusText}"`,
        `"${formatTime(item.record?.entryTime)}"`,
        `"${item.minutesLate > 0 ? `${item.minutesLate} mins` : "On time"}"`,
        `"${item.isLate ? item.monthlyLate : item.monthlyAbs} times"`,
        `"${(item.remark?.text || "").replace(/"/g, '""')}"`,
        `"${item.remark?.isExcused ? "Yes" : "No"}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HOD_Attendance_Problem_Report_${logDate}_${selectedSectionFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mentors helper methods & stats
  const toggleRevealKey = (id: string | number) => {
    setRevealedKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyKey = (key: string, id: string | number) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKeyId(String(id));
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  };

  const filteredMentorsList = useMemo(() => {
    return OFFICIAL_FACULTY_LIST.filter((m) => {
      // Year Filter
      if (mentorsYearFilter !== "All") {
        const yFilterNormalized = mentorsYearFilter.toLowerCase().replace(/[^a-z0-9]/g, "");
        const mYearNormalized = (m.yearLabel || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (mentorsYearFilter === "2nd Year" && !mYearNormalized.includes("2nd") && !mYearNormalized.includes("2")) return false;
        if (mentorsYearFilter === "3rd Year" && !mYearNormalized.includes("3rd") && !mYearNormalized.includes("3")) return false;
        if (mentorsYearFilter === "4th Year" && !mYearNormalized.includes("4th") && !mYearNormalized.includes("4")) return false;
      }
      // Section Filter
      if (mentorsSectionFilter !== "All") {
        const secFilterClean = mentorsSectionFilter.toUpperCase().trim();
        const secClean = (m.section || "").toUpperCase();
        if (!secClean.includes(secFilterClean)) return false;
      }
      // Role Filter
      if (mentorsRoleFilter !== "All") {
        if (mentorsRoleFilter === "incharge" && !m.role.toLowerCase().includes("in-charge")) return false;
        if (mentorsRoleFilter === "faculty" && (!m.role.toLowerCase().includes("faculty mentor") || m.role.toLowerCase().includes("in-charge"))) return false;
        if (mentorsRoleFilter === "subject" && !m.role.toLowerCase().includes("subject")) return false;
      }
      // Search query
      const q = mentorsSearchQuery.toLowerCase().trim();
      if (q) {
        const nameMatch = m.name.toLowerCase().includes(q);
        const emailMatch = m.email.toLowerCase().includes(q);
        const roleMatch = m.role.toLowerCase().includes(q);
        const secMatch = m.section.toLowerCase().includes(q);
        const rollMatch = m.rollRange.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !roleMatch && !secMatch && !rollMatch) return false;
      }
      return true;
    });
  }, [mentorsYearFilter, mentorsSectionFilter, mentorsRoleFilter, mentorsSearchQuery]);

  const paginatedMentorsList = useMemo(() => {
    if (mentorsPageSize === -1) return filteredMentorsList;
    const start = (mentorsPage - 1) * mentorsPageSize;
    return filteredMentorsList.slice(start, start + mentorsPageSize);
  }, [filteredMentorsList, mentorsPage, mentorsPageSize]);

  const totalMentorsPages = useMemo(() => {
    if (mentorsPageSize === -1) return 1;
    return Math.ceil(filteredMentorsList.length / mentorsPageSize) || 1;
  }, [filteredMentorsList, mentorsPageSize]);

  const mentorsStats = useMemo(() => {
    const total = OFFICIAL_FACULTY_LIST.length;
    const inchargeCount = OFFICIAL_FACULTY_LIST.filter(m => m.role.includes("In-charge")).length;
    const facultyCount = OFFICIAL_FACULTY_LIST.filter(m => m.role.includes("Faculty Mentor") && !m.role.includes("In-charge")).length;
    const subjectCount = OFFICIAL_FACULTY_LIST.filter(m => m.role.includes("Subject")).length;
    const totalEnrolledStudents = deptStudents.length > 0 ? deptStudents.length : 437;
    return { total, inchargeCount, facultyCount, subjectCount, totalEnrolledStudents };
  }, [deptStudents.length]);

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
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

  const isExitTimeOver = (logDate: string | null | undefined, exitTime: string | null | undefined) => {
    if (exitTime) return false;
    if (!logDate) return false;

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      
      const parts = formatter.formatToParts(new Date());
      const getPart = (type: string) => parts.find((part) => part.type === type)?.value || "";
      
      const year = getPart("year");
      const month = getPart("month");
      const day = getPart("day");
      const hour = parseInt(getPart("hour"), 10);
      const minute = parseInt(getPart("minute"), 10);
      
      const todayStr = `${year}-${month}-${day}`;
      
      if (logDate < todayStr) {
        return true;
      }
      if (logDate === todayStr) {
        return hour > 16 || (hour === 16 && minute >= 30);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const getPercentageColor = (percent: number) => {
    if (percent < 40) return "text-red-500 font-bold";
    if (percent < 60) return "text-orange-700 font-semibold";
    return "text-green-700 font-semibold";
  };

  // ---- Passcode Settings ----
  const MASTER_PASSCODE = "038899";
  const PASSCODE_KEY = "secapp.passcode.v1";
  const getStoredPasscode = () => {
    try { return localStorage.getItem(PASSCODE_KEY) || MASTER_PASSCODE; } catch { return MASTER_PASSCODE; }
  };
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState<"verify" | "change">("verify");
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const openPwdModal = () => {
    setPwdStep("verify"); setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    setPwdError(""); setPwdSuccess(""); setShowPwdModal(true);
  };
  const handlePwdVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdCurrent === getStoredPasscode() || pwdCurrent === MASTER_PASSCODE) {
      setPwdStep("change"); setPwdError("");
    } else { setPwdError("Incorrect passcode."); }
  };
  const handlePwdChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdNew.length < 4) { setPwdError("Min 4 characters."); return; }
    if (pwdNew !== pwdConfirm) { setPwdError("Passcodes don't match."); return; }
    try {
      localStorage.setItem(PASSCODE_KEY, pwdNew);
      setPwdSuccess("✅ Scanner passcode updated!");
      setTimeout(() => setShowPwdModal(false), 1800);
    } catch { setPwdError("Storage unavailable."); }
  };

  return (
    <Layout>
      <div className="px-4 py-3 max-w-6xl mx-auto space-y-3 font-sans">
        
        {/* Header section (only show when NOT on Risk Flag Analytics tab) */}
        {activeTab !== "flags" && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-800 tracking-tight leading-tight">HOD Dashboard</h1>
                <p className="text-[11px] text-gray-400 font-medium -mt-0.5">Department of Data Science (DS)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={openPwdModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md text-gray-500 hover:text-blue-600 font-semibold text-xs transition-all"
                title="Change scanner passcode"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-2 shadow-sm hover:border-blue-400 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-blue-600 pointer-events-none" />
                <input
                  type="date"
                  value={activeTab === "summary" ? selectedDate : logDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setLogDate(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer [color-scheme:light]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Top Module Navigation Bar */}
        <div className="flex flex-wrap items-center bg-slate-100/90 border border-slate-200 p-1 rounded-xl w-fit shadow-2xs gap-0.5">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "summary"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab("mentors")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "mentors"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Mentors
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "schedules"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timetable
          </button>
        </div>

        {/* ════════ CLASS REASSIGNMENT APPROVALS (HOD ACTION REQUIRED) ════════ */}
        {reassignmentsData && reassignmentsData.reassignments && reassignmentsData.reassignments.length > 0 && (
          <div className="space-y-3">
            {reassignmentsData.pendingCount > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border-2 border-amber-400/80 rounded-2xl p-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-300/40">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                      <span>{reassignmentsData.pendingCount} Class Reassignment Request{reassignmentsData.pendingCount > 1 ? "s" : ""} Awaiting HOD Approval</span>
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Action Required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                  {reassignmentsData.reassignments
                    .filter((r) => r.status === "pending")
                    .map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-xl p-3.5 border border-amber-300/70 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {r.date} &bull; {r.slot}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {r.section} &bull; {r.room}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-tight">
                            {r.subject}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs pt-1">
                            <span className="font-extrabold text-slate-700">{r.fromFacultyName}</span>
                            <span className="text-indigo-600 font-black">➔</span>
                            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {r.toFacultyName}
                            </span>
                          </div>
                        </div>

                        {r.reason && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong className="text-slate-700">Reason:</strong> {r.reason}
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleReassignmentAction(r.id, "decline")}
                            disabled={processingReassignId === r.id}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReassignmentAction(r.id, "accept")}
                            disabled={processingReassignId === r.id}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            {processingReassignId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept Reassignment</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "summary" ? (
          <>
            {/* Compact inline stats bar */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 pr-4 border-r border-gray-200">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Total</span>
                <span className="text-lg font-extrabold text-gray-800">{overallTotalStudents}</span>
              </div>
              <div className="flex items-center gap-1.5 pr-4 border-r border-gray-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-gray-400 font-medium">Present</span>
                <span className="text-lg font-extrabold text-emerald-600">{overallTotalPresent}</span>
              </div>
              <div className="flex items-center gap-1.5 pr-4 border-r border-gray-200">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-gray-400 font-medium">Absent</span>
                <span className="text-lg font-extrabold text-red-500">{overallTotalAbsent}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{overallDeptPercentage}%</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">Dept.</span>
              </div>
            </div>

            {/* Main Grid View */}
            {usersLoading || attendanceLoading ? (
              <div className="bg-white border border-gray-200 p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-gray-500">Loading student rosters & attendance records...</p>
              </div>
            ) : (
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        <th className="py-2.5 px-4">Section</th>
                        <th className="py-2.5 px-4 text-center">Present</th>
                        <th className="py-2.5 px-4 text-center">Absent</th>
                        <th className="py-2.5 px-4 text-center">Total</th>
                        <th className="py-2.5 px-4 text-center">%</th>
                        <th className="py-2.5 px-4 w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearGroups.map(year => {
                        const sectionsInYear = allSectionsList.filter(s => s.yearLabel === year);
                        if (sectionsInYear.length === 0) return null;

                        let yearPresent = 0;
                        let yearAbsent = 0;
                        let yearTotal = 0;

                        sectionsInYear.forEach(s => {
                          yearPresent += s.presentStudents.length;
                          yearAbsent += s.absentStudents.length;
                          yearTotal += s.totalStudents.length;
                        });

                        const yearPercentage = yearTotal > 0 
                          ? Math.round((yearPresent / yearTotal) * 100) 
                          : 0;

                        return (
                          <>
                            {sectionsInYear.map(s => {
                              const percent = s.totalStudents.length > 0 
                                ? (s.presentStudents.length / s.totalStudents.length) * 100 
                                : 0;
                              const barWidth = Math.min(percent, 100);

                              return (
                                <tr key={s.sectionKey} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                  <td className="py-2 px-4 font-bold text-gray-700 text-sm">{s.displayName}</td>
                                  
                                  <td 
                                    onClick={() => handleCellClick("PR", s)}
                                    className="py-2 px-4 text-center text-emerald-600 font-bold cursor-pointer hover:bg-emerald-50 active:scale-[0.97] transition-all text-sm"
                                    title="Present Students"
                                  >
                                    {s.presentStudents.length}
                                  </td>

                                  <td 
                                    onClick={() => handleCellClick("AB", s)}
                                    className="py-2 px-4 text-center text-red-500 font-semibold cursor-pointer hover:bg-red-50 active:scale-[0.97] transition-all text-sm"
                                  >
                                    {s.absentStudents.length}
                                  </td>
                                  
                                  <td 
                                    onClick={() => handleCellClick("Total", s)}
                                    className="py-2 px-4 text-center text-gray-500 font-medium cursor-pointer hover:bg-gray-100/50 active:scale-[0.97] transition-all text-sm"
                                  >
                                    {s.totalStudents.length}
                                  </td>
                                  
                                  <td className="py-2 px-4 text-center">
                                    <span className={`text-sm font-bold ${getPercentageColor(percent)}`}>
                                      {Math.round(percent)}%
                                    </span>
                                  </td>

                                  <td className="py-2 px-4">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          percent >= 75 ? 'bg-emerald-400' : percent >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                        }`}
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Year subtotal row */}
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100">
                              <td className="py-2 px-4 font-black text-blue-600 text-xs uppercase tracking-wide">⬥ {year}</td>
                              <td className="py-2 px-4 text-center text-emerald-600 font-bold text-sm">{yearPresent}</td>
                              <td className="py-2 px-4 text-center text-red-500 font-bold text-sm">{yearAbsent}</td>
                              <td className="py-2 px-4 text-center text-gray-600 font-bold text-sm">{yearTotal}</td>
                              <td className="py-2 px-4 text-center font-black text-blue-600 text-sm">
                                {yearPercentage}%
                              </td>
                              <td className="py-2 px-4">
                                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${yearPercentage}%` }} />
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      })}
                      
                      {/* Department total footer */}
                      <tr className="bg-white border-t-2 border-gray-200">
                        <td colSpan={4} className="py-3 px-4 font-extrabold text-gray-700 text-xs uppercase tracking-wider text-right">
                          Department Overall
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-black shadow-md shadow-blue-500/20">
                            {overallDeptPercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${overallDeptPercentage}%` }} />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : activeTab === "logs" ? (
          <div className="space-y-2.5">
            {/* ── ACTIONABLE COMMAND CENTER HEADER & FILTER BAR ── */}
            <div className="bg-white border border-gray-200 p-2.5 sm:p-3 rounded-xl shadow-xs space-y-2.5">
              {/* Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    <h2 className="text-sm font-black text-gray-900 tracking-tight">
                      Daily Problem Areas & Student Accountability
                    </h2>
                    <span className="px-2.5 py-1 rounded-md bg-rose-100 border border-rose-300 text-rose-950 text-xs font-black">
                      {problemStats.lateCount + problemStats.unscannedCount} Attention Needed
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">
                    College starts: <span className="font-black text-gray-950">09:00 AM</span> • Late threshold: <span className="font-black text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">09:30 AM</span> • Unscanned marked <span className="font-black text-red-950 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">Absent</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setBulkMessageType("late");
                      setBulkMessageModalOpen(true);
                    }}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 border-2 border-rose-400 text-rose-950 font-black text-xs transition-all shadow-xs cursor-pointer"
                    title="Send bulk WhatsApp/SMS notice to parents of late or unscanned students"
                  >
                    <Send className="w-3.5 h-3.5 text-rose-700" />
                    <span>Notify Parents</span>
                    {selectedStudentIds.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-200 text-rose-950 border border-rose-300 rounded text-[10px] font-black">
                        {selectedStudentIds.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handleExportProblemCsv}
                    className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-400 text-emerald-950 font-black text-xs transition-colors shadow-xs cursor-pointer"
                    title="Export detailed problem report with delay minutes, mentor and remarks"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Problem Report</span>
                  </button>

                  <button
                    onClick={() => setHolidayModalOpen(true)}
                    className="h-8 flex items-center gap-1 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Holidays</span>
                  </button>

                  <button
                    onClick={() => setExportModalOpen(true)}
                    className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-950 border-2 border-blue-400 font-black text-xs transition-colors cursor-pointer"
                    title="Open Monthly Attendance Register"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
                    <span>Register</span>
                  </button>
                </div>
              </div>

              {/* Filters Row: Date, Section, Mentor, Sort, Search */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  {/* Date Input */}
                  <div className="relative">
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => {
                        setLogDate(e.target.value);
                        setLogCurrentPage(1);
                      }}
                      className="h-8 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 [color-scheme:light] cursor-pointer"
                      title="Select Attendance Date"
                    />
                  </div>

                  {/* Section Select */}
                  <div className="relative">
                    <select
                      value={selectedSectionFilter}
                      onChange={(e) => {
                        setSelectedSectionFilter(e.target.value);
                        setLogCurrentPage(1);
                      }}
                      className="h-8 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 cursor-pointer"
                    >
                      <option value="All">All Sections ({deptStudents.length})</option>
                      <option value="2A">2A CSE Data Science</option>
                      <option value="2B">2B CSE Data Science</option>
                      <option value="2C">2C CSE Data Science</option>
                      <option value="3A">3A CSE Data Science</option>
                      <option value="3B">3B CSE Data Science</option>
                      <option value="3C">3C CSE Data Science</option>
                      <option value="3D">3D CSE Data Science</option>
                      <option value="4A">4A CSE Data Science</option>
                      <option value="4B">4B CSE Data Science</option>
                    </select>
                  </div>

                  {/* Mentor Filter */}
                  <div className="relative">
                    <select
                      value={selectedMentorFilter}
                      onChange={(e) => {
                        setSelectedMentorFilter(e.target.value);
                        setLogCurrentPage(1);
                      }}
                      className="h-8 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 cursor-pointer"
                      title="Filter students by assigned faculty mentor"
                    >
                      <option value="All">All Faculty Mentors</option>
                      {OFFICIAL_FACULTY_LIST.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.section || m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Field */}
                  <div className="relative">
                    <select
                      value={logSortField}
                      onChange={(e) => {
                        setLogSortField(e.target.value as any);
                        setLogCurrentPage(1);
                      }}
                      className="h-8 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      title="Sort logs"
                    >
                      <option value="severity">🔥 Sort: Problem Severity (Repeat & Delay)</option>
                      <option value="entryTime">🕒 Sort: Entry Time</option>
                      <option value="name">👤 Sort: Student Name</option>
                      <option value="uniqueId">🆔 Sort: Roll Number</option>
                      <option value="section">🏫 Sort: Section</option>
                    </select>
                  </div>

                  {/* Search Input with quick clear */}
                  <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student, roll, mentor, remark..."
                      value={logSearchQuery}
                      onChange={(e) => {
                        setLogSearchQuery(e.target.value);
                        setLogCurrentPage(1);
                      }}
                      className="w-full h-8 pl-8 pr-7 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                    {logSearchQuery && (
                      <button
                        onClick={() => {
                          setLogSearchQuery("");
                          setLogCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* View Mode Pills (Light tinted backgrounds with Dark Colored text - No White text!) */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 overflow-x-auto text-[11px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Focus:
                </span>
                <button
                  onClick={() => { setLogViewMode("problems"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    logViewMode === "problems"
                      ? "bg-rose-200 border-2 border-rose-600 text-rose-950 ring-2 ring-rose-300"
                      : "bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-700" />
                  <span>Problem Areas ({problemStats.lateCount + problemStats.unscannedCount})</span>
                </button>
                <button
                  onClick={() => { setLogViewMode("late"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    logViewMode === "late"
                      ? "bg-amber-200 border-2 border-amber-600 text-amber-950 ring-2 ring-amber-300"
                      : "bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950"
                  }`}
                >
                  <span>Late Comers ({problemStats.lateCount})</span>
                </button>
                <button
                  onClick={() => { setLogViewMode("unscanned"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    logViewMode === "unscanned"
                      ? "bg-red-200 border-2 border-red-600 text-red-950 ring-2 ring-red-300"
                      : "bg-red-50 hover:bg-red-100 border border-red-300 text-red-950"
                  }`}
                >
                  <span>Not Scanned ({problemStats.unscannedCount})</span>
                </button>
                <button
                  onClick={() => { setLogViewMode("all"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer ${
                    logViewMode === "all"
                      ? "bg-slate-200 border-2 border-slate-600 text-slate-950 ring-2 ring-slate-300"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900"
                  }`}
                >
                  Full Registry ({eligibleSectionStudents.length})
                </button>
                <button
                  onClick={() => { setLogViewMode("comparison"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    logViewMode === "comparison"
                      ? "bg-indigo-200 border-2 border-indigo-600 text-indigo-950 ring-2 ring-indigo-300"
                      : "bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-950"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Section Comparison</span>
                </button>
                <button
                  onClick={() => { setLogViewMode("trend"); setLogCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    logViewMode === "trend"
                      ? "bg-purple-200 border-2 border-purple-600 text-purple-950 ring-2 ring-purple-300"
                      : "bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-purple-700" />
                  <span>Weekly Trend</span>
                </button>
              </div>
            </div>

            {/* ── DAILY PROBLEM SEVERITY KPI COUNTER STRIP ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Late Comers */}
              <div
                onClick={() => { setLogViewMode("late"); setLogCurrentPage(1); }}
                className={`bg-white rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all border-2 ${
                  logViewMode === "late"
                    ? "border-amber-500 ring-2 ring-amber-200"
                    : "border-gray-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Late Arrivals</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black">
                    {">9:30 AM"}
                  </span>
                </div>
                <div className="text-3xl font-black text-gray-950 font-mono mt-2 tracking-tight">
                  {problemStats.lateCount}
                </div>
                <div className="text-xs text-amber-950 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{problemStats.chronicLateCount} Repeat Offenders</span>
                </div>
              </div>

              {/* Not Scanned */}
              <div
                onClick={() => { setLogViewMode("unscanned"); setLogCurrentPage(1); }}
                className={`bg-white rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all border-2 ${
                  logViewMode === "unscanned"
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-gray-200 hover:border-red-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Not Scanned</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-100 border border-red-300 text-red-950 text-xs font-black">
                    Absent
                  </span>
                </div>
                <div className="text-3xl font-black text-gray-950 font-mono mt-2 tracking-tight">
                  {problemStats.unscannedCount}
                </div>
                <div className="text-xs text-red-950 font-bold mt-1.5 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span>0 Gate Scans Today</span>
                </div>
              </div>

              {/* Excuses / Documented Remarks */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>Excused / Remarks</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-300 text-blue-950 text-xs font-black">
                    Valid
                  </span>
                </div>
                <div className="text-3xl font-black text-gray-950 font-mono mt-2 tracking-tight">
                  {problemStats.excusedCount}
                </div>
                <div className="text-xs text-blue-950 font-bold mt-1.5 flex items-center gap-1 truncate">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Bus Delay / Medical / OD</span>
                </div>
              </div>

              {/* Punctual & On Campus */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>On-Time Arrivals</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-black">
                    &lt;9:30 AM
                  </span>
                </div>
                <div className="text-3xl font-black text-gray-950 font-mono mt-2 tracking-tight">
                  {Math.max(0, problemStats.scannedCount - problemStats.lateCount)}
                </div>
                <div className="text-xs text-emerald-950 font-bold mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                  <span>{problemStats.onCampusCount} Active Inside</span>
                </div>
              </div>

              {/* Punctuality Rate Index */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>Punctuality Score</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 border border-purple-300 text-purple-950 text-xs font-black">
                    Score
                  </span>
                </div>
                <div className="text-3xl font-black text-gray-950 font-mono mt-2 tracking-tight">
                  {problemStats.punctualityRate}%
                </div>
                <div className="text-xs text-purple-950 font-bold mt-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>{problemStats.attendanceRate}% Gate Scanned</span>
                </div>
              </div>
            </div>

            {/* ── SECTION COMPARISON VIEW ── */}
            {logViewMode === "comparison" && (
              <Card className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      Section-Wise Punctuality & Accountability Matrix
                    </h3>
                    <p className="text-[11px] text-gray-500">Hold class in-charges and mentors accountable for late comers and unscanned students.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200">
                        <th className="py-2.5 px-3">Section</th>
                        <th className="py-2.5 px-3">Class In-charge / Mentor</th>
                        <th className="py-2.5 px-3 text-center">Strength</th>
                        <th className="py-2.5 px-3 text-center">Scanned</th>
                        <th className="py-2.5 px-3 text-center">Late Comers</th>
                        <th className="py-2.5 px-3 text-center">Unscanned</th>
                        <th className="py-2.5 px-3 text-center">Punctuality %</th>
                        <th className="py-2.5 px-3 text-center">Health Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {sectionComparisonStats.map((row) => (
                        <tr key={row.secName} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-2.5 px-3 font-extrabold text-gray-900">
                            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-xs">
                              {row.secName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-800">{row.mentor?.name || "Not Assigned"}</span>
                            <p className="text-[10px] text-gray-400 font-mono">{row.mentor?.email || "—"}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-700">{row.total}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">{row.scanned}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                              row.late > 4 ? "bg-amber-100 text-amber-950 border border-amber-400" : row.late > 0 ? "bg-amber-50 text-amber-800" : "text-gray-400"
                            }`}>
                              {row.late}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                              row.unscanned > 5 ? "bg-red-100 text-red-800 border border-red-300" : row.unscanned > 0 ? "bg-red-50 text-red-700" : "text-gray-400"
                            }`}>
                              {row.unscanned}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-black text-gray-900">{row.punctualityRate}%</span>
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    row.punctualityRate >= 85 ? "bg-emerald-500" : row.punctualityRate >= 70 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${row.punctualityRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.status === "critical" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center gap-1 w-max mx-auto">
                                <AlertOctagon className="w-3 h-3" /> Critical Attention
                              </span>
                            ) : row.status === "warning" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1 w-max mx-auto">
                                <AlertTriangle className="w-3 h-3" /> Needs Review
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1 w-max mx-auto">
                                <Check className="w-3 h-3" /> Good Health
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedSectionFilter(row.secName);
                                setLogViewMode("problems");
                                setLogCurrentPage(1);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Filter Section →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── WEEKLY TREND VIEW ── */}
            {logViewMode === "trend" && (
              <Card className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      6-Day Department Punctuality & Late Arrival Trend
                    </h3>
                    <p className="text-[11px] text-gray-500">Track day-by-day late entries to evaluate whether corrective actions are working.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {weeklyTrendData.map((d) => (
                    <div key={d.dateStr} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-1">
                      <span className="text-[11px] font-black text-gray-800 block">{d.dayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono block">{d.dateStr}</span>
                      
                      <div className="pt-1.5 border-t border-gray-200 space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-amber-800 font-bold">Late Comers:</span>
                          <span className="font-black text-amber-950 px-1.5 py-0.2 bg-amber-100 rounded">{d.lateCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-red-700 font-bold">Unscanned:</span>
                          <span className="font-black text-red-800 px-1.5 py-0.2 bg-red-100 rounded">{d.unscannedCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-purple-700 font-bold">On-Time %:</span>
                          <span className="font-black text-purple-900">{d.punctuality}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── ACTIONABLE PROBLEM REGISTRY TABLE ── */}
            {logsLoading ? (
              <div className="bg-white border border-gray-200 p-12 flex flex-col items-center justify-center gap-3 rounded-2xl shadow-xs">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-gray-500">Loading daily problem areas & accountability registry...</p>
              </div>
            ) : (
              <Card className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                {/* Bulk Select Bar */}
                <div className="p-2 sm:px-3 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-700">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedStudentIds.length === sortedProblemItems.length) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(sortedProblemItems.map(i => i.student.id));
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 font-bold cursor-pointer"
                    >
                      {selectedStudentIds.length > 0 && selectedStudentIds.length === sortedProblemItems.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <span>Select All ({sortedProblemItems.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        const lateIds = sortedProblemItems.filter(i => i.isLate).map(i => i.student.id);
                        setSelectedStudentIds(lateIds);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 text-xs font-black transition-colors cursor-pointer"
                    >
                      Select All Late ({sortedProblemItems.filter(i => i.isLate).length})
                    </button>

                    <button
                      onClick={() => {
                        const unscannedIds = sortedProblemItems.filter(i => i.isUnscanned).map(i => i.student.id);
                        setSelectedStudentIds(unscannedIds);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 border border-red-400 text-red-950 text-xs font-black transition-colors cursor-pointer"
                    >
                      Select All Unscanned ({sortedProblemItems.filter(i => i.isUnscanned).length})
                    </button>
                  </div>

                  {selectedStudentIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-black">{selectedStudentIds.length} Selected</span>
                      <button
                        onClick={() => {
                          setBulkMessageType("custom");
                          setBulkMessageModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Broadcast to {selectedStudentIds.length} Parents</span>
                      </button>
                      <button
                        onClick={() => setSelectedStudentIds([])}
                        className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto max-h-[580px] overflow-y-auto scroll-smooth scrollbar-thin">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 text-center w-10">Select</th>
                        <th
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Student Details</span>
                            {logSortField === "name" ? (
                              logSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </th>

                        <th
                          className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          onClick={() => handleSort("section")}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Class & Mentor</span>
                            {logSortField === "section" ? (
                              logSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </th>

                        <th
                          className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          onClick={() => handleSort("entryTime")}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Entry Time & Delay</span>
                            {logSortField === "entryTime" ? (
                              logSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </th>

                        <th
                          className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          onClick={() => handleSort("severity")}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Severity & Frequency</span>
                            {logSortField === "severity" ? (
                              logSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </th>

                        <th className="py-3 px-3 text-center">
                          <span>HOD Remarks</span>
                        </th>

                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedProblemItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                            No students match the current problem area and filter query.
                          </td>
                        </tr>
                      ) : (
                        paginatedProblemItems.map((item) => {
                          const user = item.student;
                          const { name: sDisplayName } = getSectionDisplayName(user.section);
                          const isSelected = selectedStudentIds.includes(user.id);
                          const isInside = item.record?.status === "inside" && !item.record?.exitTime;

                          return (
                            <tr
                              key={user.id}
                              className={`transition-colors group ${
                                isSelected
                                  ? "bg-blue-50/70"
                                  : item.severityScore === 4
                                  ? "bg-rose-50/20 hover:bg-rose-50/40"
                                  : item.isLate
                                  ? "bg-amber-50/15 hover:bg-amber-50/30"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentIds(prev =>
                                      prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                    );
                                  }}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </button>
                              </td>

                              {/* Student Details */}
                              <td className="py-3 px-4">
                                <div
                                  onClick={() => setSelectedStudentForDetails(user)}
                                  className="flex items-center gap-2.5 cursor-pointer"
                                  title="Click to view student profile"
                                >
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase flex-shrink-0">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                                      {user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      {user.uniqueId}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Class & Assigned Mentor */}
                              <td className="py-3 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold font-mono">
                                  {sDisplayName}
                                </span>
                                <p className="text-[11px] font-medium text-slate-600 mt-1 truncate max-w-[140px] mx-auto flex items-center justify-center gap-1" title={item.mentor?.name || "Not Assigned"}>
                                  <User className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                  <span className="truncate">{item.mentor?.name || "Not Assigned"}</span>
                                </p>
                              </td>

                              {/* Entry Time & Delay */}
                              <td className="py-3 px-3 text-center">
                                {item.isUnscanned ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-red-100 border border-red-300 text-red-950">
                                    <X className="w-3 h-3 text-red-700" /> NOT SCANNED
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                      <span className="font-mono text-xs font-bold text-slate-900">{formatTime(item.record?.entryTime)}</span>
                                      {item.isLate ? (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                                          LATE
                                        </span>
                                      ) : isInside ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-bold">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Inside
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
                                          Left
                                        </span>
                                      )}
                                    </div>
                                    {item.minutesLate > 0 && (
                                      <span className="block text-[11px] font-semibold text-amber-900">
                                        +{item.minutesLate}m delay
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Severity & Repeat Offenses */}
                              <td className="py-3 px-3 text-center">
                                {item.severityScore === 4 ? (
                                  <div className="inline-block text-center">
                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-800 inline-flex items-center gap-1 justify-center">
                                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Chronic Offender
                                    </span>
                                    <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                                      {item.isLate ? `${item.monthlyLate} late entries this mo.` : `${item.monthlyAbs} total absences`}
                                    </span>
                                  </div>
                                ) : item.severityScore === 3 ? (
                                  <div className="inline-block text-center">
                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 inline-block">
                                      {item.isLate ? `Repeat Late (${item.monthlyLate}x)` : `Unscanned (${item.monthlyAbs} abs)`}
                                    </span>
                                    <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                                      {item.monthlyLate} late this month
                                    </span>
                                  </div>
                                ) : item.isLate ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 border border-blue-200 text-blue-800 inline-block">
                                    1st Late Today
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 inline-block">
                                    Punctual
                                  </span>
                                )}
                              </td>

                              {/* HOD Remarks / Valid Reason */}
                              <td className="py-3 px-3 text-center">
                                {item.remark ? (
                                  <div
                                    onClick={() => {
                                      setRemarkModalData(item);
                                      setRemarkInput(item.remark?.text || "");
                                      setRemarkPreset(item.remark?.preset || "College Bus Delayed");
                                      setRemarkIsExcused(item.remark?.isExcused ?? true);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-50/70 border border-blue-200 hover:border-blue-300 cursor-pointer transition-all max-w-[180px] mx-auto text-left"
                                    title="Click to edit remark"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-bold text-blue-900 truncate">
                                        {item.remark.preset}
                                      </span>
                                      {item.remark.isExcused && (
                                        <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex-shrink-0">
                                          Excused
                                        </span>
                                      )}
                                    </div>
                                    {item.remark.text && item.remark.text !== item.remark.preset && (
                                      <p className="text-[10px] text-slate-600 truncate mt-0.5 font-normal">
                                        {item.remark.text}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemarkModalData(item);
                                      setRemarkInput("");
                                      setRemarkPreset("College Bus Delayed");
                                      setRemarkIsExcused(true);
                                    }}
                                    className="h-7 px-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 text-slate-400" />
                                    <span>Add Remark</span>
                                  </button>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setSelectedStudentIds([user.id]);
                                      setBulkMessageType(item.isLate ? "late" : "unscanned");
                                      setBulkMessageModalOpen(true);
                                    }}
                                    className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title={`Send notice to ${user.name}'s parent`}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedStudentForDetails(user)}
                                    className="w-7 h-7 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title="View student profile & attendance history"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── PAGINATION CONTROLS ── */}
                <div className="p-2.5 sm:p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-900">{sortedProblemItems.length === 0 ? 0 : (safeCurrentPage - 1) * logPageSize + 1}</span> to{" "}
                    <span className="font-bold text-gray-900">{Math.min(safeCurrentPage * logPageSize, sortedProblemItems.length)}</span> of{" "}
                    <span className="font-bold text-gray-900">{sortedProblemItems.length}</span> students
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Rows per page */}
                    <div className="flex items-center gap-1 text-gray-600">
                      <span className="text-[11px]">Rows:</span>
                      <select
                        value={logPageSize}
                        onChange={(e) => {
                          setLogPageSize(Number(e.target.value));
                          setLogCurrentPage(1);
                        }}
                        className="h-7 px-1.5 rounded bg-white border border-gray-300 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {/* Page buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLogCurrentPage(1)}
                        disabled={safeCurrentPage === 1}
                        className="p-1 rounded bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setLogCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={safeCurrentPage === 1}
                        className="p-1 rounded bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-2 font-bold text-gray-700 text-xs">
                        Page {safeCurrentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setLogCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="p-1 rounded bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setLogCurrentPage(totalPages)}
                        disabled={safeCurrentPage === totalPages}
                        className="p-1 rounded bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : activeTab === "mentors" ? (
          <div className="space-y-2.5">
            {/* ── ULTRA-COMPACT MENTORS KPI METRIC STRIP ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Mentors</span>
                  <span className="text-base font-black text-slate-900 leading-none">{mentorsStats.total} Faculty</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Class In-charges</span>
                  <span className="text-base font-black text-indigo-900 leading-none">{mentorsStats.inchargeCount} Primary</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Faculty Mentors</span>
                  <span className="text-base font-black text-blue-900 leading-none">{mentorsStats.facultyCount} Mentors</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Subject Faculty</span>
                  <span className="text-base font-black text-purple-900 leading-none">{mentorsStats.subjectCount} Instructors</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Enrolled</span>
                  <span className="text-base font-black text-emerald-900 leading-none">{mentorsStats.totalEnrolledStudents} Students</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              </div>
            </div>

            {/* ── FILTER & TOOLBAR (COMPACT ERP BAR) ── */}
            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search faculty name, email, roll range..."
                  value={mentorsSearchQuery}
                  onChange={(e) => {
                    setMentorsSearchQuery(e.target.value);
                    setMentorsPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                {mentorsSearchQuery && (
                  <button
                    onClick={() => {
                      setMentorsSearchQuery("");
                      setMentorsPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Year Filter */}
                <select
                  value={mentorsYearFilter}
                  onChange={(e) => {
                    setMentorsYearFilter(e.target.value);
                    setMentorsPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Academic Years</option>
                  <option value="2nd Year">2nd Year (II Year)</option>
                  <option value="3rd Year">3rd Year (III Year)</option>
                  <option value="4th Year">4th Year (IV Year)</option>
                </select>

                {/* Section Filter */}
                <select
                  value={mentorsSectionFilter}
                  onChange={(e) => {
                    setMentorsSectionFilter(e.target.value);
                    setMentorsPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Sections</option>
                  <option value="2A">Section 2A</option>
                  <option value="2B">Section 2B</option>
                  <option value="2C">Section 2C</option>
                  <option value="3A">Section 3A</option>
                  <option value="3B">Section 3B</option>
                  <option value="3C">Section 3C</option>
                  <option value="4A">Section 4A</option>
                  <option value="4B">Section 4B</option>
                </select>

                {/* Role Filter */}
                <select
                  value={mentorsRoleFilter}
                  onChange={(e) => {
                    setMentorsRoleFilter(e.target.value);
                    setMentorsPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="incharge">Class In-charge & Mentor</option>
                  <option value="faculty">Faculty Mentor</option>
                  <option value="subject">Subject Faculty</option>
                </select>

                {(mentorsYearFilter !== "All" || mentorsSectionFilter !== "All" || mentorsRoleFilter !== "All" || mentorsSearchQuery) && (
                  <button
                    onClick={() => {
                      setMentorsYearFilter("All");
                      setMentorsSectionFilter("All");
                      setMentorsRoleFilter("All");
                      setMentorsSearchQuery("");
                      setMentorsPage(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    Reset
                  </button>
                )}

                {/* Page Size */}
                <select
                  value={mentorsPageSize}
                  onChange={(e) => {
                    setMentorsPageSize(Number(e.target.value));
                    setMentorsPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  title="Rows per page"
                >
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={-1}>All ({filteredMentorsList.length})</option>
                </select>

                {/* View Switcher: Table vs Cards */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setMentorsViewMode("table")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      mentorsViewMode === "table"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Table View (Low-scrolling ERP scan)"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMentorsViewMode("card")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      mentorsViewMode === "card"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Card View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── HIGH-DENSITY MENTOR DISPLAY (TABLE / CARD VIEW) ── */}
            {mentorsLoading ? (
              <div className="bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-2 rounded-xl shadow-2xs">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading faculty registry...</p>
              </div>
            ) : filteredMentorsList.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 text-center rounded-xl shadow-2xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No mentors match the selected filters</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the year, section, or search query</p>
              </div>
            ) : mentorsViewMode === "table" ? (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[300px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-3">Faculty Name & Email</th>
                        <th className="py-2 px-2.5">Year</th>
                        <th className="py-2 px-2 text-center">Section</th>
                        <th className="py-2 px-3">Designated Role</th>
                        <th className="py-2 px-3">Allocated Roll Range</th>
                        <th className="py-2 px-3">Passkey</th>
                        <th className="py-2 px-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {paginatedMentorsList.map((m, idx) => {
                        const dbMentor = mentorsTracking.find((mt: any) =>
                          mt.email?.toLowerCase() === m.email?.toLowerCase() ||
                          mt.name?.toLowerCase() === m.name?.toLowerCase()
                        );
                        const key = dbMentor?.key || dbMentor?.passkey;
                        const isKeyRevealed = !!revealedKeys[m.id];
                        const isCopied = copiedKeyId === String(m.id);
                        const isClassIncharge = m.role.includes("In-charge");
                        const isFacultyMentor = m.role.includes("Faculty Mentor") && !isClassIncharge;
                        const rowNum = mentorsPageSize === -1 ? idx + 1 : (mentorsPage - 1) * mentorsPageSize + idx + 1;

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                              {rowNum}
                            </td>
                            <td className="py-1.5 px-3">
                              <span className="font-bold text-slate-900 block leading-tight">
                                {m.name}
                              </span>
                              <span className="text-[10.5px] font-mono text-slate-500 block">
                                {m.email}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  m.yearLabel?.includes("4")
                                    ? "bg-amber-50 border-amber-300 text-amber-900"
                                    : m.yearLabel?.includes("3")
                                    ? "bg-blue-50 border-blue-300 text-blue-900"
                                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                                }`}
                              >
                                {m.yearLabel}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center whitespace-nowrap">
                              <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                                Sec {m.section}
                              </span>
                            </td>
                            <td className="py-1.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isClassIncharge
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                                    : isFacultyMentor
                                    ? "bg-blue-50 border-blue-300 text-blue-900"
                                    : "bg-purple-50 border-purple-300 text-purple-900"
                                }`}
                              >
                                {isClassIncharge && <ShieldCheck className="w-3 h-3 text-indigo-700 shrink-0" />}
                                <span>{m.role}</span>
                              </span>
                            </td>
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                                <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {m.rollRange}
                                </span>
                                <span className="text-[9.5px] font-semibold text-slate-500">
                                  ({m.count} std)
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-3">
                              {key ? (
                                <div className="flex items-center gap-1">
                                  <span className={`font-mono font-bold rounded px-1.5 py-0.5 border text-[10.5px] ${
                                    isKeyRevealed
                                      ? "bg-blue-50 text-blue-950 border-blue-300"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}>
                                    {isKeyRevealed ? key : "••••••••"}
                                  </span>
                                  <button
                                    onClick={() => toggleRevealKey(m.id)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title={isKeyRevealed ? "Hide Passkey" : "Show Passkey"}
                                  >
                                    {isKeyRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopyKey(key, m.id)}
                                    className={`p-1 rounded transition-colors cursor-pointer ${
                                      isCopied ? "bg-emerald-100 text-emerald-800" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                    }`}
                                    title="Copy Passkey"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 italic">Not set</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedMentorForModal({ ...m, key })}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                                  title="View Mentor Details"
                                >
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setMentorEditData({
                                      id: m.id,
                                      name: m.name,
                                      email: m.email,
                                      role: m.role,
                                      section: m.section,
                                      key: key || "",
                                    });
                                    setEditKeyInput(key || "");
                                    setEditMentorModalOpen(true);
                                  }}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                  title="Edit Passkey / Assignment"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Compact Pagination Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div>
                    Showing <strong className="text-slate-900">{filteredMentorsList.length === 0 ? 0 : (mentorsPage - 1) * (mentorsPageSize === -1 ? filteredMentorsList.length : mentorsPageSize) + 1}</strong> to <strong className="text-slate-900">{mentorsPageSize === -1 ? filteredMentorsList.length : Math.min(mentorsPage * mentorsPageSize, filteredMentorsList.length)}</strong> of <strong className="text-slate-900">{filteredMentorsList.length}</strong> mentors
                  </div>

                  {mentorsPageSize !== -1 && totalMentorsPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMentorsPage((p) => Math.max(1, p - 1))}
                        disabled={mentorsPage === 1}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold text-slate-800">
                        {mentorsPage} / {totalMentorsPages}
                      </span>
                      <button
                        onClick={() => setMentorsPage((p) => Math.min(totalMentorsPages, p + 1))}
                        disabled={mentorsPage >= totalMentorsPages}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Compact Streamlined Card View (~100px height) */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[calc(100vh-270px)] min-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {paginatedMentorsList.map((m) => {
                  const dbMentor = mentorsTracking.find((mt: any) =>
                    mt.email?.toLowerCase() === m.email?.toLowerCase() ||
                    mt.name?.toLowerCase() === m.name?.toLowerCase()
                  );
                  const key = dbMentor?.key || dbMentor?.passkey;
                  const isKeyRevealed = !!revealedKeys[m.id];
                  const isCopied = copiedKeyId === String(m.id);
                  const isClassIncharge = m.role.includes("In-charge");

                  return (
                    <div
                      key={m.id}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs leading-tight truncate" title={m.name}>
                            {m.name}
                          </h4>
                          <p className="text-[10.5px] text-slate-500 font-mono mt-0.5 truncate">
                            {m.email}
                          </p>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 border border-slate-200 text-slate-800 font-mono shrink-0">
                          Sec {m.section}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-[10.5px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600 font-semibold">
                          <span>Role / Year:</span>
                          <span className="font-bold text-slate-900">
                            {m.role} • {m.yearLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 font-semibold">
                          <span>Roll Range:</span>
                          <span className="font-mono font-bold text-blue-800">
                            {m.rollRange} ({m.count} std)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-[10.5px] font-bold text-slate-500">Key:</span>
                          <span className="font-mono font-bold text-[10.5px] text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {isKeyRevealed ? key || "None" : "••••••••"}
                          </span>
                          {key && (
                            <button
                              onClick={() => toggleRevealKey(m.id)}
                              className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                              title={isKeyRevealed ? "Hide" : "Show"}
                            >
                              {isKeyRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedMentorForModal({ ...m, key })}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 text-[10.5px] font-bold border border-slate-200 cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              setMentorEditData({
                                id: m.id,
                                name: m.name,
                                email: m.email,
                                role: m.role,
                                section: m.section,
                                key: key || "",
                              });
                              setEditKeyInput(key || "");
                              setEditMentorModalOpen(true);
                            }}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "schedules" ? (
          <div className="space-y-3">
            {/* ── ULTRA-COMPACT HEADER & SECTION SELECTOR BAR ── */}
            {(() => {
              const activeSecKey = selectedTimetableSection === "All" ? "2A" : selectedTimetableSection;
              const activeSecMeta = SECTION_METADATA_REGISTRY[activeSecKey] || SECTION_METADATA_REGISTRY["2A"];

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
                  {/* Top Row: Title, Metadata Chips & Primary Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900 leading-none">
                            Department Master Timetable
                          </h2>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-950 border border-blue-300">
                            {selectedTimetableSection === "All" ? "All Sections (Showing 2A)" : `Section ${activeSecMeta.sectionKey} • ${activeSecMeta.yearLabel}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-950 border border-indigo-200">
                            👤 {activeSecMeta.classIncharge.name} (In-charge)
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-950 border border-emerald-200">
                            📍 {activeSecMeta.lectureHall}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {activeSecMeta.totalStudents} Students
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Print / Export Timetable */}
                      <button
                        onClick={() => setTimetablePrintModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print / Export</span>
                      </button>

                      {/* Assign New Class */}
                      <button
                        onClick={() => setNewClassModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign Class</span>
                      </button>

                      {/* View Switcher Toggle */}
                      <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
                        <button
                          onClick={() => setTimetableViewMode("grid")}
                          title="Weekly Matrix Grid View"
                          className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            timetableViewMode === "grid" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTimetableViewMode("list")}
                          title="Management List View"
                          className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            timetableViewMode === "list" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Selector Pills Row */}
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-100 overflow-x-auto text-xs scrollbar-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 flex-shrink-0">
                      <SlidersHorizontal className="w-3 h-3" /> Section:
                    </span>
                    <button
                      onClick={() => setSelectedTimetableSection("All")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                        selectedTimetableSection === "All"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      }`}
                    >
                      All Sections
                    </button>
                    {["2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B"].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setSelectedTimetableSection(sec)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                          selectedTimetableSection === sec
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                        }`}
                      >
                        Section {sec}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── ULTRA-COMPACT SEARCH BAR ── */}
            <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, faculty, room or day..."
                value={schedulesSearchQuery}
                onChange={(e) => setSchedulesSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {schedulesLoading ? (
              <div className="bg-white border border-slate-200 p-12 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-500">Loading department academic schedule...</p>
              </div>
            ) : timetableViewMode === "grid" ? (
              /* ── ULTRA-COMPACT WEEKLY TIMETABLE MATRIX (GRID VIEW) ── */
              <div className="space-y-3">
                <Card className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden p-2 sm:p-3">
                  {(() => {
                    const daysOfWeek = [
                      { key: "MON", label: "MON" },
                      { key: "TUE", label: "TUE" },
                      { key: "WED", label: "WED" },
                      { key: "THUR", label: "THU" },
                      { key: "FRI", label: "FRI" },
                      { key: "SAT", label: "SAT" },
                    ];

                    const defaultSlots = [
                      { slotIdx: 0, start: "09:00", end: "10:00", label: "09:00 - 10:00", periodName: "Period I" },
                      { slotIdx: 1, start: "10:00", end: "11:00", label: "10:00 - 11:00", periodName: "Period II" },
                      { isBreak: true, breakName: "TEA BREAK (11:00 - 11:10 AM)" },
                      { slotIdx: 2, start: "11:10", end: "12:10", label: "11:10 - 12:10", periodName: "Period III" },
                      { slotIdx: 3, start: "12:10", end: "01:10", label: "12:10 - 01:10", periodName: "Period IV" },
                      { isBreak: true, breakName: "LUNCH BREAK (01:10 - 02:00 PM)" },
                      { slotIdx: 4, start: "02:00", end: "03:00", label: "02:00 - 03:00", periodName: "Period V" },
                      { slotIdx: 5, start: "03:00", end: "04:00", label: "03:00 - 04:00", periodName: "Period VI" },
                    ];

                    const activeSecKey = selectedTimetableSection === "All" ? "2A" : selectedTimetableSection;
                    const secMeta = SECTION_METADATA_REGISTRY[activeSecKey] || SECTION_METADATA_REGISTRY["2A"];
                    const exactSecSchedule = DEPARTMENT_EXACT_TIMETABLE[activeSecKey] || DEPARTMENT_EXACT_TIMETABLE["2A"];

                    return (
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                              <th className="py-2 px-2 text-center w-28 border-r border-slate-200">
                                TIME / SLOT
                              </th>
                              {daysOfWeek.map((day) => (
                                <th
                                  key={day.key}
                                  className="py-2 px-2 text-center min-w-[125px]"
                                >
                                  {day.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {defaultSlots.map((slot, sIdx) => {
                              if (slot.isBreak) {
                                return (
                                  <tr key={sIdx} className="bg-amber-50/70 border-y border-amber-200/80">
                                    <td colSpan={daysOfWeek.length + 1} className="py-1 px-3 text-center">
                                      <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                        <Coffee className="w-3 h-3 text-amber-700" />
                                        {slot.breakName}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              const pIdx = slot.slotIdx!;

                              return (
                                <tr key={sIdx} className="hover:bg-slate-50/40 transition-colors">
                                  {/* Period Column */}
                                  <td className="py-1.5 px-2 align-middle border-r border-slate-200 text-center bg-slate-50/30">
                                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase">{slot.periodName}</span>
                                    <span className="block font-mono text-[10px] font-bold text-slate-800 mt-0.5">{slot.label}</span>
                                  </td>

                                  {/* Day Columns */}
                                  {daysOfWeek.map((day) => {
                                    const slotKey = `${activeSecKey}:${day.key}:${pIdx}`;
                                    const rawSubj = customSubjectOverrides?.[activeSecKey]?.[slotKey] || exactSecSchedule[day.key]?.[pIdx] || "Free";
                                    const isFree = rawSubj === "Free" || !rawSubj || rawSubj.trim() === "";

                                    // Search filter
                                    const q = schedulesSearchQuery.toLowerCase().trim();
                                    if (q) {
                                      const match = rawSubj.toLowerCase().includes(q) ||
                                        day.label.toLowerCase().includes(q) ||
                                        secMeta.lectureHall.toLowerCase().includes(q);
                                      if (!match) {
                                        return (
                                          <td key={day.key} className="py-1 px-1.5 align-middle opacity-25">
                                            <div className="p-1 text-[10px] text-center text-slate-400">—</div>
                                          </td>
                                        );
                                      }
                                    }

                                    if (isFree) {
                                      return (
                                        <td key={day.key} className="py-1 px-1.5 align-middle min-w-[125px]">
                                          <div
                                            onClick={() => handleOpenSlotReassign({
                                              sectionKey: activeSecKey,
                                              dayKey: day.key,
                                              dayLabel: day.label,
                                              slotIdx: pIdx,
                                              periodName: slot.periodName || "",
                                              timeLabel: slot.label,
                                              subject: "Free",
                                              currentFaculty: "Unassigned",
                                              room: secMeta.lectureHall,
                                            })}
                                            title="Click to assign subject and faculty for this free period"
                                            className="border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 rounded-lg flex items-center justify-center p-1.5 min-h-[48px] text-[11px] font-bold text-slate-400 bg-slate-50/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                          >
                                            <div className="flex items-center gap-1">
                                              <span>Free</span>
                                              <Plus className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        </td>
                                      );
                                    }

                                    const subjDetails = getTimetableSubjectDetails(rawSubj, activeSecKey);
                                    const faculty = getSectionFacultyForSubject(rawSubj, activeSecKey, day.key, pIdx, customFacultyOverrides);
                                    const isLab = subjDetails.type === "practical" || rawSubj.includes("LAB") || rawSubj.includes("/");
                                    const isActivity = subjDetails.type === "activity" || ["SPORTS", "LIBRARY", "COUNSELLING", "CLUB ACTIVITIES", "APTITUDE"].includes(rawSubj.toUpperCase());

                                    return (
                                      <td key={day.key} className="py-1 px-1.5 align-middle min-w-[125px]">
                                        <div
                                          onClick={() => handleOpenSlotReassign({
                                            sectionKey: activeSecKey,
                                            dayKey: day.key,
                                            dayLabel: day.label,
                                            slotIdx: pIdx,
                                            periodName: slot.periodName || "",
                                            timeLabel: slot.label,
                                            subject: rawSubj,
                                            currentFaculty: faculty,
                                            room: isLab ? secMeta.labRoom : secMeta.lectureHall,
                                          })}
                                          title={`Click to reassign faculty for ${rawSubj}`}
                                          className={`rounded-lg p-1.5 border transition-all flex flex-col justify-between min-h-[48px] cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                                            isLab
                                              ? "bg-emerald-50/90 border-emerald-300 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/40 shadow-2xs"
                                              : isActivity
                                              ? "bg-amber-50/80 border-amber-200 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/40 shadow-2xs"
                                              : "bg-blue-50/90 border-blue-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-400/40 shadow-2xs"
                                          }`}
                                        >
                                          <div>
                                            {/* Tag & Code Row */}
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                                isLab
                                                  ? "bg-emerald-200 text-emerald-950 border border-emerald-300"
                                                  : isActivity
                                                  ? "bg-amber-200 text-amber-950 border border-amber-300"
                                                  : "bg-blue-200 text-blue-950 border border-blue-300"
                                              }`}>
                                                {isLab ? "LAB" : isActivity ? "ACT" : "THEORY"}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <span className="font-mono text-[9px] font-bold text-slate-600 truncate">
                                                  {subjDetails.code}
                                                </span>
                                                <Edit3 className="w-2.5 h-2.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                              </div>
                                            </div>

                                            {/* Subject Title */}
                                            <h4 className="font-bold text-slate-900 text-[11px] leading-tight truncate" title={subjDetails.fullName || rawSubj}>
                                              {rawSubj}
                                            </h4>

                                            {/* Faculty & Venue */}
                                            <div className="mt-1 flex items-center justify-between text-[9.5px] text-slate-600 font-semibold gap-1">
                                              <span className="truncate flex items-center gap-0.5" title={faculty}>
                                                <User className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                                                <span className="truncate">{faculty}</span>
                                              </span>
                                              <span className="font-mono text-slate-500 flex-shrink-0">
                                                {isLab ? "Lab" : secMeta.lectureHall.replace("Hall ", "H")}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </Card>

                {/* ── ULTRA-COMPACT COURSE REFERENCE CATALOG ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Academic Course & Faculty Allocation (Section {selectedTimetableSection === "All" ? "2A" : selectedTimetableSection})
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-1.5 px-2 text-center w-10">S.No</th>
                          <th className="py-1.5 px-2">Code</th>
                          <th className="py-1.5 px-3">Subject / Lab Title</th>
                          <th className="py-1.5 px-2 text-center">Type</th>
                          <th className="py-1.5 px-3">Assigned Faculty</th>
                          <th className="py-1.5 px-2">Room</th>
                          <th className="py-1.5 px-2 text-center">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                        {(() => {
                          const activeSecKey = selectedTimetableSection === "All" ? "2A" : selectedTimetableSection;
                          const activeSecMeta = SECTION_METADATA_REGISTRY[activeSecKey] || SECTION_METADATA_REGISTRY["2A"];
                          const sched = DEPARTMENT_EXACT_TIMETABLE[activeSecKey] || DEPARTMENT_EXACT_TIMETABLE["2A"];

                          const uniqueSubjects = Array.from(new Set(
                            Object.values(sched).flat().filter((s) => s && s !== "Free")
                          ));

                          return uniqueSubjects.map((rawSubj, idx) => {
                            const details = getTimetableSubjectDetails(rawSubj, activeSecKey);
                            const faculty = getSectionFacultyForSubject(rawSubj, activeSecKey, undefined, undefined, customFacultyOverrides);
                            const isLab = details.type === "practical" || rawSubj.includes("LAB") || rawSubj.includes("/");

                            return (
                              <tr key={rawSubj} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                                <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{details.code}</td>
                                <td className="py-1.5 px-3 font-bold text-slate-900">{details.fullName || rawSubj}</td>
                                <td className="py-1.5 px-2 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    isLab
                                      ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                      : "bg-blue-100 text-blue-950 border border-blue-300"
                                  }`}>
                                    {isLab ? "LAB" : "THEORY"}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 font-bold text-slate-800">{faculty}</td>
                                <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600">
                                  {isLab ? activeSecMeta.labRoom : activeSecMeta.lectureHall}
                                </td>
                                <td className="py-1.5 px-2 text-center">
                                  <button
                                    onClick={() => handleOpenSlotReassign({
                                      sectionKey: activeSecKey,
                                      dayKey: "ALL",
                                      dayLabel: "All Days",
                                      slotIdx: 0,
                                      periodName: "Subject Scope",
                                      timeLabel: "All Slots",
                                      subject: rawSubj,
                                      currentFaculty: faculty,
                                      room: isLab ? activeSecMeta.labRoom : activeSecMeta.lectureHall,
                                    })}
                                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>Reassign</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* ── COMPACT LIST VIEW ── */
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto scroll-smooth scrollbar-thin">
                  <table className="w-full text-left border-collapse relative text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Faculty / Mentor</th>
                        <th className="py-2.5 px-2">Day</th>
                        <th className="py-2.5 px-2">Time Slot</th>
                        <th className="py-2.5 px-2">Section</th>
                        <th className="py-2.5 px-3">Subject Title</th>
                        <th className="py-2.5 px-3 text-center">HOD Override</th>
                        <th className="py-2.5 px-2 text-center">Assign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {schedules.map((s: any) => {
                        const overrideObj = (scheduleOverrides || []).find((o: any) => o.scheduleId === s.id);
                        const isUnlocked = overrideObj ? overrideObj.isUnlocked : false;
                        const extendedMins = overrideObj ? overrideObj.extendedMinutes : 0;
                        const subjInfo = getTimetableSubjectDetails(s.subject, s.section, s.year);

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 font-bold text-slate-900">{s.qr_mentors?.name || "Unassigned"}</td>
                            <td className="py-2 px-2 text-slate-700 font-bold">{s.day_of_week}</td>
                            <td className="py-2 px-2 text-slate-700 font-mono text-[11px]">
                              {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                            </td>
                            <td className="py-2 px-2">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[10px] font-mono">
                                {s.year} - {s.section}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900">{subjInfo.fullName}</span>
                              <span className="block text-[9.5px] font-mono text-slate-500">{subjInfo.code}</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleToggleScheduleOverride(s.id, isUnlocked, extendedMins)}
                                className={`px-2 py-0.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer border ${
                                  isUnlocked
                                    ? "bg-emerald-600 text-white border-emerald-700"
                                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                {isUnlocked ? <Unlock className="w-3 h-3 text-white" /> : <Lock className="w-3 h-3 text-slate-500" />}
                                {isUnlocked ? "UNLOCKED" : "LOCKED"}
                              </button>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleOpenAssignModal(s)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                Assign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : activeTab === "student-analytics" ? (
          <div className="space-y-2.5">
            {/* Student Analytics Search & Filter Header (Compact ERP Bar) */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="w-4 h-4 text-blue-600" />
                    Student Profiles & Academic Attendance Register
                    <span className="ml-1.5 px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {filteredAnalyticsList.length} Students
                    </span>
                  </h3>
                </div>
              </div>

              {/* Toolbar: Search + Quick Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by full name or roll number (e.g. 23N81A6701, Naveen)..."
                    value={analyticsSearchQuery}
                    onChange={(e) => {
                      setAnalyticsSearchQuery(e.target.value);
                      setAnalyticsPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Status Filter */}
                  <select
                    value={analyticsStatusFilter}
                    onChange={(e: any) => {
                      setAnalyticsStatusFilter(e.target.value);
                      setAnalyticsPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Status: All</option>
                    <option value="RED">Critical Shortage (&lt;65%)</option>
                    <option value="YELLOW">Borderline Warning (65%–74%)</option>
                    <option value="GREEN">Compliant (≥75%)</option>
                  </select>

                  {/* Year Filter */}
                  <select
                    value={analyticsYearFilter}
                    onChange={(e) => {
                      setAnalyticsYearFilter(e.target.value);
                      setAnalyticsPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="2">2nd Year (II)</option>
                    <option value="3">3rd Year (III)</option>
                    <option value="4">4th Year (IV)</option>
                  </select>

                  {/* Section Filter */}
                  <select
                    value={analyticsSectionFilter}
                    onChange={(e) => {
                      setAnalyticsSectionFilter(e.target.value);
                      setAnalyticsPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>

                  {/* Sort Order */}
                  <select
                    value={analyticsSortOrder}
                    onChange={(e: any) => {
                      setAnalyticsSortOrder(e.target.value);
                      setAnalyticsPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="name">Sort: Full Name (A–Z)</option>
                    <option value="roll">Sort: Roll Number</option>
                    <option value="lowest">Sort: Lowest Attendance %</option>
                    <option value="highest">Sort: Highest Attendance %</option>
                  </select>

                  {/* Page Size */}
                  <select
                    value={analyticsPageSize}
                    onChange={(e) => {
                      setAnalyticsPageSize(Number(e.target.value));
                      setAnalyticsPage(1);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                    title="Rows per page"
                  >
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                    <option value={-1}>All ({filteredAnalyticsList.length})</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      onClick={() => setAnalyticsViewMode("table")}
                      className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        analyticsViewMode === "table"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Table View (Fast Scanning)"
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAnalyticsViewMode("card")}
                      className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        analyticsViewMode === "card"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Card View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Density Administrative Display */}
            {analyticsViewMode === "table" ? (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-290px)] min-h-[320px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-3">Student Full Name</th>
                        <th className="py-2 px-3">Roll Number</th>
                        <th className="py-2 px-2 text-center">Class</th>
                        <th className="py-2 px-3 text-center">Attendance %</th>
                        <th className="py-2 px-3">Present / Absent / Total</th>
                        <th className="py-2 px-3">Compliance & 75% Requirement</th>
                        <th className="py-2 px-2.5 text-right">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {filteredAnalyticsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                            No student profiles match your query or filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedAnalyticsList.map((item, idx) => {
                          const s = item.student;
                          const studentFullName = s.name || (s as any).full_name || (s as any).username || s.uniqueId || "Student";
                          const absentDays = Math.max(0, item.totalWorkingDays - item.presentDays);
                          const rowNum = analyticsPageSize === -1 ? idx + 1 : (analyticsPage - 1) * analyticsPageSize + idx + 1;

                          return (
                            <tr
                              key={s.id}
                              onClick={() => setSelectedStudentForDetails(s)}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                                {rowNum}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block break-words">
                                  {studentFullName}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 font-mono font-bold text-slate-700 text-[11px] whitespace-nowrap">
                                {s.uniqueId || "N/A"}
                              </td>
                              <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[9.5px] font-bold font-mono">
                                  {item.secInfo.name}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                  item.flag === "RED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : item.flag === "YELLOW"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {item.percent}%
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 text-[11px] font-bold">
                                    <span className="text-emerald-700">{item.presentDays}P</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-rose-600">{absentDays}A</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-600">{item.totalWorkingDays} Days</span>
                                  </div>
                                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.flag === "RED" ? "bg-rose-500" : item.flag === "YELLOW" ? "bg-amber-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${item.percent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-1.5 px-3">
                                {item.flag === "RED" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                      Critical (&lt;65%)
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-slate-600 font-mono">
                                      +{item.classesNeededFor75} classes to 75%
                                    </span>
                                  </div>
                                ) : item.flag === "YELLOW" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                      Warning
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-slate-600 font-mono">
                                      +{item.classesNeededFor75} classes to 75%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Compliant • ≥75%
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudentForDetails(s);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Report</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Compact Pagination Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div>
                    Showing <strong className="text-slate-900">{filteredAnalyticsList.length === 0 ? 0 : (analyticsPage - 1) * (analyticsPageSize === -1 ? filteredAnalyticsList.length : analyticsPageSize) + 1}</strong> to <strong className="text-slate-900">{analyticsPageSize === -1 ? filteredAnalyticsList.length : Math.min(analyticsPage * analyticsPageSize, filteredAnalyticsList.length)}</strong> of <strong className="text-slate-900">{filteredAnalyticsList.length}</strong> students
                  </div>

                  {analyticsPageSize !== -1 && totalAnalyticsPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAnalyticsPage((p) => Math.max(1, p - 1))}
                        disabled={analyticsPage === 1}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold text-slate-800">
                        {analyticsPage} / {totalAnalyticsPages}
                      </span>
                      <button
                        onClick={() => setAnalyticsPage((p) => Math.min(totalAnalyticsPages, p + 1))}
                        disabled={analyticsPage >= totalAnalyticsPages}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Administrative Cards View (No giant button bloat, full student names) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[calc(100vh-290px)] min-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredAnalyticsList.length === 0 ? (
                  <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-semibold text-xs">
                    No student profiles match your query or filters.
                  </div>
                ) : (
                  paginatedAnalyticsList.map((item) => {
                    const s = item.student;
                    const studentFullName = s.name || (s as any).full_name || (s as any).username || s.uniqueId || "Student";
                    const absentDays = Math.max(0, item.totalWorkingDays - item.presentDays);

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudentForDetails(s)}
                        className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-2.5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug break-words">
                                {studentFullName}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 mt-0.5">
                                <span className="font-bold text-blue-700">{s.uniqueId || "N/A"}</span>
                                <span>•</span>
                                <span>Sec {item.secInfo.name}</span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-black border shrink-0 ${
                                item.flag === "RED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : item.flag === "YELLOW"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {item.percent}%
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-600 font-semibold">
                              <span>Days Attended:</span>
                              <span className="font-bold text-slate-900">
                                {item.presentDays} Present / {absentDays} Absent ({item.totalWorkingDays} Total)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 font-semibold">
                              <span>Action Target:</span>
                              <span className="font-bold text-slate-900">
                                {item.classesNeededFor75 > 0 ? `+${item.classesNeededFor75} Classes to 75%` : "✓ Compliant"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-bold text-blue-700 group-hover:text-blue-800">
                          <span>View Attendance Profile</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : activeTab === "flags" ? (
          /* DEDICATED HOD STUDENT RISK FLAG ANALYTICS VIEW (INSTITUTIONAL ERP DISPLAY) */
          <div className="space-y-2.5">
            {/* Ultra-Compact Risk Summary Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Card 1: Critical Shortage (<65%) */}
              <button
                onClick={() => {
                  setRiskFlagFilter(riskFlagFilter === "RED" ? "ALL" : "RED");
                  setRiskPage(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer bg-white ${
                  riskFlagFilter === "RED"
                    ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/30 shadow-xs"
                    : "border-slate-200 hover:border-rose-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Critical Shortage (&lt;65%)
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Condonation Req.
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">
                    {hodRedCount === 1 ? "1 Student" : `${hodRedCount} Students`}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Below 65% limit
                  </span>
                </div>
              </button>

              {/* Card 2: Borderline Warning (65%–74%) */}
              <button
                onClick={() => {
                  setRiskFlagFilter(riskFlagFilter === "YELLOW" ? "ALL" : "YELLOW");
                  setRiskPage(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer bg-white ${
                  riskFlagFilter === "YELLOW"
                    ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/30 shadow-xs"
                    : "border-slate-200 hover:border-amber-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Borderline Warning (65%–74%)
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Recoverable
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">
                    {hodYellowCount === 1 ? "1 Student" : `${hodYellowCount} Students`}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Target 75% achievable
                  </span>
                </div>
              </button>

              {/* Card 3: Compliant (≥75%) */}
              <button
                onClick={() => {
                  setRiskFlagFilter(riskFlagFilter === "GREEN" ? "ALL" : "GREEN");
                  setRiskPage(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer bg-white ${
                  riskFlagFilter === "GREEN"
                    ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400/30 shadow-xs"
                    : "border-slate-200 hover:border-emerald-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Compliant (≥75%)
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Safe Standing
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">
                    {hodGreenCount === 1 ? "1 Student" : `${hodGreenCount} Students`}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Compliant • ≥75%
                  </span>
                </div>
              </button>
            </div>

            {/* Categorization & Filter Toolbar (Compact ERP Bar) */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student name or roll number..."
                  value={riskSearchQuery}
                  onChange={(e) => {
                    setRiskSearchQuery(e.target.value);
                    setRiskPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Risk Status Filter */}
                <select
                  value={riskFlagFilter}
                  onChange={(e: any) => {
                    setRiskFlagFilter(e.target.value);
                    setRiskPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Risk Status: All</option>
                  <option value="RED">Critical Shortage (&lt;65%)</option>
                  <option value="YELLOW">Borderline Warning (65%–74%)</option>
                  <option value="GREEN">Compliant (≥75%)</option>
                </select>

                {/* Year Filter */}
                <select
                  value={riskYearFilter}
                  onChange={(e) => {
                    setRiskYearFilter(e.target.value);
                    setRiskPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="2">2nd Year (II)</option>
                  <option value="3">3rd Year (III)</option>
                  <option value="4">4th Year (IV)</option>
                </select>

                {/* Section Filter */}
                <select
                  value={riskSectionFilter}
                  onChange={(e) => {
                    setRiskSectionFilter(e.target.value);
                    setRiskPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sections</option>
                  <option value="2A">Section 2A</option>
                  <option value="2B">Section 2B</option>
                  <option value="2C">Section 2C</option>
                  <option value="3A">Section 3A</option>
                  <option value="3B">Section 3B</option>
                  <option value="3C">Section 3C</option>
                  <option value="4A">Section 4A</option>
                  <option value="4B">Section 4B</option>
                </select>

                {/* Sort Order */}
                <select
                  value={riskSortOrder}
                  onChange={(e: any) => {
                    setRiskSortOrder(e.target.value);
                    setRiskPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="lowest">Sort: Lowest Attendance %</option>
                  <option value="highest">Sort: Highest Attendance %</option>
                  <option value="roll">Sort: Roll Number</option>
                  <option value="name">Sort: Student Name</option>
                </select>

                {/* Page Size */}
                <select
                  value={riskPageSize}
                  onChange={(e) => {
                    setRiskPageSize(Number(e.target.value));
                    setRiskPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                  title="Rows per page"
                >
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={-1}>All ({filteredHodAnalyticsList.length})</option>
                </select>

                {/* View Switcher: Table vs Cards */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setRiskViewMode("table")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      riskViewMode === "table"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Table View (Fast Scanning)"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRiskViewMode("card")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      riskViewMode === "card"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Card View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* High-Density Display (Table View / Card View) */}
            {riskViewMode === "table" ? (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-310px)] min-h-[300px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Roll Number</th>
                        <th className="py-2 px-2 text-center">Class</th>
                        <th className="py-2 px-3 text-center">Attendance %</th>
                        <th className="py-2 px-3">Attended Days</th>
                        <th className="py-2 px-3">Compliance & Recovery Target</th>
                        <th className="py-2 px-2.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {filteredHodAnalyticsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                            No students found matching your selected filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedRiskList.map((item, idx) => {
                          const rowNum = riskPageSize === -1 ? idx + 1 : (riskPage - 1) * riskPageSize + idx + 1;
                          return (
                            <tr
                              key={item.student.id}
                              onClick={() => setSelectedStudentForDetails(item.student)}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 font-semibold text-[11px]">
                                {rowNum}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block truncate max-w-[220px]">
                                  {item.student.name || (item.student as any).full_name || item.student.uniqueId || "Student"}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 font-mono font-bold text-slate-700 text-[11px]">
                                {item.student.uniqueId || "N/A"}
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[9.5px] font-bold font-mono">
                                  {item.secInfo.name}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black border ${
                                  item.flag === "RED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : item.flag === "YELLOW"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {item.percent}%
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-[11px] whitespace-nowrap">
                                    {item.presentDays} / {item.totalWorkingDays} Days
                                  </span>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.flag === "RED" ? "bg-rose-500" : item.flag === "YELLOW" ? "bg-amber-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${item.percent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-1.5 px-3">
                                {item.flag === "RED" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                      Critical (&lt;65%)
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-slate-600 font-mono">
                                      +{item.classesNeededFor75} classes to 75% (+{item.classesNeededFor65} to 65%)
                                    </span>
                                  </div>
                                ) : item.flag === "YELLOW" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                      Warning
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-slate-600 font-mono">
                                      +{item.classesNeededFor75} consecutive classes to 75%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Compliant • ≥75%
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudentForDetails(item.student);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>View</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Compact Table Pagination Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div>
                    Showing <strong className="text-slate-900">{filteredHodAnalyticsList.length === 0 ? 0 : (riskPage - 1) * (riskPageSize === -1 ? filteredHodAnalyticsList.length : riskPageSize) + 1}</strong> to <strong className="text-slate-900">{riskPageSize === -1 ? filteredHodAnalyticsList.length : Math.min(riskPage * riskPageSize, filteredHodAnalyticsList.length)}</strong> of <strong className="text-slate-900">{filteredHodAnalyticsList.length}</strong> students
                  </div>

                  {riskPageSize !== -1 && totalRiskPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRiskPage((p) => Math.max(1, p - 1))}
                        disabled={riskPage === 1}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold text-slate-800">
                        {riskPage} / {totalRiskPages}
                      </span>
                      <button
                        onClick={() => setRiskPage((p) => Math.min(totalRiskPages, p + 1))}
                        disabled={riskPage >= totalRiskPages}
                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Streamlined Compact Card View (No repeated giant paragraph boxes) */
              <div className="space-y-1.5 max-h-[calc(100vh-310px)] min-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredHodAnalyticsList.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-semibold text-xs">
                    No students found matching your selected filters.
                  </div>
                ) : (
                  paginatedRiskList.map((item) => (
                    <div
                      key={item.student.id}
                      onClick={() => setSelectedStudentForDetails(item.student)}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 transition-all hover:shadow-2xs cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                          item.flag === "RED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : item.flag === "YELLOW"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {item.percent}%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.student.name || (item.student as any).full_name || item.student.uniqueId || "Student"}
                          </h4>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-mono">
                            <span className="text-blue-700 font-bold">{item.student.uniqueId || "N/A"}</span>
                            <span>•</span>
                            <span>{item.secInfo.yearLabel}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">Sec {item.secInfo.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {item.presentDays} / {item.totalWorkingDays} Days Attended
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            {item.classesNeededFor75 > 0 ? `Target: +${item.classesNeededFor75} Classes Needed` : "Target Met"}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                          item.flag === "RED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : item.flag === "YELLOW"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {item.flag === "RED" ? "Critical (<65%)" : item.flag === "YELLOW" ? "Warning (65-74%)" : "Compliant (≥75%)"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Detailed student listing slide-over sheet */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-xl bg-white border-l border-gray-200 p-0 flex flex-col h-full text-gray-900">
            <SheetHeader className="p-6 border-b border-gray-200">
              <SheetTitle className="text-2xl font-bold text-gray-800 tracking-tight">
                {drawerConfig.title}
              </SheetTitle>
              <SheetDescription className="text-gray-500 text-sm mt-1">
                {drawerConfig.description}
              </SheetDescription>
            </SheetHeader>

            {/* Search filter */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search student name or roll number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                />
              </div>
            </div>

            {/* Students list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-855 p-2">
              {filteredDrawerStudents.length === 0 ? (
                <div className="py-20 text-center text-gray-400 text-sm">
                  No students match your query.
                </div>
              ) : (
                filteredDrawerStudents.map((item, idx) => {
                  const s = item.student;
                  const record = item.record;
                  
                  return (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-800 uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-slate-550 font-mono mt-0.5">{s.uniqueId}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 text-right">
                        {item.status === "present" ? (
                          <>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              {record?.exitTime
                                ? "Left Campus"
                                : isExitTimeOver(record?.date, record?.exitTime)
                                  ? "Present"
                                  : "Still on Campus"}
                            </span>
                            <div className="flex items-center gap-3 text-gray-500 text-[10px]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-500" /> 
                                In: {formatTime(record?.entryTime)}
                                {isLateTime(record?.entryTime) && (
                                  <span className="ml-1.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 text-[8px] font-black uppercase tracking-wider">LATE</span>
                                )}
                              </span>
                              {record?.exitTime ? (
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> Out: {formatTime(record?.exitTime)}</span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-400 font-medium">Out: —</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-500" />
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

        {/* Reassign Faculty for Timetable Slot Modal */}
        {reassignSlotModalOpen && slotToReassign && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Reassign Faculty / Teacher</h3>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Section {slotToReassign.sectionKey} • {slotToReassign.dayLabel} • {slotToReassign.periodName} ({slotToReassign.timeLabel})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReassignSlotModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Slot details card */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{slotToReassign.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                    {slotToReassign.room}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <span>Current Assigned Faculty:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {slotToReassign.currentFaculty}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveSlotReassign} className="space-y-4">
                {/* Edit Subject Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject / Lab / Activity Title
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedSubjectInput}
                      onChange={(e) => setEditedSubjectInput(e.target.value)}
                      placeholder="e.g. CN, JAVA LAB, Free"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setEditedSubjectInput("Free")}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                    >
                      Set Free
                    </button>
                  </div>
                </div>

                {/* Select from list */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Department Faculty
                  </label>
                  <select
                    value={selectedFacultyName}
                    onChange={(e) => {
                      setSelectedFacultyName(e.target.value);
                      setCustomFacultyTextInput("");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {DEPARTMENT_FACULTY_LIST.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Or Custom / Multi Faculty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Or Enter Custom Name / Multi-Faculty Co-Teachers
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mrs. K. Sneha & Mrs. A. Sravanthi"
                    value={customFacultyTextInput}
                    onChange={(e) => {
                      setCustomFacultyTextInput(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    If entered, this custom text will take precedence over the dropdown selection.
                  </span>
                </div>

                {/* Scope of change */}
                <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-2">
                  <span className="block text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                    Reassignment Scope:
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="reassignScope"
                      checked={applyToAllSlotsOfSubject}
                      onChange={() => setApplyToAllSlotsOfSubject(true)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>
                      Update faculty for <strong>all "{slotToReassign.subject}"</strong> classes in Section {slotToReassign.sectionKey}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="reassignScope"
                      checked={!applyToAllSlotsOfSubject}
                      onChange={() => setApplyToAllSlotsOfSubject(false)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>
                      Update only this specific time slot (<strong>{slotToReassign.dayLabel} {slotToReassign.timeLabel}</strong>)
                    </span>
                  </label>
                </div>

                {reassignSuccessMsg && (
                  <div className="p-3 rounded-xl bg-green-100 border border-green-300 text-green-800 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-green-700" />
                    {reassignSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReassignSlotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReassignment || (!selectedFacultyName && !customFacultyTextInput.trim())}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-200 cursor-pointer"
                  >
                    {savingReassignment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Reassignment...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Save Reassignment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Faculty to Class Modal */}
        {assignModalOpen && scheduleToAssign && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-700" />
                  <h3 className="text-lg font-bold text-gray-900">Assign Class to Faculty</h3>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-1 text-xs">
                <p className="text-gray-700 font-bold">{scheduleToAssign.subject}</p>
                <p className="text-gray-500">Class: {scheduleToAssign.year} Yr - {scheduleToAssign.section} | Day: {scheduleToAssign.day_of_week}</p>
                <p className="text-gray-400 font-mono">{scheduleToAssign.start_time?.slice(0,5)} - {scheduleToAssign.end_time?.slice(0,5)}</p>
              </div>

              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Select Faculty / Teacher
                  </label>
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentorsTracking.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) — Key: {m.key || "No Key"}
                      </option>
                    ))}
                  </select>
                </div>

                {assignSuccessMsg && (
                  <div className="p-3 rounded-xl bg-green-100 border border-green-300 text-green-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    {assignSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !selectedMentorId}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-200"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Confirm Assign
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create New Class Schedule Modal */}
        {newClassModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-700" />
                  <h3 className="text-lg font-bold text-gray-900">Assign New Class Schedule</h3>
                </div>
                <button
                  onClick={() => setNewClassModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DBMS, Computer Networks, AI"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Year</label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      <option value="MON">Mon</option>
                      <option value="TUE">Tue</option>
                      <option value="WED">Wed</option>
                      <option value="THUR">Thu</option>
                      <option value="FRI">Fri</option>
                      <option value="SAT">Sat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="text"
                      placeholder="09:00:00"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Time</label>
                    <input
                      type="text"
                      placeholder="10:00:00"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign Faculty / Teacher
                  </label>
                  <select
                    value={newMentorId}
                    onChange={(e) => setNewMentorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Select Faculty --</option>
                    {mentorsTracking.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) — Key: {m.key || "No Key"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewClassModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClass || !newMentorId || !newSubject}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-200"
                  >
                    {creatingClass ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Assign Class
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official Printable Timetable Document Modal */}
        {timetablePrintModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-5xl my-6 p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900">
              {/* Modal Control Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Official Department Timetable Document</h3>
                    <p className="text-xs text-slate-500">Autonomous university standard format ready for printing & archiving</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Document</span>
                  </button>
                  <button
                    onClick={() => setTimetablePrintModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ── PRINTABLE LETTERHEAD & MASTER TIMETABLE ── */}
              {(() => {
                const secKey = selectedTimetableSection === "All" ? "3B" : selectedTimetableSection;
                const secMeta = SECTION_METADATA_REGISTRY[secKey] || SECTION_METADATA_REGISTRY["3B"];

                const daysOfWeek = [
                  { key: "MON", label: "MONDAY" },
                  { key: "TUE", label: "TUESDAY" },
                  { key: "WED", label: "WEDNESDAY" },
                  { key: "THUR", label: "THURSDAY" },
                  { key: "FRI", label: "FRIDAY" },
                  { key: "SAT", label: "SATURDAY" },
                ];

                const defaultSlots = [
                  { start: "09:00", end: "10:00", label: "09:00 - 10:00 AM", periodName: "Period I" },
                  { start: "10:00", end: "11:00", label: "10:00 - 11:00 AM", periodName: "Period II" },
                  { start: "11:00", end: "11:10", label: "11:00 - 11:10 AM", isBreak: true, breakName: "TEA BREAK" },
                  { start: "11:10", end: "12:10", label: "11:10 - 12:10 PM", periodName: "Period III" },
                  { start: "12:10", end: "01:10", label: "12:10 - 01:10 PM", periodName: "Period IV" },
                  { start: "01:10", end: "02:00", label: "01:10 - 02:00 PM", isBreak: true, breakName: "LUNCH BREAK" },
                  { start: "02:00", end: "03:00", label: "02:00 - 03:00 PM", periodName: "Period V" },
                  { start: "03:00", end: "04:00", label: "03:00 - 04:00 PM", periodName: "Period VI" },
                ];

                const exactSecSchedule = DEPARTMENT_EXACT_TIMETABLE[secKey] || DEPARTMENT_EXACT_TIMETABLE["2A"];
                const uniqueSubjects = Array.from(new Set([
                  ...Object.values(exactSecSchedule).flat().filter((s) => s && s !== "Free"),
                  ...Object.values(customSubjectOverrides?.[secKey] || {}).filter((s) => s && s !== "Free"),
                ]));

                const legendList = uniqueSubjects.map((rawSubj) => ({
                  raw: rawSubj,
                  details: getTimetableSubjectDetails(rawSubj, secKey),
                  faculty: getSectionFacultyForSubject(rawSubj, secKey, undefined, undefined, customFacultyOverrides),
                }));

                return (
                  <div className="space-y-6">
                    {/* College Official Letterhead */}
                    <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                      <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
                        SPHOORTHY ENGINEERING COLLEGE
                      </h1>
                      <p className="text-xs font-semibold text-slate-700 tracking-wider">
                        (An Autonomous Institution • Approved by AICTE, Affiliated to JNTUH, NAAC 'A+' Grade)
                      </p>
                      <p className="text-[11px] text-slate-600">Sagar Road, Nadargul, Hyderabad, Telangana – 501510</p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-xs uppercase tracking-widest text-slate-900">
                          DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING (DATA SCIENCE)
                        </span>
                      </div>
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pt-1">
                        CLASS TIME TABLE — ACADEMIC YEAR {secMeta.academicYear}
                      </h2>
                    </div>

                    {/* Section Metadata Table */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 divide-x divide-y sm:divide-y-0 divide-slate-200 border-b border-slate-200">
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Degree & Branch</span>
                          <span className="font-bold text-slate-900">B.Tech – CSE (Data Science)</span>
                        </div>
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Year / Semester / Sec</span>
                          <span className="font-bold text-slate-900">{secMeta.yearNumber} Year • {secMeta.semester} • Sec {secMeta.sectionLetter}</span>
                        </div>
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Lecture Hall / Room</span>
                          <span className="font-bold text-slate-900">{secMeta.lectureHall}</span>
                        </div>
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">W.E.F. Date</span>
                          <span className="font-bold text-slate-900">{secMeta.wefDate}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-slate-200 bg-white">
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Class In-charge & Mentor</span>
                          <span className="font-bold text-slate-900">{secMeta.classIncharge.name} ({secMeta.classIncharge.designation})</span>
                        </div>
                        <div className="p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Practical Lab Venue</span>
                          <span className="font-bold text-slate-900">{secMeta.labRoom}</span>
                        </div>
                      </div>
                    </div>

                    {/* Master Timetable Matrix */}
                    <div className="border border-slate-300 rounded-xl overflow-x-auto text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold uppercase text-[11px]">
                            <th className="py-2.5 px-3 text-center border-r border-slate-300 w-32">DAY / TIME</th>
                            {defaultSlots.map((slot, i) => (
                              <th key={i} className={`py-2 px-2 text-center border-r border-slate-300 ${slot.isBreak ? "bg-amber-100 text-amber-950 w-24" : ""}`}>
                                <span className="block text-[10px] font-black">{slot.periodName || slot.breakName}</span>
                                <span className="block font-mono text-[10px] font-normal text-slate-600 mt-0.5">{slot.label}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {daysOfWeek.map((day) => (
                            <tr key={day.key} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-black text-slate-900 text-center bg-slate-50 border-r border-slate-300">
                                {day.label}
                              </td>
                              {defaultSlots.map((slot, sIdx) => {
                                if (slot.isBreak) {
                                  return (
                                    <td key={sIdx} className="bg-amber-50 text-amber-950 font-black text-[10px] text-center border-r border-slate-300 p-1">
                                      {slot.breakName}
                                    </td>
                                  );
                                }

                                const slotPeriodMap: Record<string, number> = {
                                  "Period I": 0,
                                  "Period II": 1,
                                  "Period III": 2,
                                  "Period IV": 3,
                                  "Period V": 4,
                                  "Period VI": 5,
                                };
                                const pIdx = slotPeriodMap[slot.periodName || ""] ?? 0;
                                const slotKey = `${secKey}:${day.key}:${pIdx}`;
                                const rawSubj = customSubjectOverrides?.[secKey]?.[slotKey] || exactSecSchedule[day.key]?.[pIdx] || "Free";

                                if (rawSubj === "Free" || !rawSubj) {
                                  return (
                                    <td key={sIdx} className="text-center text-slate-400 font-medium border-r border-slate-300 p-2 bg-slate-50/30">
                                      —
                                    </td>
                                  );
                                }

                                const subj = getTimetableSubjectDetails(rawSubj, secKey);
                                const faculty = getSectionFacultyForSubject(rawSubj, secKey, day.key, pIdx, customFacultyOverrides);

                                return (
                                  <td key={sIdx} className={`p-2 border-r border-slate-300 text-center ${subj.type === "practical" ? "bg-emerald-50/60" : "bg-white"}`}>
                                    <span className="font-bold text-slate-900 block text-xs leading-snug">{subj.fullName || rawSubj}</span>
                                    <span className="font-mono text-[10px] text-blue-800 font-bold block mt-0.5">{subj.code}</span>
                                    <span className="text-[10px] font-semibold text-slate-600 block mt-0.5">{faculty}</span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Subject Legend & Faculty Allocation Table */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 font-bold text-slate-900 uppercase text-[11px]">
                        Subject Details & Faculty Allocation Reference
                      </div>
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                            <th className="py-2 px-3 text-center w-12 border-r border-slate-200">S.No</th>
                            <th className="py-2 px-3 border-r border-slate-200">Subject Code</th>
                            <th className="py-2 px-3 border-r border-slate-200">Subject Name</th>
                            <th className="py-2 px-3 text-center border-r border-slate-200">L-T-P-C</th>
                            <th className="py-2 px-3">Faculty / Mentor Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium">
                          {legendList.map((item, idx) => (
                            <tr key={item.raw}>
                              <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-800 border-r border-slate-200">{item.details.code}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{item.details.fullName}</td>
                              <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{item.details.type === "practical" ? "0-0-3-2" : "3-1-0-4"}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{item.faculty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signature Blocks */}
                    <div className="pt-8 pb-4 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
                      <div>
                        <div className="h-10"></div>
                        <div className="border-t border-slate-400 pt-1.5 mx-6">
                          Time Table Coordinator
                        </div>
                      </div>
                      <div>
                        <div className="h-10"></div>
                        <div className="border-t border-slate-400 pt-1.5 mx-6">
                          Head of the Department (CSE-DS)
                        </div>
                      </div>
                      <div>
                        <div className="h-10"></div>
                        <div className="border-t border-slate-400 pt-1.5 mx-6">
                          Principal
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Export Monthly Attendance Register Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Download Monthly Register</h3>
                    <p className="text-xs text-gray-500">Export attendance spreadsheet (P / A register format)</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Date Selection Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Date Range Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setExportDateMode("month")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        exportDateMode === "month"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      🗓️ By Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportDateMode("range")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        exportDateMode === "range"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      📅 Calendar Range (From - To)
                    </button>
                  </div>
                </div>

                {/* Month Picker */}
                {exportDateMode === "month" ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={exportMonth}
                      onChange={(e) => setExportMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                      required
                    />
                  </div>
                ) : (
                  /* Custom From - To Calendar Date Pickers */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={exportFromDate}
                        onChange={(e) => setExportFromDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={exportToDate}
                        onChange={(e) => setExportToDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Scope Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Target Scope
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="department">Full Department (All Students)</option>
                    <option value="year">By Year (2nd, 3rd, or 4th Year)</option>
                    <option value="section">By Section (e.g. 2A, 2B, 3A...)</option>
                    <option value="student">Individual Student</option>
                  </select>
                </div>

                {/* Year Selector */}
                {exportType === "year" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Select Year
                    </label>
                    <select
                      value={exportYear}
                      onChange={(e) => setExportYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="2nd Year">2nd Year (DS II)</option>
                      <option value="3rd Year">3rd Year (DS III)</option>
                      <option value="4th Year">4th Year (DS IV)</option>
                    </select>
                  </div>
                )}

                {/* Section Selector */}
                {exportType === "section" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Select Section
                    </label>
                    <select
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="2A">2A CSE Data Science</option>
                      <option value="2B">2B CSE Data Science</option>
                      <option value="2C">2C CSE Data Science</option>
                      <option value="3A">3A CSE Data Science</option>
                      <option value="3B">3B CSE Data Science</option>
                      <option value="3C">3C CSE Data Science</option>
                      <option value="3D">3D CSE Data Science</option>
                      <option value="4A">4A CSE Data Science</option>
                      <option value="4B">4B CSE Data Science</option>
                    </select>
                  </div>
                )}

                {/* Student Selector by Roll Number or Name */}
                {exportType === "student" && (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Enter Roll Number or Search Student
                    </label>

                    {/* Roll Number Search Input */}
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search className="w-4 h-4 text-emerald-700" />
                      </div>
                      <input
                        type="text"
                        placeholder="Type Roll Number (e.g. 23N81A6701)..."
                        value={exportRollQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExportRollQuery(val);
                          const matched = studentsOnly.find(s => 
                            s.uniqueId?.toLowerCase().trim() === val.toLowerCase().trim()
                          );
                          if (matched) {
                            setExportStudentId(matched.id);
                          } else if (!val) {
                            setExportStudentId("");
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 placeholder-gray-400 font-mono"
                      />
                    </div>

                    {/* Dropdown sorted by Roll Number first */}
                    <select
                      value={exportStudentId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setExportStudentId(id);
                        const s = studentsOnly.find(st => st.id === id);
                        if (s) {
                          setExportRollQuery(s.uniqueId || "");
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Select from Roll Number List --</option>
                      {[...studentsOnly]
                        .filter(s => {
                          if (!exportRollQuery) return true;
                          const q = exportRollQuery.toLowerCase().trim();
                          return (s.uniqueId || "").toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
                        })
                        .sort((a, b) => (a.uniqueId || "").localeCompare(b.uniqueId || ""))
                        .map(s => {
                          const { name: secName } = getSectionDisplayName(s.section);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.uniqueId ? `${s.uniqueId} — ` : ""}{s.name} (Sec {secName})
                            </option>
                          );
                        })}
                    </select>

                    {/* Selected Student Details Card */}
                    {exportStudentId ? (
                      (() => {
                        const s = studentsOnly.find(st => st.id === Number(exportStudentId));
                        if (!s) return null;
                        const { name: secName, yearLabel } = getSectionDisplayName(s.section);
                        return (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center font-bold text-emerald-700">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-emerald-200 text-sm">{s.name}</p>
                                <p className="text-emerald-700/80 font-mono">Roll No: {s.uniqueId || "N/A"} | Sec {secName} ({yearLabel})</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-500/30">
                              Selected
                            </span>
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                )}

                <div className="bg-gray-50/80 border border-gray-200 p-3.5 rounded-xl text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">📊 Register Format Preview:</p>
                  <p>• Columns: S.No | Roll No | Student Name | Year | Section | Day 1..31 | Total P | Total A | Attendance %</p>
                  <p>• Daily Status: <span className="text-emerald-700 font-bold">P</span> = Present, <span className="text-red-700 font-bold">A</span> = Absent</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCsv}
                  disabled={isExporting || (exportType === "student" && !exportStudentId)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Spreadsheet (.csv)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Holidays Modal */}
        {holidayModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-700" />
                  <h3 className="text-lg font-bold text-gray-900">Declare / Manage Holidays</h3>
                </div>
                <button
                  onClick={() => setHolidayModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Add Holiday Form */}
              <form onSubmit={handleAddHoliday} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Holiday Date
                    </label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Reason / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Independence Day"
                      value={newHolidayReason}
                      onChange={(e) => setNewHolidayReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold focus:outline-none focus:border-purple-500 placeholder-gray-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newHolidayDate}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Holiday
                </button>
              </form>

              {/* Declared Holidays List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Declared Holidays ({Object.keys(holidays).length})
                </p>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {Object.keys(holidays).length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-3">No custom holidays declared yet.</p>
                  ) : (
                    Object.entries(holidays)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dStr, reason]) => (
                        <div key={dStr} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                          <div>
                            <span className="font-mono font-bold text-purple-700">{dStr}</span>
                            <span className="text-gray-500 ml-2 font-medium">— {reason}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveHoliday(dStr)}
                            className="text-gray-400 hover:text-red-700 p-1 transition-colors cursor-pointer"
                            title="Remove Holiday"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40 text-[11px] text-purple-700/80 space-y-0.5">
                <p className="font-bold text-purple-200">ℹ️ Automatic Rules:</p>
                <p>• All <span className="font-bold text-purple-200">Sundays</span> are automatically marked with <span className="font-bold text-amber-700">*</span> in the register.</p>
                <p>• Declared holidays above are also marked with <span className="font-bold text-amber-700">*</span> and not counted as absent days.</p>
              </div>
            </div>
          </div>
        )}
        {/* Student Profile & Attendance Details Modal - LIGHT MODE REDESIGN */}
        {selectedStudentForDetails && (
          <div className="fixed inset-0 z-50 bg-white backdrop-blur-sm flex flex-col p-4 sm:p-8 md:p-10 overflow-y-auto animate-fadeIn font-sans">
            <div className="max-w-4xl mx-auto w-full space-y-6 bg-white border border-gray-300 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 border border-blue-400 flex items-center justify-center text-2xl font-black text-gray-900 shadow-md">
                    {selectedStudentForDetails.name ? selectedStudentForDetails.name.charAt(0) : "S"}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      {selectedStudentForDetails.name || (selectedStudentForDetails as any).full_name || (selectedStudentForDetails as any).username || selectedStudentForDetails.uniqueId || "Student"}
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 uppercase tracking-wider">
                        Student Profile
                      </span>
                    </h2>
                    <p className="text-sm font-bold text-slate-700 mt-1">
                      Department of CSE Data Science
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="p-2 rounded-xl bg-gray-100 border border-gray-300 hover:bg-gray-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                >
                  <XCircle className="w-7 h-7" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-100 border border-gray-300">
                    <p className="text-xs font-black text-slate-700 uppercase">Roll Number</p>
                    <p className="text-base font-black text-slate-900 font-mono mt-1">
                      {selectedStudentForDetails.uniqueId || selectedStudentForDetails.unique_id || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-100 border border-gray-300">
                    <p className="text-xs font-black text-slate-700 uppercase">Section & Year</p>
                    <p className="text-base font-black text-slate-900 mt-1">
                      Sec {getSectionDisplayName(selectedStudentForDetails.section).name} ({getSectionDisplayName(selectedStudentForDetails.section).yearLabel})
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-100 border border-gray-300">
                    <p className="text-xs font-black text-slate-700 uppercase">Department</p>
                    <p className="text-base font-black text-blue-700 mt-1">
                      CSE Data Science
                    </p>
                  </div>
                </div>

                {/* Interactive Monthly Attendance Register Grid & Day Details */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Select Month:
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
                      onClick={() => handleDirectCSVDownload(selectedStudentForDetails.name, studentModalMonth, studentMonthlyRecords)}
                      className="text-xs font-black text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download Register (.csv)
                    </button>
                  </div>

                  {/* Monthly Stats Summary Bar */}
                  {(() => {
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

                    const monthDaysList = [];
                    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                    let studentPresentCount = 0;
                    let studentAbsentCount = 0;
                    let studentHolidayCount = 0;
                    let studentWorkingDaysCount = 0;

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
                          studentPresentCount++;
                        } else {
                          status = "*";
                          studentHolidayCount++;
                        }
                      } else {
                        studentWorkingDaysCount++;
                        if (isPresent) {
                          status = "P";
                          studentPresentCount++;
                        } else {
                          status = "A";
                          studentAbsentCount++;
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

                    const calcWorkingDays = studentWorkingDaysCount > 0 ? studentWorkingDaysCount : 1;
                    const studentMonthlyPercent = Math.floor((studentPresentCount / calcWorkingDays) * 100);

                    // Dynamic stay time math
                    const presentDaysWithDuration = (studentMonthlyRecords || []).filter(r => r.durationMinutes && r.durationMinutes > 0);
                    const totalDurationMinutes = presentDaysWithDuration.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
                    const avgDurationMinutes = presentDaysWithDuration.length > 0 ? Math.round(totalDurationMinutes / presentDaysWithDuration.length) : 0;
                    const avgDurationStr = avgDurationMinutes > 0 ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m` : "No checkout logs";

                    const hourlyForSelectedDay = (studentHourlyRecords || []).filter((hr: any) => {
                      if (!hr.date || !selectedDayDetail) return false;
                      return hr.date.slice(0, 10) === selectedDayDetail.dateStr;
                    });

                    return (
                      <div className="space-y-6">
                        {/* Stats Row & Visual Pie Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          {/* Pie Chart Card */}
                          <div className="p-5 rounded-2xl bg-gray-100 border border-gray-300 flex flex-col items-center justify-center space-y-3">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Attendance Breakdown</p>
                            <div className="relative flex items-center justify-center">
                              {/* Inline SVG Pie Chart */}
                              <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
                                <path
                                  className="text-gray-700"
                                  strokeWidth="3"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className={studentMonthlyPercent >= 75 ? "text-emerald-600" : studentMonthlyPercent >= 65 ? "text-amber-600" : "text-rose-600"}
                                  strokeDasharray={`${studentMonthlyPercent}, 100`}
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900">{studentMonthlyPercent}%</span>
                                <span className="text-[9px] font-black text-slate-700 uppercase">Monthly</span>
                              </div>
                            </div>
                          </div>

                          {/* Present Days Card */}
                          <div className="p-5 rounded-2xl bg-gray-100 border border-gray-300 text-center space-y-2">
                            <p className="text-xs font-black text-emerald-800 uppercase">Present Days (P)</p>
                            <p className="text-3xl font-black text-slate-900">{studentPresentCount} Days</p>
                            <p className="text-xs text-slate-700 font-extrabold">Attended out of {calcWorkingDays} working days</p>
                          </div>

                          {/* Absent Days Card */}
                          <div className="p-5 rounded-2xl bg-gray-100 border border-gray-300 text-center space-y-2">
                            <p className="text-xs font-black text-rose-800 uppercase">Absent Days (A)</p>
                            <p className="text-3xl font-black text-slate-900">{studentAbsentCount} Days</p>
                            <p className="text-xs text-slate-700 font-extrabold">Missed classes</p>
                          </div>

                          {/* Average College stay time */}
                          <div className="p-5 rounded-2xl bg-gray-100 border border-gray-300 text-center space-y-2">
                            <p className="text-xs font-black text-blue-800 uppercase">Avg Daily Campus Stay</p>
                            <p className="text-3xl font-black text-slate-900">{avgDurationStr}</p>
                            <p className="text-xs text-slate-700 font-extrabold">Calculated from gate logs</p>
                          </div>
                        </div>

                        {/* Daily Register Grid */}
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Daily Register Grid (Click any date to view Entry/Exit times)</span>
                            <span className="text-slate-700 font-bold">P = Present | A = Absent | * = Holiday | — = Future</span>
                          </p>
                          
                          <div className="grid grid-cols-7 gap-1.5 bg-gray-100 p-4 rounded-2xl border border-gray-300">
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
                                      ? "bg-emerald-100 border-emerald-300 text-emerald-950"
                                      : d.status === "*"
                                      ? "bg-purple-100 border-purple-300 text-purple-950"
                                      : d.status === "—"
                                      ? "bg-gray-200 border-gray-300 text-slate-600 opacity-80"
                                      : "bg-rose-100 border-rose-300 text-rose-950"
                                  }`}
                                >
                                  <span className="text-[10px] font-mono font-bold text-slate-700">
                                    {d.dayNum} {d.dayOfWeek}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                    d.status === "P"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : d.status === "*"
                                      ? "bg-amber-500 text-slate-950 shadow-xs"
                                      : d.status === "—"
                                      ? "bg-gray-300 text-slate-800"
                                      : "bg-rose-600 text-white shadow-xs"
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
                          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-slate-900 space-y-2 animate-fadeIn shadow-xs">
                            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <h5 className="text-sm font-black text-slate-900">
                                  Date: <span className="font-mono text-blue-900">{selectedDayDetail.dateStr}</span> ({selectedDayDetail.dayOfWeek})
                                </h5>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                selectedDayDetail.status === "P"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : selectedDayDetail.status === "*"
                                  ? "bg-purple-100 text-purple-900 border border-purple-300"
                                  : selectedDayDetail.status === "—"
                                  ? "bg-gray-200 text-slate-800 border border-gray-300"
                                  : "bg-rose-100 text-rose-900 border border-rose-300"
                              }`}>
                                {selectedDayDetail.status === "P"
                                  ? "🟢 PRESENT"
                                  : selectedDayDetail.status === "*"
                                  ? `🟨 HOLIDAY (${selectedDayDetail.holidayReason || "Sunday"})`
                                  : selectedDayDetail.status === "—"
                                  ? "🗓️ FUTURE DATE (Not Occurred Yet)"
                                  : "🔴 ABSENT"}
                              </span>
                            </div>

                            {selectedDayDetail.record ? (
                              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between">
                                    <span>Entry Time (In)</span>
                                    {isLateTime(selectedDayDetail.record.entryTime) && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider animate-pulse">LATE</span>
                                    )}
                                  </p>
                                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                                    {selectedDayDetail.record.entryTime ? formatTime(selectedDayDetail.record.entryTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Exit Time (Out)</p>
                                  <p className="text-sm font-bold text-blue-700 mt-0.5">
                                    {selectedDayDetail.record.exitTime ? formatTime(selectedDayDetail.record.exitTime) : "—"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase">Duration / Status</p>
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
                              <p className="text-xs text-gray-500 italic pt-1">
                                {selectedDayDetail.status === "*"
                                  ? `College was closed on this day (${selectedDayDetail.holidayReason || "Sunday"}). No attendance recorded.`
                                  : selectedDayDetail.status === "—"
                                  ? "This date is in the future. Attendance will be recorded when the student scans on this day."
                                  : "No QR scan records registered for this date (Absent)."}
                              </p>
                            )}

                             {/* Hourly Period Attendance */}
                             <div className="space-y-2 pt-2.5 border-t border-gray-200">
                               <h6 className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5 text-blue-700" />
                                 Hourly Period Attendance
                               </h6>
                               {hourlyForSelectedDay.length > 0 ? (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                                   {hourlyForSelectedDay.map((hr: any) => (
                                     <div key={hr.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/60 border border-gray-200">
                                       <div className="space-y-0.5">
                                         <p className="text-xs font-bold text-gray-900">
                                           {hr.qr_schedules?.subject || "Unknown Subject"}
                                         </p>
                                         <p className="text-[10px] text-gray-400 font-medium font-mono">
                                           Period: {hr.qr_schedules?.start_time?.slice(0, 5)} - {hr.qr_schedules?.end_time?.slice(0, 5)}
                                         </p>
                                       </div>
                                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                         hr.marked_present
                                           ? "bg-emerald-950/80 text-emerald-700 border-emerald-900/30"
                                           : "bg-red-950/80 text-red-700 border-red-900/30"
                                       }`}>
                                         {hr.marked_present ? "PRESENT" : "ABSENT"}
                                       </span>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-xs text-gray-400 italic">
                                   No period-wise attendance records for this date.
                                 </p>
                               )}
                             </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic text-center py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            💡 Click on any date box above (P, A, *, or —) to view exact Entry & Exit scan timestamps for that day.
                          </p>
                        )}
                      </div>
                    );
                  })()}
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
            </div>
          </div>
        )}
      </div>
      {/* ════════ SCANNER SETTINGS MODAL ════════ */}
      {showPwdModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowPwdModal(false); }}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Scanner Settings</h2>
                  <p className="text-xs text-gray-500">{pwdStep === "verify" ? "Verify your identity first" : "Enter your new passcode"}</p>
                </div>
              </div>
              <button onClick={() => setShowPwdModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-lg font-light">×</button>
            </div>

            {/* Step 1: Verify */}
            {pwdStep === "verify" && (
              <form onSubmit={handlePwdVerify} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Passcode</label>
                  <input
                    type="password"
                    placeholder="Enter current passcode"
                    value={pwdCurrent}
                    onChange={e => { setPwdCurrent(e.target.value); setPwdError(""); }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-center font-mono text-2xl tracking-[0.4em] text-gray-900 bg-gray-50 transition-colors placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal"
                    autoFocus
                  />
                  {pwdError && <p className="text-red-500 text-xs font-semibold text-center mt-2">{pwdError}</p>}
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20">
                  Verify & Continue →
                </button>
                <p className="text-center text-xs text-gray-400">Forgot? Use master code to access.</p>
              </form>
            )}

            {/* Step 2: Change */}
            {pwdStep === "change" && (
              <form onSubmit={handlePwdChange} className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-blue-700">Identity verified — set your new passcode below</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Passcode</label>
                  <input
                    type="password"
                    placeholder="Min 4 characters"
                    value={pwdNew}
                    onChange={e => { setPwdNew(e.target.value); setPwdError(""); }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-center font-mono text-2xl tracking-[0.4em] text-gray-900 bg-gray-50 transition-colors placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Passcode</label>
                  <input
                    type="password"
                    placeholder="Repeat new passcode"
                    value={pwdConfirm}
                    onChange={e => { setPwdConfirm(e.target.value); setPwdError(""); }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-center font-mono text-2xl tracking-[0.4em] text-gray-900 bg-gray-50 transition-colors placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal"
                  />
                </div>
                {pwdError && <p className="text-red-500 text-xs font-semibold text-center">{pwdError}</p>}
                {pwdSuccess && <p className="text-emerald-600 text-sm font-bold text-center">{pwdSuccess}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPwdStep("verify")} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">← Back</button>
                  <button type="submit" className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20">Save Passcode</button>
                </div>
                <p className="text-center text-xs text-gray-400">Master override always works as a backup.</p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════════ MENTOR DETAILS MODAL ════════ */}
      {selectedMentorForModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMentorForModal(null); }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base font-black uppercase shadow-xs">
                  {selectedMentorForModal.name.split(" ").slice(-1)[0]?.charAt(0) || selectedMentorForModal.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{selectedMentorForModal.name}</h2>
                  <p className="text-xs text-gray-500 font-mono">{selectedMentorForModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMentorForModal(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Role & Section Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selectedMentorForModal.role}
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                  {selectedMentorForModal.yearLabel}
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-gray-100 border border-gray-200 text-gray-800 text-xs font-mono">
                  Section {selectedMentorForModal.section}
                </span>
              </div>

              {/* Allocation details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Students Assigned</span>
                  <span className="text-base font-black text-gray-900 font-mono">{selectedMentorForModal.count} Students</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Department</span>
                  <span className="text-sm font-bold text-gray-800">CSE Data Science</span>
                </div>
              </div>

              {/* Roll Numbers Allocated */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Assigned Roll Range</span>
                <p className="font-mono text-xs font-bold text-gray-800 bg-white p-2 rounded-lg border border-gray-200 break-words leading-relaxed">
                  {selectedMentorForModal.rollRange}
                </p>
              </div>

              {/* Login Key */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Security Passkey</span>
                  <span className="font-mono text-xs font-black text-blue-900 tracking-widest mt-0.5 block">
                    {selectedMentorForModal.key || "Not configured"}
                  </span>
                </div>
                {selectedMentorForModal.key && (
                  <button
                    onClick={() => handleCopyKey(selectedMentorForModal.key, selectedMentorForModal.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedKeyId === String(selectedMentorForModal.id) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKeyId === String(selectedMentorForModal.id) ? "Copied!" : "Copy Key"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedMentorForModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-xs text-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ EDIT MENTOR MODAL ════════ */}
      {editMentorModalOpen && mentorEditData && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditMentorModalOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Edit Faculty Assignment</h2>
                  <p className="text-[11px] text-gray-500">{mentorEditData.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditMentorModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={mentorEditData.name}
                  disabled
                  className="w-full h-8 px-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Official Email</label>
                <input
                  type="text"
                  value={mentorEditData.email}
                  disabled
                  className="w-full h-8 px-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Assigned Section</label>
                <input
                  type="text"
                  value={mentorEditData.section}
                  disabled
                  className="w-full h-8 px-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Login Key / Passkey</label>
                <input
                  type="text"
                  value={editKeyInput}
                  onChange={(e) => setEditKeyInput(e.target.value)}
                  placeholder="Enter login passkey"
                  className="w-full h-9 px-3 rounded-lg bg-gray-50 border-2 border-blue-200 focus:border-blue-500 text-gray-900 font-mono text-xs font-bold outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">This key is used by faculty to log into the Mentor App.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditMentorModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!mentorEditData) return;
                  setIsSavingKey(true);
                  try {
                    await customFetch(`/api/mentors/${mentorEditData.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ passkey: editKeyInput, key: editKeyInput })
                    });
                    queryClient.invalidateQueries({ queryKey: ["mentors"] });
                    setEditMentorModalOpen(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSavingKey(false);
                  }
                }}
                disabled={isSavingKey}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isSavingKey ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ BULK PARENT NOTIFICATION MODAL ════════ */}
      {bulkMessageModalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setBulkMessageModalOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Broadcast Notice to Parents</h2>
                  <p className="text-xs text-gray-500">Official HOD Punctuality & Absence Notification</p>
                </div>
              </div>
              <button
                onClick={() => setBulkMessageModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Target Audience Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Target Recipient Group
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkMessageType("late")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      bulkMessageType === "late"
                        ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block text-sm font-black text-amber-900">{problemStats.lateCount}</span>
                    <span className="text-[10px] text-amber-800">All Late Comers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkMessageType("unscanned")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      bulkMessageType === "unscanned"
                        ? "bg-red-50 border-red-400 text-red-950 ring-2 ring-red-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block text-sm font-black text-red-900">{problemStats.unscannedCount}</span>
                    <span className="text-[10px] text-red-800">All Unscanned</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkMessageType("custom")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      bulkMessageType === "custom"
                        ? "bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block text-sm font-black text-blue-900">{selectedStudentIds.length}</span>
                    <span className="text-[10px] text-blue-800">Selected Only</span>
                  </button>
                </div>
              </div>

              {/* Delivery Channel */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Notification Channel
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkBroadcastChannel("whatsapp")}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      bulkBroadcastChannel === "whatsapp"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-300"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Official</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkBroadcastChannel("sms")}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      bulkBroadcastChannel === "sms"
                        ? "bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-300"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>SMS Gateway</span>
                  </button>
                </div>
              </div>

              {/* Message Template Preview */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Message Content Preview
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-sans text-xs text-gray-800 leading-relaxed space-y-1">
                  {bulkMessageType === "late" ? (
                    <>
                      <p className="font-bold text-gray-900">🔔 Late Arrival Advisory:</p>
                      <p>
                        "Dear Parent, your ward was marked <strong>LATE</strong> today ({logDate}) at Sphoorthy Engineering College. College timing commences at <strong>09:00 AM</strong>. Repeated late entries affect academic attendance records. Please advise punctuality. — <em>HOD, CSE Data Science</em>"
                      </p>
                    </>
                  ) : bulkMessageType === "unscanned" ? (
                    <>
                      <p className="font-bold text-gray-900">⚠️ Absence & Safety Alert:</p>
                      <p>
                        "Dear Parent, your ward has <strong>NOT SCANNED</strong> into the college campus today ({logDate}). If they have not arrived, please confirm their status with the faculty mentor or department office. — <em>HOD, CSE Data Science</em>"
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900">📢 Department Circular:</p>
                      <p>
                        "Dear Parent, this is an official attendance notice regarding your ward's attendance status today ({logDate}) at Sphoorthy Engineering College CSE-DS Dept. — <em>HOD</em>"
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Broadcast Alert */}
              {bulkBroadcastSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold">
                    Broadcast queued successfully! {bulkMessageType === "late" ? problemStats.lateCount : bulkMessageType === "unscanned" ? problemStats.unscannedCount : selectedStudentIds.length} parent alerts sent via {bulkBroadcastChannel.toUpperCase()}.
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkMessageModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkBroadcastSending(true);
                  setTimeout(() => {
                    setBulkBroadcastSending(false);
                    setBulkBroadcastSuccess(true);
                    setTimeout(() => {
                      setBulkBroadcastSuccess(false);
                      setBulkMessageModalOpen(false);
                      setSelectedStudentIds([]);
                    }, 1800);
                  }, 800);
                }}
                disabled={bulkBroadcastSending || (bulkMessageType === "custom" && selectedStudentIds.length === 0)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {bulkBroadcastSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Broadcast Notice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ ADD / EDIT STUDENT REMARK & EXCUSE MODAL ════════ */}
      {remarkModalData && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRemarkModalData(null); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Document Reason & Excuse</h2>
                  <p className="text-[11px] text-gray-500">{remarkModalData.student.name} ({remarkModalData.student.uniqueId})</p>
                </div>
              </div>
              <button
                onClick={() => setRemarkModalData(null)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3.5 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Valid Reason Preset
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "College Bus Delayed",
                    "Medical / Sick Leave",
                    "OD / Sports / Placement",
                    "Permission from Mentor",
                    "Traffic / Commute Issue",
                    "Parent Informed & Verified",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRemarkPreset(preset);
                        if (!remarkInput || remarkInput === remarkPreset) setRemarkInput(preset);
                      }}
                      className={`p-2 rounded-lg border text-left font-bold text-[11px] transition-all cursor-pointer ${
                        remarkPreset === preset
                          ? "bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-200"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Remark Input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Custom Remark / Description
                </label>
                <input
                  type="text"
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="e.g. Route 12 college bus punctured at LB Nagar"
                  className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-blue-500 text-gray-900 font-medium text-xs outline-none"
                />
              </div>

              {/* Excused Toggle */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Mark as Valid / Excused</span>
                  <span className="text-[10px] text-emerald-700">Will mark this late entry or absence as approved by HOD.</span>
                </div>
                <input
                  type="checkbox"
                  checked={remarkIsExcused}
                  onChange={(e) => setRemarkIsExcused(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              {remarksMap[`${remarkModalData.student.id}_${logDate}`] ? (
                <button
                  type="button"
                  onClick={() => {
                    const key = `${remarkModalData.student.id}_${logDate}`;
                    const updated = { ...remarksMap };
                    delete updated[key];
                    setRemarksMap(updated);
                    localStorage.setItem("hod_student_remarks_v1", JSON.stringify(updated));
                    setRemarkModalData(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Delete Remark
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRemarkModalData(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = `${remarkModalData.student.id}_${logDate}`;
                    const updated = {
                      ...remarksMap,
                      [key]: {
                        preset: remarkPreset,
                        text: remarkInput.trim() || remarkPreset,
                        isExcused: remarkIsExcused,
                        updatedAt: new Date().toISOString(),
                      }
                    };
                    setRemarksMap(updated);
                    localStorage.setItem("hod_student_remarks_v1", JSON.stringify(updated));
                    setRemarkModalData(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
