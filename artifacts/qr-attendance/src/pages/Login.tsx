import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, GraduationCap, Lock, Mail, Loader2 } from "lucide-react";

type Tab = "admin" | "mentor";

export default function Login() {
  const { role, loginAdmin, loginMentor } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role === "admin") navigate("/dashboard");
    else if (role === "mentor") navigate("/mentor");
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "admin") {
        await loginAdmin(email.trim(), password);
        navigate("/dashboard");
      } else {
        await loginMentor(email.trim(), password);
        navigate("/mentor");
      }
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.message?.replace(/^HTTP \d+ [^:]+: ?/, "") ||
        "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">QR Attendance</h1>
          <p className="text-sm text-slate-400 mt-1">Campus Control System</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-800 rounded-lg">
            <button
              type="button"
              data-testid="tab-admin"
              onClick={() => { setTab("admin"); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors ${
                tab === "admin" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin
            </button>
            <button
              type="button"
              data-testid="tab-mentor"
              onClick={() => { setTab("mentor"); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors ${
                tab === "mentor" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Mentor
            </button>
          </div>

          {error && (
            <div data-testid="login-error" className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  data-testid="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder={tab === "admin" ? "admin@example.com" : "mentor@example.com"}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  data-testid="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              data-testid="login-submit"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                `Sign in as ${tab === "admin" ? "Admin" : "Mentor"}`
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <a
              href={`${import.meta.env.BASE_URL}security`.replace(/\/+/g, "/")}
              data-testid="security-app-link"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Open Security App (no login) →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
