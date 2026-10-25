import { useEffect, useRef, useState } from "react";
import { useScanQr, getGetDashboardStatsQueryKey, getGetTodayAttendanceQueryKey, getGetCurrentlyInsideQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, QrCode, Camera, ArrowLeft, Volume2, VolumeX, Play, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { findUserLocal, enqueueScan, markScannedLocally, syncQueue, getQueue } from "../lib/offlineScanner";

type ScanResult = {
  success: boolean;
  message: string;
  userName?: string;
  uniqueId?: string;
  role?: string;
  action?: string;
};

export default function Scanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(() => getQueue().length);
  const [cameraError, setCameraError] = useState("");
  const [isLateEntryMode, setIsLateEntryMode] = useState(false);

  // Auto-sync pending scans when network connection is restored
  useEffect(() => {
    const handleOnline = async () => {
      if (getQueue().length > 0) {
        await syncQueue();
        setPendingCount(getQueue().length);
      }
    };
    window.addEventListener("online", handleOnline);
    const interval = setInterval(handleOnline, 3000);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.7;
    const saved = window.localStorage.getItem("qr_scanner_volume");
    const n = saved == null ? 0.7 : parseFloat(saved);
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.7;
  });
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const isProcessingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const queryClient = useQueryClient();
  const scanMutation = useScanQr();

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
    try {
      if (ctx.state === "suspended") ctx.resume();
    } catch {}
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

  const handleVolumeChange = (next: number) => {
    setVolume(next);
    try { window.localStorage.setItem("qr_scanner_volume", String(next)); } catch {}
  };

  const testSound = async () => {
    const ctx = ensureAudio();
    try { if (ctx && ctx.state === "suspended") await ctx.resume(); } catch {}
    playBeep(true);
  };

  const safePauseScanner = () => {
    try {
      const inst = scannerInstanceRef.current;
      if (inst && typeof inst.pause === "function") {
        const state = typeof inst.getState === "function" ? inst.getState() : null;
        if (state === 2) {
          inst.pause(true);
        }
      }
    } catch {}
  };

  const safeResumeScanner = () => {
    try {
      const inst = scannerInstanceRef.current;
      if (inst && typeof inst.resume === "function") {
        const state = typeof inst.getState === "function" ? inst.getState() : null;
        if (state === 3) {
          inst.resume();
        }
      }
    } catch {}
  };

  const clearResult = () => {
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = null;
    setResult(null);
    isProcessingRef.current = false;
    safeResumeScanner();
  };

  const showResult = (r: ScanResult) => {
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    setResult(r);
    playBeep(r.success);
    if (r.success) {
      try { window.navigator?.vibrate?.(200); } catch {}
    } else {
      try { window.navigator?.vibrate?.([100, 60, 100]); } catch {}
    }
    resultTimeoutRef.current = setTimeout(() => {
      setResult(null);
      isProcessingRef.current = false;
      resultTimeoutRef.current = null;
      safeResumeScanner();
    }, 1000);
  };

  // Extract roll number from scanned data.
  // QR codes contain just the roll number (10 chars like 24N81A6758).
  // Barcodes on ID cards have variable prefixes (]C1, ]C0, etc.) —
  // the roll number is always the LAST 10 characters.
  const extractRollNumber = (raw: string): string => {
    const cleaned = (raw ?? "").trim();
    if (!cleaned) return "";
    // If it's exactly 10 chars or looks like a plain roll number, use as-is
    if (cleaned.length <= 10) return cleaned;
    // For barcodes with any prefix, take the last 10 characters
    return cleaned.slice(-10);
  };

  const handleScan = (decodedText: string) => {
    if (isProcessingRef.current || scanMutation.isPending) return;

    const uid = extractRollNumber(decodedText);
    if (!uid) return;

    const now = Date.now();
    if (lastScanRef.current.text === uid && now - lastScanRef.current.at < 1200) {
      return;
    }
    lastScanRef.current = { text: uid, at: now };
    isProcessingRef.current = true;
    safePauseScanner();

    if (!navigator.onLine) {
      // Offline fallback queueing
      try {
        const localUser = findUserLocal(uid);
        enqueueScan(uid, isLateEntryMode);
        markScannedLocally(uid);
        showResult({
          success: true,
          message: `${localUser ? localUser.name : uid} queued offline (will push live when network returns)`,
          userName: localUser?.name ?? "Student",
          uniqueId: uid,
          action: "entry",
        });
      } catch {
        showResult({
          success: false,
          message: "Failed to queue offline scan.",
        });
      }
      return;
    }

    scanMutation.mutate(
      { data: { uniqueId: uid, isLateEntry: isLateEntryMode } as any },
      {
        onSuccess: (data: any) => {
          showResult({
            success: data.action !== "ignored",
            message: data.message,
            userName: data.user?.name,
            uniqueId: data.user?.uniqueId,
            role: data.user?.role,
            action: data.action,
          });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentlyInsideQueryKey() });
        },
        onError: (err: any) => {
          // If network error occurred during scan, queue offline!
          if (!navigator.onLine || err?.message?.includes("fetch") || err?.message?.includes("Network")) {
            try {
              const localUser = findUserLocal(uid);
              enqueueScan(uid, isLateEntryMode);
              markScannedLocally(uid);
              showResult({
                success: true,
                message: `${localUser ? localUser.name : uid} queued offline (will push live when network returns)`,
                userName: localUser?.name ?? "Student",
                uniqueId: uid,
                action: "entry",
              });
              return;
            } catch {}
          }
          showResult({
            success: false,
            message: err?.data?.error ?? err?.message ?? "Invalid QR code or barcode",
          });
        },
      }
    );
  };

  const startScanner = async () => {
    setCameraError("");
    setScanning(true);

    // Prime the audio context inside the user-gesture handler so beeps
    // are allowed to play later (browsers block autoplay otherwise).
    const ctx = ensureAudio();
    try { if (ctx && ctx.state === "suspended") await ctx.resume(); } catch {}

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      // Support both QR codes AND 1D barcodes (Code 128, Code 39, EAN, etc.)
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODABAR,
      ];

      const scanner = new Html5Qrcode("qr-reader", { formatsToSupport, verbose: true });
      scannerInstanceRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setCameraError("No cameras found. Please connect a camera.");
        setScanning(false);
        return;
      }

      const cameraId = cameras.find((c) => c.label.toLowerCase().includes("back"))?.id ?? cameras[cameras.length - 1].id;

      // Use wider scan region to accommodate horizontal 1D barcodes
      await scanner.start(
        cameraId,
        { fps: 12, qrbox: { width: 280, height: 200 } },
        (text) => { handleScan(text); },
        undefined
      );
    } catch (err: any) {
      console.error(err);
      setCameraError("Camera access denied. Please allow camera access and try again.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const inst = scannerInstanceRef.current;
      if (inst) {
        const state = typeof inst.getState === "function" ? inst.getState() : null;
        if (state === 2 || state === 3) {
          await inst.stop();
        }
        scannerInstanceRef.current = null;
      }
    } catch {}
    setScanning(false);
    isProcessingRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopScanner();
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-300/70 px-4 py-3.5 shadow-xs">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Link href="/dashboard">
            <button
              data-testid="back-button"
              className="p-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-md bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow text-slate-500">Gate Console</p>
            <h1 className="text-base font-bold text-slate-950 tracking-tight leading-tight" style={{ fontFamily: "var(--app-font-display)" }}>
              QR &amp; Barcode Scanner
            </h1>
            <p className="text-[11px] text-slate-500">Scan QR code or barcode on ID card</p>
          </div>
        </div>
      </header>

      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-md mx-auto w-full">
        {/* Scan result overlay */}
        {result && (
          <div
            data-testid={result.success ? "scan-success" : "scan-error"}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ${
              result.success
                ? result.action === "exit"
                  ? "bg-orange-500"
                  : "bg-emerald-600"
                : "bg-red-600"
            }`}
          >
            {result.success ? (
              <CheckCircle className={`w-20 h-20 mb-4 ${result.action === "exit" ? "text-orange-100" : "text-emerald-100"}`} />
            ) : (
              <XCircle className="w-20 h-20 text-red-100 mb-4" />
            )}
            <p className="text-3xl font-extrabold mb-3 uppercase tracking-wide text-white" style={{ fontFamily: "var(--app-font-display)" }}>
              {result.success
                ? result.action === "exit"
                  ? "Left Campus"
                  : result.action === "entry"
                  ? "On Campus"
                  : "Recorded"
                : "Already Scanned"}
            </p>
            {result.userName && (
              <div className="my-2 px-8 py-4 bg-white border border-white/70 rounded-lg shadow-xl text-center">
                <p
                  className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight uppercase"
                  style={{ fontFamily: "var(--app-font-display)" }}
                >
                  {result.userName}
                </p>
              </div>
            )}
            {result.uniqueId && (
              <p className="text-base font-mono text-white mt-3 tracking-widest">
                ID: {result.uniqueId}
              </p>
            )}
            {result.role && (
              <span className="stamp mt-3 border-white/70 bg-white/15 text-white">
                {result.role}
              </span>
            )}
            <p className="text-sm text-white/90 text-center mt-2 px-4 font-medium">{result.message}</p>
            {result.action && (
              <span className="stamp mt-4 border-white bg-white text-slate-950">
                <CheckCircle className="w-3 h-3" />
                {result.action === "entry" ? "Checked In" : result.action === "exit" ? "Checked Out" : "Recorded"}
              </span>
            )}
            <button
              onClick={clearResult}
              className="mt-8 px-6 py-2.5 rounded-md bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Continue Scanning
            </button>
          </div>
        )}

        {isLateEntryMode && (
          <div className="w-full mb-3 px-4 py-2.5 rounded-md bg-amber-100 border border-amber-400 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            LATE ENTRY MODE IS ACTIVE
          </div>
        )}

        {/* Scanner viewport */}
        <div className="w-full bg-white border border-slate-300/70 rounded-lg overflow-hidden shadow-xs mb-4">
          <div
            id="qr-reader"
            ref={scannerRef}
            className={`w-full aspect-square ${scanning ? "" : "hidden"}`}
          />
          {!scanning && (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50">
              <div className="w-20 h-20 rounded-md border border-slate-300 bg-white shadow-xs flex items-center justify-center mb-4">
                <Camera className="w-9 h-9 text-slate-400" />
              </div>
              <p className="eyebrow text-slate-500 mb-1.5">Camera Standby</p>
              <p className="text-sm text-slate-600 text-center px-6">
                Camera is off. Press Start to begin scanning.
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="w-full mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-300 text-red-800 text-sm text-center font-medium">
            {cameraError}
          </div>
        )}

        {/* Late Entry Mode Toggle */}
        <div className="w-full mb-4 bg-white border border-slate-300/70 rounded-lg px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex flex-col">
            <span className="eyebrow text-slate-500">Late Entry Mode</span>
            <span className="text-xs text-slate-600 font-medium mt-1">Flag scanned student as late entry</span>
          </div>
          <button
            onClick={() => setIsLateEntryMode(prev => !prev)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center border ${
              isLateEntryMode ? "bg-amber-400 border-amber-500" : "bg-slate-100 border-slate-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                isLateEntryMode ? "translate-x-5" : "translate-x-0 border border-slate-300"
              }`}
            />
          </button>
        </div>

        {/* Controls */}
        <div className="w-full flex gap-3">
          {!scanning ? (
            <button
              data-testid="start-scanner"
              onClick={startScanner}
              className="flex-1 py-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              Start Scanner
            </button>
          ) : (
            <button
              data-testid="stop-scanner"
              onClick={stopScanner}
              className="flex-1 py-4 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50 text-base font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Volume control */}
        <div className="mt-6 w-full bg-white border border-slate-300/70 rounded-lg px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.7)}
              className="text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
              title={volume > 0 ? "Mute" : "Unmute"}
              data-testid="toggle-mute"
            >
              {volume > 0 ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="eyebrow text-slate-500">Beep volume</span>
                <span className="text-xs font-mono text-slate-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
                data-testid="volume-slider"
              />
            </div>
            <button
              onClick={testSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 text-xs font-semibold transition-colors cursor-pointer"
              title="Play test beep"
              data-testid="test-sound"
            >
              <Play className="w-3.5 h-3.5" />
              Test
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 w-full space-y-2">
          {[
            "Point camera at QR code or barcode on ID card",
            "Hold steady — works with both QR codes & barcodes",
            "Same student scanned via QR + barcode counts only once",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-md bg-white border border-slate-300/70 shadow-xs">
              <span className="w-5 h-5 rounded border border-slate-300 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
