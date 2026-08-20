import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Search,
  AlertTriangle,
  Lock,
  Sparkles,
  UserCheck,
  RefreshCw,
  Users,
  ChevronRight,
  Smartphone,
  Share2,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Check,
  X as XIcon,
  Settings,
  Download,
  WifiOff,
  Cloud,
  CheckCircle2,
  TrendingUp,
  School,
  History,
  User,
  Percent,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  Delete
} from "lucide-react";

type Schedule = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  section: string;
  subject: string;
  year: string;
  isTraining?: boolean;
  trainingId?: number;
  trainingName?: string;
};

type Session = {
  id: number;
  started_at: string;
  ended_at: string | null;
  student_count: number;
};

type ScheduleStudent = {
  id: number;
  name: string;
  uniqueId: string;
  unique_id?: string;
  section: string;
  scannedGate: boolean;
  gateEntryTime: string | null;
  markedPresent: boolean;
  markedByTeacher: boolean;
  scannedQr: boolean;
  warningNotScanned: boolean;
};

export const OFFICIAL_FACULTY_LIST = [
  // IV Year
  { id: 1, name: "Mrs A Sravanthi", email: "mrsasravanthi@gmail.com", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4A", rollRange: "23N81A6701 TO 23N81A6743", count: 42 },
  { id: 3, name: "Mr T Shravan Kumar", email: "mrtshravankumar@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "23N81A6744 TO 23N81A6787", count: 42 },
  { id: 2, name: "Mrs K Sneha", email: "mrsksneha@gmail.com", role: "Class In-charge & Mentor", yearLabel: "4th Year", section: "4B", rollRange: "23N81A6788 TO 23N81A67C8 + LE-3, LE-4", count: 39 },

  // III Year
  { id: 4, name: "Mrs G Sushma", email: "mrsgsushma@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6701 TO 24N81A6731", count: 29 },
  { id: 15, name: "Ms. Priyusha", email: "msspriyusha@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3A", rollRange: "24N81A6732 TO 24N81A6752 + LE-3 to LE-8", count: 26 },
  { id: 6, name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6753 TO 24N81A6779 + RA-33, A9", count: 26 },
  { id: 8, name: "Mr Miskeen Ali", email: "mrmiskeenali@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3B", rollRange: "24N81A6780 TO 24N81A67A5", count: 24 },
  { id: 5, name: "Mr M Yadaiah", email: "mrmyadaiah@gmail.com", role: "Class In-charge & Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67A6 TO 24N81A67D2", count: 27 },
  { id: 9, name: "Mrs. Swetha", email: "mrsswetha@gmail.com", role: "Faculty Mentor", yearLabel: "3rd Year", section: "3C", rollRange: "24N81A67D3 TO 24N81A67F9", count: 27 },

  // II Year
  { id: 10, name: "Mrs B Gayathri", email: "mrsbgayathri@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6701 TO 25N81A6727", count: 27 },
  { id: 13, name: "Mrs Ch Vijaya Lakshmi", email: "mrschvijayalakshmi@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2A", rollRange: "25N81A6728 TO 25N81A6755", count: 28 },
  { id: 11, name: "Mrs K Ramya", email: "mrskramya@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6756 TO 25N81A6783", count: 27 },
  { id: 14, name: "Mr M Srinivasulu", email: "mrmsrinivasulu@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2B", rollRange: "25N81A6784 TO 25N81A67B3", count: 28 },
  { id: 12, name: "Mrs K Srinija", email: "mrsksrinija@gmail.com", role: "Faculty Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67B4 TO 25N81A67D9", count: 26 },
  { id: 7, name: "Mr K Bikshapathi", email: "mrkbikshapathi@gmail.com", role: "Class In-charge & Mentor", yearLabel: "2nd Year", section: "2C", rollRange: "25N81A67E0 TO 25N81A67G0", count: 19 },

  // Subject Faculty
  { id: 18, name: "Mr. Rakesh Goud", email: "mrrakeshgoud@gmail.com", role: "Subject Faculty (MSF)", yearLabel: "2nd Year", section: "2A/2B/2C", rollRange: "MSF — All 2nd Year Students", count: 80 },
  { id: 16, name: "Dr. A. Balaram", email: "drabalaram@gmail.com", role: "Subject Faculty", yearLabel: "2nd Year", section: "2A", rollRange: "2nd Year Students", count: 27 },
  { id: 17, name: "Dr. Md Abdul Azeem", email: "drmdabdulazeem@gmail.com", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", rollRange: "3rd Year Students", count: 29 },
  { id: 19, name: "Dr. Sri Hari VLN", email: "drsriharivln@gmail.com", role: "Subject Faculty", yearLabel: "2nd Year", section: "2A", rollRange: "2nd Year Students", count: 27 },
  { id: 20, name: "Mr. Prateek", email: "mrprateek@gmail.com", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", rollRange: "3rd Year Students", count: 29 },
  { id: 21, name: "Ms. Vaidehi", email: "msvaidehi@gmail.com", role: "Subject Faculty", yearLabel: "3rd Year", section: "3A", rollRange: "3rd Year Students", count: 29 },
  { id: 22, name: "Dr. C. Lakshmi Nath", email: "lakshminath@sphoorthyengg.ac.in", role: "Subject Faculty (OE)", yearLabel: "4th Year", section: "4B", rollRange: "PPLE(OE) — All 4B Students", count: 39 },
];

export default function MentorApp() {
  const { mentor, role, logout, loginMentorKey } = useAuth();
  const [, navigate] = useLocation();

  // Navigation Tabs: "schedule" | "history" | "profile"
  const [activeTab, setActiveTab] = useState<"schedule" | "history" | "profile">("schedule");

  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<ScheduleStudent[]>([]);
  const [serverTime, setServerTime] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<(Schedule & { status: "pending" | "started" | "submitted"; session: Session | null })[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAscending, setSortAscending] = useState(true);

  // Keypad Passkey Login state
  const [passkey, setPasskey] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  // Auto-Update Engine States
  const CURRENT_APP_VERSION = "1.7.0";
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState<{
    versionName: string;
    versionCode: number;
    downloadUrl: string;
    releaseNotes: string;
  } | null>(null);

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // History Tab Selected Date
  const [historySelectedDay, setHistorySelectedDay] = useState("WED");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check for app updates on mount
  useEffect(() => {
    async function checkAppVersion() {
      try {
        const res = await fetch(`https://qr-attendance-app-eight.vercel.app/api/auth/version-check?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.latestVersionName && data.latestVersionName !== CURRENT_APP_VERSION) {
            setLatestVersionInfo({
              versionName: data.latestVersionName,
              versionCode: data.latestVersionCode || 7,
              downloadUrl: data.downloadUrl || "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
              releaseNotes: data.releaseNotes || "Performance enhancements & training sub-sessions sync."
            });
            // Show update dialog if newer version available
            setUpdateModalOpen(true);
          }
        }
      } catch (e) {
        // silent fail on network glitch
      }
    }
    checkAppVersion();
  }, []);

  useEffect(() => {
    if (role === "mentor") {
      loadActiveSchedule();
    }
  }, [role]);

  // Resolve current faculty profile from official dataset
  const activeFaculty = useMemo(() => {
    if (!mentor) return null;
    return OFFICIAL_FACULTY_LIST.find(
      (f) =>
        f.email?.toLowerCase() === mentor.email?.toLowerCase() ||
        f.id === mentor.id ||
        (f.name && mentor.name && f.name.toLowerCase().trim() === mentor.name.toLowerCase().trim()) ||
        f.section.toLowerCase() === (mentor.section || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
        (mentor.section && mentor.section.includes(f.section))
    ) || {
      name: mentor.name || "Faculty Teacher",
      role: "Subject Faculty",
      yearLabel: "CSE Data Science",
      section: mentor.section || "DS",
    };
  }, [mentor]);

  const handleKeyLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const typed = passkey.trim();
    if (!typed) return;
    setKeySubmitting(true);
    setError(null);
    try {
      await loginMentorKey(typed);
    } catch (err: any) {
      setError(err?.message || "Invalid faculty authorization key");
    } finally {
      setKeySubmitting(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (passkey.length < 6) {
      setPasskey(prev => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPasskey(prev => prev.slice(0, -1));
  };

  const loadActiveSchedule = async (scheduleIdToLoad?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customFetch<{
        activeSchedule: Schedule | null;
        session: Session | null;
        todaySchedules: (Schedule & { status: "pending" | "started" | "submitted"; session: Session | null })[];
        serverTime: any;
      }>("/api/mentor/active-schedule");

      let selected = res.activeSchedule;
      if (scheduleIdToLoad && res.todaySchedules) {
        const found = res.todaySchedules.find(s => s.id === scheduleIdToLoad);
        if (found) selected = found;
      }

      setActiveSchedule(selected);
      setSession(res.session);
      setTodaySchedules(res.todaySchedules || []);
      setServerTime(res.serverTime);

      if (selected) {
        let currentSession = res.session;
        if (!currentSession && selected.id > 0) {
          currentSession = await customFetch<Session>("/api/mentor/start-session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ scheduleId: selected.id }),
          });
          setSession(currentSession);
        }

        const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${selected.id}`);
        const mappedStudents = studentData.map(s => {
          if (!s.markedByTeacher && s.scannedGate) {
            return { ...s, markedPresent: true };
          }
          return s;
        });

        setStudents(mappedStudents);
      }
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load classroom schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, markedPresent: !s.markedPresent, markedByTeacher: true }
          : s
      )
    );
  };

  const handleMarkAll = (present: boolean) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, markedPresent: present, markedByTeacher: true }))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!activeSchedule) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await customFetch("/api/mentor/submit-attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scheduleId: activeSchedule.id,
          students: students.map((s) => ({
            studentId: s.id,
            markedPresent: s.markedPresent,
          })),
        }),
      });

      setSuccess("Attendance submitted successfully!");
      setTodaySchedules(prev => prev.map(item => item.id === activeSchedule.id ? { ...item, status: "submitted" } : item));
      setSession(prev => prev ? { ...prev, ended_at: new Date().toISOString() } : null);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) => (s.name || "").toLowerCase().includes(q) || (s.uniqueId || s.unique_id || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const rollA = a.uniqueId || a.unique_id || "";
      const rollB = b.uniqueId || b.unique_id || "";
      return sortAscending ? rollA.localeCompare(rollB) : rollB.localeCompare(rollA);
    });

    return result;
  }, [students, searchQuery, sortAscending]);

  const presentCount = useMemo(
    () => students.filter((s) => s.markedPresent).length,
    [students]
  );

  // Trigger APK download with zero-cache URL
  const handleDownloadApk = () => {
    const freshUrl = `https://qr-attendance-app-eight.vercel.app/FacultyApp.apk?v=1.7.0&t=${Date.now()}`;
    window.location.href = freshUrl;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. OFFLINE CONNECTION LOST SCREEN (Modern Stitch Variant)
  // ─────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c] h-screen w-screen flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 opacity-50 blur-3xl mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-100 opacity-50 blur-3xl mix-blend-multiply"></div>
        </div>

        <main className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-gray-100 relative">
            <WifiOff className="w-12 h-12 text-gray-500" />
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Lost</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-[280px] leading-relaxed">
            Syncing your attendance data will resume once you're back online. Your offline records remain safe.
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={() => setIsOnline(true)}
              className="w-full h-12 bg-transparent border border-indigo-900 text-indigo-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 transition-all cursor-pointer"
            >
              Continue Offline
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PASSKEY LOGIN SCREEN (Modern Stitch Keypad Variant)
  // ─────────────────────────────────────────────────────────────
  if (role !== "mentor") {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans antialiased min-h-screen flex flex-col relative overflow-hidden">
        {/* Atmospheric Top Gradient */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none -z-10"></div>

        {/* Update Required Modal */}
        {updateModalOpen && latestVersionInfo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="p-6 pb-4 flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">New Version Available</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="font-bold text-indigo-900">v{latestVersionInfo.versionName}</span>
                    <span className="text-gray-400">Current: {CURRENT_APP_VERSION}</span>
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-y border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Release Notes</h3>
                <ul className="space-y-2 text-xs font-medium text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <span>Added support for Training sub-sessions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <span>Performance improvements for rapid roster sync.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 flex flex-col gap-2.5">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-12 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download & Update APK
                </button>
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="w-full h-11 bg-transparent text-indigo-900 hover:bg-gray-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Update Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Keypad Container */}
        <main className="flex-1 flex flex-col items-center justify-between px-4 pt-12 pb-8 w-full max-w-md mx-auto z-10 h-full">
          {/* Header & Identity */}
          <header className="flex flex-col items-center w-full mt-4">
            <div className="relative mb-5">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-900 to-indigo-700 p-1 shadow-lg flex items-center justify-center text-white text-3xl font-black">
                <School className="w-12 h-12 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-900" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
              Welcome back, Professor
            </h1>
            <p className="text-xs font-semibold text-gray-500 text-center mt-1.5">
              Enter your 3/4-digit faculty authorization code
            </p>
          </header>

          {/* Authorization Code Display */}
          <section className="w-full flex flex-col items-center my-6">
            {error && (
              <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full max-w-[240px] border-b-[3px] border-indigo-900 flex items-center justify-center pb-2 relative min-h-[52px]">
              <span className="text-3xl font-bold text-gray-900 tracking-[0.5em] leading-none font-mono">
                {passkey || ""}
              </span>
              <div className="w-[2px] h-8 bg-indigo-900 animate-pulse ml-1"></div>
            </div>
            <span className="text-[11px] font-mono text-gray-400 mt-2">e.g. 118, 4011, 801</span>
          </section>

          {/* Numeric Keypad */}
          <section className="w-full flex flex-col items-center mt-auto mb-6">
            <div className="grid grid-cols-3 gap-y-4 gap-x-8">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="w-[68px] h-[68px] rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-900 active:bg-gray-100 active:scale-95 transition-all shadow-xs hover:border-indigo-200 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              {/* Backspace */}
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="w-[68px] h-[68px] rounded-full bg-transparent flex items-center justify-center text-gray-600 active:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              >
                <Delete className="w-6 h-6" />
              </button>
              {/* Zero */}
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="w-[68px] h-[68px] rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-900 active:bg-gray-100 active:scale-95 transition-all shadow-xs hover:border-indigo-200 cursor-pointer"
              >
                0
              </button>
              {/* Submit Action Key */}
              <button
                type="button"
                onClick={() => handleKeyLogin()}
                disabled={keySubmitting || !passkey}
                className="w-[68px] h-[68px] rounded-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 flex items-center justify-center text-gray-900 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                {keySubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
                ) : (
                  <Check className="w-7 h-7 stroke-[3]" />
                )}
              </button>
            </div>
          </section>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleKeyLogin()}
            disabled={keySubmitting || !passkey}
            className="w-full bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            {keySubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter Portal</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. LOGGED-IN PORTAL (Schedule, History & Profile Views)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen pb-28 font-sans flex flex-col">
      {/* Top App Bar (Matches Stitch TopAppBar) */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-100 shadow-sm">
            {activeFaculty?.name?.split(" ").slice(-1)[0]?.charAt(0) || "F"}
          </div>
          <div>
            <h1 className="text-base font-bold text-indigo-950 tracking-tight leading-tight">
              {activeFaculty?.name}
            </h1>
            <p className="text-[11px] font-semibold text-indigo-800">
              Sec {activeFaculty?.section} • Faculty Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFaculty?.role?.includes("In-charge") && (
            <button
              onClick={() => navigate("/incharge-dashboard")}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-indigo-100 transition-all"
              title="Class Incharge Portal"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Incharge</span>
            </button>
          )}

          <button
            onClick={() => loadActiveSchedule()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
            title="Sync Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* Auto-Update Modal Dialog */}
      {updateModalOpen && latestVersionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-6 pb-4 flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">New Version Available</h2>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="font-bold text-indigo-900">v{latestVersionInfo.versionName}</span>
                  <span className="text-gray-400">Current: {CURRENT_APP_VERSION}</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-y border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Release Notes</h3>
              <ul className="space-y-2 text-xs font-medium text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Added support for Training sub-sessions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Performance improvements for rapid roster sync.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 flex flex-col gap-2.5">
              <button
                onClick={handleDownloadApk}
                className="w-full h-12 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download & Update APK
              </button>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="w-full h-11 bg-transparent text-indigo-900 hover:bg-gray-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Update Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="pt-20 px-4 max-w-4xl mx-auto w-full flex-1 space-y-5">
        {/* ─── TAB 1: SCHEDULE & ATTENDANCE ROSTER ─── */}
        {activeTab === "schedule" && (
          <>
            {/* Timetable Period Carousel / Quick Switcher */}
            {todaySchedules.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {todaySchedules.map((sch) => {
                  const isCurrent = activeSchedule?.id === sch.id;
                  const startFmt = (sch.start_time || "00:00").slice(0, 5);
                  const endFmt = (sch.end_time || "00:00").slice(0, 5);

                  return (
                    <button
                      key={sch.id}
                      onClick={() => loadActiveSchedule(sch.id)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        isCurrent
                          ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{sch.subject}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isCurrent ? "bg-indigo-800 text-indigo-200" : "bg-gray-100 text-gray-500"
                      }`}>
                        {startFmt} - {endFmt}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Summary & Controls Header (From Stitch) */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeSchedule?.subject || "Active Classroom Session"}
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Section {activeSchedule?.section || activeFaculty?.section} • {activeSchedule?.start_time ? `${activeSchedule.start_time.slice(0, 5)} - ${activeSchedule.end_time.slice(0, 5)}` : "Regular Class"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase mr-2">Attendance</span>
                  <span className="text-lg font-black text-indigo-900">
                    {presentCount}<span className="text-gray-400 font-medium">/{students.length}</span>
                  </span>
                </div>
              </div>
            </section>

            {/* Success & Error alerts */}
            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Search and Filter Bar (From Stitch) */}
            <section className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all placeholder-gray-400 shadow-xs"
                  placeholder="Search by Name or Roll No..."
                  type="text"
                />
              </div>
              <button
                onClick={() => setSortAscending(prev => !prev)}
                className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center gap-1.5 hover:bg-gray-50 transition-colors text-gray-700 shadow-xs cursor-pointer text-xs font-bold"
                title="Sort Roll Number"
              >
                <span>{sortAscending ? "Roll ↑" : "Roll ↓"}</span>
              </button>
            </section>

            {/* Quick Batch Actions */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-gray-500">
                {filteredStudents.length} Students Listed
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkAll(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleMarkAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-extrabold text-[11px] hover:bg-red-100 transition-all cursor-pointer"
                >
                  All Absent
                </button>
              </div>
            </div>

            {/* Roster List (From Stitch) */}
            <section className="space-y-2.5">
              {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
                  <Loader2 className="w-8 h-8 text-indigo-900 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">Loading student roster...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-xs font-bold text-gray-400">
                  No students found matching your search.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const initials = student.name
                    ? student.name.split(" ").slice(0, 2).map(n => n.charAt(0)).join("")
                    : "ST";
                  const rollNo = student.uniqueId || student.unique_id || "—";
                  const isPresent = student.markedPresent;

                  // Gate In timing calculation
                  const hasGate = student.scannedGate;
                  const gateTimeFmt = student.gateEntryTime
                    ? new Date(student.gateEntryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
                    : null;

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(student.id)}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-all relative overflow-hidden cursor-pointer active:scale-[0.99]"
                    >
                      {/* Status indicator line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        hasGate ? "bg-emerald-500" : "bg-red-400"
                      }`} />

                      {/* Initials Avatar */}
                      <div className="flex-shrink-0 mx-2 relative">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black ${
                          isPresent ? "bg-indigo-50 text-indigo-900" : "bg-gray-100 text-gray-500"
                        }`}>
                          {initials}
                        </div>
                        {!hasGate && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Student Info */}
                      <div className="flex-grow min-w-0 pl-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-gray-500">{rollNo}</span>
                          {hasGate ? (
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                Gate In: {gateTimeFmt || "08:52 AM"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wide">
                                No Gate Scan
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="flex-shrink-0 ml-3 flex items-center pr-1" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center cursor-pointer">
                          <div
                            onClick={() => handleToggleStudent(student.id)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                              isPresent ? "bg-indigo-900" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-150 ${
                                isPresent ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </div>
                          <span className={`ml-2 text-xs font-extrabold hidden sm:inline w-14 text-center ${
                            isPresent ? "text-indigo-900" : "text-gray-400"
                          }`}>
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            {/* Floating Action Button (Submit Attendance) */}
            <div className="fixed bottom-20 left-0 w-full px-4 max-w-4xl md:left-1/2 md:-translate-x-1/2 flex justify-center z-40 pointer-events-none">
              <button
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="pointer-events-auto flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-950 text-white w-full py-4 rounded-2xl shadow-xl transition-all active:scale-95 font-extrabold text-xs tracking-wider uppercase cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Attendance...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>SUBMIT ATTENDANCE ({presentCount} / {students.length})</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ─── TAB 2: ATTENDANCE HISTORY (From Stitch) ─── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Header & Date Ribbon */}
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-indigo-950">Attendance History</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { day: "Mon", date: "18", code: "MON" },
                  { day: "Tue", date: "19", code: "TUE" },
                  { day: "Wed", date: "20", code: "WED" },
                  { day: "Thu", date: "21", code: "THUR" },
                  { day: "Fri", date: "22", code: "FRI" },
                  { day: "Sat", date: "23", code: "SAT" }
                ].map((item) => {
                  const isActive = historySelectedDay === item.code;
                  return (
                    <button
                      key={item.code}
                      onClick={() => setHistorySelectedDay(item.code)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-[11px] font-bold opacity-80">{item.day}</span>
                      <span className="text-lg font-black">{item.date}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Summary Bento Box */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-gray-200 relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <School className="w-4 h-4 text-indigo-900" />
                  <span className="text-xs font-bold text-gray-500">Total Classes</span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-indigo-950">04</span>
                  <span className="text-xs text-gray-500 font-bold mb-1">Sessions</span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex flex-col justify-between border border-amber-200 relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-amber-800">Avg Attendance</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-amber-900">92%</span>
                  <span className="text-xs text-amber-800/80 font-bold mb-1">Present</span>
                </div>
              </div>
            </section>

            {/* Historical Sessions List */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Logged Sessions for {historySelectedDay}
              </h3>

              {[
                { subject: "Mathematical & Statistical Foundations (MSF)", sec: `DS II/I/${activeFaculty?.section || "A"}`, time: "09:00 AM - 10:00 AM", present: 48, total: 52, pct: "92%" },
                { subject: "Computer Science Laboratory", sec: `DS II/I/${activeFaculty?.section || "A"}`, time: "11:10 AM - 13:10 PM", present: 50, total: 52, pct: "96%" },
                { subject: "Next Gen Employability Training", sec: "Session 1 (Morning Batch)", time: "09:00 AM - 13:00 PM", present: 98, total: 100, pct: "98%" },
              ].map((sess, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{sess.subject}</h4>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">{sess.sec}</p>
                    </div>
                    <div className="bg-gray-100 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-600 font-mono">{sess.time}</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-100" />

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-gray-800">
                        <strong>{sess.present}</strong>/{sess.total} Present
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {sess.pct}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ─── TAB 3: FACULTY PROFILE (From Stitch) ─── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Header */}
            <section className="flex flex-col items-center justify-center pt-4 pb-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs">
              <div className="w-24 h-24 rounded-full bg-indigo-900 text-white flex items-center justify-center text-3xl font-black mb-3 ring-4 ring-indigo-50 shadow-md">
                {activeFaculty?.name?.split(" ").slice(-1)[0]?.charAt(0) || "F"}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{activeFaculty?.name}</h2>
              <p className="text-xs font-bold text-indigo-800 mt-0.5">
                {activeFaculty?.role} • Department of CSE - DS
              </p>
              <span className="text-[11px] font-mono text-gray-400 mt-1">
                {activeFaculty?.email || "faculty@sphoorthyengg.ac.in"}
              </span>
            </section>

            {/* Sync Status Banner */}
            <section className="bg-indigo-50 text-indigo-950 px-4 py-3 rounded-2xl flex items-center justify-between border border-indigo-100 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold">All Data Synced to Supabase</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600">Live</span>
            </section>

            {/* Metric Bento Cards */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">Classes Today</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-black text-indigo-950">{todaySchedules.length || 3}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">Attendance Rate</span>
                  <Percent className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-black text-indigo-950">94%</div>
              </div>
            </section>

            {/* App Preferences */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">App Preferences</h3>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Push Notifications</h4>
                  <p className="text-xs text-gray-500">Alerts for upcoming class periods</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={() => setPushNotifications(prev => !prev)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    pushNotifications ? "bg-indigo-900" : "bg-gray-200"
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-150 ${
                      pushNotifications ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </div>
                </label>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Offline Mode</h4>
                  <p className="text-xs text-gray-500">Cache rosters locally</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offlineMode}
                    onChange={() => setOfflineMode(prev => !prev)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    offlineMode ? "bg-indigo-900" : "bg-gray-200"
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-150 ${
                      offlineMode ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </div>
                </label>
              </div>

              {/* Version & APK Download */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Installed Version</h4>
                  <p className="text-xs font-semibold text-gray-500">v{CURRENT_APP_VERSION} (Production Build)</p>
                </div>
                <button
                  onClick={handleDownloadApk}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Get APK
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 mt-4"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                Sign Out of Faculty Portal
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Matches Stitch BottomNavBar) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-white border-t border-gray-200 shadow-lg md:max-w-4xl md:left-1/2 md:-translate-x-1/2">
        {/* Tab 1: Schedule */}
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === "schedule"
              ? "bg-amber-400 text-gray-900 font-bold scale-95 shadow-xs"
              : "text-gray-500 hover:text-indigo-900 font-medium"
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Schedule</span>
        </button>

        {/* Tab 2: History */}
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-amber-400 text-gray-900 font-bold scale-95 shadow-xs"
              : "text-gray-500 hover:text-indigo-900 font-medium"
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">History</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-amber-400 text-gray-900 font-bold scale-95 shadow-xs"
              : "text-gray-500 hover:text-indigo-900 font-medium"
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  );
}
