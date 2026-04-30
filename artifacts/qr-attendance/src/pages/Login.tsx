import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

const BYPASS_CODE = "038899";

export default function Login() {
  const { loginBypass } = useAuth();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (adminCode.trim() === BYPASS_CODE) {
      loginBypass();
      const base = (import.meta as any).env?.BASE_URL || "/";
      window.location.href = `${base}dashboard`.replace(/\/+/g, "/");
      return;
    }

    setError("Invalid code. Try 038899");
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">QR Attendance</h1>
          <p className="text-slate-400 font-medium mt-1">Campus Control System</p>
        </div>

        <div className="bg-[#0c111d] border border-slate-800/60 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 ml-1 text-center mb-4 uppercase tracking-wider">
                Admin Access
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
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
                  className="w-full pl-12 pr-4 py-5 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-800 text-4xl font-mono tracking-[0.3em] text-center focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="CODE"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              Enter Dashboard
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 text-xs">
            Use the 6-digit administrator override code.
          </div>
        </div>
      </div>
    </div>
  );
}
