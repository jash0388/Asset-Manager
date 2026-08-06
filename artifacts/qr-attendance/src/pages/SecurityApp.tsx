import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  CheckCircle, XCircle, Camera, History as HistoryIcon, ArrowLeft,
  ShieldCheck, Wifi, WifiOff, RefreshCw, CloudUpload, Download, Clock,
  AlertTriangle,
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

  const [unlocked, setUnlocked] = useState(false);
  const [isLateEntryMode, setIsLateEntryMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "038899") {
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

  const runSync = useCallback(async (manual = false) => {
    const qLen = getQueue().length;
    if (qLen === 0) {
      if (manual) setSyncStatusMsg("✅ No pending scans — all synced!");
      return;
    }
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
        setSyncStatusMsg("⚠️ Server error — will retry automatically in 3s.");
      }
    } catch {
      setSyncError(true);
      setSyncStatusMsg("❌ Network error — retrying automatically...");
    } finally {
      setSyncing(false);
      setTimeout(() => { setSyncStatusMsg(""); setSyncError(false); }, 6000);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => { runSync(false); }, SYNC_INTERVAL_MS);
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
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("sec-qr-reader");
      scannerInstanceRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 240, height: 240 } };
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
      <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
              <ShieldCheck style={{ width: "32px", height: "32px", color: "#ffffff" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", margin: "0 0 6px", textAlign: "center" }}>SPHN Security Scanner</h1>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, textAlign: "center" }}>Enter passcode to access the scanner</p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Passcode
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ width: "100%", padding: "14px 16px", background: "#ffffff", border: "2px solid #E5E7EB", borderRadius: "12px", color: "#111827", textAlign: "center", fontFamily: "monospace", fontSize: "20px", letterSpacing: "0.3em", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#2563EB"}
              onBlur={e => e.target.style.borderColor = "#E5E7EB"}
              autoFocus
            />
            {passcodeError && (
              <p style={{ color: "#DC2626", fontSize: "12px", fontWeight: "600", marginTop: "8px", textAlign: "center" }}>{passcodeError}</p>
            )}
            <button
              type="submit"
              style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "12px", background: "#2563EB", color: "#ffffff", fontWeight: "700", fontSize: "15px", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "background 0.2s" }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.background = "#1D4ED8"}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.background = "#2563EB"}
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
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ---- SCAN RESULT POPUP (full screen overlay) ---- */}
      {popup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "24px",
          background: popup.ok ? "rgba(5,150,105,0.97)" : "rgba(185,28,28,0.97)",
        }}>
          {popup.ok ? (
            <CheckCircle style={{ width: "80px", height: "80px", color: "#ffffff", marginBottom: "16px" }} />
          ) : (
            <XCircle style={{ width: "80px", height: "80px", color: "#ffffff", marginBottom: "16px" }} />
          )}
          <p style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {popup.ok ? "✓ Access Granted" : "⚠ Already Scanned"}
          </p>
          {popup.ok && (
            <>
              <div style={{ margin: "12px 0", padding: "16px 32px", background: "rgba(255,255,255,0.15)", borderRadius: "16px", border: "2px solid rgba(255,255,255,0.4)", textAlign: "center" }}>
                <p style={{ fontSize: "36px", fontWeight: "900", color: "#ffffff", margin: 0, letterSpacing: "0.03em" }}>
                  {popup.user.name}
                </p>
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", margin: "4px 0" }}>{popup.user.uniqueId} · {popup.user.role}</p>
              <span style={{ marginTop: "8px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "rgba(0,0,0,0.2)", color: "#ffffff" }}>
                Saved · {popup.queued} pending sync
              </span>
            </>
          )}
          {!popup.ok && (
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: "8px" }}>{popup.message}</p>
          )}
        </div>
      )}

      {/* ---- HEADER ---- */}
      <div style={{ background: "#ffffff", borderBottom: "2px solid #E5E7EB", padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck style={{ width: "22px", height: "22px", color: "#ffffff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", margin: 0 }}>Security Scanner</h1>
            <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Offline-ready · validates locally · auto-syncs</p>
          </div>
          <button
            data-testid="open-history"
            onClick={() => setShowHistory(true)}
            style={{ padding: "8px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
            title="View pending queue"
          >
            <HistoryIcon style={{ width: "20px", height: "20px" }} />
            {queueLen > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#EF4444", color: "#fff", borderRadius: "10px", fontSize: "10px", fontWeight: "800", minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {queueLen}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ---- STATUS BAR ---- */}
      <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "8px 16px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: online ? "#059669" : "#D97706", fontWeight: "600" }}>
            {online ? <Wifi style={{ width: "14px", height: "14px" }} /> : <WifiOff style={{ width: "14px", height: "14px" }} />}
            <span>{online ? "Online" : "Offline"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: queueLen > 0 ? "#D97706" : "#059669", fontWeight: "600" }}>
            <CloudUpload style={{ width: "14px", height: "14px", ...(syncing ? { animation: "pulse 1s infinite" } : {}) }} />
            <span>{syncing ? "Syncing..." : queueLen > 0 ? `${queueLen} pending` : "All synced ✓"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7280", fontWeight: "500" }}>
            <Download style={{ width: "14px", height: "14px" }} />
            <span>{cachedCount} students</span>
          </div>
        </div>
      </div>

      {/* ---- INSTALL BANNER ---- */}
      {installPromptEvt && (
        <div style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE", padding: "8px 16px" }}>
          <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <p style={{ fontSize: "12px", color: "#1D4ED8", margin: 0, fontWeight: "500" }}>📱 Install this app to your home screen for offline scanning.</p>
            <button
              onClick={installApp}
              data-testid="install-app"
              style={{ padding: "6px 14px", borderRadius: "8px", background: "#2563EB", color: "#ffffff", fontSize: "12px", fontWeight: "700", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* ---- MAIN CONTENT ---- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", maxWidth: "480px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Camera box */}
        <div style={{ width: "100%", background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
          <div
            id="sec-qr-reader"
            ref={scannerRef}
            style={{ width: "100%", aspectRatio: "1", display: scanning ? "block" : "none" }}
          />
          {!scanning && (
            <div style={{ width: "100%", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <Camera style={{ width: "40px", height: "40px", color: "#9CA3AF" }} />
              </div>
              <p style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", padding: "0 24px", margin: 0 }}>
                Tap <strong style={{ color: "#2563EB" }}>Start Scanner</strong> to open camera
              </p>
              {cachedCount === 0 && (
                <p style={{ marginTop: "8px", fontSize: "12px", color: "#D97706", padding: "0 24px", textAlign: "center" }}>
                  ⚠️ No students cached yet — connect to internet once first
                </p>
              )}
            </div>
          )}
        </div>

        {/* Late Entry banner */}
        {isLateEntryMode && (
          <div style={{ width: "100%", marginBottom: "12px", padding: "10px 16px", borderRadius: "12px", background: "#FFFBEB", border: "2px solid #F59E0B", color: "#92400E", fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            ⚠️ LATE ENTRY MODE IS ACTIVE
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div style={{ width: "100%", marginBottom: "12px", padding: "12px 16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontSize: "13px" }}>
            {cameraError}
          </div>
        )}

        {/* Late Entry Toggle */}
        <div style={{ width: "100%", marginBottom: "16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 2px" }}>Late Entry Mode</p>
            <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Flag scanned student as late entry</p>
          </div>
          <button
            onClick={() => setIsLateEntryMode(prev => !prev)}
            style={{
              width: "52px", height: "28px", borderRadius: "14px", padding: "3px",
              background: isLateEntryMode ? "#F59E0B" : "#D1D5DB",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: "22px", height: "22px", borderRadius: "50%", background: "#ffffff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transform: isLateEntryMode ? "translateX(24px)" : "translateX(0)",
              transition: "transform 0.2s",
            }} />
          </button>
        </div>

        {/* Start / Stop Scanner button */}
        <div style={{ width: "100%", display: "flex", gap: "12px", marginBottom: "12px" }}>
          {!scanning ? (
            <button
              data-testid="security-start-scanner"
              onClick={startScanner}
              disabled={cachedCount === 0}
              style={{
                flex: 1, padding: "16px", borderRadius: "14px",
                background: cachedCount === 0 ? "#D1D5DB" : "#2563EB",
                color: "#ffffff", fontWeight: "800", fontSize: "16px",
                border: "none", cursor: cachedCount === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: cachedCount === 0 ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                transition: "background 0.2s",
              }}
            >
              <Camera style={{ width: "20px", height: "20px" }} /> Start Scanner
            </button>
          ) : (
            <button
              data-testid="security-stop-scanner"
              onClick={stopScanner}
              style={{
                flex: 1, padding: "16px", borderRadius: "14px",
                background: "#EF4444", color: "#ffffff",
                fontWeight: "800", fontSize: "16px",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
              }}
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Sync status message */}
        {syncStatusMsg && (
          <div style={{
            width: "100%", marginBottom: "12px", padding: "12px 16px",
            borderRadius: "12px",
            background: syncError ? "#FEF2F2" : "#EFF6FF",
            border: `1px solid ${syncError ? "#FECACA" : "#BFDBFE"}`,
            color: syncError ? "#991B1B" : "#1D4ED8",
            fontSize: "13px", fontWeight: "600", textAlign: "center",
          }}>
            {syncStatusMsg}
          </div>
        )}

        {/* Action buttons grid */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <button
            onClick={refreshCacheNow}
            disabled={refreshing}
            data-testid="refresh-students"
            style={{
              padding: "12px", borderRadius: "12px",
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              color: "#374151", fontSize: "12px", fontWeight: "600",
              cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              opacity: refreshing ? 0.6 : 1, transition: "background 0.2s",
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", ...(refreshing ? { animation: "spin 1s linear infinite" } : {}) }} />
            {refreshing ? "Refreshing..." : "Refresh Students"}
          </button>
          <button
            onClick={() => runSync(true)}
            disabled={syncing || queueLen === 0}
            data-testid="sync-now"
            style={{
              padding: "12px", borderRadius: "12px",
              background: syncing || queueLen === 0 ? "#F9FAFB" : "#2563EB",
              border: syncing || queueLen === 0 ? "1px solid #E5E7EB" : "none",
              color: syncing || queueLen === 0 ? "#9CA3AF" : "#ffffff",
              fontSize: "12px", fontWeight: "700",
              cursor: syncing || queueLen === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              boxShadow: syncing || queueLen === 0 ? "none" : "0 2px 8px rgba(37,99,235,0.3)",
            }}
          >
            <CloudUpload style={{ width: "14px", height: "14px" }} />
            {syncing ? "Syncing..." : `Sync Now (${queueLen})`}
          </button>
        </div>

        {/* Download & Clear buttons (only when queue has items) */}
        {queueLen > 0 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            <button
              onClick={downloadQueueJson}
              data-testid="download-scans-json"
              style={{
                width: "100%", padding: "13px", borderRadius: "12px",
                background: "#FFFBEB", border: "2px solid #F59E0B",
                color: "#92400E", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <Download style={{ width: "16px", height: "16px" }} />
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
              style={{
                width: "100%", padding: "10px", borderRadius: "12px",
                background: "#F9FAFB", border: "1px solid #E5E7EB",
                color: "#6B7280", fontSize: "12px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              Clear Pending Queue ({queueLen})
            </button>
          </div>
        )}

        {/* Info footer */}
        <div style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "12px", color: "#6B7280" }}>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "480px", background: "#ffffff", borderRadius: "20px 20px 0 0", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  data-testid="close-history"
                  onClick={() => setShowHistory(false)}
                  style={{ padding: "8px", borderRadius: "10px", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex" }}
                >
                  <ArrowLeft style={{ width: "18px", height: "18px", color: "#374151" }} />
                </button>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  Pending Sync ({queueLen})
                </h2>
              </div>
              <button
                onClick={() => runSync(true)}
                disabled={syncing || queueLen === 0}
                style={{ fontSize: "13px", color: syncing || queueLen === 0 ? "#9CA3AF" : "#2563EB", background: "none", border: "none", cursor: syncing || queueLen === 0 ? "not-allowed" : "pointer", fontWeight: "700" }}
              >
                {syncing ? "Syncing…" : "Sync Now"}
              </button>
            </div>
            <div data-testid="history-list" style={{ flex: 1, overflowY: "auto" }}>
              {queueLen === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280", fontSize: "14px" }}>
                  ✅ No pending scans — everything is on the dashboard!
                </div>
              ) : (
                queue.slice().reverse().map((s) => {
                  const u = findUserLocal(s.uniqueId);
                  return (
                    <div key={s.clientScanId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#2563EB", flexShrink: 0 }}>
                        {(u?.name ?? s.uniqueId).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u?.name ?? "Unknown"}</p>
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.uniqueId} · <Clock style={{ display: "inline", width: "11px", height: "11px", verticalAlign: "middle" }} /> {new Date(s.scannedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
                        Pending
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            {lastSync && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", fontSize: "12px", color: "#9CA3AF", textAlign: "center" }}>
                Last sync {formatAgo(lastSync)} · auto-syncs every 3s when online
              </div>
            )}
          </div>
        </div>
      )}

      {/* tick for re-render */}
      <span style={{ display: "none" }}>{tick}</span>
    </div>
  );
}
