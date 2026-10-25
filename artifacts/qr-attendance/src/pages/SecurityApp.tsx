import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  CheckCircle, XCircle, Camera, History as HistoryIcon, ArrowLeft,
  ShieldCheck, Wifi, WifiOff, RefreshCw, CloudUpload, Download, Clock,
  Smartphone, AlertTriangle,
} from "lucide-react";
import {
  refreshUserCache, findUserLocal, getCachedUsers, getCacheFetchedAt,
  getCooldownMsRemaining, markScannedLocally, extractCleanId,
  enqueueScan, getQueue, syncQueue, getLastSyncAt, clearLocalQueue,
  type CachedUser, type PendingScan,
} from "../lib/offlineScanner";

type ScanReply =
  | { ok: true; action: "queued"; user: CachedUser; queued: number }
  | { ok: false; message: string };

const POPUP_MS = 1500; // 1.5 second display duration
const SYNC_INTERVAL_MS = 3_000; // sync every 3 seconds

function formatAgo(ts: number | null): string {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${s}s`;
}

export default function SecurityApp() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [popup, setPopup] = useState<ScanReply | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);

  const MASTER_PASSCODE = "038899";
  const PASSCODE_KEY = "secapp.passcode.v1";
  const getStoredPasscode = () => {
    try { return localStorage.getItem(PASSCODE_KEY) || MASTER_PASSCODE; } catch { return MASTER_PASSCODE; }
  };

  const [unlocked, setUnlocked] = useState(false);
  const [isLateEntryMode, setIsLateEntryMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPasscode();
    if (passcode === stored || passcode === MASTER_PASSCODE) {
      setUnlocked(true);
      setPasscodeError("");
    } else {
      setPasscodeError("Invalid passcode. Please try again.");
    }
  };

  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [cachedCount, setCachedCount] = useState<number>(getCachedUsers().length);
  const [cachedAt, setCachedAt] = useState<number | null>(getCacheFetchedAt());
  const [queue, setQueue] = useState<PendingScan[]>(getQueue());
  const [lastSync, setLastSync] = useState<number | null>(getLastSyncAt());
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [installPromptEvt, setInstallPromptEvt] = useState<any>(null);
  const [tick, setTick] = useState(0);

  // ---------- Audio feedback ----------
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ensureCtx = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) audioCtxRef.current = new Ctx();
      } catch {}
    }
    return audioCtxRef.current;
  };
  const beep = (kind: "ok" | "err") => {
    const ctx = ensureCtx();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      if (kind === "ok") {
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      } else {
        o.frequency.setValueAtTime(220, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);
      }
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      o.start();
      o.stop(ctx.currentTime + 0.24);
    } catch {}
  };

  // ---------- Online/offline + install prompt ----------
  useEffect(() => {
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    const onInstall = (e: any) => { e.preventDefault(); setInstallPromptEvt(e); };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  // ---------- Cache students on mount ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      const r = await refreshUserCache(false);
      if (cancelled) return;
      setCachedCount(r.count);
      setCachedAt(getCacheFetchedAt());
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshCacheNow = async () => {
    setRefreshing(true);
    const r = await refreshUserCache(true);
    setCachedCount(r.count);
    setCachedAt(getCacheFetchedAt());
    setRefreshing(false);
  };

  // ---------- Background sync ----------
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>("");
  const [syncError, setSyncError] = useState(false);
  const syncingRef = useRef(false);

  const runSync = useCallback(async (manual = false) => {
    if (syncingRef.current) return;
    const qLen = getQueue().length;
    if (qLen === 0) {
      if (manual) setSyncStatusMsg("✅ No pending scans — all synced!");
      return;
    }
    syncingRef.current = true;
    setSyncing(true);
    setSyncError(false);
    setSyncStatusMsg("⏳ Syncing pending scans to server...");
    try {
      const res = await syncQueue();
      setQueue(getQueue());
      setLastSync(getLastSyncAt());
      const remaining = getQueue().length;
      if (res.synced > 0 || res.attempted > 0) {
        setSyncError(false);
        setSyncStatusMsg(`✅ Synced ${res.synced} scans successfully. ${remaining > 0 ? `${remaining} still pending.` : "All clear!"}`);
      } else {
        setSyncError(true);
        setSyncStatusMsg("⚠️ Server busy — retrying in a moment...");
      }
    } catch {
      setSyncError(true);
      setSyncStatusMsg("❌ Network error — retrying automatically...");
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      setTimeout(() => { setSyncStatusMsg(""); setSyncError(false); }, 5000);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => { runSync(false); }, 5_000);
    const onOnline = () => { runSync(false); };
    window.addEventListener("online", onOnline);
    runSync(false);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, [runSync]);

  // 1Hz tick for timestamps and cooldown countdowns
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- Popup helper ----------
  const showPopup = (r: ScanReply) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup(r);
    if (r.ok) {
      beep("ok");
      try { window.navigator?.vibrate?.(120); } catch {}
    } else {
      beep("err");
      try { window.navigator?.vibrate?.([60, 40, 60]); } catch {}
    }
    popupTimeoutRef.current = setTimeout(() => setPopup(null), POPUP_MS);
  };

  const downloadQueueJson = () => {
    const currentQueue = getQueue();
    if (currentQueue.length === 0) {
      alert("No pending scans to download.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQueue, null, 2));
    const downloadAnchor = document.createElement("a");
    const filename = `offline_scans_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // ---------- LOCAL scan handling ----------
  const handleScan = (decodedText: string) => {
    const raw = decodedText.trim();
    if (!raw) return;

    const uid = extractCleanId(raw);
    if (!uid) return;

    // 3s debouncer (reduced from 5s) to allow quick entry/exit scanning
    const last = lastScanRef.current;
    if (last && (last.text === raw || last.text === uid) && Date.now() - last.at < 3_000) return;
    lastScanRef.current = { text: uid, at: Date.now() };

    const user = findUserLocal(uid) || { id: 0, name: uid, uniqueId: uid, role: "student" };

    const cdRemaining = getCooldownMsRemaining(uid);
    if (cdRemaining > 0) {
      showPopup({
        ok: false,
        message: `${user.name} already scanned. Wait ${formatRemaining(cdRemaining)}.`,
      });
      return;
    }

    enqueueScan(uid, isLateEntryMode);
    markScannedLocally(uid);
    const newQueue = getQueue();
    setQueue(newQueue);
    showPopup({ ok: true, action: "queued", user, queued: newQueue.length });

    // Immediately attempt sync when online
    if (navigator.onLine) {
      runSync();
    }
  };

  // ---------- Camera ----------
  const startScanner = async () => {
    setCameraError("");
    setScanning(true);
    ensureCtx();
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

      const scanner = new Html5Qrcode("sec-qr-reader", { formatsToSupport, verbose: true });
      scannerInstanceRef.current = scanner;

      // Wider scan region to accommodate horizontal 1D barcodes
      const config = { fps: 12, qrbox: { width: 280, height: 200 } };
      const onScanSuccess = (text: string) => handleScan(text);

      try {
        await scanner.start({ facingMode: "environment" }, config, onScanSuccess, undefined);
      } catch (backErr) {
        console.warn("Back camera failed, trying user camera:", backErr);
        await scanner.start({ facingMode: "user" }, config, onScanSuccess, undefined);
      }
    } catch (err: any) {
      console.error("Camera start error:", err);
      const errMsg = String(err?.message || err || "");
      if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission")) {
        setCameraError("Camera permission blocked. Tap the lock icon in your browser address bar → allow Camera, then retry.");
      } else {
        setCameraError(`Camera error: ${errMsg || "Could not access camera. Try reloading the page."}`);
      }
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current = null;
      }
    } catch {}
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  const installApp = async () => {
    if (!installPromptEvt) return;
    try {
      installPromptEvt.prompt();
      await installPromptEvt.userChoice;
    } catch {}
    setInstallPromptEvt(null);
  };

  const queueLen = queue.length;

  // ===================== LOCK SCREEN =====================
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-lg bg-emerald-600 flex items-center justify-center mb-4 shadow-md">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-950 tracking-tight mb-1.5 text-center">SPHN Security Scanner</h1>
            <p className="text-[13px] text-slate-500 text-center">Enter passcode to access the scanner</p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="bg-white border border-slate-300/70 rounded-lg p-6 shadow-xs">
            <label className="eyebrow block text-slate-600 mb-2">
              Passcode
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-md text-slate-950 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors box-border"
              autoFocus
            />
            {passcodeError && (
              <p className="text-red-700 text-xs font-semibold mt-2 text-center">{passcodeError}</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 py-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] cursor-pointer transition-colors"
            >
              Unlock Scanner
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===================== MAIN SCANNER UI =====================
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ---- SCAN RESULT POPUP (full screen overlay) ---- */}
      {popup && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ${
            popup.ok ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {popup.ok ? (
            <CheckCircle className="w-20 h-20 text-white mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-white mb-4" />
          )}
          <p className="text-[32px] font-bold text-white mb-2 uppercase tracking-wide font-mono">
            {popup.ok ? "Access Granted" : "Already Scanned"}
          </p>
          {popup.ok && (
            <>
              <div className="my-3 px-8 py-4 bg-white/15 rounded-lg border-2 border-white/40 text-center">
                <p className="text-[36px] font-bold text-white leading-tight" style={{ fontFamily: "var(--app-font-display)" }}>
                  {popup.user.name}
                </p>
              </div>
              <p className="text-sm text-white/85 font-mono">{popup.user.uniqueId} · {popup.user.role}</p>
              <span className="stamp mt-3 bg-black/25 text-white border-white/20">
                Saved · {popup.queued} pending sync
              </span>
            </>
          )}
          {!popup.ok && (
            <p className="text-[15px] text-white/90 text-center mt-2">{popup.message}</p>
          )}
        </div>
      )}

      {/* ---- HEADER ---- */}
      <div className="bg-white border-b border-slate-300 px-4 py-3 sticky top-0 z-10 shadow-xs">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-[22px] h-[22px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-950 tracking-tight">Security Scanner</h1>
            <p className="text-[11px] text-slate-500">Offline-ready · validates locally · auto-syncs</p>
          </div>
          <button
            data-testid="open-history"
            onClick={() => setShowHistory(true)}
            className="relative p-2 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-950 cursor-pointer flex items-center justify-center transition-colors"
            title="View pending queue"
          >
            <HistoryIcon className="w-5 h-5" />
            {queueLen > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold font-mono border-2 border-white">
                {queueLen}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* ---- STATUS BAR ---- */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <div className="max-w-[480px] mx-auto flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 font-semibold ${online ? "text-emerald-700" : "text-orange-700"}`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{online ? "Online" : "Offline"}</span>
          </div>
          <div className={`flex items-center gap-1.5 font-semibold font-mono ${queueLen > 0 ? "text-orange-700" : "text-emerald-700"}`}>
            <CloudUpload className={`w-3.5 h-3.5 ${syncing ? "animate-pulse" : ""}`} />
            <span>{syncing ? "Syncing..." : queueLen > 0 ? `${queueLen} pending` : "All synced ✓"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-medium font-mono">
            <Download className="w-3.5 h-3.5" />
            <span>{cachedCount} students</span>
          </div>
        </div>
      </div>

      {/* ---- INSTALL BANNER ---- */}
      {installPromptEvt && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="max-w-[480px] mx-auto flex items-center justify-between gap-3">
            <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              Install this app to your home screen for offline scanning.
            </p>
            <button
              onClick={installApp}
              data-testid="install-app"
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* ---- MAIN CONTENT ---- */}
      <div className="flex-1 flex flex-col items-center px-4 py-5 max-w-[480px] mx-auto w-full box-border">

        {/* Camera box */}
        <div className="w-full bg-white border-2 border-slate-300/70 rounded-lg overflow-hidden mb-5 shadow-xs">
          <div
            id="sec-qr-reader"
            ref={scannerRef}
            style={{ width: "100%", aspectRatio: "1", display: scanning ? "block" : "none" }}
          />
          {!scanning && (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-100">
              <div className="w-20 h-20 rounded-full bg-white border border-slate-300 flex items-center justify-center mb-3">
                <Camera className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 text-center px-6">
                Tap <strong className="text-emerald-700">Start Scanner</strong> to open camera
              </p>
              {cachedCount === 0 && (
                <p className="mt-2 text-xs text-orange-700 px-6 text-center flex items-center gap-1.5 justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No students cached yet — connect to internet once first
                </p>
              )}
            </div>
          )}
        </div>

        {/* Late Entry banner */}
        {isLateEntryMode && (
          <div className="w-full mb-3 px-4 py-2.5 rounded-md bg-amber-100 border-2 border-amber-400 text-amber-800 text-[13px] font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            LATE ENTRY MODE IS ACTIVE
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="w-full mb-3 px-4 py-3 rounded-md bg-red-50 border border-red-300 text-red-800 text-[13px]">
            {cameraError}
          </div>
        )}

        {/* Late Entry Toggle */}
        <div className="w-full mb-4 bg-white border border-slate-300/70 rounded-lg px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-sm font-bold text-slate-950 mb-0.5">Late Entry Mode</p>
            <p className="text-xs text-slate-500">Flag scanned student as late entry</p>
          </div>
          <button
            onClick={() => setIsLateEntryMode(prev => !prev)}
            className={`w-[52px] h-7 rounded-full p-[3px] cursor-pointer flex items-center transition-colors ${
              isLateEntryMode ? "bg-amber-500" : "bg-slate-300"
            }`}
            aria-label="Toggle late entry mode"
          >
            <div
              className={`w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform ${
                isLateEntryMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Start / Stop Scanner button */}
        <div className="w-full flex gap-3 mb-3">
          {!scanning ? (
            <button
              data-testid="security-start-scanner"
              onClick={startScanner}
              disabled={cachedCount === 0}
              className={`flex-1 py-4 rounded-md font-bold text-base flex items-center justify-center gap-2 transition-colors ${
                cachedCount === 0
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              }`}
            >
              <Camera className="w-5 h-5" /> Start Scanner
            </button>
          ) : (
            <button
              data-testid="security-stop-scanner"
              onClick={stopScanner}
              className="flex-1 py-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Sync status message */}
        {syncStatusMsg && (
          <div
            className={`w-full mb-3 px-4 py-3 rounded-md text-[13px] font-semibold text-center ${
              syncError ? "bg-red-50 border border-red-300 text-red-800" : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            {syncStatusMsg}
          </div>
        )}

        {/* Action buttons grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={refreshCacheNow}
            disabled={refreshing}
            data-testid="refresh-students"
            className={`py-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              refreshing
                ? "bg-slate-50 border-slate-300 text-slate-500 opacity-60 cursor-not-allowed"
                : "bg-white border-slate-300 text-slate-800 hover:border-slate-400 cursor-pointer"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Students"}
          </button>
          <button
            onClick={() => runSync(true)}
            disabled={syncing || queueLen === 0}
            data-testid="sync-now"
            className={`py-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              syncing || queueLen === 0
                ? "bg-slate-50 border border-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            {syncing ? "Syncing..." : `Sync Now (${queueLen})`}
          </button>
        </div>

        {/* Download & Clear buttons (only when queue has items) */}
        {queueLen > 0 && (
          <div className="w-full flex flex-col gap-2 mb-3">
            <button
              onClick={downloadQueueJson}
              data-testid="download-scans-json"
              className="w-full py-3 rounded-md bg-amber-100 border-2 border-amber-400 text-amber-800 text-[13px] font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Offline Scans ({queueLen} items)
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Clear ${queueLen} pending items from local queue? Only do this if they're already in the database!`)) {
                  clearLocalQueue();
                  setQueue([]);
                  setSyncStatusMsg("✅ Local queue cleared.");
                  setTimeout(() => setSyncStatusMsg(""), 3000);
                }
              }}
              className="w-full py-2.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-slate-600 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              Clear Pending Queue ({queueLen})
            </button>
          </div>
        )}

        {/* Info footer */}
        <div className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono text-center">
          {cachedAt ? (
            <>Student cache updated {formatAgo(cachedAt)} · 5s cooldown between duplicate scans.</>
          ) : (
            <>Student cache empty — refresh once with internet to enable offline scanning.</>
          )}
          {lastSync && <> · Last sync {formatAgo(lastSync)}.</>}
        </div>
      </div>

      {/* ---- PENDING QUEUE MODAL ---- */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-t-xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <button
                  data-testid="close-history"
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer flex transition-colors"
                >
                  <ArrowLeft className="w-[18px] h-[18px]" />
                </button>
                <h2 className="text-[15px] font-bold text-slate-950">
                  Pending Sync <span className="font-mono">({queueLen})</span>
                </h2>
              </div>
              <button
                onClick={() => runSync(true)}
                disabled={syncing || queueLen === 0}
                className={`text-[13px] bg-transparent border-none transition-colors ${
                  syncing || queueLen === 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-emerald-700 hover:text-emerald-600 cursor-pointer font-semibold"
                }`}
              >
                {syncing ? "Syncing…" : "Sync Now"}
              </button>
            </div>
            <div data-testid="history-list" className="flex-1 overflow-y-auto">
              {queueLen === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No pending scans — everything is on the dashboard!</p>
                </div>
              ) : (
                queue.slice().reverse().map((s) => {
                  const u = findUserLocal(s.uniqueId);
                  return (
                    <div key={s.clientScanId} className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-800 font-mono shrink-0">
                        {(u?.name ?? s.uniqueId).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-950 mb-0.5 truncate">{u?.name ?? "Unknown"}</p>
                        <p className="text-xs text-slate-500 truncate">
                          <span className="font-mono">{s.uniqueId}</span> · <Clock className="inline w-[11px] h-[11px] align-middle" /> <span className="font-mono">{new Date(s.scannedAt).toLocaleTimeString()}</span>
                        </p>
                      </div>
                      <span className="stamp border-amber-400 bg-amber-100 text-amber-800 shrink-0">
                        Pending
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            {lastSync && (
              <div className="px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 text-center font-mono">
                Last sync {formatAgo(lastSync)} · auto-syncs every 3s when online
              </div>
            )}
          </div>
        </div>
      )}

      {/* tick for re-render */}
      <span className="hidden">{tick}</span>
    </div>
  );
}
