import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
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
import { ShieldCheck } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/30">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/history/:userId" component={History} />
      <Route path="/history" component={History} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
