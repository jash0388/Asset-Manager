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
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`} className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
            {value}
          </p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} shadow-xs`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "inside") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
        <Circle className="w-2 h-2 fill-current text-emerald-600" />
        In Campus
      </span>
    );
  }
  if (status === "left") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-300">
        <Circle className="w-2 h-2 fill-current text-gray-500" />
        Left Campus
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
      <Circle className="w-2 h-2 fill-current text-blue-600" />
      Present
    </span>
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
      <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        {stats.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            <StatCard
              label="Total Users"
              value={data?.totalUsers ?? 0}
              icon={Users}
              color="bg-blue-100 text-blue-700"
              sub={`${data?.totalStudents ?? 0} students, ${data?.totalStaff ?? 0} staff`}
            />
            <StatCard
              label="Gate Check-ins"
              value={data?.todayAttendanceCount ?? 0}
              icon={UserCheck}
              color="bg-emerald-100 text-emerald-700"
              sub="Scanned at campus gate"
            />
            <StatCard
              label="Still on Campus"
              value={data?.currentlyInsideCount ?? 0}
              icon={Clock}
              color="bg-orange-100 text-orange-700"
              sub="Inside college now"
            />
            <StatCard
              label="In Class (Gate Missed)"
              value={inClassUnscannedStudents.length}
              icon={BookOpen}
              color="bg-indigo-100 text-indigo-700"
              sub="In lecture, gate missed"
            />
            <StatCard
              label="Total Students"
              value={data?.totalStudents ?? 0}
              icon={TrendingUp}
              color="bg-purple-100 text-purple-700"
              sub={`${data?.totalStaff ?? 0} staff members`}
            />
          </div>
        )}

        {/* 3 Main Activity Columns */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Recent Gate Activity */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/80">
              <h2 className="text-xs font-bold text-gray-900">Recent Gate Activity</h2>
              <Link href="/attendance">
                <span className="text-[11px] text-blue-700 font-bold hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                  View all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div data-testid="recent-activity-table" className="divide-y divide-gray-200 max-h-96 overflow-y-auto flex-1">
              {stats.isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : !data?.recentActivity?.length ? (
                <div className="px-5 py-12 text-center text-sm text-gray-400 font-medium">No activity today yet</div>
              ) : (
                data.recentActivity.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-800 flex-shrink-0">
                      {rec.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{rec.user?.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {rec.user?.role === "student" ? "Student" : "Staff"} · {rec.user?.uniqueId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={rec.status} />
                      <span className="text-xs text-gray-400 font-mono">{formatTime(rec.entryTime)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Currently On Campus */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-gray-900">Currently On Campus</h2>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {insideList.length} inside
              </span>
            </div>
            <div data-testid="currently-inside-list" className="divide-y divide-gray-200 max-h-96 overflow-y-auto flex-1">
              {inside.isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : !insideList.length ? (
                <div className="px-5 py-12 text-center text-sm text-gray-400 font-medium">No one currently on campus</div>
              ) : (
                insideList.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 flex-shrink-0">
                      {rec.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{rec.user?.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{rec.user?.role} · In: {formatTime(rec.entryTime)}</p>
                    </div>
                    <Link href={`/history/${rec.userId}`}>
                      <span className="text-xs text-gray-400 hover:text-blue-700 cursor-pointer">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Class (Gate Scan Missed) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-blue-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">In Class (Gate Scan Missed)</h2>
              </div>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-300">
                {inClassUnscannedStudents.length} Students
              </span>
            </div>
            <div data-testid="in-class-unscanned-list" className="divide-y divide-gray-200 max-h-96 overflow-y-auto flex-1">
              {inClassUnscannedStudents.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-400 font-medium">
                  No students marked in class without gate scan today
                </div>
              ) : (
                inClassUnscannedStudents.map((st) => (
                  <div key={st.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-800 flex-shrink-0">
                        {st.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{st.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{st.uniqueId} · {st.section}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                      <BookOpen className="w-3 h-3 text-blue-600" />
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
