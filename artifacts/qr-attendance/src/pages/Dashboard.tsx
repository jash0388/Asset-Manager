import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats, useGetCurrentlyInside, customFetch } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Users, UserCheck, Clock, TrendingUp, ArrowRight, BookOpen } from "lucide-react";
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
    <div className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] p-6">
      <span className={`h-10 w-10 rounded-[12px] flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
      <p data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`} className="mt-5 text-[34px] leading-none font-bold tracking-[-0.03em] text-ink-900">
        {value}
      </p>
      <p className="mt-2 text-[15px] font-semibold text-ink-900">{label}</p>
      {sub && <p className="mt-0.5 text-[13px] text-ink-500">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    inside: { label: "On campus", dot: "bg-[#34c759]", text: "text-[#248a3d]" },
    left: { label: "Left", dot: "bg-ink-300", text: "text-ink-500" },
  };
  const s = map[status] ?? { label: "Present", dot: "bg-[#0a84ff]", text: "text-blue-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
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

  const insideCount = data?.currentlyInsideCount ?? insideList.length;

  return (
    <Layout>
      <div className="px-6 lg:px-10 py-10 max-w-[1180px] mx-auto space-y-10 font-sans">
        <div>
          <p className="text-[13px] font-medium text-ink-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-1 text-[34px] leading-[1.1] font-bold tracking-[-0.025em] text-ink-900">Overview</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] rounded-[28px] relative overflow-hidden p-9 lg:p-11 flex flex-col justify-between min-h-[280px]">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-[#34c759]/20 to-[#5ac8fa]/10 blur-2xl" />
            <div className="relative">
              <p className="text-[15px] font-semibold text-[#248a3d] flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[#34c759] opacity-60 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#34c759]" /></span>
                Live
              </p>
              <h2 className="mt-3 text-[40px] lg:text-[48px] leading-[1.04] font-bold tracking-[-0.035em] text-ink-900">
                {stats.isLoading ? "Loading campus…" : `${insideCount} people on campus.`}
                <span className="block text-ink-400">{data?.todayAttendanceCount ?? 0} checked in today.</span>
              </h2>
            </div>
            <div className="relative mt-10 flex flex-wrap items-center gap-2">
              <Link href="/scanner">
                <span className="inline-flex h-11 px-6 items-center rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium transition-colors cursor-pointer">Open scanner</span>
              </Link>
              <Link href="/attendance">
                <span className="inline-flex h-11 px-5 items-center gap-1 rounded-full text-blue-600 hover:bg-blue-50 text-[15px] font-medium transition-colors cursor-pointer">
                  View attendance <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] rounded-[28px] p-9 flex flex-col justify-between">
            <span className="h-12 w-12 rounded-[14px] bg-[#5856d6] flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <BookOpen className="w-6 h-6" />
            </span>
            <div className="mt-8">
              <p className="text-[56px] leading-none font-bold tracking-[-0.04em] text-ink-900">{inClassUnscannedStudents.length}</p>
              <p className="mt-3 text-[17px] font-semibold text-ink-900">In class, gate missed</p>
              <p className="mt-1 text-[14px] text-ink-500">Marked present by faculty but never scanned at the gate.</p>
            </div>
          </div>
        </div>

        {stats.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] p-6 animate-pulse">
                <div className="h-10 w-10 rounded-[12px] bg-ink-100" />
                <div className="mt-5 h-8 bg-ink-100 rounded-full w-1/2" />
                <div className="mt-3 h-3 bg-ink-50 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Users" value={data?.totalUsers ?? 0} icon={Users} color="bg-[#0a84ff]" sub={`${data?.totalStudents ?? 0} students, ${data?.totalStaff ?? 0} staff`} />
            <StatCard label="Gate Check-ins" value={data?.todayAttendanceCount ?? 0} icon={UserCheck} color="bg-[#34c759]" sub="Scanned at campus gate" />
            <StatCard label="Still on Campus" value={data?.currentlyInsideCount ?? 0} icon={Clock} color="bg-[#ff9500]" sub="Inside college now" />
            <StatCard label="Total Students" value={data?.totalStudents ?? 0} icon={TrendingUp} color="bg-[#ff2d55]" sub={`${data?.totalStaff ?? 0} staff members`} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="flex flex-col">
            <div className="flex items-end justify-between px-1 mb-3">
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ink-900">Recent activity</h2>
                <p className="text-[13px] text-ink-500">Latest gate scans</p>
              </div>
              <Link href="/attendance">
                <span className="text-[14px] font-medium text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer">See all <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            </div>
            <div data-testid="recent-activity-table" className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.05] max-h-[460px] overflow-y-auto flex-1">
              {stats.isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-ink-100" />
                    <div className="flex-1">
                      <div className="h-3 bg-ink-100 rounded-full w-1/2 mb-2" />
                      <div className="h-2.5 bg-ink-50 rounded-full w-1/3" />
                    </div>
                  </div>
                ))
              ) : !data?.recentActivity?.length ? (
                <div className="px-6 py-16 text-center text-[14px] text-ink-400">No activity today yet</div>
              ) : (
                data.recentActivity.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#d1d1d6] to-[#aeaeb2] flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">{rec.user?.name?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-ink-900 truncate">{rec.user?.name}</p>
                      <p className="text-[12px] text-ink-500">{rec.user?.role === "student" ? "Student" : "Staff"} · {rec.user?.uniqueId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <StatusBadge status={rec.status} />
                      <span className="text-[12px] text-ink-400 tabular-nums">{formatTime(rec.entryTime)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="flex flex-col">
            <div className="flex items-end justify-between px-1 mb-3">
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ink-900">On campus</h2>
                <p className="text-[13px] text-ink-500">Inside college right now</p>
              </div>
              <span className="text-[13px] font-semibold text-[#248a3d] bg-[#34c759]/10 px-2.5 py-1 rounded-full">{insideList.length} inside</span>
            </div>
            <div data-testid="currently-inside-list" className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.05] max-h-[460px] overflow-y-auto flex-1">
              {inside.isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-ink-100" />
                    <div className="flex-1">
                      <div className="h-3 bg-ink-100 rounded-full w-1/2 mb-2" />
                      <div className="h-2.5 bg-ink-50 rounded-full w-1/3" />
                    </div>
                  </div>
                ))
              ) : !insideList.length ? (
                <div className="px-6 py-16 text-center text-[14px] text-ink-400">No one currently on campus</div>
              ) : (
                insideList.map((rec) => (
                  <Link key={rec.id} href={`/history/${rec.userId}`}>
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#d1d1d6] to-[#aeaeb2] flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">{rec.user?.name?.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-ink-900 truncate">{rec.user?.name}</p>
                        <p className="text-[12px] text-ink-500 capitalize">{rec.user?.role} · In {formatTime(rec.entryTime)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
          <section className="flex flex-col">
            <div className="flex items-end justify-between px-1 mb-3">
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ink-900">Gate missed</h2>
                <p className="text-[13px] text-ink-500">In lecture without a gate scan</p>
              </div>
              <span className="text-[13px] font-semibold text-[#5856d6] bg-[#5856d6]/10 px-2.5 py-1 rounded-full">{inClassUnscannedStudents.length} students</span>
            </div>
            <div data-testid="in-class-unscanned-list" className="rounded-[24px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.05] max-h-[460px] overflow-y-auto flex-1">
              {inClassUnscannedStudents.length === 0 ? (
                <div className="px-6 py-16 text-center text-[14px] text-ink-400">No students marked in class without gate scan today</div>
              ) : (
                inClassUnscannedStudents.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#d1d1d6] to-[#aeaeb2] flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">{st.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-ink-900 truncate">{st.name}</p>
                      <p className="text-[12px] text-ink-500">{st.uniqueId} · {st.section}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
