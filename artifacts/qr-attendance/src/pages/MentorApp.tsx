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
  Smartphone,
  Share2
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
  const [showInstallHelpModal, setShowInstallHelpModal] = useState(false);
  
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

  const handleInstallClick = () => {
    if (canInstall) {
      install();
    } else {
      setShowInstallHelpModal(true);
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

  // ---------- Passkey Lock Screen ----------
  if (role !== "mentor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-xl shadow-purple-600/30 mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            {/* Explicit inline style #0f172a ensures dark black text regardless of CSS theme */}
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              Faculty Scanner App
            </h1>
            <p className="text-sm font-bold mt-1.5 max-w-xs" style={{ color: "#475569" }}>
              Enter your Faculty Passkey to access classes & live QR attendance scanner.
            </p>
          </div>

          <form onSubmit={handleKeyLogin} className="mt-7 flex flex-col gap-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-center" style={{ color: "#1e293b" }}>
                Faculty Passkey (Key)
              </label>
              {/* type="text" removes bullet dots so key digits are 100% visible */}
              <input
                required
                type="text"
                placeholder="e.g. 123"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                className="px-4 py-4 rounded-2xl border-2 border-purple-500 text-3xl font-mono font-black tracking-widest text-center focus:outline-none focus:ring-4 focus:ring-purple-600/20 shadow-inner"
                style={{ color: "#0f172a", backgroundColor: "#f8fafc" }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={keySubmitting}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider mt-1"
            >
              {keySubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" /> Unlocking Portal...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white" /> Unlock Faculty App
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Light Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black truncate" style={{ color: "#0f172a" }}>Faculty Scanner App</h1>
              <p className="text-xs font-bold truncate" style={{ color: "#7e22ce" }}>{mentor?.name} · {mentor?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 hover:bg-purple-200 text-purple-900 text-xs font-black transition-all shadow-sm"
              style={{ color: "#6b21a8" }}
            >
              <Smartphone className="w-4 h-4 text-purple-700" />
              Install App
            </button>

            <button
              data-testid="mentor-logout"
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 border border-slate-300 text-xs font-bold transition-all"
              style={{ color: "#1e293b" }}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Result Popup Overlay (1.0 Second Popup) */}
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

          <p className="text-3xl font-black mb-3 text-white uppercase tracking-wide">
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
            <p className="text-xl font-mono font-bold text-white mb-2 tracking-wider">
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

      {/* App Install Instructions Modal */}
      {showInstallHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-700" />
                <h3 className="text-lg font-black" style={{ color: "#0f172a" }}>Install Faculty App</h3>
              </div>
              <button
                onClick={() => setShowInstallHelpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed" style={{ color: "#334155" }}>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-black text-purple-800 uppercase tracking-wider">For Android (Chrome / Edge):</p>
                <p>1. Tap the 3 dots menu <span className="font-bold text-slate-900">⋮</span> in top right corner.</p>
                <p>2. Tap <span className="font-bold text-slate-900">"Add to Home screen"</span> or <span className="font-bold text-slate-900">"Install app"</span>.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-black text-purple-800 uppercase tracking-wider">For iPhone / iPad (Safari):</p>
                <p>1. Tap the Share button <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> at bottom of screen.</p>
                <p>2. Scroll down and tap <span className="font-bold text-slate-900">"Add to Home Screen ➕"</span>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
            >
              Got It
            </button>
          </div>
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
            <p className="text-xs font-bold" style={{ color: "#334155" }}>Loading active class timetable...</p>
          </div>
        ) : !activeSchedule ? (
          <div className="space-y-5">
            {/* No Active Class Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-black" style={{ color: "#0f172a" }}>No Class Active Right Now</h2>
              <p className="text-xs mt-2 max-w-sm mx-auto leading-relaxed font-bold" style={{ color: "#334155" }}>
                Select any of your scheduled lecture classes below to launch the live QR camera scanner and take attendance.
              </p>
              <button
                onClick={loadActiveSchedule}
                className="mt-5 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 transition-all active:scale-[0.98] inline-flex items-center gap-2 shadow-sm"
                style={{ color: "#0f172a" }}
              >
                <RefreshCw className="w-4 h-4 text-purple-600" />
                Refresh Timetable Check
              </button>
            </div>

            {/* Today's Schedules List */}
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: "#6b21a8" }}>
                  Your Classes Today
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {todaySchedules.map((sched) => (
                    <div
                      key={sched.id}
                      onClick={() => handleSelectSchedule(sched)}
                      className="bg-white border-2 border-slate-200 hover:border-purple-500 p-4 rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center flex-shrink-0">
                          <QrCode className="w-6 h-6 text-purple-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 border border-purple-300 font-bold text-[10px]" style={{ color: "#6b21a8" }}>
                              {sched.year} Yr · Section {sched.section}
                            </span>
                            <span className="text-xs font-mono font-bold" style={{ color: "#334155" }}>
                              {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {/* Subject Title 100% visible black text */}
                          <h4 className="text-lg font-black mt-1.5 group-hover:text-purple-700 transition-colors" style={{ color: "#0f172a" }}>
                            {sched.subject || "Lecture Class"}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        {sched.status === "submitted" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Submitted ({sched.session?.student_count} present)
                          </span>
                        ) : sched.status === "started" ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            ● Scan Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                            Pending
                          </span>
                        )}

                        <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5">
                          Start Scanner <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center text-sm font-bold" style={{ color: "#334155" }}>
                You have no classes scheduled for today.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Active Class Header Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-xs font-black border border-purple-300" style={{ color: "#6b21a8" }}>
                      {activeSchedule.year} Yr - Section {activeSchedule.section}
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#334155" }}>
                      {activeSchedule.start_time.slice(0, 5)} - {activeSchedule.end_time.slice(0, 5)}
                    </span>
                  </div>
                  {/* Subject Name in Active Class 100% visible black text */}
                  <h2 className="text-2xl font-black mt-2" style={{ color: "#0f172a" }}>
                    {activeSchedule.subject || "Lecture Class"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                      <Lock className="w-4 h-4" /> Session Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black animate-pulse">
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
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs border border-slate-300 transition-all active:scale-[0.97]"
                      style={{ color: "#0f172a" }}
                    >
                      Change Class
                    </button>
                  )}
                </div>
              </div>

              {isLocked && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  ⚠️ Attendance session for this lecture hour is locked. You cannot scan or modify records.
                </div>
              )}
            </div>

            {/* Attendance Counters Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>Total Class</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#0f172a" }}>{students.length}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>Present</p>
                <p className="text-2xl font-black mt-1" style={{ color: "#15803d" }}>{presentCount}</p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>No Gate Scan</p>
                <p className="text-2xl font-black mt-1" style={{ color: warningsCount > 0 ? "#b45309" : "#475569" }}>
                  {warningsCount}
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-1.5 flex gap-2 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
                style={{ color: viewMode === "list" ? "#ffffff" : "#0f172a" }}
              >
                <Users className="w-4 h-4" />
                Class Roster List ({students.length})
              </button>
              <button
                onClick={() => setViewMode("camera")}
                disabled={isLocked}
                className={`flex-1 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  viewMode === "camera"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-purple-100 text-purple-900 border border-purple-300"
                }`}
                style={{ color: viewMode === "camera" ? "#ffffff" : "#6b21a8" }}
              >
                <Camera className="w-4 h-4" />
                Live QR Scanner
              </button>
            </div>

            {/* Live Camera View Mode */}
            {viewMode === "camera" && (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "#0f172a" }}>
                      <Camera className="w-4 h-4 text-purple-700" />
                      Point Camera at Student QR Code
                    </h3>
                    <p className="text-xs font-bold mt-0.5" style={{ color: "#475569" }}>Scanned students will automatically mark Present</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {presentCount} / {students.length} Present
                  </span>
                </div>

                <div className="w-full bg-slate-950 border-2 border-slate-300 rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto relative shadow-inner">
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
                      {volume > 0 ? <Volume2 className="w-4 h-4 text-purple-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    </button>
                    <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Beep Audio</span>
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
                    className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-bold shadow-sm"
                    style={{ color: "#0f172a" }}
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
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center text-sm font-bold" style={{ color: "#475569" }}>
                    No students matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="bg-white border-2 border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-md">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Student Name 100% visible black text */}
                            <p className="text-base font-black truncate" style={{ color: "#020617" }}>{s.name}</p>
                            {s.scannedGate ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                                Gate Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-300 font-bold">
                                No Gate Scan
                              </span>
                            )}
                          </div>
                          {/* Roll number 100% visible dark text */}
                          <p className="text-xs font-mono font-black mt-0.5" style={{ color: "#334155" }}>{s.uniqueId}</p>
                        </div>

                        {s.warningNotScanned && (
                          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> No Gate Scan
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, true)}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all ${
                              s.markedPresent
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                            }`}
                            style={{ color: s.markedPresent ? "#ffffff" : "#0f172a" }}
                          >
                            Present
                          </button>
                          <button
                            disabled={isLocked}
                            onClick={() => handleSetAttendance(s.id, false)}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all ${
                              !s.markedPresent
                                ? "bg-red-600 border-red-500 text-white shadow-md"
                                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                            }`}
                            style={{ color: !s.markedPresent ? "#ffffff" : "#0f172a" }}
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
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-base shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wide"
                style={{ color: "#ffffff" }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" /> Submitting Attendance...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 text-white" /> Submit Class Attendance ({presentCount} Present)
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
