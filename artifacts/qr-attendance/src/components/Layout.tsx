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
  Trash2,
  Layers,
  Building2,
} from "lucide-react";
import { useState, useMemo } from "react";
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

function useTrainingSessions() {
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

  return useMemo<any[]>(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.sessions)) return rawData.sessions;
    return [];
  }, [rawData]);
}

function TrainingMenu({ location, sessions }: { location: string; sessions: any[] }) {
  const [open, setOpen] = useState(false);
  const isOnTraining = location.startsWith("/training-sessions");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          isOnTraining ? "bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]" : "text-ink-600 hover:text-ink-900"
        }`}
      >
        Training
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-50 w-72 rounded-[14px] bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-1.5 animate-in fade-in zoom-in-95 duration-150">
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Training sessions</p>
            <Link href="/training-sessions" onClick={() => setOpen(false)}>
              <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                location === "/training-sessions" ? "bg-blue-50 text-blue-700 font-semibold" : "text-ink-700 hover:bg-ink-50"
              }`}>
                <span className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Layers className="w-4 h-4" /></span>
                All sessions
              </div>
            </Link>
            {sessions.map((s: any) => {
              const href = `/training-sessions/${s.id}`;
              return (
                <Link key={s.id} href={href} onClick={() => setOpen(false)}>
                  <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    location === href ? "bg-blue-50 text-blue-700 font-semibold" : "text-ink-700 hover:bg-ink-50"
                  }`}>
                    <span className="h-8 w-8 shrink-0 rounded-lg bg-ink-50 text-ink-500 flex items-center justify-center"><Building2 className="w-4 h-4" /></span>
                    <span className="truncate">{s.name}</span>
                  </div>
                </Link>
              );
            })}
            {sessions.length === 0 && <p className="px-3 py-2 text-xs text-ink-400">No sessions yet</p>}
          </div>
        </>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { admin, hod, principal, role, logout } = useAuth();
  const [location] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const trainingSessions = useTrainingSessions();
  const showTraining = role === "hod" || role === "admin";

  // ---- Settings modal ----
  const [showSettings, setShowSettings] = useState(false);
  const [settingsStep, setSettingsStep] = useState<"verify" | "change">("verify");
  const [settingsCurrentPwd, setSettingsCurrentPwd] = useState("");
  const [settingsNewPwd, setSettingsNewPwd] = useState("");
  const [settingsConfirmPwd, setSettingsConfirmPwd] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const openSettings = () => {
    setProfileOpen(false);
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

  const shortLabel = (label: string) =>
    label.replace("Risk Flag Analytics", "Risk Flags").replace("Student Analytics", "Students").replace("Hourly Attendance", "Hourly").replace("HOD Dashboard", "Dashboard");

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

  const handleNavClick = (href: string) => {
    setMobileNavOpen(false);
    if (href.includes("tab=") || href === "/hod-dashboard" || href === "/principal-dashboard") {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new Event("popstate"));
    }
  };

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
  const iconBtnCls = "relative h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer";

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#f5f5f7] font-sans">

      {/* ══════════ TOP NAVIGATION ══════════ */}
      <header className="relative z-30 shrink-0 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border-b border-black/[0.08]">
        <div className="mx-auto max-w-[1400px] h-14 px-4 lg:px-8 flex items-center gap-4">
          <button
            data-testid="mobile-menu-button"
            onClick={() => setMobileNavOpen(o => !o)}
            className="lg:hidden -ml-1 h-11 w-11 rounded-full flex items-center justify-center text-ink-600 hover:bg-ink-100 cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-[9px] bg-ink-900 flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px] text-white" strokeWidth={2} />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-[14px] font-semibold text-ink-900 tracking-[-0.01em]">SPHN Attendance</p>
              <p className="text-[11px] font-medium text-ink-400">{ROLE_LABEL[role ?? "admin"]}</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 ml-8 rounded-[10px] bg-black/[0.05] p-[3px]">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = isLinkActive(href);
              return (
                <Link key={href} href={href}>
                  <div
                    data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => handleNavClick(href)}
                    className={`flex items-center gap-2 h-8 px-3.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isActive ? "bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]" : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    {shortLabel(label)}
                  </div>
                </Link>
              );
            })}
            {showTraining && <TrainingMenu location={location} sessions={trainingSessions} />}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 relative">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotificationsOpen(p => !p); setProfileOpen(false); }}
                className={`${iconBtnCls} ${notificationsOpen ? "bg-blue-50 text-blue-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"}`}
                title="Notifications"
              >
                <Bell className="w-[19px] h-[19px]" />
                {pendingCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[22rem] sm:w-96 bg-white/95 backdrop-blur-2xl rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-black/[0.08] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3.5 border-b border-ink-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">Notifications</span>
                      {activeNotifications.length > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{activeNotifications.length}</span>
                      )}
                    </div>
                    {activeNotifications.length > 0 && (
                      <button onClick={handleClearAllNotifications} className="text-[12px] font-semibold text-ink-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer">
                        <Trash2 className="w-3 h-3" /> Clear all
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
                              <span className="text-[10px] font-mono font-semibold text-ink-500">{r.date} &bull; {r.slot}</span>
                              {isPending ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                              ) : isAccepted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> Accepted</span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 flex items-center gap-1"><X className="w-3 h-3" /> Declined</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-ink-900">{r.subject} <span className="text-ink-400 font-medium">· {r.section}</span></p>
                              <p className="text-xs text-ink-500 mt-0.5">
                                {r.fromFacultyName} <span className="text-blue-500">→</span> <span className="font-semibold text-ink-800">{r.toFacultyName}</span>
                              </p>
                            </div>
                            {r.reason && (
                              <p className="text-[11px] text-ink-600 bg-ink-50 px-2.5 py-1.5 rounded-lg"><span className="font-semibold">Reason:</span> {r.reason}</p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-ink-100 gap-2">
                              <button type="button" onClick={() => handleClearSingleNotification(r.id)} className="text-[12px] font-semibold text-ink-400 hover:text-ink-700 transition-colors cursor-pointer">Dismiss</button>
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={() => handleNotificationAction(r.id, "decline")} disabled={processingNotificationId === r.id}
                                    className="px-3.5 py-2 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 text-[12px] font-semibold transition-all cursor-pointer">Decline</button>
                                  <button type="button" onClick={() => handleNotificationAction(r.id, "accept")} disabled={processingNotificationId === r.id}
                                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95">
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

            {(role === "hod" || role === "principal" || role === "admin") && (
              <button data-testid="sidebar-settings" onClick={openSettings} className={`${iconBtnCls} text-ink-500 hover:bg-ink-100 hover:text-ink-900`} title="Settings">
                <Settings className="w-[19px] h-[19px]" />
              </button>
            )}

            <div className="mx-1 h-7 w-px bg-ink-100" />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(p => !p); setNotificationsOpen(false); }}
                className="flex items-center gap-2.5 rounded-full pl-1 pr-2.5 h-11 hover:bg-black/[0.04] transition-colors cursor-pointer"
              >
                <span className="h-8 w-8 rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#8e8e93] text-white text-[12px] font-semibold flex items-center justify-center">{initials}</span>
                <span className="hidden md:block text-left leading-tight max-w-[160px]">
                  <span className="block text-[13px] font-semibold text-ink-900 truncate">{userDisplayName}</span>
                  <span className="block text-[11px] text-ink-400 truncate">{userEmail}</span>
                </span>
                <ChevronDown className="hidden md:block w-4 h-4 text-ink-400" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-13 z-50 mt-2 w-60 rounded-[14px] bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-ink-100 mb-1">
                      <p className="text-sm font-semibold text-ink-900 truncate">{userDisplayName}</p>
                      <p className="text-xs text-ink-500 truncate">{userEmail}</p>
                    </div>
                    {(role === "hod" || role === "principal" || role === "admin") && (
                      <button onClick={openSettings} className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-ink-700 hover:bg-ink-50 cursor-pointer">
                        <Settings className="w-4 h-4 text-ink-400" /> Settings
                      </button>
                    )}
                    <button data-testid="logout-button" onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-rose-600 hover:bg-rose-50 cursor-pointer">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav sheet */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-ink-100 bg-white px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = isLinkActive(href);
              return (
                <Link key={href} href={href}>
                  <div onClick={() => handleNavClick(href)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold cursor-pointer ${isActive ? "bg-blue-50 text-blue-700" : "text-ink-700 hover:bg-ink-50"}`}>
                    <Icon className="w-[18px] h-[18px]" /> {label}
                  </div>
                </Link>
              );
            })}
            {showTraining && (
              <Link href="/training-sessions">
                <div onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold cursor-pointer ${location.startsWith("/training-sessions") ? "bg-blue-50 text-blue-700" : "text-ink-700 hover:bg-ink-50"}`}>
                  <Briefcase className="w-[18px] h-[18px]" /> Training Sessions
                </div>
              </Link>
            )}
            <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
              <LogOut className="w-[18px] h-[18px]" /> Log out
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-up">{children}</div>
      </main>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-ink-900/30 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[17px] font-semibold text-ink-900">Settings</p>
                  <p className="text-xs text-ink-500">Account & scanner passcode</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="h-9 w-9 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-ink-50 mb-5">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#8e8e93] text-white flex items-center justify-center text-sm font-bold">{initials}</div>
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
                  <button type="submit" className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors cursor-pointer">Change passcode</button>
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
                    <button type="button" onClick={() => setSettingsStep("verify")} className="flex-1 py-3 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-700 font-semibold text-[15px] cursor-pointer">Back</button>
                    <button type="submit" className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] cursor-pointer">Save passcode</button>
                  </div>
                </form>
              )}

              <button
                onClick={() => { setShowSettings(false); logout(); }}
                className="w-full mt-4 py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
