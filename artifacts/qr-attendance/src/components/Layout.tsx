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
} from "lucide-react";
import { useState } from "react";

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

export function Layout({ children }: { children: React.ReactNode }) {
  const { admin, hod, principal, role, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 16px 18px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck style={{ width: "20px", height: "20px", color: "#ffffff" }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>QR Attendance</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Campus Control System</p>
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
        {/* Mobile top bar */}
        <header style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #E5E7EB", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} className="lg:hidden flex items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button data-testid="mobile-menu-button" onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex" }}>
              <Menu style={{ width: "24px", height: "24px" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck style={{ width: "20px", height: "20px", color: "#2563EB" }} />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>QR Attendance</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={openSettings}
              style={{ padding: "8px 10px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", justify: "center" }}
              title="Settings"
            >
              <Settings style={{ width: "18px", height: "18px", color: "#334155" }} />
            </button>
            <button
              onClick={logout}
              style={{ padding: "8px 12px", borderRadius: "10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <LogOut style={{ width: "16px", height: "16px" }} />
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
