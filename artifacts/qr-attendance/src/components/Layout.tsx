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
  List,
  Building2,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";


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
    <div className="mt-1">
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors cursor-pointer ${
          isOnTraining
            ? "bg-slate-800 text-slate-50 font-semibold"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"
        }`}
      >
        <Briefcase className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Training Sessions</span>
        {expanded
          ? <ChevronDown className="w-3 h-3 opacity-60" />
          : <ChevronRight className="w-3 h-3 opacity-60" />}
      </button>

      {expanded && (
        <div className="ml-[22px] relative">
          <div className="absolute left-0 top-0 bottom-3 w-px bg-slate-700/70" aria-hidden />

          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 w-3 h-px bg-slate-700/70" aria-hidden />
            <Link href="/training-sessions" onClick={onNavigate}>
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  location === "/training-sessions"
                    ? "bg-slate-800 text-slate-50 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <List className="w-3 h-3 shrink-0" />
                <span>All Sessions</span>
              </div>
            </Link>
          </div>

          {(sessions || []).map((s: any) => {
            const href = `/training-sessions/${s.id}`;
            const isActive = location === href;
            return (
              <div key={s.id} className="relative pl-4 mt-0.5">
                <div className="absolute left-0 top-1/2 w-3 h-px bg-slate-700/70" aria-hidden />
                <Link href={href} onClick={onNavigate}>
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      isActive
                        ? "bg-slate-800 text-slate-50 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </div>
                </Link>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="pl-6 py-1.5 text-[11px] text-slate-600">No sessions yet</div>
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
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (e.matches) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      setSettingsSuccess("Passcode updated."); setSettingsError("");
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

  const initials = userDisplayName?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-slate-100">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className={`${isDesktop && sidebarOpen ? "relative" : "fixed inset-y-0 left-0"} z-50 w-[248px] shrink-0 flex flex-col bg-slate-950 border-r border-slate-800 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 relative">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="absolute bottom-0 left-1.5 right-1.5 h-[2px] bg-emerald-500/80" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-slate-50 truncate" style={{ fontFamily: "var(--app-font-display)" }}>
              SPHN Attendance
            </p>
            <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 truncate">
              Control Console
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="eyebrow text-slate-600 px-2 mb-2">Registry</p>
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
                    if (!isDesktop) setSidebarOpen(false);
                    if (href.includes("tab=") || href === "/hod-dashboard" || href === "/principal-dashboard") {
                      window.history.pushState({}, "", href);
                      window.dispatchEvent(new Event("popstate"));
                    }
                  }}
                  className={`relative flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-md mb-0.5 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-800 text-slate-50 font-semibold"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-emerald-500" aria-hidden />
                  )}
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[13px]">{label}</span>
                </div>
              </Link>
            );
          })}

          {/* Training Sessions Tree Nav — HOD & Admin only */}
          {(role === "hod" || role === "admin") && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <p className="eyebrow text-slate-600 px-2 mb-1.5">Programs</p>
              <TrainingNavTree location={location} onNavigate={() => { if (!isDesktop) setSidebarOpen(false); }} />
            </div>
          )}
        </nav>

        {/* Bottom: user + settings + logout */}
        <div className="px-3 py-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-1.5 pb-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0 font-mono">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userDisplayName}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>

          {(role === "hod" || role === "principal" || role === "admin") && (
            <button
              data-testid="sidebar-settings"
              onClick={openSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-900 hover:text-slate-200 text-[13px] font-medium transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}

          <button
            data-testid="logout-button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-400 hover:bg-red-950/50 hover:text-red-300 text-[13px] font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && !isDesktop && (
        <div className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header bar (desktop & mobile) */}
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-300/70 bg-slate-50 z-30 relative">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                data-testid="mobile-menu-button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 -ml-1 rounded-md border border-slate-300 bg-card text-slate-600 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-[13px] font-bold text-slate-950 tracking-tight" style={{ fontFamily: "var(--app-font-display)" }}>
                SPHN Attendance
              </span>
              <span className="hidden sm:inline stamp border-slate-300 text-slate-500 bg-card">{role ?? "staff"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Notification Bell with Badge and Popover Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`relative p-2 rounded-md border transition-colors cursor-pointer flex items-center justify-center ${
                  notificationsOpen
                    ? "bg-slate-950 border-slate-950 text-slate-50"
                    : "bg-card border-slate-300 text-slate-600 hover:text-slate-950 hover:border-slate-400"
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold font-mono text-white border-2 border-slate-50">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-card rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
                  style={{ minWidth: "320px" }}
                >
                  {/* Popover Header */}
                  <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="eyebrow text-slate-300">Notifications &amp; Approvals</span>
                      {activeNotifications.length > 0 && (
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {activeNotifications.length}
                        </span>
                      )}
                    </div>
                    {activeNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear all</span>
                      </button>
                    )}
                  </div>

                  {/* Popover Body */}
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[420px] bg-slate-100/60">
                    {activeNotifications.length === 0 ? (
                      <div className="p-6 text-center space-y-2 bg-card rounded-md border border-slate-200">
                        <div className="w-9 h-9 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-900">No pending notices</p>
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
                            className={`p-3 rounded-md border bg-card space-y-2 relative ${
                              isPending
                                ? "border-amber-300 ring-1 ring-amber-200/60"
                                : isAccepted
                                ? "border-emerald-200"
                                : "border-red-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="stamp border-slate-300 text-slate-600 bg-slate-50">
                                {r.date} &middot; {r.slot}
                              </span>

                              {isPending ? (
                                <span className="stamp border-amber-300 bg-amber-50 text-amber-800">Pending HOD</span>
                              ) : isAccepted ? (
                                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                                  <Check className="w-3 h-3" /> Accepted
                                </span>
                              ) : (
                                <span className="stamp border-red-300 bg-red-50 text-red-800">
                                  <X className="w-3 h-3" /> Declined
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-slate-900">{r.subject} ({r.section})</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-0.5">
                                <span>{r.fromFacultyName}</span>
                                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                <span className="font-semibold text-slate-900">{r.toFacultyName}</span>
                              </div>
                            </div>

                            {r.reason && (
                              <p className="text-[10.5px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <span className="font-semibold text-slate-700">Reason:</span> {r.reason}
                              </p>
                            )}

                            {/* Action Buttons for Pending or Status for Accepted/Declined */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 gap-2">
                              <button
                                type="button"
                                onClick={() => handleClearSingleNotification(r.id)}
                                className="text-[10.5px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                Dismiss
                              </button>

                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "decline")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-2.5 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Decline</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "accept")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Accept</span>
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <span className="text-[10.5px] font-medium text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Assigned to {r.toFacultyName}</span>
                                </span>
                              ) : (
                                <span className="text-[10.5px] font-medium text-red-800 flex items-center gap-1">
                                  <X className="w-3.5 h-3.5 text-red-600" />
                                  <span>Reassignment declined</span>
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
              className="p-2 rounded-md bg-card border border-slate-300 text-slate-600 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-md bg-card border border-slate-300 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-800 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-100 bg-slate-950/50 flex items-center justify-center p-6">
          <div className="w-full max-w-[380px] bg-card rounded-lg shadow-xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950" style={{ fontFamily: "var(--app-font-display)" }}>System Settings</p>
                  <p className="text-[11px] text-slate-500">Account options &amp; passcode</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Close settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="px-3.5 py-3 rounded-md bg-slate-50 border border-slate-200">
                <p className="eyebrow text-slate-500">Signed in</p>
                <p className="text-sm font-semibold text-slate-950 mt-1">{userDisplayName}</p>
                <p className="text-[11px] font-mono text-slate-500">{userEmail}</p>
              </div>

              {settingsStep === "verify" && (
                <form onSubmit={handleVerifyForSettings} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="eyebrow block text-slate-600">Current Passcode</label>
                    <input type="password" placeholder="••••••" value={settingsCurrentPwd}
                      onChange={e => { setSettingsCurrentPwd(e.target.value); setSettingsError(""); }}
                      className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-300 text-slate-950 text-center font-mono text-xl tracking-[0.3em] outline-none focus:bg-card focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors box-border"
                      autoFocus />
                  </div>
                  {settingsError && <p className="text-red-700 text-xs font-semibold text-center">{settingsError}</p>}
                  <button type="submit" className="w-full py-2.5 rounded-md bg-slate-950 hover:bg-emerald-800 text-slate-50 font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer">
                    Change Passcode →
                  </button>
                </form>
              )}

              {settingsStep === "change" && (
                <form onSubmit={handleChangePasscode} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="eyebrow block text-slate-600">New Passcode</label>
                    <input type="password" placeholder="Min 4 characters" value={settingsNewPwd}
                      onChange={e => { setSettingsNewPwd(e.target.value); setSettingsError(""); }}
                      className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-300 text-slate-950 text-center font-mono text-xl tracking-[0.3em] outline-none focus:bg-card focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors box-border"
                      autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <label className="eyebrow block text-slate-600">Confirm Passcode</label>
                    <input type="password" placeholder="Repeat passcode" value={settingsConfirmPwd}
                      onChange={e => { setSettingsConfirmPwd(e.target.value); setSettingsError(""); }}
                      className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-300 text-slate-950 text-center font-mono text-xl tracking-[0.3em] outline-none focus:bg-card focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors box-border" />
                  </div>
                  {settingsError && <p className="text-red-700 text-xs font-semibold text-center">{settingsError}</p>}
                  {settingsSuccess && <p className="text-emerald-700 text-xs font-semibold text-center">{settingsSuccess}</p>}
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setSettingsStep("verify")} className="flex-1 py-2.5 rounded-md bg-card border border-slate-300 text-slate-700 hover:border-slate-400 font-semibold text-xs transition-colors cursor-pointer">← Back</button>
                    <button type="submit" className="flex-[2] py-2.5 rounded-md bg-slate-950 hover:bg-emerald-800 text-slate-50 font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer">Save Passcode</button>
                  </div>
                </form>
              )}

              <button
                onClick={() => { setShowSettings(false); logout(); }}
                className="w-full py-3 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout from account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
