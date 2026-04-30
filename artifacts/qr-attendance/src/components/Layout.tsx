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
  ScanLine,
} from "lucide-react";
import { useState } from "react";

const adminNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/scanner", label: "QR Scanner", icon: QrCode },
  { href: "/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/history", label: "Student History", icon: History },
  { href: "/mentors", label: "Mentors", icon: GraduationCap },
];

const baseUrl = (import.meta as any).env?.BASE_URL || "/";
function joinBase(p: string) {
  return `${baseUrl}${p}`.replace(/\/+/g, "/");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">QR Attendance</p>
            <p className="text-xs text-slate-400 truncate">Campus Control System</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mb-2">Navigation</p>
          {adminNavLinks.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            );
          })}

          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mt-6 mb-2">Open Apps</p>

          <a
            href={joinBase("security")}
            data-testid="nav-security-app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-orange-300 bg-orange-900/20 hover:bg-orange-900/30 transition-colors"
          >
            <ScanLine className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Security App</p>
              <p className="text-[10px] text-orange-400/80">Open scanner (no login)</p>
            </div>
          </a>

          <a
            href={joinBase("login")}
            data-testid="nav-mentor-app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-purple-300 bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
          >
            <GraduationCap className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Mentor App</p>
              <p className="text-[10px] text-purple-400/80">Login as mentor</p>
            </div>
          </a>
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {admin?.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name ?? "Admin"}</p>
              <p className="text-xs text-slate-400 truncate">{admin?.email ?? ""}</p>
            </div>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 bg-slate-900 lg:hidden">
          <button
            data-testid="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-white">QR Attendance</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
