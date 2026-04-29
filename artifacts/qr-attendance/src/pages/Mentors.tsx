import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/BackButton";
import { customFetch } from "@workspace/api-client-react";
import { GraduationCap, Plus, X, Loader2, UserCheck } from "lucide-react";

type Mentor = { id: number; name: string; email: string };
type User = {
  id: number;
  name: string;
  uniqueId: string;
  role: "student" | "staff";
  mentorId: number | null;
};

export default function Mentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, s] = await Promise.all([
        customFetch<Mentor[]>("/api/mentors"),
        customFetch<User[]>("/api/users?role=student"),
      ]);
      setMentors(m);
      setStudents(s);
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const createMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await customFetch("/api/mentors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      reload();
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to create mentor");
    } finally {
      setSubmitting(false);
    }
  };

  const assignMentor = async (userId: number, mentorId: number | null) => {
    try {
      await customFetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, mentorId } : s))
      );
    } catch (err: any) {
      setError(err?.data?.error ?? "Failed to assign");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Mentors</h1>
            <p className="text-sm text-slate-400 mt-1">Manage mentors and assign students</p>
          </div>
          <button
            data-testid="add-mentor-button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Mentor
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={createMentor}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 grid sm:grid-cols-3 gap-3"
          >
            <input
              data-testid="mentor-name"
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <input
              data-testid="mentor-email"
              required
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <input
              data-testid="mentor-password"
              required
              type="password"
              minLength={4}
              placeholder="Password (min 4 chars)"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                data-testid="create-mentor-submit"
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-sm font-semibold"
              >
                {submitting ? "Creating…" : "Create mentor"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">Mentors ({mentors.length})</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {mentors.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No mentors yet</div>
                ) : (
                  mentors.map((m) => {
                    const count = students.filter((s) => s.mentorId === m.id).length;
                    return (
                      <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-900/40 text-purple-300 flex items-center justify-center text-sm font-bold">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.name}</p>
                          <p className="text-xs text-slate-400 truncate">{m.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                          {count} {count === 1 ? "student" : "students"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Assign students</h2>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-800">
                {students.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No students</div>
                ) : (
                  students.map((s) => (
                    <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-400 truncate">{s.uniqueId}</p>
                      </div>
                      <select
                        data-testid={`assign-mentor-${s.id}`}
                        value={s.mentorId ?? ""}
                        onChange={(e) =>
                          assignMentor(
                            s.id,
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="">— None —</option>
                        {mentors.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
