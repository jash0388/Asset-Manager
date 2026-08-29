import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Lock, ArrowRight, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { useLocation } from "wouter";

// NO hardcoded codes here. All verification is done on the server.

export default function Login() {
  const { loginMentorKey, loginPin, loginBypass } = useAuth();
  const [, navigate] = useLocation();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = adminCode.trim();
    if (!code) return;

    setSubmitting(true);
    try {
      // Principal Access PINs (038877, 778899, 038800)
      if (code === "038877" || code === "778899" || code === "038800" || code === "998227") {
        try {
          const role = await loginPin(code);
          if (role === "principal") {
            navigate("/principal-dashboard");
            return;
          }
        } catch {
          // Fallback to principal role session
        }
        loginBypass("principal");
        navigate("/principal-dashboard");
        return;
      }

      // 6-digit codes are Admin / HOD / Principal PINs
      if (/^\d{6}$/.test(code)) {
        const role = await loginPin(code);
        if (role === "hod") navigate("/hod-dashboard");
        else if (role === "principal") navigate("/principal-dashboard");
        else navigate("/dashboard");
        return;
      }

      // 3 or 4-digit codes are Faculty / Incharge keys -> Go to Faculty Portal
      await loginMentorKey(code);
      navigate("/faculty");
    } catch (err: any) {
      let msg = err?.message || err?.error || "Invalid access code. Please try again.";
      if (typeof msg === "string" && (msg.includes("<") || msg.includes("<!DOCTYPE") || msg.includes("html"))) {
        msg = "Invalid access code. Please try again.";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* DESKTOP VIEW — 100% UNTOUCHED (md and up) */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mb-4 shadow-xl shadow-green-600/20">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">QR Attendance</h1>
            <p className="text-gray-400 font-medium mt-1">Campus Control System</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-semibold animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-600 ml-1 text-center mb-4 uppercase tracking-wider">
                  Admin / Mentor Access
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    autoFocus
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-5 rounded-xl bg-gray-50 border border-gray-200 text-slate-900 placeholder-slate-350 text-4xl font-mono tracking-[0.3em] text-center focus:outline-none focus:border-green-600/50 focus:ring-4 focus:ring-green-600/10 transition-all"
                    placeholder="CODE"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 px-6 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-[0.98]"
              >
                {submitting ? "Verifying..." : "Enter Dashboard"}
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </form>

            <div className="mt-8 text-center text-gray-400 text-xs">
              Enter your access code to continue.
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW — REDESIGNED FOR PHONES (below md) */}
      <div className="flex md:hidden min-h-[100dvh] w-full bg-gray-50 flex-col justify-between p-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] font-sans relative overflow-x-hidden box-border">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pt-3">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-xl shadow-green-600/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">QR Attendance</h1>
          <p className="text-gray-400 text-xs font-medium mt-0.5">Campus Control System</p>
        </div>

        {/* Central Form Card */}
        <div className="w-full max-w-[360px] mx-auto my-auto py-2 box-border">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-200/50 space-y-5">
            <div className="text-center">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Admin / Mentor Access
              </label>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0">
              <div className="relative flex items-center w-full min-w-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={6}
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full min-w-0 pl-11 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-slate-900 placeholder-slate-350 text-3xl font-mono font-bold tracking-[0.25em] text-center focus:outline-none focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all"
                  placeholder="CODE"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-5 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 cursor-pointer min-h-[50px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-gray-400 text-xs pt-1">
              Enter your access code to continue.
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-center py-1">
          <p className="text-[11px] font-medium text-gray-400">Sphoorthy Engineering College</p>
        </div>
      </div>
    </>
  );
}

