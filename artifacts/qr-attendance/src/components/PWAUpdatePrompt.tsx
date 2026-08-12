import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 60_000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 32px)",
        maxWidth: "400px",
        background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
        color: "#ffffff",
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(37, 99, 235, 0.45), 0 2px 8px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border: "1px solid rgba(255,255,255,0.2)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <RefreshCw style={{ width: "18px", height: "18px", color: "#ffffff" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: "800", margin: 0, color: "#ffffff" }}>
          New Update Available! 🎉
        </p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", margin: "2px 0 0", fontWeight: "500" }}>
          Tap Refresh to get the latest version
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={() => updateServiceWorker(true)}
          style={{ padding: "8px 16px", borderRadius: "10px", background: "#ffffff", color: "#1E40AF", fontWeight: "800", fontSize: "12px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Refresh Now
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          title="Dismiss"
        >
          <X style={{ width: "14px", height: "14px", color: "#ffffff" }} />
        </button>
      </div>
    </div>
  );
}
