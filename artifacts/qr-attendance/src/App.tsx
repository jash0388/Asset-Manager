import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Scanner from "@/pages/Scanner";
import Attendance from "@/pages/Attendance";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import SecurityApp from "@/pages/SecurityApp";
import MentorApp from "@/pages/MentorApp";
import Mentors from "@/pages/Mentors";
import HodDashboard from "@/pages/HodDashboard";
import PrincipalDashboard from "@/pages/PrincipalDashboard";
import HourlyAttendance from "@/pages/HourlyAttendance";
import InchargeDashboard from "@/pages/InchargeDashboard";
import ParentApp from "@/pages/ParentApp";
import TrainingSessions from "@/pages/TrainingSessions";
import FacultyPortal from "@/pages/FacultyPortal";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function getStoredRole(): "admin" | "mentor" | "hod" | "principal" | null {
  try {
    const r = localStorage.getItem("qr_role");
    return r === "admin" || r === "mentor" || r === "hod" || r === "principal" ? r : null;
  } catch {
    return null;
  }
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const [, navigate] = useLocation();
  const effectiveRole = role || getStoredRole();

  useEffect(() => {
    if (!loading && !effectiveRole) {
      navigate("/login");
    } else if (!loading && effectiveRole && effectiveRole !== "admin") {
      navigate(effectiveRole === "hod" ? "/hod-dashboard" : effectiveRole === "principal" ? "/principal-dashboard" : "/mentor");
    }
  }, [effectiveRole, loading, navigate]);

  if (loading || !effectiveRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

function RequireHod({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const [, navigate] = useLocation();
  const effectiveRole = role || getStoredRole();

  useEffect(() => {
    if (!loading && !effectiveRole) {
      navigate("/login");
    } else if (!loading && effectiveRole && effectiveRole !== "hod") {
      navigate(effectiveRole === "admin" ? "/dashboard" : effectiveRole === "principal" ? "/principal-dashboard" : "/mentor");
    }
  }, [effectiveRole, loading, navigate]);

  if (loading || !effectiveRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

function RequirePrincipal({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const [, navigate] = useLocation();
  const effectiveRole = role || getStoredRole();

  useEffect(() => {
    if (!loading && !effectiveRole) {
      navigate("/login");
    } else if (!loading && effectiveRole && effectiveRole !== "principal") {
      navigate(effectiveRole === "admin" ? "/dashboard" : effectiveRole === "hod" ? "/hod-dashboard" : "/mentor");
    }
  }, [effectiveRole, loading, navigate]);

  if (loading || !effectiveRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

function RequireAdminOrHod({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const [, navigate] = useLocation();
  const effectiveRole = role || getStoredRole();

  useEffect(() => {
    if (!loading && !effectiveRole) {
      navigate("/login");
    }
  }, [effectiveRole, loading, navigate]);

  if (loading || !effectiveRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      {/* Explicit APK Direct Download Routes */}
      <Route path="/ParentApp.apk">
        {() => {
          window.location.href = "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/ParentApp.apk";
          return null;
        }}
      </Route>
      <Route path="/Parent_Attendance.apk">
        {() => {
          window.location.href = "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/ParentApp.apk";
          return null;
        }}
      </Route>
      <Route path="/FacultyApp.apk">
        {() => {
          window.location.href = "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/FacultyApp.apk";
          return null;
        }}
      </Route>
      <Route path="/Faculty_Attendance.apk">
        {() => {
          window.location.href = "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/FacultyApp.apk";
          return null;
        }}
      </Route>

      <Route path="/security" component={SecurityApp} />
      <Route path="/login" component={Login} />
      <Route path="/parent" component={ParentApp} />
      <Route path="/parent/:uniqueId" component={ParentApp} />
      <Route path="/parents" component={ParentApp} />

      {/* Mentor & Faculty Scanner App & ERP Portal */}
      <Route path="/faculty-portal" component={FacultyPortal} />
      <Route path="/faculty" component={FacultyPortal} />
      <Route path="/mentor" component={FacultyPortal} />
      <Route path="/incharge-dashboard" component={FacultyPortal} />
      <Route path="/scanner-view" component={MentorApp} />

      {/* HOD routes */}
      <Route path="/hod-dashboard">
        <RequireHod><HodDashboard /></RequireHod>
      </Route>

      {/* Training Sessions - HOD & Admin */}
      <Route path="/training-sessions/:id">
        {(params) => <RequireAdminOrHod><TrainingSessions trainingId={parseInt(params.id)} /></RequireAdminOrHod>}
      </Route>
      <Route path="/training-sessions">
        <RequireAdminOrHod><TrainingSessions /></RequireAdminOrHod>
      </Route>

      {/* Principal routes */}
      <Route path="/principal-dashboard">
        <RequirePrincipal><PrincipalDashboard /></RequirePrincipal>
      </Route>

      {/* Admin routes */}
      <Route path="/dashboard">
        <RequireAdmin><Dashboard /></RequireAdmin>
      </Route>
      <Route path="/users">
        <RequireAdmin><Users /></RequireAdmin>
      </Route>
      <Route path="/mentors">
        <RequireAdmin><Mentors /></RequireAdmin>
      </Route>
      <Route path="/scanner">
        <RequireAdmin><Scanner /></RequireAdmin>
      </Route>
      <Route path="/attendance">
        <RequireAdmin><Attendance /></RequireAdmin>
      </Route>
      <Route path="/hourly-attendance">
        <RequireAdminOrHod><HourlyAttendance /></RequireAdminOrHod>
      </Route>
      <Route path="/history/:userId">
        {(params) => <RequireAdmin><History /></RequireAdmin>}
      </Route>
      <Route path="/history">
        <RequireAdmin><History /></RequireAdmin>
      </Route>

      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <AppRouter />
          </WouterRouter>
          <Toaster />
          <PWAUpdatePrompt />
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
// deploy trigger 1
