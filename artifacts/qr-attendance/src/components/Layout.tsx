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
  Trash2,
  Layers,
  Building2,
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

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  hod: "Head of Department",
  principal: "Principal",
  mentor: "Class Incharge",
};

const navItemBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer select-none";
const navItemIdle = "text-ink-300 hover:text-white hover:bg-white/[0.06]";
const navItemActive = "text-white bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

function ActiveBar() {
  return <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-blue-300 to-blue-500" />;
}

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
      <div
        onClick={() => setExpanded(e => !e)}
        className={`${navItemBase} ${isOnTraining ? navItemActive : navItemIdle}`}
      >
        {isOnTraining && <ActiveBar />}
        <Briefcase className={`w-[18px] h-[18px] shrink-0 ${isOnTraining ? "text-blue-300" : "text-ink-400 group-hover:text-ink-200"}`} />
        <span className="flex-1">Training Sessions</span>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          : <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        }
      </div>

      {expanded && (
        <div className="ml-[22px] mt-1 border-l border-white/10 pl-3 space-y-0.5">
          <Link href="/training-sessions" onClick={onNavigate}>
            <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
              location === "/training-sessions" ? "bg-white/[0.08] text-white font-semibold" : "text-ink-400 hover:text-white hover:bg-white/[0.05]"
            }`}>
              <Layers className="w-3.5 h-3.5 shrink-0" />
              All Sessions
            </div>
          </Link>

          {(sessions || []).map((s: any) => {
            const href = `/training-sessions/${s.id}`;
            const isActive = location === href;
            return (
              <Link key={s.id} href={href} onClick={onNavigate}>
                <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                  isActive ? "bg-white/[0.08] text-white font-semibold" : "text-ink-400 hover:text-white hover:bg-white/[0.05]"
                }`}>
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </div>
              </Link>
            );
          })}

          {sessions.length === 0 && (
            <div className="px-2.5 py-1.5 text-[11px] text-ink-500">No sessions yet</div>
          )}
        </div>
      )}
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

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
      setSettingsSuccess("Passcode updated!"); setSettingsError("");
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

  const currentFull = typeof window !== "undefined" ? window.location.pathname + window.location.search : location;
  const isLinkActive = (href: string) =>
    href.includes("tab=flags")
      ? currentFull.includes("tab=flags")
      : href.includes("tab=student-analytics")
      ? currentFull.includes("tab=student-analytics")
      : currentFull === href ||
        (href === "/hod-dashboard" && !currentFull.includes("tab=") && location.startsWith("/hod-dashboard")) ||
        (href === "/principal-dashboard" && !currentFull.includes("tab=") && location.startsWith("/principal-dashboard")) ||
        (href === "/history" && location.startsWith("/history"));

  const activeLink = navLinks.find(l => isLinkActive(l.href));
  const pageTitle = activeLink?.label ?? (location.startsWith("/training-sessions") ? "Training Sessions" : "Overview");
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

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

  const initials = (userDisplayName || "U").replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "U";
  const passwordInputCls = "w-full px-4 py-3 rounded-xl bg-ink-50 border-2 border-ink-100 text-ink-900 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-blue-500 focus:bg-white transition-colors";
  const fieldLabelCls = "block text-[11px] font-bold text-ink-500 uppercase tracking-[0.08em] mb-2";

  return (
    <div className="flex h-screen bg-ink-50 font-sans">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className={`${isDesktop && sidebarOpen ? "relative" : "fixed inset-y-0 left-0"} z-50 w-[264px] shrink-0 flex flex-col bg-ink-950 text-white transition-transform duration-200 ease-out overflow-hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />

        {/* Brand */}
        <div className="relative flex items-center gap-3 px-5 pt-6 pb-5">
          <div className="relative h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-blue-400 via-blue-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-extrabold tracking-tight leading-tight truncate">SPHN Attendance</p>
            <p className="text-[11px] text-ink-400 truncate">Sphoorthy Engineering College</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role chip */}
        <div className="relative mx-4 mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Signed in as</p>
          <p className="mt-0.5 text-[13px] font-bold text-white truncate">{ROLE_LABEL[role ?? "admin"] ?? "User"}</p>
          {role === "hod" && <p className="text-[11px] text-blue-300 truncate">Dept. of Data Science</p>}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Workspace</p>
          <div className="space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = isLinkActive(href);
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
                    className={`${navItemBase} ${isActive ? navItemActive : navItemIdle}`}
                  >
                    {isActive && <ActiveBar />}
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-blue-300" : "text-ink-400 group-hover:text-ink-200"}`} />
                    <span className="truncate">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {(role === "hod" || role === "admin") && (
            <>
              <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Programs</p>
              <TrainingNavTree location={location} onNavigate={() => { if (!isDesktop) setSidebarOpen(false); }} />
            </>
          )}
        </nav>

        {/* Account */}
        <div className="relative border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-ink-900 flex items-center justify-center text-[12px] font-bold">{initials}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate">{userDisplayName}</p>
              <p className="text-[11px] text-ink-400 truncate">{userEmail}</p>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {(role === "hod" || role === "principal" || role === "admin") ? (
              <button
                data-testid="sidebar-settings"
                onClick={openSettings}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-ink-200 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
            ) : <span />}
            <button
              data-testid="logout-button"
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-200 px-3 py-2 text-xs font-semibold text-ink-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && !isDesktop && (
        <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <header className="relative z-30 flex items-center justify-between gap-3 border-b border-ink-100 bg-white/80 backdrop-blur-xl px-4 lg:px-8 h-16 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button data-testid="mobile-menu-button" onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-xl text-ink-600 hover:bg-ink-50 cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] font-medium text-ink-400 leading-none mb-1">
                {ROLE_LABEL[role ?? "admin"]} <span className="mx-1 text-ink-300">/</span> {pageTitle}
              </p>
              <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight truncate">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {todayLabel}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`relative h-10 w-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  notificationsOpen
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-ink-100 text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[22rem] sm:w-96 bg-white rounded-2xl shadow-2xl border border-ink-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3.5 border-b border-ink-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-ink-900">Notifications</span>
                      {activeNotifications.length > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          {activeNotifications.length}
                        </span>
                      )}
                    </div>
                    {activeNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-semibold text-ink-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="p-3 space-y-2 overflow-y-auto max-h-[420px] bg-ink-50/60">
                    {activeNotifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <Check className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-ink-800">You're all caught up</p>
                        <p className="text-xs text-ink-500 mt-0.5">No pending substitution requests.</p>
                      </div>
                    ) : (
                      activeNotifications.map((r: any) => {
                        const isPending = r.status === "pending";
                        const isAccepted = r.status === "accepted";
                        return (
                          <div key={r.id} className="p-3.5 rounded-xl border border-ink-100 bg-white space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-semibold text-ink-500">
                                {r.date} &bull; {r.slot}
                              </span>
                              {isPending ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              ) : isAccepted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Accepted
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 flex items-center gap-1">
                                  <X className="w-3 h-3" /> Declined
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-[13px] font-bold text-ink-900">{r.subject} <span className="text-ink-400 font-medium">· {r.section}</span></p>
                              <p className="text-xs text-ink-500 mt-0.5">
                                {r.fromFacultyName} <span className="text-blue-500">→</span> <span className="font-semibold text-ink-800">{r.toFacultyName}</span>
                              </p>
                            </div>

                            {r.reason && (
                              <p className="text-[11px] text-ink-600 bg-ink-50 px-2.5 py-1.5 rounded-lg">
                                <span className="font-semibold">Reason:</span> {r.reason}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-ink-100 gap-2">
                              <button
                                type="button"
                                onClick={() => handleClearSingleNotification(r.id)}
                                className="text-[11px] font-semibold text-ink-400 hover:text-ink-700 transition-colors cursor-pointer"
                              >
                                Dismiss
                              </button>

                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "decline")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-3 py-1.5 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(r.id, "accept")}
                                    disabled={processingNotificationId === r.id}
                                    className="px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-white text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <Check className="w-3 h-3" /> Accept
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <span className="text-[11px] font-semibold text-emerald-700">Assigned to {r.toFacultyName}</span>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-700">Reassignment declined</span>
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

            <button
              onClick={openSettings}
              className="h-10 w-10 rounded-xl border border-ink-100 bg-white text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-all cursor-pointer flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>

            <button
              onClick={logout}
              className="hidden sm:flex h-10 items-center gap-2 rounded-xl bg-ink-900 hover:bg-ink-800 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-ink-900">Settings</p>
                  <p className="text-xs text-ink-500">Account & scanner passcode</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-ink-50 mb-5">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">{initials}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900 truncate">{userDisplayName}</p>
                  <p className="text-xs text-ink-500 truncate">{userEmail}</p>
                </div>
              </div>

              {settingsStep === "verify" && (
                <form onSubmit={handleVerifyForSettings}>
                  <label className={fieldLabelCls}>Current passcode</label>
                  <input type="password" placeholder="••••••" value={settingsCurrentPwd}
                    onChange={e => { setSettingsCurrentPwd(e.target.value); setSettingsError(""); }}
                    className={passwordInputCls} autoFocus />
                  {settingsError && <p className="text-rose-600 text-xs font-semibold text-center mt-2">{settingsError}</p>}
                  <button type="submit" className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer">Change passcode</button>
                </form>
              )}

              {settingsStep === "change" && (
                <form onSubmit={handleChangePasscode} className="space-y-4">
                  <div>
                    <label className={fieldLabelCls}>New passcode</label>
                    <input type="password" placeholder="Min 4 chars" value={settingsNewPwd}
                      onChange={e => { setSettingsNewPwd(e.target.value); setSettingsError(""); }}
                      className={passwordInputCls} autoFocus />
                  </div>
                  <div>
                    <label className={fieldLabelCls}>Confirm passcode</label>
                    <input type="password" placeholder="Repeat" value={settingsConfirmPwd}
                      onChange={e => { setSettingsConfirmPwd(e.target.value); setSettingsError(""); }}
                      className={passwordInputCls} />
                  </div>
                  {settingsError && <p className="text-rose-600 text-xs font-semibold text-center">{settingsError}</p>}
                  {settingsSuccess && <p className="text-emerald-600 text-sm font-semibold text-center">{settingsSuccess}</p>}
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setSettingsStep("verify")} className="flex-1 py-3 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-700 font-semibold text-sm cursor-pointer">Back</button>
                    <button type="submit" className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer">Save passcode</button>
                  </div>
                </form>
              )}

              <button
                onClick={() => { setShowSettings(false); logout(); }}
                className="w-full mt-4 py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log out of account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
