import { useEffect, useRef, useState } from "react";
import { useScanQr, getGetDashboardStatsQueryKey, getGetTodayAttendanceQueryKey, getGetCurrentlyInsideQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, QrCode, Camera, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

type ScanResult = {
  success: boolean;
  message: string;
  userName?: string;
  action?: string;
};

export default function Scanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const queryClient = useQueryClient();
  const scanMutation = useScanQr();

  const clearResult = () => {
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    setResult(null);
  };

  const showResult = (r: ScanResult) => {
    setResult(r);
    if (r.success) {
      try { window.navigator?.vibrate?.(200); } catch {}
    }
    resultTimeoutRef.current = setTimeout(() => {
      setResult(null);
    }, 4000);
  };

  const handleScan = (decodedText: string) => {
    if (scanMutation.isPending) return;
    const uid = (decodedText ?? "").trim();
    if (!uid) return;
    scanMutation.mutate(
      { uniqueId: uid },
      {
        onSuccess: (data) => {
          showResult({
            success: data.action !== "ignored",
            message: data.message,
            userName: data.user?.name,
            action: data.action,
          });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentlyInsideQueryKey() });
        },
        onError: (err: any) => {
          showResult({
            success: false,
            message: err?.data?.error ?? "Invalid QR code",
          });
        },
      }
    );
  };

  const startScanner = async () => {
    setCameraError("");
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setCameraError("No cameras found. Please connect a camera.");
        setScanning(false);
        return;
      }

      const cameraId = cameras.find((c) => c.label.toLowerCase().includes("back"))?.id ?? cameras[cameras.length - 1].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Link href="/dashboard">
            <button
              data-testid="back-button"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">QR Scanner</h1>
            <p className="text-xs text-slate-400">Scan student ID card to mark attendance</p>
          </div>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-md mx-auto w-full">
        {/* Scan result overlay */}
        {result && (
          <div
            data-testid={result.success ? "scan-success" : "scan-error"}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 transition-all ${
              result.success ? "bg-green-950/95" : "bg-red-950/95"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-red-400 mb-4" />
            )}
            <p className={`text-3xl font-bold mb-2 ${result.success ? "text-green-400" : "text-red-400"}`}>
              {result.success ? "Access Granted" : "Access Denied"}
            </p>
            {result.userName && (
              <p className="text-xl font-semibold text-white mb-2">{result.userName}</p>
            )}
            <p className="text-base text-slate-300 text-center">{result.message}</p>
            {result.action && (
              <span className={`mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${
                result.action === "entry" ? "bg-green-800 text-green-200" : "bg-blue-800 text-blue-200"
              }`}>
                {result.action === "entry" ? "Entry Recorded" : result.action === "exit" ? "Exit Recorded" : "Recorded"}
              </span>
            )}
            <button
              onClick={clearResult}
              className="mt-8 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
            >
              Continue Scanning
            </button>
          </div>
        )}

        {/* Scanner viewport */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
          <div
            id="qr-reader"
            ref={scannerRef}
            className={`w-full aspect-square ${scanning ? "" : "hidden"}`}
          />
          {!scanning && (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-800/50">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <Camera className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 text-center px-6">
                Camera is off. Press Start to begin scanning.
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm text-center">
            {cameraError}
          </div>
        )}

        {/* Controls */}
        <div className="w-full flex gap-3">
          {!scanning ? (
            <button
              data-testid="start-scanner"
              onClick={startScanner}
              className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-900/30"
            >
              <Camera className="w-5 h-5" />
              Start Scanner
            </button>
          ) : (
            <button
              data-testid="stop-scanner"
              onClick={stopScanner}
              className="flex-1 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-base font-bold flex items-center justify-center gap-3 transition-colors"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 w-full space-y-2">
          {[
            "Point camera at QR code on ID card",
            "Hold steady until scan is detected",
            "Wait for confirmation before next scan",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-400">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
