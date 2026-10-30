import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Loader2, AlertCircle, ArrowRight, Delete } from "lucide-react";
import { useLocation } from "wouter";

// NO hardcoded codes here. All verification is done on the server.

function AccessCard({ error, submitting, adminCode, setAdminCode, handleSubmit }: {
  error: string;
  submitting: boolean;
  adminCode: string;
  setAdminCode: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="w-full max-w-[380px] bg-card border border-slate-300/70 rounded-lg shadow-lg shadow-slate-950/5 overflow-hidden">
      {/* Ledger top rule */}
      <div className="h-[3px] bg-emerald-600" aria-hidden />

      <div className="p-7 sm:p-8">
        <p className="eyebrow text-slate-500 text-center">Restricted Access</p>

        {error && (
          <div className="mt-4 px-3.5 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="space-y-2">
            <label htmlFor="access-code" className="eyebrow block text-slate-600 text-center">
              Staff Access Code
            </label>
            {/* Desktop: typed input */}
            <input
              id="access-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="hidden md:block w-full px-4 py-4 rounded-md bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-3xl font-mono font-semibold tracking-[0.35em] text-center focus:outline-none focus:bg-card focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
              placeholder="••••••"
              aria-describedby="access-help"
            />
            <p id="access-help" className="md:hidden text-center text-[11px] text-slate-500">
              Faculty keys &amp; administration PINs only
            </p>
          </div>

          {/* Mobile on-screen keypad — classic passcode style */}
          <div className="md:hidden select-none mx-auto w-[264px]">
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              {[
                { d: "1", sub: "" },
                { d: "2", sub: "ABC" },
                { d: "3", sub: "DEF" },
                { d: "4", sub: "GHI" },
                { d: "5", sub: "JKL" },
                { d: "6", sub: "MNO" },
                { d: "7", sub: "PQRS" },
                { d: "8", sub: "TUV" },
                { d: "9", sub: "WXYZ" },
              ].map((k) => (
                <button
                  key={k.d}
                  type="button"
                  onClick={() => setAdminCode((adminCode + k.d).slice(0, 6))}
                  className="h-[58px] rounded-full bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center active:bg-slate-200 transition-colors"
                >
                  <span className="text-[22px] leading-6 font-normal text-slate-900">{k.d}</span>
                  {k.sub ? (
                    <span className="text-[8px] font-semibold tracking-[0.12em] text-slate-500">{k.sub}</span>
                  ) : (
                    <span className="h-[8px]" />
                  )}
                </button>
              ))}
              <span />
              <button
                type="button"
                onClick={() => setAdminCode((adminCode + "0").slice(0, 6))}
                className="h-[58px] rounded-full bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center active:bg-slate-200 transition-colors"
              >
                <span className="text-[22px] leading-6 font-normal text-slate-900">0</span>
                <span className="h-[8px]" />
              </button>
              <button
                type="button"
                onClick={() => setAdminCode(adminCode.slice(0, -1))}
                className="h-[58px] rounded-full flex items-center justify-center active:bg-slate-200 transition-colors text-slate-500"
                aria-label="Delete last digit"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group w-full py-3.5 px-6 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying</span>
              </>
            ) : (
              <>
                <span>Authenticate</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="px-8 py-3.5 border-t border-slate-200 bg-slate-50">
        <p className="text-center text-[11px] text-slate-500 font-mono tracking-wide">
          Sphoorthy Engineering College
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const { loginMentorKey, loginPin } = useAuth();
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
      // All verification happens server-side. No codes live in the client.
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
    <div className="min-h-[100dvh] bg-slate-100 ledger-ruled flex flex-col items-center px-4 py-10 sm:py-0 sm:justify-center">
      {/* Masthead */}
      <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
        <div className="w-14 h-14 rounded-lg bg-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-[26px] sm:text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--app-font-display)" }}>
          SPHN Attendance
        </h1>
        <p className="eyebrow text-slate-600 mt-1.5">Campus Control Console &middot; 2022&ndash;26</p>
      </div>

      <AccessCard
        error={error}
        submitting={submitting}
        adminCode={adminCode}
        setAdminCode={setAdminCode}
        handleSubmit={handleSubmit}
      />

      <p className="mt-8 text-[11px] text-slate-500 font-mono tracking-wide text-center">
        Unauthorised access is logged and reviewed.
      </p>
    </div>
  );
}
