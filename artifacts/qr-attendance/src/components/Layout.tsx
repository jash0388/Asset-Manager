import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  QrCode,
  CalendarDays,
  History,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  GraduationCap,
  Clock,
  Flag,
  Settings,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Bell,
  Check,
  ArrowRightLeft,
  Trash2,
  Download,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";


const adminNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/scanner", label: "QR Scanner", icon: QrCode },
  { href: "/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/hourly-attendance", label: "Hourly Attendance", icon: Clock },
  { href: "/history", label: "Student History", icon: History },
  { href: "/mentors", label: "Mentors", icon: GraduationCap },
];

const MASTER_PASSCODE = "038899";
const PASSCODE_KEY = "secapp.passcode.v1";
const getStoredPasscode = () => {
  try { return localStorage.getItem(PASSCODE_KEY) || MASTER_PASSCODE; } catch { return MASTER_PASSCODE; }
};

// ─── Training Sessions Tree Component ────────────────────────────────────────
function TrainingNavTree({ location, onNavigate }: { location: string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(true);

  const { data: rawData } = useQuery<any>({
    queryKey: ["training-sessions-nav"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("qr_token") || "";
        const res = await fetch("/api/admin/training-sessions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const sessions: any[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.sessions)) return rawData.sessions;
    return [];
  }, [rawData]);

  const isOnTraining = location.startsWith("/training-sessions");

  return (
    <div style={{ marginTop: "4px" }}>
      {/* Parent: Training Sessions header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 12px", borderRadius: "10px", marginBottom: "2px",
          cursor: "pointer", transition: "all 0.15s ease",
          background: isOnTraining ? "rgba(255,255,255,0.2)" : "transparent",
          color: isOnTraining ? "#ffffff" : "rgba(255,255,255,0.80)",
          fontWeight: isOnTraining ? "700" : "500",
        }}
        onMouseEnter={e => { if (!isOnTraining) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={e => { if (!isOnTraining) (e.currentTarget as HTMLDivElement).style.background = isOnTraining ? "rgba(255,255,255,0.2)" : "transparent"; }}
      >
        <Briefcase style={{ width: "16px", height: "16px", flexShrink: 0 }} />
        <span style={{ fontSize: "13px", flex: 1 }}>Training Sessions</span>
        {expanded
          ? <ChevronDown style={{ width: "12px", height: "12px", opacity: 0.7 }} />
          : <ChevronRight style={{ width: "12px", height: "12px", opacity: 0.7 }} />
        }
      </div>

      {/* Sub-tree items with branch lines */}
      {expanded && (
        <div style={{ marginLeft: "22px", position: "relative" }}>
          {/* Vertical branch line */}
          <div style={{
            position: "absolute", left: "8px", top: 0, bottom: "14px",
            width: "1.5px", background: "rgba(255,255,255,0.25)", borderRadius: "2px"
          }} />

          {/* All Sessions overview link */}
          <div style={{ position: "relative", paddingLeft: "20px", marginBottom: "2px" }}>
            <div style={{ position: "absolute", left: "8px", top: "50%", width: "12px", height: "1.5px", background: "rgba(255,255,255,0.25)" }} />
            <Link href="/training-sessions" onClick={onNavigate}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "7px 10px", borderRadius: "8px", cursor: "pointer",
                transition: "all 0.15s", fontSize: "12px",
                background: location === "/training-sessions" ? "rgba(255,255,255,0.18)" : "transparent",
                color: location === "/training-sessions" ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: location === "/training-sessions" ? "700" : "400",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = location === "/training-sessions" ? "rgba(255,255,255,0.18)" : "transparent"; }}
              >
                <span>📋</span> All Sessions
              </div>
            </Link>
          </div>

          {/* Per-session links */}
          {(sessions || []).map((s: any, idx: number) => {
            const href = `/training-sessions/${s.id}`;
            const isActive = location === href;
            const isLast = idx === sessions.length - 1;
            return (
              <div key={s.id} style={{ position: "relative", paddingLeft: "20px", marginBottom: "2px" }}>
                {/* Horizontal branch connector */}
                <div style={{ position: "absolute", left: "8px", top: "50%", width: "12px", height: "1.5px", background: "rgba(255,255,255,0.25)" }} />
                <Link href={href} onClick={onNavigate}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "7px 10px", borderRadius: "8px", cursor: "pointer",
                    transition: "all 0.15s", fontSize: "12px",
                    background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                    fontWeight: isActive ? "700" : "400",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isActive ? "rgba(255,255,255,0.18)" : "transparent"; }}
                  >
                    <span>🏢</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
                </Link>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div style={{ paddingLeft: "20px", fontSize: "11px", color: "rgba(255,255,255,0.4)", padding: "6px 10px 6px 28px" }}>
              No sessions yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const { admin, hod, principal, role, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canInstall, install } = usePwaInstall();

  // ---- Settings modal ----
  const [showSettings, setShowSettings] = useState(false);
  const [settingsStep, setSettingsStep] = useState<"verify" | "change">("verify");
  const [settingsCurrentPwd, setSettingsCurrentPwd] = useState("");
  const [settingsNewPwd, setSettingsNewPwd] = useState("");
  const [settingsConfirmPwd, setSettingsConfirmPwd] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const openSettings = () => {
    setSettingsStep("verify");
    setSettingsCurrentPwd(""); setSettingsNewPwd(""); setSettingsConfirmPwd("");
    setSettingsError(""); setSettingsSuccess("");
    setShowSettings(true);
  };

  const handleVerifyForSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPasscode();
    if (settingsCurrentPwd === stored || settingsCurrentPwd === MASTER_PASSCODE) {
      setSettingsStep("change"); setSettingsError("");
    } else { setSettingsError("Incorrect passcode."); }
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsNewPwd.length < 4) { setSettingsError("Min 4 characters."); return; }
    if (settingsNewPwd !== settingsConfirmPwd) { setSettingsError("Passcodes don't match."); return; }
    try {
      localStorage.setItem(PASSCODE_KEY, settingsNewPwd);
      setSettingsSuccess("✅ Passcode updated!"); setSettingsError("");
      setTimeout(() => setShowSettings(false), 1500);
    } catch { setSettingsError("Storage unavailable."); }
  };

  const navLinks = role === "principal"
    ? [
        { href: "/principal-dashboard", label: "Principal Portal", icon: LayoutDashboard },
        { href: "/principal-dashboard?tab=flags", label: "Risk Flag Analytics", icon: Flag },
        { href: "/hod-dashboard?tab=student-analytics", label: "Student Analytics", icon: Users },
        { href: "/hourly-attendance", label: "Hourly Attendance", icon: Clock },
      ]
    : role === "hod"
    ? [
        { href: "/hod-dashboard", label: "HOD Dashboard", icon: LayoutDashboard },
        { href: "/hod-dashboard?tab=flags", label: "Risk Flag Analytics", icon: Flag },
        { href: "/hod-dashboard?tab=student-analytics", label: "Student Analytics", icon: Users },
        { href: "/hourly-attendance", label: "Hourly Attendance", icon: Clock },
      ]
    : role === "mentor"
    ? [
        { href: "/incharge-dashboard", label: "Class Incharge Portal", icon: LayoutDashboard },
        { href: "/mentor", label: "Take Class Attendance", icon: QrCode },
        { href: "/hod-dashboard?tab=student-analytics", label: "Student Analytics", icon: Users },
        { href: "/hourly-attendance", label: "Hourly Attendance", icon: Clock },
      ]
    : adminNavLinks;

  const userDisplayName = role === "principal" ? principal?.name : role === "hod" ? hod?.name : admin?.name ?? "Admin";
  const userEmail = role === "principal" ? principal?.email : role === "hod" ? hod?.email : admin?.email ?? "";
  const queryClient = useQueryClient();

  // ── Notification Popover & Approvals State ──
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] = useState<string | null>(null);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("qr_cleared_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data: reassignmentsResponse, refetch: refetchLayoutReassignments } = useQuery<any>({
    queryKey: ["layout-reassignments"],
    queryFn: async () => {
      try {
        return await customFetch("/api/admin/reassignments");
      } catch {
        return { reassignments: [] };
      }
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  const rawReassignments = reassignmentsResponse?.reassignments || [];
  const activeNotifications = useMemo(() => {
    return rawReassignments.filter((r: any) => !clearedNotificationIds.includes(r.id));
  }, [rawReassignments, clearedNotificationIds]);

  const pendingCount = useMemo(() => {
    return activeNotifications.filter((r: any) => r.status === "pending").length;
  }, [activeNotifications]);

  const handleClearAllNotifications = () => {
    const allIds = rawReassignments.map((r: any) => r.id);
    const newCleared = Array.from(new Set([...clearedNotificationIds, ...allIds]));
    setClearedNotificationIds(newCleared);
    try {
      localStorage.setItem("qr_cleared_notifications", JSON.stringify(newCleared));
    } catch {}
  };

  const handleClearSingleNotification = (id: string) => {
    const newCleared = Array.from(new Set([...clearedNotificationIds, id]));
    setClearedNotificationIds(newCleared);
    try {
      localStorage.setItem("qr_cleared_notifications", JSON.stringify(newCleared));
    } catch {}
  };

  const handleNotificationAction = async (id: string, action: "accept" | "decline") => {
    setProcessingNotificationId(id);
    try {
      await customFetch(`/api/admin/reassignments/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      refetchLayoutReassignments();
      queryClient.invalidateQueries({ queryKey: ["layout-reassignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-list-status"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-attendance-schedules"] });
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setProcessingNotificationId(null);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside style={{
        position: "fixed", inset: "0 auto 0 0", zIndex: 50,
        width: "240px",
        background: "linear-gradient(160deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)",
        display: "flex", flexDirection: "column",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease",
        boxShadow: "4px 0 24px rgba(37,99,235,0.25)",
      }}
        className="lg:relative lg:translate-x-0"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 14px 14px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <img
            src="/pwa-192x192.png"
            alt="Sphoorthy Logo"
            style={{ width: "34px", height: "34px", borderRadius: "8px", objectFit: "contain", background: "#ffffff", padding: "2px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: "800", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>Hourly Attendance</p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sphoorthy Engg College</p>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex" }} className="lg:hidden">
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 8px", marginBottom: "8px" }}>Navigation</p>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const currentFull = window.location.pathname + window.location.search;
            const isActive = href.includes("tab=flags")
              ? currentFull.includes("tab=flags")
              : href.includes("tab=student-analytics")
              ? currentFull.includes("tab=student-analytics")
              : currentFull === href ||
                (href === "/hod-dashboard" && !currentFull.includes("tab=") && location.startsWith("/hod-dashboard")) ||
                (href === "/principal-dashboard" && !currentFull.includes("tab=") && location.startsWith("/principal-dashboard"));

            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setMobileOpen(false);
                    if (href.includes("tab=") || href === "/hod-dashboard" || href === "/principal-dashboard") {
                      window.history.pushState({}, "", href);
                      window.dispatchEvent(new Event("popstate"));
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 12px", borderRadius: "10px", marginBottom: "2px",
                    cursor: "pointer", transition: "all 0.15s ease",
                    background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                    boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : "none",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                    fontWeight: isActive ? "700" : "500",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px" }}>{label}</span>
                </div>
              </Link>
            );
          })}

          {/* Training Sessions Tree Nav — HOD & Admin only */}
          {(role === "hod" || role === "admin") && (
            <TrainingNavTree location={location} onNavigate={() => setMobileOpen(false)} />
          )}
        </nav>

        {/* Bottom: user + settings + logout */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 10px 8px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: "#ffffff", flexShrink: 0 }}>
              {userDisplayName?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userDisplayName}</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
            </div>
          </div>

          {/* Settings */}
          {(role === "hod" || role === "principal" || role === "admin") && (
            <button
              data-testid="sidebar-settings"
              onClick={openSettings}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", transition: "background 0.15s", marginBottom: "2px" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
            >
              <Settings style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "13px", fontWeight: "500" }}>Settings</span>
            </button>
          )}

          {/* Logout */}
          <button
            data-testid="logout-button"
            onClick={logout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,100,100,0.2)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
          >
            <LogOut style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }} onClick={() => setMobileOpen(false)} className="lg:hidden" />
      )}

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {/* Header bar (desktop & mobile) */}
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shadow-xs z-30 relative">
          <div className="flex items-center gap-3">
            <button data-testid="mobile-menu-button" onClick={() => setMobileOpen(true)} className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/pwa-192x192.png" alt="Logo" className="w-6 h-6 rounded-md object-contain bg-white border border-slate-200 p-0.5 shadow-2xs" />
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">Hourly Attendance</span>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Notification Bell with Badge and Popover Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  notificationsOpen
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-xs animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
                  style={{ minWidth: "320px" }}
                >
                  {/* Popover Header */}
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black">Notifications & Approvals</span>
                      {activeNotifications.length > 0 && (
                        <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-extrabold">
                          {activeNotifications.length}
                        </span>
                      )}
                    </div>
                    {activeNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-extrabold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {/* Popover Body */}
                  <div className="p-3 space-y-2.5 overflow-y-auto max-h-[420px] bg-slate-50/50">
                    {activeNotifications.length === 0 ? (
                      <div className="p-6 text-center space-y-2 bg-white rounded-xl border border-slate-200/80">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">No New Notifications</p>
                        <p className="text-[11px] text-slate-500">All substitution requests have been cleared or handled.</p>
                      </div>
                    ) : (
                      activeNotifications.map((r: any) => {
                        const isPending = r.status === "pending";
                        const isAccepted = r.status === "accepted";
                        const isDeclined = r.status === "declined";

                        return (
                          <div
                            key={r.id}
                            className={`p-3 rounded-xl border bg-white shadow-xs space-y-2 relative transition-all ${
                              isPending
                                ? "border-amber-300 ring-1 ring-amber-200"
                                : isAccepted
                                ? "border-emerald-200"
                                : "border-rose-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {r.date} &bull; {r.slot}
                              </span>

                              {/* Status Badge with Tick or X mark */}
                              {isPending ? (
                                <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending HOD</span>
                                </span>
                              ) : isAccepted ? (
                                <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Accepted</span>
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                                  <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                                  <span>Declined</span>
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-black text-slate-900">{r.subject} ({r.section})</p>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 pt-0.5">
                                <span className="text-slate-600">{r.fromFacultyName}</span>
                                <span className="text-indigo-600 font-bold">➔</span>
                                <span className="text-indigo-900 font-extrabold">{r.toFacultyName}</span>
                              </div>
                            </div>

                            {r.reason && (
                              <p className="text-[10.5px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <strong className="text-slate-700">Reason:</strong> {r.reason}
                              </p>
                            )}

                            {/* Action Buttons for Pending or Status for Accepted/Declined */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                              <button
                                type="button"
                                onClick={() => handleClearSingleNotification(r.id)}
                                className="text-[10.5px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                Dismiss
                              </button>

                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "decline")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-2.5 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Decline</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "accept")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Accept</span>
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>Assigned to {r.toFacultyName}</span>
                                </span>
                              ) : (
                                <span className="text-[10.5px] font-bold text-rose-700 flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                                  <span>Reassignment Declined</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear Button */}
            <button
              onClick={openSettings}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5 text-slate-700" />
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ width: "100%", maxWidth: "360px", background: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings style={{ width: "18px", height: "18px", color: "#2563EB" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "800", color: "#111827", margin: 0 }}>System Settings</p>
                  <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Account Options & Passcode</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: "16px", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "20px", spaceY: "16px" }}>
              <div style={{ padding: "14px", borderRadius: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>Logged in Account</p>
                <p style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: "2px 0 0" }}>{userDisplayName}</p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#2563EB", margin: "2px 0 0" }}>{userEmail}</p>
              </div>

              {settingsStep === "verify" && (
                <form onSubmit={handleVerifyForSettings}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Current Passcode</label>
                  <input type="password" placeholder="••••••" value={settingsCurrentPwd}
                    onChange={e => { setSettingsCurrentPwd(e.target.value); setSettingsError(""); }}
                    style={{ width: "100%", padding: "12px 16px", background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: "12px", color: "#111827", textAlign: "center", fontFamily: "monospace", fontSize: "20px", letterSpacing: "0.3em", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} autoFocus />
                  {settingsError && <p style={{ color: "#DC2626", fontSize: "12px", fontWeight: "600", textAlign: "center", marginTop: "8px" }}>{settingsError}</p>}
                  <button type="submit" style={{ width: "100%", marginTop: "14px", padding: "12px", borderRadius: "12px", background: "#2563EB", color: "#fff", fontWeight: "700", fontSize: "14px", border: "none", cursor: "pointer" }}>Change Passcode →</button>
                </form>
              )}

              {settingsStep === "change" && (
                <form onSubmit={handleChangePasscode}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>New Passcode</label>
                    <input type="password" placeholder="Min 4 characters" value={settingsNewPwd}
                      onChange={e => { setSettingsNewPwd(e.target.value); setSettingsError(""); }}
                      style={{ width: "100%", padding: "12px 16px", background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: "12px", color: "#111827", textAlign: "center", fontFamily: "monospace", fontSize: "20px", letterSpacing: "0.3em", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} autoFocus />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Confirm Passcode</label>
                    <input type="password" placeholder="Repeat passcode" value={settingsConfirmPwd}
                      onChange={e => { setSettingsConfirmPwd(e.target.value); setSettingsError(""); }}
                      style={{ width: "100%", padding: "12px 16px", background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: "12px", color: "#111827", textAlign: "center", fontFamily: "monospace", fontSize: "20px", letterSpacing: "0.3em", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
                  </div>
                  {settingsError && <p style={{ color: "#DC2626", fontSize: "12px", fontWeight: "600", textAlign: "center", marginTop: "8px" }}>{settingsError}</p>}
                  {settingsSuccess && <p style={{ color: "#059669", fontSize: "13px", fontWeight: "700", textAlign: "center", marginTop: "8px" }}>{settingsSuccess}</p>}
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button type="button" onClick={() => setSettingsStep("verify")} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#374151", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>← Back</button>
                    <button type="submit" style={{ flex: 2, padding: "12px", borderRadius: "12px", background: "#2563EB", color: "#fff", fontWeight: "700", fontSize: "14px", border: "none", cursor: "pointer" }}>Save Passcode</button>
                  </div>
                </form>
              )}

              <button
                onClick={() => { setShowSettings(false); logout(); }}
                style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "12px", background: "#DC2626", color: "#ffffff", fontWeight: "800", fontSize: "14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <LogOut style={{ width: "18px", height: "18px" }} />
                LOGOUT FROM ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
