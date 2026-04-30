import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { setUser } = useAuth();
  const [, navigate] = useLocation();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    // Simple 6-digit code bypass
    if (adminCode === "038899") {
      const mockUser = {
        id: "bypass-admin",
        email: "jashwanth038@gmail.com",
        role: "admin",
        full_name: "Admin User",
        created_at: new Date().toISOString()
      };
      localStorage.setItem("qr_auth_token", "bypass-token");
      localStorage.setItem("qr_user", JSON.stringify(mockUser));
      setUser(mockUser);
      navigate("/admin");
    } else {
      setError("Invalid admin code. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">QR Attendance</h1>
          <p className="text-slate-400 font-medium mt-1">Campus Control System</p>
        </div>

        {/* Card */}
        <div className="bg-[#0c111d] border border-slate-800/60 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
          
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-red-400 rounded-full" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 ml-1 text-center mb-4">Enter Admin Access Code</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  autoFocus
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-700 text-3xl font-mono tracking-[0.5em] text-center focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[15px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Only authorized administrators can access this area.
            </p>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          © 2024 QR Attendance System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
