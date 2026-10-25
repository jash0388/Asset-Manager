import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats, useGetCurrentlyInside, customFetch } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Users, UserCheck, Clock, TrendingUp, ArrowRight, Circle, BookOpen } from "lucide-react";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-slate-300/70 rounded-lg p-3.5 shadow-xs relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${color}`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow text-slate-500">{label}</p>
          <p
            data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-[26px] leading-none font-bold text-slate-950 mt-2 font-mono tabular-nums"
          >
            {value}
          </p>
          {sub && <p className="text-[10.5px] text-slate-500 mt-1.5 truncate">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "inside") {
    return (
      <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
        <Circle className="w-1.5 h-1.5 fill-current text-emerald-600" />
        In Campus
      </span>
    );
  }
  if (status === "left") {
    return (
      <span className="stamp border-slate-300 bg-slate-50 text-slate-600">
        <Circle className="w-1.5 h-1.5 fill-current text-slate-400" />
        Left Campus
      </span>
    );
  }
  return (
    <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
      <Circle className="w-1.5 h-1.5 fill-current text-blue-600" />
      Present
    </span>
  );
}

function PanelHeader({
  title,
  right,
  accent,
}: {
  title: string;
  right?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/70">
      <h2 className="text-[13px] font-bold text-slate-950 flex items-center gap-2" style={{ fontFamily: "var(--app-font-display)" }}>
        {accent && <Circle className="w-2 h-2 fill-emerald-600 text-emerald-600 animate-pulse" />}
        {title}
      </h2>
      {right}
    </div>
  );
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  } catch {
    return "—";
  }
}

export default function Dashboard() {
  const stats = useGetDashboardStats({ query: { refetchInterval: 5000 } as any });
  const inside = useGetCurrentlyInside({ query: { refetchInterval: 5000 } as any });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: todayClassPresence = [] } = useQuery<any[]>({
    queryKey: ["admin-today-class-presence", todayStr],
    queryFn: () => customFetch<any[]>(`/api/admin/today-class-presence?date=${todayStr}`),
    refetchInterval: 5000,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["all-users-dashboard"],
    queryFn: () => customFetch<any[]>("/api/users"),
  });

  const data = stats.data;
  const insideList = inside.data ?? [];

  // Compute in-class unscanned students (marked present in class by faculty but no campus gate scan)
  const gateScannedUserIds = useMemo(() => {
    const set = new Set<number>();
    (data?.recentActivity || []).forEach((r: any) => {
      if (r.userId || r.user_id) set.add(r.userId || r.user_id);
    });
    (insideList || []).forEach((r: any) => {
      if (r.userId || r.user_id) set.add(r.userId || r.user_id);
    });
    return set;
  }, [data?.recentActivity, insideList]);

  const inClassUnscannedStudents = useMemo(() => {
    const userMap = new Map<number, any>();
    (allUsers || []).forEach((u: any) => userMap.set(u.id, u));

    const list: any[] = [];
    const seen = new Set<number>();

    (todayClassPresence || []).forEach((item: any) => {
      const uid = item.user_id;
      if (uid && !gateScannedUserIds.has(uid) && !seen.has(uid)) {
        seen.add(uid);
        const u = userMap.get(uid);
        if (u) {
          list.push({
            id: uid,
            name: u.name,
            uniqueId: u.unique_id || u.uniqueId || "—",
            section: u.section || "—",
            role: u.role || "student"
          });
        }
      }
    });
    return list;
  }, [todayClassPresence, gateScannedUserIds, allUsers]);

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 pb-4 border-b border-slate-300/70">
          <div>
            <p className="eyebrow text-slate-500">Daily Register</p>
            <h1 className="text-xl sm:text-[26px] font-bold text-slate-950 tracking-tight mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
              Dashboard Overview
            </h1>
          </div>
          <p className="hidden sm:block text-[11px] font-mono text-slate-500 text-right leading-relaxed">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Top Metric Cards */}
        {stats.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="h-2.5 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard
              label="Total Users"
              value={data?.totalUsers ?? 0}
              icon={Users}
              color="bg-blue-600"
              sub={`${data?.totalStudents ?? 0} students · ${data?.totalStaff ?? 0} staff`}
            />
            <StatCard
              label="Gate Check-ins"
              value={data?.todayAttendanceCount ?? 0}
              icon={UserCheck}
              color="bg-emerald-600"
              sub="Scanned at campus gate"
            />
            <StatCard
              label="Still on Campus"
              value={data?.currentlyInsideCount ?? 0}
              icon={Clock}
              color="bg-orange-500"
              sub="Inside college now"
            />
            <StatCard
              label="In Class (Gate Missed)"
              value={inClassUnscannedStudents.length}
              icon={BookOpen}
              color="bg-indigo-500"
              sub="In lecture, gate missed"
            />
            <StatCard
              label="Total Students"
              value={data?.totalStudents ?? 0}
              icon={TrendingUp}
              color="bg-purple-500"
              sub={`${data?.totalStaff ?? 0} staff members`}
            />
          </div>
        )}

        {/* 3 Main Activity Columns */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Recent Gate Activity */}
          <div className="bg-card border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col">
            <PanelHeader
              title="Recent Gate Activity"
              right={
                <Link href="/attendance">
                  <span className="text-[11px] text-emerald-800 font-semibold hover:text-emerald-600 flex items-center gap-1 cursor-pointer">
                    View all <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              }
            />
            <div data-testid="recent-activity-table" className="divide-y divide-slate-200 max-h-96 overflow-y-auto flex-1">
              {stats.isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : !data?.recentActivity?.length ? (
                <div className="px-4 py-12 text-center text-[13px] text-slate-500">No activity today yet</div>
              ) : (
                data.recentActivity.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 font-mono">
                      {rec.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-950 truncate">{rec.user?.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {rec.user?.role === "student" ? "Student" : "Staff"} · {rec.user?.uniqueId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={rec.status} />
                      <span className="text-[11px] text-slate-500 font-mono">{formatTime(rec.entryTime)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Currently On Campus */}
          <div className="bg-card border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col">
            <PanelHeader
              title="Currently On Campus"
              accent
              right={
                <span className="stamp border-emerald-300 bg-emerald-50 text-emerald-800">
                  {insideList.length} inside
                </span>
              }
            />
            <div data-testid="currently-inside-list" className="divide-y divide-slate-200 max-h-96 overflow-y-auto flex-1">
              {inside.isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : !insideList.length ? (
                <div className="px-4 py-12 text-center text-[13px] text-slate-500">No one currently on campus</div>
              ) : (
                insideList.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0 font-mono">
                      {rec.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-950 truncate">{rec.user?.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{rec.user?.role} · In: {formatTime(rec.entryTime)}</p>
                    </div>
                    <Link href={`/history/${rec.userId}`}>
                      <span className="text-slate-400 hover:text-emerald-700 cursor-pointer transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Class (Gate Scan Missed) */}
          <div className="bg-card border border-slate-300/70 rounded-lg overflow-hidden shadow-xs flex flex-col">
            <PanelHeader
              title="In Class — Gate Scan Missed"
              right={
                <span className="stamp border-blue-300 bg-blue-50 text-blue-800">
                  {inClassUnscannedStudents.length} students
                </span>
              }
            />
            <div data-testid="in-class-unscanned-list" className="divide-y divide-slate-200 max-h-96 overflow-y-auto flex-1">
              {inClassUnscannedStudents.length === 0 ? (
                <div className="px-4 py-12 text-center text-[13px] text-slate-500">
                  No students marked in class without gate scan today
                </div>
              ) : (
                inClassUnscannedStudents.map((st) => (
                  <div key={st.id} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-800 shrink-0 font-mono">
                        {st.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-950 truncate">{st.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{st.uniqueId} · {st.section}</p>
                      </div>
                    </div>
                    <span className="stamp border-blue-300 bg-blue-50 text-blue-800 shrink-0">
                      <BookOpen className="w-3 h-3" />
                      Gate Missed
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
