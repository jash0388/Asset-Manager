import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, GraduationCap, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const { role: authRole, loginAdmin, loginMentor } = useAuth();
  const [, navigate] = useLocation();
  const [role, setRole] = useState<string>("admin");
  const [email, setEmail] = useState("jashwanth038@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authRole === "admin") navigate("/dashboard");
    else if (authRole === "mentor") navigate("/mentor");
  }, [authRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    try {
      if (role === "admin") {
        await loginAdmin(email, password);
        navigate("/dashboard");
      } else {
        await loginMentor(email, password);
        navigate("/mentor");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.body?.error || err.message || "Invalid credentials or internal server error";
      setError(msg);
    } finally {
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
          {/* Tabs */}
          <Tabs value={role} onValueChange={setRole} className="mb-8">
            <TabsList className="grid grid-cols-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
              <TabsTrigger 
                value="admin" 
                className="rounded-lg py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger 
                value="mentor" 
                className="rounded-lg py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                Mentor
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {error && (
            <div
              data-testid="login-error"
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
              <label className="block text-sm font-semibold text-slate-300 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  data-testid="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-600 text-[15px] focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  data-testid="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-600 text-[15px] focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              data-testid="login-submit"
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[15px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              className="text-sm text-blue-500/80 hover:text-blue-400 font-medium transition-colors inline-flex items-center gap-2"
            >
              Open Security App (no login) 
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          © 2024 QR Attendance System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
