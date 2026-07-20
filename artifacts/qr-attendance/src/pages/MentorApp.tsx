import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import {
  GraduationCap,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  X,
  Search,
  AlertTriangle,
  Lock,
  Camera,
  QrCode,
  Volume2,
  VolumeX,
  Sparkles,
  UserCheck,
  RefreshCw,
  Users,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

type Schedule = {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  section: string;
  subject: string;
  year: string;
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
  section: string;
  scannedGate: boolean;
  gateEntryTime: string | null;
  markedPresent: boolean;
  markedByTeacher: boolean;
  scannedQr: boolean;
  warningNotScanned: boolean;
};

type ScanPopup = {
  success: boolean;
  studentName?: string;
  uniqueId?: string;
  message: string;
  scannedGate?: boolean;
};

export default function MentorApp() {
  const { mentor, role, logout, loginMentorKey } = useAuth();
  const [, navigate] = useLocation();
  
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
  const { canInstall, install } = usePwaInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  
  const [passkey, setPasskey] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  // ---------- Camera & Scanner States ----------
  const [viewMode, setViewMode] = useState<"list" | "camera">("list");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanPopup, setScanPopup] = useState<ScanPopup | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const isProcessingRef = useRef(false);

  // Audio state & volume
  const [volume, setVolume] = useState<number>(0.7);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudio = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtxRef.current = new Ctor();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playTone = (
    ctx: AudioContext,
    freq: number,
    durationMs: number,
    startOffsetMs: number,
    type: OscillatorType = "sine",
    peakGain = 0.25,
  ) => {
    const startTime = ctx.currentTime + startOffsetMs / 1000;
    const stopTime = startTime + durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(stopTime + 0.02);
  };

  const playBeep = (success: boolean) => {
    if (volume <= 0) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    try { if (ctx.state === "suspended") ctx.resume(); } catch {}
    try {
      if (success) {
        playTone(ctx, 880, 120, 0, "sine", 0.3 * volume);
        playTone(ctx, 1320, 180, 130, "sine", 0.3 * volume);
      } else {
        playTone(ctx, 220, 180, 0, "sawtooth", 0.25 * volume);
        playTone(ctx, 180, 220, 200, "sawtooth", 0.25 * volume);
      }
    } catch {}
  };

  const showPopup = (p: ScanPopup) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setScanPopup(p);
    playBeep(p.success);
    if (p.success) {
      try { window.navigator?.vibrate?.(150); } catch {}
    } else {
      try { window.navigator?.vibrate?.([80, 50, 80]); } catch {}
    }
    // Popup stays for 1.0 second (1000ms) as requested
    popupTimeoutRef.current = setTimeout(() => {
      setScanPopup(null);
      isProcessingRef.current = false;
      popupTimeoutRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    if (role === "mentor") {
      loadActiveSchedule();
    }
  }, [role]);

  const handleKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setKeySubmitting(true);
    setError(null);
    try {
      await loginMentorKey(passkey.trim());
    } catch (err: any) {
      setError(err?.data?.error ?? "Invalid faculty key");
    } finally {
      setKeySubmitting(false);
    }
  };

  const loadActiveSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customFetch<{
        activeSchedule: Schedule | null;
        session: Session | null;
        todaySchedules: (Schedule & { status: "pending" | "started" | "submitted"; session: Session | null })[];
        serverTime: any;
      }>("/api/mentor/active-schedule");
      
      setActiveSchedule(res.activeSchedule);
      setSession(res.session);
      setTodaySchedules(res.todaySchedules || []);
      setServerTime(res.serverTime);

      if (res.activeSchedule) {
        let currentSession = res.session;
        if (!currentSession) {
          currentSession = await customFetch<Session>("/api/mentor/start-session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ scheduleId: res.activeSchedule.id }),
          });
          setSession(currentSession);
        }

        const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${res.activeSchedule.id}`);
        
        const mappedStudents = studentData.map(s => {
          if (!s.markedByTeacher && s.scannedGate) {
            return { ...s, markedPresent: true };
          }
          return s;
        });

        setStudents(mappedStudents);
      }
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load active class schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchedule = async (sched: Schedule & { status: "pending" | "started" | "submitted"; session: Session | null }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      setActiveSchedule(sched);
      
      let currentSession = sched.session;
      if (!currentSession) {
        currentSession = await customFetch<Session>("/api/mentor/start-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduleId: sched.id }),
        });
      }
      setSession(currentSession);

      const studentData = await customFetch<ScheduleStudent[]>(`/api/mentor/students-by-schedule?scheduleId=${sched.id}`);
      
      const mappedStudents = studentData.map(s => {
        if (!s.markedByTeacher && s.scannedGate) {
          return { ...s, markedPresent: true };
        }
        return s;
      });

      setStudents(mappedStudents);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to load class schedule details");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Live Camera Scanning Logic ----------
  const handleScanCode = (decodedText: string) => {
    if (isProcessingRef.current || isLocked) return;
    const uid = (decodedText || "").trim();
    if (!uid) return;

    const now = Date.now();
    if (lastScanRef.current.text === uid && now - lastScanRef.current.at < 1200) return;
    lastScanRef.current = { text: uid, at: now };
    isProcessingRef.current = true;

    // Find student in current roster
    setStudents(prev => {
      const targetIndex = prev.findIndex(
        s => s.uniqueId.toLowerCase() === uid.toLowerCase() || String(s.id) === uid
      );

      if (targetIndex !== -1) {
        const targetStudent = prev[targetIndex];
        showPopup({
          success: true,
          studentName: targetStudent.name,
          uniqueId: targetStudent.uniqueId,
          message: targetStudent.markedPresent ? "Already marked present!" : "Marked Present!",
          scannedGate: targetStudent.scannedGate
        });

        const updated = [...prev];
        updated[targetIndex] = {
          ...targetStudent,
          markedPresent: true,
          scannedQr: true,
          warningNotScanned: false
        };
        return updated;
      } else {
        showPopup({
          success: false,
          message: `Student (${uid}) not found in this class section!`
        });
        return prev;
      }
    });
  };

  const startScanner = async () => {
    setCameraError("");
    setScanning(true);
    ensureAudio();

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("faculty-qr-reader");
      scannerInstanceRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setCameraError("No camera found on this device.");
        setScanning(false);
        return;
      }

      const cameraId = cameras.find((c) => c.label.toLowerCase().includes("back"))?.id ?? cameras[cameras.length - 1].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => { handleScanCode(text); },
        undefined
      );
    } catch (err) {
      console.error(err);
      setCameraError("Camera permission denied. Please allow camera access.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        const state = typeof scannerInstanceRef.current.getState === "function" ? scannerInstanceRef.current.getState() : null;
        if (state === 2 || state === 3) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current = null;
      }
    } catch {}
    setScanning(false);
    isProcessingRef.current = false;
  };

  useEffect(() => {
    if (viewMode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [viewMode]);

  const handleSetAttendance = (studentId: number, isPresent: boolean) => {
    if (isLocked) return;
    
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            markedPresent: isPresent,
            warningNotScanned: isPresent && !s.scannedGate
          };
        }
        return s;
      })
    );
  };

  const handleSubmitAttendance = async () => {
    if (!activeSchedule || isLocked) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        markedPresent: s.markedPresent
      }));

      const res = await customFetch<{ message: string; presentCount: number }>("/api/mentor/submit-attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scheduleId: activeSchedule.id,
          students: records
        })
      });

      setSuccess(`Attendance submitted successfully! ${res.presentCount} students present.`);
      await loadActiveSchedule();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const isTimePast = () => {
    if (!activeSchedule) return false;
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const hours = String(istTime.getUTCHours()).padStart(2, "0");
    const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(istTime.getUTCSeconds()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}:${seconds}`;
    return timeStr > activeSchedule.end_time;
  };

  const isLocked = !!(session?.ended_at || isTimePast());

  // ---------- Light Theme Lock / Passkey Screen ----------
  if (role !== "mentor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 font-sans relative overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-600 flex items-center justify-center shadow-xl shadow-purple-600/20 mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Scanner App</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1.5 max-w-xs">
              Enter your Faculty Passkey to access classes & live QR attendance scanner.
            </p>
          </div>

          <form onSubmit={handleKeyLogin} className="mt-8 flex flex-col gap-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider text-center">
                Faculty Passkey (Key)
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-2xl font-mono font-bold tracking-widest text-center focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 shadow-inner transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={keySubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider mt-1"
            >
              {keySubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Unlocking Portal...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Unlock Faculty App
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter((s) => s.markedPresent).length;
  const warningsCount = students.filter((s) => s.warningNotScanned).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Light Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-emerald-600 flex items-center justify-center shadow-md shadow-purple-600/20 flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-slate-900 truncate">Faculty Scanner App</h1>
              <p className="text-xs text-purple-700 font-bold truncate">{mentor?.name} · {mentor?.email}</p>
            </div>
          </div>

          <button
            data-testid="mentor-logout"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-xs font-bold transition-all active:scale-[0.97]"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      {canInstall && showInstallBanner && (
        <div className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-4 py-3 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider">Install App</p>
              <p className="text-xs text-purple-100 truncate">Add Faculty Scanner to home screen for offline camera scanning.</p>
            </div>
            <button
              onClick={install}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white text-purple-900 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="flex-shrink-0 p-1 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Result Popup Overlay (1.0 Second Popup with Light High-Contrast Visuals) */}
      {scanPopup && (
        <div
          data-testid={scanPopup.success ? "scan-success" : "scan-error"}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md transition-all ${
            scanPopup.success ? "bg-emerald-600/95" : "bg-red-600/95"
          }`}
        >
          {scanPopup.success ? (
            <CheckCircle className="w-24 h-24 text-white mb-4 animate-bounce" />
          ) : (
            <XCircle className="w-24 h-24 text-white mb-4" />
          )}

          <p className="text-3xl font-extrabold mb-3 text-white uppercase tracking-wide">
            {scanPopup.success ? "PRESENT MARKED" : "SCAN ERROR"}
          </p>

          {scanPopup.studentName && (
            <div className="my-2 px-6 py-3.5 bg-amber-300 border-4 border-amber-400 rounded-2xl shadow-2xl text-center">
              <p className="text-4xl sm:text-5xl font-black text-slate-950 tracking-wide leading-tight uppercase drop-shadow-md">
                {scanPopup.studentName}
              </p>
            </div>
          )}

          {scanPopup.uniqueId && (
            <p className="text-xl font-mono font-bold text-white/90 mb-2 tracking-wider">
              ID: {scanPopup.uniqueId}
            </p>
          )}

          <p className="text-sm font-extrabold text-white text-center mt-1">{scanPopup.message}</p>

          {scanPopup.success && (
            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-black border ${
              scanPopup.scannedGate
                ? "bg-white text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-900 border-amber-300"
            }`}>
              {scanPopup.scannedGate ? "✓ Gate Verified (On Campus)" : "⚠️ No Gate Scan"}
            </span>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-3xl mx-auto p-4 flex-1 w-full space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading active class timetable...</p>
          </div>
        ) : !activeSchedule ? (
          <div className="space-y-5">
            {/* No Active Class Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-slate-900 text-xl font-black">No Class Active Right Now</h2>
              <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed font-medium">
                Select any of your scheduled lecture classes below to launch the live QR camera scanner and take attendance.
              </p>
              <button
                onClick={loadActiveSchedule}
                className="mt-5 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all active:scale-[0.98] inline-flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-purple-600" />
                Refresh Timetable Check
              </button>
            </div>

            {/* Today's Schedules List */}
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-purple-700 uppercase tracking-widest ml-1">
                  Your Classes Today
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {todaySchedules.map((sched) => (
                    <div
                      key={sched.id}
                      onClick={() => handleSelectSchedule(sched)}
                      className="bg-white border border-slate-200 hover:border-purple-400 p-4 rounded-2xl shadow-md shadow-slate-200/50 transition-all active:scale-[0.99] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                          <QrCode className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-bold">
                              {sched.year} Yr · Section {sched.section}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <h4 className="text-slate-900 font-bold text-base mt-1.5 group-hover:text-purple-600 transition-colors">
                            {sched.subject || "Lecture Class"}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        {sched.status === "submitted" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Submitted ({sched.session?.student_count} present)
                          </span>
                        ) : sched.status === "started" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            ● Scan Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            Pending
                          </span>
                        )}

                        <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5">
                          Start Scanner <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm font-semibold">
                You have no classes scheduled for today.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Active Class Header Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl shadow-slate-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
                      {activeSchedule.year} Yr - Section {activeSchedule.section}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {activeSchedule.start_time.slice(0, 5)} - {activeSchedule.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {activeSchedule.subject || "Lecture Class"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs font-bold">
                      <Lock className="w-4 h-4" /> Session Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold animate-pulse">
                      ● Live Session
                    </span>
                  )}
                  {todaySchedules.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveSchedule(null);
                        setSession(null);
                        setStudents([]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all active:scale-[0.97]"
                    >
                      Change Class
                    </button>
                  )}
                </div>
              </div>

              {isLocked && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  ⚠️ Attendance session for this lecture hour is locked. You cannot scan or modify records.
                </div>
              )}
            </div>

            {/* Attendance Counters Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Class</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{students.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No Gate Scan</p>
                <p className={`text-2xl font-black mt-1 ${warningsCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                  {warningsCount}
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Users className="w-4 h-4" />
                Class Roster List ({students.length})
              </button>
              <button
                onClick={() => setViewMode("camera")}
                disabled={isLocked}
                className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  viewMode === "camera"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                <Camera className="w-4 h-4" />
                Live QR Scanner
              </button>
            </div>

            {/* Live Camera View Mode */}
            {viewMode === "camera" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-600" />
                      Point Camera at Student QR Code
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Scanned students will automatically mark Present</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {presentCount} / {students.length} Present
                  </span>
                </div>

                <div className="w-full bg-slate-900 border border-slate-300 rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto relative shadow-inner">
                  <div id="faculty-qr-reader" ref={scannerRef} className="w-full h-full" />
                </div>

                {cameraError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
                    {cameraError}
                  </div>
                )}

                {/* Volume Control */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {volume > 0 ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    </button>
                    <span className="text-xs font-bold text-slate-700">Beep Audio</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-28 accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Class Roster Search & List */}
            {viewMode === "list" && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-colors font-bold shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm font-semibold">
                    No students matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-md shadow-slate-200/50">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                            {s.scannedGate ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                Gate Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200 font-semibold">
                                No Gate Scan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">{s.uniqueId}</p>
                        </div>

                        {s.warningNotScanned && (
                          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> No Gate Scan
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, true)}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
                              s.markedPresent
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, false)}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
                              !s.markedPresent
                                ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/20"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Submission Button */}
            {!isLocked && (
              <button
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting Attendance...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" /> Submit Class Attendance ({presentCount} Present)
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
