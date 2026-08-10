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
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (role !== "admin") {
      navigate("/login");
    }
  }, [role, navigate]);

  if (role !== "admin") return null;
  return <>{children}</>;
}

function RequireHod({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (role !== "hod") {
      navigate("/login");
    }
  }, [role, navigate]);

  if (role !== "hod") return null;
  return <>{children}</>;
}

function RequirePrincipal({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (role !== "principal") {
      navigate("/login");
    }
  }, [role, navigate]);

  if (role !== "principal") return null;
  return <>{children}</>;
}

function RequireAdminOrHod({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (role !== "admin" && role !== "hod" && role !== "principal" && role !== "mentor") {
      navigate("/login");
    }
  }, [role, navigate]);

  if (role !== "admin" && role !== "hod" && role !== "principal" && role !== "mentor") return null;
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/security" component={SecurityApp} />
      <Route path="/login" component={Login} />

      {/* Mentor & Faculty Scanner App */}
      <Route path="/mentor" component={MentorApp} />
      <Route path="/faculty" component={MentorApp} />
      <Route path="/incharge-dashboard" component={InchargeDashboard} />

      {/* HOD routes */}
      <Route path="/hod-dashboard">
        <RequireHod><HodDashboard /></RequireHod>
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
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
// deploy trigger 1
