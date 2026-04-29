import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { CheckCircle, XCircle, QrCode, Camera, History as HistoryIcon, ArrowLeft, ShieldCheck } from "lucide-react";

type AttendanceRow = {
  id: number;
  userId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status: "inside" | "left" | "present";
  user?: { id: number; name: string; uniqueId: string; role: string };
};

type ScanReply =
  | { ok: true; action: "entry" | "exit"; userName: string; message: string }
  | { ok: false; message: string };

const POPUP_MS = 3000;

export default function SecurityApp() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [popup, setPopup] = useState<ScanReply | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inFlightRef = useRef(false);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);

  const showPopup = (r: ScanReply) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup(r);
    if (r.ok) {
      try { window.navigator?.vibrate?.(150); } catch {}
    }
    popupTimeoutRef.current = setTimeout(() => setPopup(null), POPUP_MS);
  };

  const submitScan = async (decodedText: string) => {
    const text = decodedText.trim();
    if (!text) return;
    if (inFlightRef.current) return;

    // Debounce same code within 3s to prevent spam scans.
    const last = lastScanRef.current;
    if (last && last.text === text && Date.now() - last.at < 3000) return;
    lastScanRef.current = { text, at: Date.now() };

    inFlightRef.current = true;
    try {
      const res = await customFetch<{
        action: "entry" | "exit" | "ignored";
        message: string;
        user?: { name: string };
      }>("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uniqueId: text }),
      });
      showPopup({
        ok: res.action !== "ignored",
        action: res.action as any,
        userName: res.user?.name ?? "",
        message: res.message,
      });
    } catch (err: any) {
      showPopup({
        ok: false,
        message: err?.data?.error ?? "Invalid QR Code",
      });
    } finally {
      inFlightRef.current = false;
    }
  };

  const startScanner = async () => {
    setCameraError("");
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;
      const scanner = new Html5Qrcode("sec-qr-reader");
      scannerInstanceRef.current = scanner;
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setCameraError("No cameras found.");
        setScanning(false);
        return;
      }
      const cameraId =
        cameras.find((c) => c.label.toLowerCase().includes("back"))?.id ??
        cameras[cameras.length - 1].id;
      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => { submitScan(text); },
        undefined
      );
    } catch (err) {
      console.error(err);
      setCameraError("Camera access denied. Please allow camera permission.");
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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await customFetch<AttendanceRow[]>("/api/attendance/recent?limit=50");
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold">Security Scanner</h1>
            <p className="text-xs text-slate-400">Scan student/staff QR to record entry/exit</p>
          </div>
          <button
            data-testid="open-history"
            onClick={openHistory}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="History"
          >
            <HistoryIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3-second popup */}
      {popup && (
        <div
          data-testid={popup.ok ? "scan-success" : "scan-error"}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ${
            popup.ok ? "bg-green-950/95" : "bg-red-950/95"
          }`}
        >
          {popup.ok ? (
            <CheckCircle className="w-24 h-24 text-green-400 mb-4" />
          ) : (
            <XCircle className="w-24 h-24 text-red-400 mb-4" />
          )}
          <p className={`text-3xl font-bold mb-2 ${popup.ok ? "text-green-400" : "text-red-400"}`}>
            {popup.ok ? "Access Granted" : "Invalid QR"}
          </p>
          {popup.ok && "userName" in popup && popup.userName && (
            <p className="text-2xl font-semibold text-white">{popup.userName}</p>
          )}
          <p className="text-sm text-slate-300 text-center mt-2">{popup.message}</p>
          {popup.ok && "action" in popup && popup.action && (
            <span className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
              popup.action === "entry" ? "bg-green-800 text-green-200" : "bg-blue-800 text-blue-200"
            }`}>
              {popup.action === "entry" ? "Entry recorded" : "Exit recorded"}
            </span>
          )}
        </div>
      )}

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center px-4 py-5 max-w-md mx-auto w-full">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
          <div
            id="sec-qr-reader"
            ref={scannerRef}
            className={`w-full aspect-square ${scanning ? "" : "hidden"}`}
          />
          {!scanning && (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-800/50">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                <Camera className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 text-center px-6">Press Start to open the camera.</p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="w-full mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm text-center">
            {cameraError}
          </div>
        )}

        <div className="w-full flex gap-3">
          {!scanning ? (
            <button
              data-testid="security-start-scanner"
              onClick={startScanner}
              className="flex-1 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
            >
              <Camera className="w-5 h-5" /> Start Scanner
            </button>
          ) : (
            <button
              data-testid="security-stop-scanner"
              onClick={stopScanner}
              className="flex-1 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-base font-bold"
            >
              Stop Scanner
            </button>
          )}
        </div>

        <Link href="/login">
          <span className="mt-6 text-xs text-slate-500 hover:text-blue-400 cursor-pointer">
            Admin / Mentor login →
          </span>
        </Link>
      </div>

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg sm:rounded-2xl bg-slate-900 border-t sm:border border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  data-testid="close-history"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-semibold text-white">Recent Scans</h2>
              </div>
              <button
                onClick={loadHistory}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Refresh
              </button>
            </div>
            <div data-testid="history-list" className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {historyLoading ? (
                <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No scans yet today</div>
              ) : (
                history.map((r) => {
                  const time = r.exitTime || r.entryTime;
                  const t = time ? new Date(time).toLocaleString() : "—";
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 flex-shrink-0">
                        {r.user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {r.user?.uniqueId} · {t}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === "inside"
                            ? "bg-green-900/50 text-green-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {r.status === "inside" ? "Inside" : "Left"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
