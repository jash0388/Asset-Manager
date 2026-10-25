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
  Bell,
  Check,
  List,
  Building2,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
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

// ─── Training Programs Dropdown (desktop) ────────────────────────────────────
function TrainingProgramsMenu({ location, onNavigate }: { location: string; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
          isOnTraining
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Briefcase className="w-4 h-4" />
        <span>Training</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-lg border border-slate-300 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <p className="eyebrow text-slate-500 px-4 pt-3 pb-2 border-b border-slate-200">Training Programs</p>
          <div className="max-h-72 overflow-y-auto p-1.5">
            <Link href="/training-sessions" onClick={() => { setOpen(false); onNavigate(); }}>
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                location === "/training-sessions" ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-slate-700 hover:bg-slate-100"
              }`}>
                <List className="w-4 h-4 shrink-0 text-slate-500" />
                <span>All Sessions</span>
              </div>
            </Link>
            {(sessions || []).map((s: any) => {
              const href = `/training-sessions/${s.id}`;
              const isActive = location === href;
              return (
                <Link key={s.id} href={href} onClick={() => { setOpen(false); onNavigate(); }}>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                    isActive ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`}>
                    <Building2 className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">{s.name}</span>
                  </div>
                </Link>
              );
            })}
            {sessions.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-slate-500">No sessions yet</p>
            )}
          </div>
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

  useEffect(() => { setMobileOpen(false); }, [location]);

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
    } catch (err: any) {
      console.error("Action error:", err);
      const { toast } = await import("@/hooks/use-toast");
      let msg = err?.message || err?.error || "Request could not be processed.";
      if (typeof msg === "string" && (msg.includes("<") || msg.includes("<!DOCTYPE"))) {
        msg = "Server error — the reassignment was not updated.";
      }
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: msg,
      });
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const initials = userDisplayName?.charAt(0).toUpperCase() ?? "U";

  const isNavLinkActive = (href: string) => {
    const currentFull = window.location.pathname + window.location.search;
    return href.includes("tab=flags")
      ? currentFull.includes("tab=flags")
      : href.includes("tab=student-analytics")
      ? currentFull.includes("tab=student-analytics")
      : currentFull === href ||
        (href === "/hod-dashboard" && !currentFull.includes("tab=") && location.startsWith("/hod-dashboard")) ||
        (href === "/principal-dashboard" && !currentFull.includes("tab=") && location.startsWith("/principal-dashboard"));
  };

  const pushNavHref = (href: string) => {
    if (href.includes("tab=") || href === "/hod-dashboard" || href === "/principal-dashboard") {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const navLinkEl = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }, extraClass = "") => {
    const isActive = isNavLinkActive(href);
    return (
      <Link key={href} href={href}>
        <div
          data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => pushNavHref(href)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors cursor-pointer ${extraClass} ${
            isActive
              ? "bg-emerald-600 text-white font-semibold shadow-sm"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">

      {/* ══════════ TOP NAV — BRAND ROW ══════════ */}
      <header className="shrink-0 bg-white border-b border-slate-300 shadow-xs z-40 relative">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              data-testid="mobile-menu-button"
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="w-9 h-9 rounded-md bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-900 leading-tight truncate" style={{ fontFamily: "var(--app-font-display)" }}>
                SPHN Attendance
              </p>
              <p className="hidden sm:block text-[9px] font-mono uppercase tracking-[0.14em] text-slate-500 leading-tight">
                Campus Control Console
              </p>
            </div>
            <span className="hidden md:inline stamp border-emerald-300 text-emerald-800 bg-emerald-50 ml-1">{role ?? "staff"}</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 relative">
            {/* Notification Bell with Badge and Popover Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`relative p-2 rounded-md border transition-colors cursor-pointer flex items-center justify-center ${
                  notificationsOpen
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400"
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold font-mono text-white border-2 border-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
                  style={{ minWidth: "320px" }}
                >
                  {/* Popover Header */}
                  <div className="px-4 py-3 bg-emerald-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5" />
                      <span className="eyebrow">Notifications &amp; Approvals</span>
                      {activeNotifications.length > 0 && (
                        <span className="text-[10px] font-mono bg-white/20 text-white px-1.5 py-0.5 rounded">
                          {activeNotifications.length}
                        </span>
                      )}
                    </div>
                    {activeNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-semibold text-emerald-100 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear all</span>
                      </button>
                    )}
                  </div>

                  {/* Popover Body */}
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[420px] bg-slate-100/70">
                    {activeNotifications.length === 0 ? (
                      <div className="p-6 text-center space-y-2 bg-white rounded-md border border-slate-200">
                        <div className="w-9 h-9 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-900">No pending notices</p>
                        <p className="text-[11px] text-slate-600">All substitution requests have been cleared or handled.</p>
                      </div>
                    ) : (
                      activeNotifications.map((r: any) => {
                        const isPending = r.status === "pending";
                        const isAccepted = r.status === "accepted";
                        const isDeclined = r.status === "declined";

                        return (
                          <div
                            key={r.id}
                            className={`p-3 rounded-md border bg-white space-y-2 relative ${
                              isPending
                                ? "border-amber-400 ring-1 ring-amber-300/70"
                                : isAccepted
                                ? "border-emerald-300"
                                : "border-red-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="stamp border-slate-300 text-slate-700 bg-slate-100">
                                {r.date} &middot; {r.slot}
                              </span>

                              {isPending ? (
                                <span className="stamp border-amber-400 bg-amber-100 text-amber-800">Pending HOD</span>
                              ) : isAccepted ? (
                                <span className="stamp border-emerald-400 bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" /> Accepted
                                </span>
                              ) : (
                                <span className="stamp border-red-400 bg-red-100 text-red-800">
                                  <X className="w-3 h-3" /> Declined
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-slate-900">{r.subject} ({r.section})</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-700 pt-0.5">
                                <span>{r.fromFacultyName}</span>
                                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                <span className="font-semibold text-slate-900">{r.toFacultyName}</span>
                              </div>
                            </div>

                            {r.reason && (
                              <p className="text-[10.5px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <span className="font-semibold text-slate-900">Reason:</span> {r.reason}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 gap-2">
                              <button
                                type="button"
                                onClick={() => handleClearSingleNotification(r.id)}
                                className="text-[10.5px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
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
                                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Accept</span>
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <span className="text-[10.5px] font-medium text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
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
              className="p-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0 font-mono">
                {initials}
              </div>
              <div className="hidden md:block min-w-0 max-w-[160px]">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{userDisplayName}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate leading-tight">{userEmail}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* ══════════ TOP NAV — LINK ROW (desktop) ══════════ */}
        <nav className="hidden lg:flex items-center flex-wrap gap-1 px-4 sm:px-5 py-1.5 border-t border-slate-200 bg-white">
          {navLinks.map((l) => navLinkEl(l))}
          {(role === "hod" || role === "admin") && (
            <TrainingProgramsMenu location={location} onNavigate={() => {}} />
          )}
        </nav>

        {/* Mobile slide-down nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-3 py-3 space-y-1 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((l) => navLinkEl(l, "w-full"))}
            {(role === "hod" || role === "admin") && (
              <div className="pt-2 mt-2 border-t border-slate-200">
                <p className="eyebrow text-slate-500 px-3 mb-1.5">Training Programs</p>
                <Link href="/training-sessions" onClick={() => setMobileOpen(false)}>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                    location === "/training-sessions" ? "bg-emerald-600 text-white font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`}>
                    <List className="w-4 h-4 shrink-0" />
                    <span>All Sessions</span>
                  </div>
                </Link>
              </div>
            )}
            {(role === "hod" || role === "principal" || role === "admin") && (
              <button
                data-testid="sidebar-settings"
                onClick={() => { setMobileOpen(false); openSettings(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 text-[13px] font-medium transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}
          </nav>
        )}
      </header>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-100 bg-slate-900/40 flex items-center justify-center p-6">
          <div className="w-full max-w-[380px] bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--app-font-display)" }}>System Settings</p>
                  <p className="text-[11px] text-slate-600">Account options &amp; passcode</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Close settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="px-3.5 py-3 rounded-md bg-slate-50 border border-slate-200">
                <p className="eyebrow text-slate-500">Signed in</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{userDisplayName}</p>
                <p className="text-[11px] font-mono text-slate-600">{userEmail}</p>
              </div>

              {settingsStep === "verify" && (
                <form onSubmit={handleVerifyForSettings} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="eyebrow block text-slate-600">Current Passcode</label>
                    <input type="password" placeholder="••••••" value={settingsCurrentPwd}
                      onChange={e => { setSettingsCurrentPwd(e.target.value); setSettingsError(""); }}
                      className="w-full px-4 py-3 rounded-md bg-white border border-slate-300 text-slate-900 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors box-border"
                      autoFocus />
                  </div>
                  {settingsError && <p className="text-red-700 text-xs font-semibold text-center">{settingsError}</p>}
                  <button type="submit" className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer">
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
                      className="w-full px-4 py-3 rounded-md bg-white border border-slate-300 text-slate-900 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors box-border"
                      autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <label className="eyebrow block text-slate-600">Confirm Passcode</label>
                    <input type="password" placeholder="Repeat passcode" value={settingsConfirmPwd}
                      onChange={e => { setSettingsConfirmPwd(e.target.value); setSettingsError(""); }}
                      className="w-full px-4 py-3 rounded-md bg-white border border-slate-300 text-slate-900 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors box-border" />
                  </div>
                  {settingsError && <p className="text-red-700 text-xs font-semibold text-center">{settingsError}</p>}
                  {settingsSuccess && <p className="text-emerald-700 text-xs font-semibold text-center">{settingsSuccess}</p>}
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setSettingsStep("verify")} className="flex-1 py-2.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-slate-400 font-semibold text-xs transition-colors cursor-pointer">← Back</button>
                    <button type="submit" className="flex-[2] py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer">Save Passcode</button>
                  </div>
                </form>
              )}

              <button
                onClick={() => { setShowSettings(false); logout(); }}
                className="w-full py-3 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold font-mono uppercase tracking-[0.14em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
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
