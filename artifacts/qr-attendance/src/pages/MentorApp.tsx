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
  Delete,
  SlidersHorizontal,
  Save,
  Bell,
  HardDrive
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
  // 1. OFFLINE CONNECTION LOST SCREEN (Exact Match to Stitch)
  // ─────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c] h-screen w-screen flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
        <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-200 p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-2xl bg-gray-100 relative">
            <WifiOff className="w-12 h-12 text-gray-500" />
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500"></div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Lost</h1>
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 text-white rounded-lg text-xs font-semibold">
            <Save className="w-3.5 h-3.5" />
            <span>3 unsynced records</span>
          </div>

          <p className="text-xs text-gray-500 mb-8 max-w-[260px] leading-relaxed">
            Syncing your attendance data will resume once you're back online. Your changes are saved locally.
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-[#000666] hover:bg-blue-950 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={() => setIsOnline(true)}
              className="w-full h-12 bg-transparent border border-[#000666] text-[#000666] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PASSKEY LOGIN SCREEN (Exact Match to Stitch Login)
  // ─────────────────────────────────────────────────────────────
  if (role !== "mentor") {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans antialiased min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Main Keypad Container */}
        <main className="w-full max-w-sm flex flex-col items-center z-10">
          {/* Header Avatar & Identity */}
          <div className="relative mb-5">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVc6EUxBsB_2npXnzhP5je8Sb21sFeUdyqS5gkM5rUBCcN_YM1Varbeu7828Gy9uBt_70VRgH8u5TiJMp0aqAHjYrxFpXwDo5zhbF3jepe4y9dMU3N01-iDSBxUiW05UYh4h1G6SIk74BP5nK-C7kDJsoDXMSTqCwZXJwDzx_mB7OT6j0HL2VItHbir3JYTxgNPGmwd9d6M7CXGMOn18QfDVeKAjibaKNKyj_cflWDY9rnD-XXm5D-"
              alt="Professor Avatar"
              className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-gray-200"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#000666]" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center tracking-tight">
            Welcome back, Professor
          </h1>
          <p className="text-xs text-gray-500 text-center mt-1">
            Enter your authorization code
          </p>

          {/* Authorization Code Display */}
          <div className="w-full flex flex-col items-center my-8">
            {error && (
              <div className="mb-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full max-w-[220px] border-b-[3px] border-[#000666] flex items-center justify-center pb-2 relative min-h-[44px]">
              <span className="text-2xl font-bold text-gray-900 tracking-[0.4em] leading-none font-mono">
                {passkey.split("").join(" ")}
              </span>
              <div className="w-[2px] h-6 bg-[#000666] animate-pulse ml-1"></div>
            </div>
          </div>

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-6 mb-8">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-900 active:bg-gray-100 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                {num}
              </button>
            ))}
            {/* Backspace */}
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center text-gray-600 active:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
            {/* Zero */}
            <button
              type="button"
              onClick={() => handleKeypadPress("0")}
              className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-900 active:bg-gray-100 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              0
            </button>
            {/* Submit Action Key (Yellow Check) */}
            <button
              type="button"
              onClick={() => handleKeyLogin()}
              disabled={keySubmitting || !passkey}
              className="w-16 h-16 rounded-full bg-[#fdd400] hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center text-gray-900 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {keySubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
              ) : (
                <Check className="w-6 h-6 stroke-[3]" />
              )}
            </button>
          </div>

          {/* Primary Action Button (Navy Pill) */}
          <button
            type="button"
            onClick={() => handleKeyLogin()}
            disabled={keySubmitting || !passkey}
            className="w-full bg-[#000666] hover:bg-blue-950 disabled:opacity-50 text-white py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            {keySubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>ENTER PORTAL</span>
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
    <div className="bg-[#f9f9f9] text-[#1a1c1c] antialiased min-h-screen pb-24 font-sans flex flex-col">
      {/* Top App Bar (Exact Match to Stitch) */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFxsC-2I5znpQDv1AtSc9ZcxedtH-FYVHtBcMwZ0uVve32d5Ah9aTbWOx8GbpUqBNqSkvjD4pi8rIYalgSqi-mMNCZJDMnTjcYpcc4gUd8muso3N0eAqTWZI4olzV1TZNw7lsMzpOtnu49PDUe-4zvvV6Z56_plUFMZBA2YIcycS2fg1IkQLi_R8xNZLf2ZoKbaLcYkLsdmIK3172778piqeXWGjDvrhmMoVLOopjxXrHoyu4uEU2f"
            alt="Faculty"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
          <h1 className="text-base font-bold text-[#000666] tracking-tight">
            Faculty Portal
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {activeFaculty?.role?.includes("In-charge") && (
            <button
              onClick={() => navigate("/incharge-dashboard")}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer mr-1"
            >
              <Users className="w-3 h-3" />
              Incharge
            </button>
          )}

          <button
            onClick={() => loadActiveSchedule()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
            title="Sync"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#000666]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Auto-Update Modal Dialog (Exact Match to Stitch) */}
      {updateModalOpen && latestVersionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[380px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-6 pb-4 flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-[#000666] text-white rounded-xl flex items-center justify-center shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">New Version Available</h2>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="font-bold text-[#000666]">v{latestVersionInfo.versionName}</span>
                  <span className="text-gray-400">Current: {CURRENT_APP_VERSION}</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-y border-gray-100 bg-[#f9f9f9]">
              <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">RELEASE NOTES</h3>
              <ul className="space-y-2 text-xs font-medium text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#000666] shrink-0 mt-0.5" />
                  <span>Added support for Training sub-sessions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#000666] shrink-0 mt-0.5" />
                  <span>Performance improvements for rapid roster sync.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 flex flex-col gap-2">
              <button
                onClick={handleDownloadApk}
                className="w-full h-11 bg-[#000666] hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD & UPDATE APK
              </button>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="w-full h-10 bg-transparent text-[#000666] hover:bg-gray-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                UPDATE LATER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="pt-20 px-4 max-w-lg mx-auto w-full flex-1 space-y-4">
        {/* ─── TAB 1: SCHEDULE & ATTENDANCE ROSTER (Exact Stitch) ─── */}
        {activeTab === "schedule" && (
          <>
            {/* Period Quick Switcher */}
            {todaySchedules.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {todaySchedules.map((sch) => {
                  const isCurrent = activeSchedule?.id === sch.id;
                  return (
                    <button
                      key={sch.id}
                      onClick={() => loadActiveSchedule(sch.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#000666] text-white border-[#000666]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sch.subject} ({sch.start_time.slice(0, 5)})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Subject Title & Summary */}
            <section className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {activeSchedule?.subject || "Computer Science 101"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Section {activeSchedule?.section || "A"} • Mon, 9:00 AM
              </p>

              {/* Gray Attendance Pill Banner (Exact Match to Stitch) */}
              <div className="mt-2 w-full bg-[#eeeeee] rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">
                  ATTENDANCE
                </span>
                <span className="text-base font-bold text-[#000666]">
                  {presentCount}<span className="text-gray-500 font-normal">/{students.length}</span>
                </span>
              </div>
            </section>

            {/* Search and Sort Bar (Exact Match to Stitch) */}
            <section className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#000666]"
                  placeholder="Search by Name or Roll No..."
                  type="text"
                />
              </div>
              <button
                onClick={() => setSortAscending(prev => !prev)}
                className="w-10 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
                title="Sort"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </section>

            {/* Quick Batch Select Helpers */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] font-semibold text-gray-400">
                {filteredStudents.length} Students
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkAll(true)}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleMarkAll(false)}
                  className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 hover:bg-red-100 cursor-pointer"
                >
                  All Absent
                </button>
              </div>
            </div>

            {/* Student Roster Cards (Exact Match to Stitch) */}
            <section className="space-y-2.5 pb-20">
              {loading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
                  <Loader2 className="w-6 h-6 text-[#000666] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-500">Loading student roster...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-xs text-gray-400 font-semibold">
                  No students found.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const initials = student.name
                    ? student.name.split(" ").slice(0, 2).map(n => n.charAt(0)).join("")
                    : "ST";
                  const rollNo = student.uniqueId || student.unique_id || "—";
                  const isPresent = student.markedPresent;
                  const hasGate = student.scannedGate;
                  const gateTimeFmt = student.gateEntryTime
                    ? new Date(student.gateEntryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
                    : null;

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(student.id)}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-2xl shadow-2xs relative overflow-hidden cursor-pointer hover:border-gray-300 transition-all"
                    >
                      {/* Left vertical accent line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        hasGate ? "bg-emerald-600" : "bg-gray-300"
                      }`} />

                      {/* Initials Circle */}
                      <div className="flex-shrink-0 mr-3 ml-1 relative">
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                          {initials}
                        </div>
                        {!hasGate && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Student Info & Gate Badge */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-mono text-gray-400 font-medium">
                            {rollNo}
                          </span>
                          {hasGate ? (
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span className="text-[9px] font-bold text-emerald-700">
                                Gate In: {gateTimeFmt || "08:52 AM"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              <span className="text-[9px] font-bold text-red-700">
                                No Gate Scan
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle Pill (Exact Stitch Style) */}
                      <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(student.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                            isPresent ? "bg-[#000666]" : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform duration-150 ${
                              isPresent ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            {/* Sticky Submit Button */}
            <div className="fixed bottom-20 left-0 w-full px-4 max-w-lg md:left-1/2 md:-translate-x-1/2 z-40 pointer-events-none">
              <button
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="pointer-events-auto flex items-center justify-center gap-2 bg-[#000666] hover:bg-blue-950 text-white w-full py-3.5 rounded-2xl shadow-lg transition-all active:scale-98 font-bold text-xs tracking-wider uppercase cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>SUBMITTING...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>SUBMIT ATTENDANCE</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ─── TAB 2: ATTENDANCE HISTORY (Exact Match to Stitch) ─── */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Header & Date Ribbon */}
            <section className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-[#000666]">Attendance History</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">OCT</span>
                {[
                  { day: "Mon", date: "09", code: "09" },
                  { day: "Tue", date: "10", code: "10" },
                  { day: "Wed", date: "11", code: "11", active: true },
                  { day: "Thu", date: "12", code: "12" },
                  { day: "Fri", date: "13", code: "13" }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setHistorySelectedDay(item.code)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl border transition-all cursor-pointer ${
                      item.active || historySelectedDay === item.code
                        ? "bg-[#000666] text-white border-[#000666] shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-[10px] font-semibold opacity-80">{item.day}</span>
                    <span className="text-sm font-bold">{item.date}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Bento Summary Box (Exact Stitch) */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-[#f3f3f3] rounded-xl p-3.5 flex flex-col justify-between border border-gray-200">
                <div className="flex items-center gap-1.5 mb-2 text-gray-600">
                  <School className="w-4 h-4 text-[#000666]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Classes</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#000666]">04</span>
                  <span className="text-xs text-gray-500 font-medium">Sessions</span>
                </div>
              </div>

              <div className="bg-[#fdd400] rounded-xl p-3.5 flex flex-col justify-between border border-yellow-300">
                <div className="flex items-center gap-1.5 mb-2 text-gray-800">
                  <TrendingUp className="w-4 h-4 text-gray-900" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Avg Attendance</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">92%</span>
                  <span className="text-xs text-gray-800 font-medium">Present</span>
                </div>
              </div>
            </section>

            {/* Historical Sessions List (Exact Stitch) */}
            <section className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-semibold text-gray-600">Wednesday, Oct 11</h3>
                <span className="text-xs font-bold text-[#000666] cursor-pointer">Filter</span>
              </div>

              {[
                { title: "Data Structures", sec: "Section DS II/I/A", time: "09:00 AM - 10:30 AM", present: "48/52", pct: "92%", color: "bg-emerald-500" },
                { title: "Algorithms Lab", sec: "Section AL III/B", time: "11:00 AM - 12:30 PM", present: "30/30", pct: "100%", color: "bg-emerald-500" },
                { title: "Software Engineering", sec: "Section SE IV/C", time: "02:00 PM - 03:30 PM", present: "45/60", pct: "75%", color: "bg-red-500" },
              ].map((s, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{s.title}</h4>
                      <p className="text-xs text-gray-500">{s.sec}</p>
                    </div>
                    <div className="bg-[#e8e8e8] px-2.5 py-0.5 rounded-full text-[10px] font-medium text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{s.time}</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gray-100" />

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="font-semibold text-gray-800"><strong>{s.present}</strong> Present</span>
                    </div>
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {s.pct}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ─── TAB 3: FACULTY PROFILE (Exact Match to Stitch) ─── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Profile Card */}
            <section className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 text-center">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC88bLXC6ysKxleMb3vTfOeWk_k4m60sGLvT0OT-_Xl4AWCNMobx_y4KddCFFdLZ42WPoBPnA2eQMlywgIA7Tq12xBMx_KnF4Nx3CDBqkqMySbit4setrJpbXLlgDO3iuL9gWTxjfL7q3MbZzQGdEXzm_oH72uG0QHbzH7AggoE8NmD0NnyR-CAKNd7_0vFNTF6fS4DODyRUuXYkrE0mWTV04EGuZWvsgrXZSA3AK9_1OcINbg3GSgU"
                alt="Faculty Portrait"
                className="w-20 h-20 rounded-2xl object-cover shadow-sm mb-3 border-2 border-white ring-2 ring-gray-100"
              />
              <h2 className="text-lg font-bold text-gray-900">{activeFaculty?.name || "Dr. Eleanor Vance"}</h2>
              <p className="text-xs text-gray-500 font-medium">Department of Computer Science</p>
            </section>

            {/* Sync Status Banner (Lavender pill from Stitch) */}
            <section className="bg-[#bdc2ff]/40 text-[#000767] px-4 py-2.5 rounded-xl flex items-center justify-between border border-[#bdc2ff]">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#000666]" />
                <span className="text-xs font-bold">All Data Synced</span>
              </div>
              <span className="text-[11px] font-semibold text-gray-600">Just now</span>
            </section>

            {/* Metrics Bento Grid */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Classes Today</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-[#000666]">3</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Attendance Rate</span>
                  <Percent className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-[#000666]">94%</div>
              </div>
            </section>

            {/* Recent Sessions List */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recent Sessions</h3>

              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col gap-1.5 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Data Structures & Algo</h4>
                    <p className="text-[11px] text-gray-500">CS301 • Room 402</p>
                  </div>
                  <span className="bg-[#e2e2e2] text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>42/45 Present</span>
                </div>
              </div>

              <div className="bg-white border border-[#000666] rounded-xl p-3.5 flex flex-col gap-1.5 shadow-2xs relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#000666]" />
                <div className="flex justify-between items-start pl-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Advanced Compilers</h4>
                    <p className="text-[11px] text-gray-500">CS410 • Room 305</p>
                  </div>
                  <span className="bg-[#000666] text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    Ongoing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pl-1 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ends in 20m</span>
                </div>
              </div>
            </section>

            {/* App Preferences */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">App Preferences</h3>

              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Push Notifications</h4>
                  <p className="text-[11px] text-gray-500">Alerts for upcoming classes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPushNotifications(p => !p)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                    pushNotifications ? "bg-[#000666]" : "bg-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    pushNotifications ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Offline Mode</h4>
                  <p className="text-[11px] text-gray-500">Cache rosters locally</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOfflineMode(o => !o)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                    offlineMode ? "bg-[#000666]" : "bg-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                    offlineMode ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Version & APK Download */}
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">App Version</h4>
                  <p className="text-[11px] text-gray-500 font-mono">v{CURRENT_APP_VERSION} (Production Build)</p>
                </div>
                <button
                  onClick={handleDownloadApk}
                  className="px-2.5 py-1 rounded-lg bg-[#000666] text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  APK
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                Sign Out
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Exact Match to Stitch BottomNavBar) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-white border-t border-gray-200 shadow-md md:max-w-lg md:left-1/2 md:-translate-x-1/2">
        {/* Tab 1: Schedule */}
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all cursor-pointer ${
            activeTab === "schedule"
              ? "bg-[#fdd400] text-gray-900 font-bold scale-95"
              : "text-gray-500 hover:text-gray-900 font-medium"
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Schedule</span>
        </button>

        {/* Tab 2: History */}
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-[#fdd400] text-gray-900 font-bold scale-95"
              : "text-gray-500 hover:text-gray-900 font-medium"
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">History</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#fdd400] text-gray-900 font-bold scale-95"
              : "text-gray-500 hover:text-gray-900 font-medium"
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  );
}
