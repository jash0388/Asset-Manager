import { useMemo, useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import {
  X,
  Users,
  QrCode,
  GraduationCap,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

const WHATSAPP_NUMBER = "918074772823";

type Denial = { title: string; problems: string[]; more: number } | null;

type MentorRow = { name: string; subject: string; key: string; sections: string };

type Props = {
  open: boolean;
  prefillCode?: string;
  onClose: () => void;
  onDone: () => void;
};

const ROMAN: Record<string, string> = { "1": "I", "2": "II", "3": "III", "4": "IV" };

function randomKey(used: Set<string>): string {
  for (let i = 0; i < 200; i++) {
    const k = String(Math.floor(100 + Math.random() * 900));
    if (!used.has(k)) return k;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function DepartmentSetupWizard({ open, prefillCode, onClose, onDone }: Props) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [denial, setDenial] = useState<Denial>(null);

  const [form, setForm] = useState({
    code: (prefillCode || "").toUpperCase(),
    name: "",
    years: "2,3,4",
    sections: "A,B",
    academicYear: "2026-2027",
  });
  const [deptStatus, setDeptStatus] = useState<"setup" | "live">("setup");

  const [importResult, setImportResult] = useState<{ inserted: number; perSection: Record<string, number> } | null>(null);

  const [hodPin, setHodPin] = useState("");
  const [packBuilding, setPackBuilding] = useState(false);

  const [mentorRows, setMentorRows] = useState<MentorRow[]>([{ name: "", subject: "", key: "", sections: "" }]);
  const [mentorsResult, setMentorsResult] = useState<{ id: number; name: string; key: string }[] | null>(null);

  const usedKeys = useMemo(() => new Set(mentorRows.map((m) => m.key).filter(Boolean)), [mentorRows]);

  if (!open) return null;

  const deny = (title: string, problems: string[]) => {
    setDenial({ title, problems: problems.slice(0, 6), more: Math.max(0, problems.length - 6) });
    setTimeout(() => setDenial(null), 12000);
  };

  // ── Step 1: department details ──
  const saveDetails = async () => {
    setBusy(true);
    try {
      await customFetch("/api/admin/departments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDeptStatus("setup");
      setStep(2);
    } catch (err: any) {
      const problems = err?.body?.error ? [err.body.error] : [String(err?.message || "Could not save department")];
      deny("Department details rejected", problems);
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2: students Excel ──
  const handleExcel = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
      const res = await fetch(`/api/admin/departments/import-students?code=${encodeURIComponent(form.code)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("qr_token") || ""}`,
        },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        deny(data?.error || "Import rejected", data?.problems || [data?.error || "Unknown error"]);
        return;
      }
      setImportResult({ inserted: data.inserted, perSection: data.perSection || {} });
      setDeptStatus("live");
      setStep(3);
    } catch (err: any) {
      deny("Could not read the file", [String(err?.message || err)]);
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3: HOD PIN + QR pack ──
  const ensureHodPin = async (): Promise<string> => {
    if (hodPin) return hodPin;
    const data = await customFetch<{ hod_pin: string }>("/api/admin/departments/hod-pin", {
      method: "POST",
      body: JSON.stringify({ code: form.code }),
    });
    const pin = data?.hod_pin || "";
    setHodPin(pin);
    return pin;
  };

  const buildPack = async () => {
    setPackBuilding(true);
    try {
      const pin = await ensureHodPin();
      const users = await customFetch<{ id: number; name: string; uniqueId: string; section: string }[]>(
        `/api/users?role=student`
      );
      const mine = users.filter((u) => u.section?.startsWith(`${form.code} `));
      // QR codes in batches
      const qrMap = new Map<number, string>();
      for (let i = 0; i < mine.length; i += 15) {
        const chunk = mine.slice(i, i + 15);
        const urls = await Promise.all(
          chunk.map((u) =>
            customFetch<{ qrCodeDataUrl: string }>(`/api/users/qrcode/${u.id}`)
              .then((r) => [u.id, r.qrCodeDataUrl] as const)
              .catch(() => [u.id, ""] as const)
          )
        );
        urls.forEach(([id, url]) => qrMap.set(id, url));
      }

      const cards = mine
        .map(
          (u) => `
          <div class="card">
            <img src="${qrMap.get(u.id) || ""}" alt="" />
            <p class="roll">${u.uniqueId}</p>
            <p class="nm">${u.name}</p>
            <p class="sec">${u.section}</p>
          </div>`
        )
        .join("");

      const mentorTable =
        mentorsResult && mentorsResult.length > 0
          ? `<h2 class="pgbreak">Faculty Login Keys</h2>
             <table><thead><tr><th>#</th><th>Name</th><th>Key</th></tr></thead><tbody>
             ${mentorsResult.map((m, i) => `<tr><td>${i + 1}</td><td>${m.name}</td><td class="mono">${m.key}</td></tr>`).join("")}
             </tbody></table>`
          : "";

      const win = window.open("", "_blank");
      if (!win) {
        deny("Popup blocked", ["Allow popups for this site to download the QR pack."]);
        return;
      }
      win.document.write(`<!DOCTYPE html><html><head><title>${form.code} Setup Pack</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 28px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .card { border: 1px solid #ccc; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
          .card img { width: 96px; height: 96px; }
          .roll { font-family: monospace; font-weight: bold; font-size: 12px; margin: 6px 0 2px; }
          .nm { font-size: 11px; margin: 0; font-weight: 600; }
          .sec { font-size: 10px; color: #555; margin: 2px 0 0; }
          .pin { font-family: monospace; font-size: 22px; font-weight: bold; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 12px; text-align: left; }
          .mono { font-family: monospace; font-weight: bold; }
          .pgbreak { page-break-before: always; }
          @media print { .noprint { display: none; } }
        </style></head><body>
        <div class="noprint"><button onclick="window.print()" style="padding:10px 18px;font-size:14px;cursor:pointer">Print / Save as PDF</button></div>
        <h1>${form.code} Department — Setup Pack</h1>
        <h2>Department HOD PIN</h2>
        <p class="pin">${pin || "(generate in step 3)"}</p>
        <h2>Student QR Codes (${mine.length})</h2>
        <div class="grid">${cards}</div>
        ${mentorTable}
        </body></html>`);
      win.document.close();
    } catch (err: any) {
      deny("Could not build the QR pack", [String(err?.message || err)]);
    } finally {
      setPackBuilding(false);
    }
  };

  // ── Step 4: mentors ──
  const saveMentors = async () => {
    setBusy(true);
    try {
      const payload = mentorRows
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          subject: m.subject.trim(),
          key: m.key.trim(),
          sections: m.sections.split(",").map((s) => s.trim()).filter(Boolean),
        }));
      const data = await customFetch<{ created: { id: number; name: string; key: string }[] }>(
        `/api/admin/departments/import-mentors?code=${encodeURIComponent(form.code)}`,
        { method: "POST", body: JSON.stringify({ mentors: payload }) }
      );
      setMentorsResult(data.created);
    } catch (err: any) {
      const problems = err?.body?.problems || [err?.body?.error || err?.message || "Could not save mentors"];
      deny("Mentor details rejected", problems);
    } finally {
      setBusy(false);
    }
  };

  const whatsappLink = () => {
    const lines = [
      `Department setup: ${form.name} (${form.code})`,
      importResult ? `Students imported: ${importResult.inserted}` : "Students imported: (pending)",
      importResult ? `Sections: ${Object.entries(importResult.perSection).map(([k, v]) => `${k}=${v}`).join(", ")}` : "",
      "",
      "Faculty & keys:",
      ...(mentorsResult || []).map((m, i) => `${i + 1}. ${m.name} — key ${m.key}`),
      "",
      hodPin ? `Department HOD PIN: ${hodPin}` : "",
      "",
      "I will send the department timetable next. Please load it into the database.",
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  const stepTitles = ["Department Details", "Students (Excel)", "QR Pack & HOD PIN", "Faculty & Keys", "WhatsApp Handoff"];

  return (
    <div className="fixed inset-0 z-100 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <p className="eyebrow text-slate-500">Department Setup</p>
            <h2 className="text-sm font-bold text-slate-950 mt-0.5" style={{ fontFamily: "var(--app-font-display)" }}>
              Step {step} of 5 — {stepTitles[step - 1]}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md bg-white border border-slate-300 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer" aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 px-5 pt-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-emerald-600" : "bg-slate-200"}`} />
          ))}
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="eyebrow text-slate-600 block mb-1">Department Code</span>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="CSE" maxLength={8}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono font-semibold uppercase focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="block">
                  <span className="eyebrow text-slate-600 block mb-1">Academic Year</span>
                  <input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    placeholder="2026-2027" className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono focus:outline-none focus:border-emerald-600" />
                </label>
              </div>
              <label className="block">
                <span className="eyebrow text-slate-600 block mb-1">Department Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="eyebrow text-slate-600 block mb-1">Years (comma separated)</span>
                  <input value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })}
                    placeholder="1,2,3,4" className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="block">
                  <span className="eyebrow text-slate-600 block mb-1">Sections (A-D)</span>
                  <input value={form.sections} onChange={(e) => setForm({ ...form, sections: e.target.value.toUpperCase() })}
                    placeholder="A,B,C" className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono focus:outline-none focus:border-emerald-600" />
                </label>
              </div>
              <button onClick={saveDetails} disabled={busy || !form.code || !form.name}
                className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold font-mono uppercase tracking-[0.14em] transition-colors cursor-pointer flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save &amp; Continue to Students
              </button>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">Upload the full student Excel sheet (.xlsx / .csv)</p>
                <p>The sheet must contain columns for <span className="font-semibold">Roll Number</span>, <span className="font-semibold">Student Name</span>, <span className="font-semibold">Year</span> (or a combined Class like 2A) and <span className="font-semibold">Section</span>. Batch is optional.</p>
                <p className="text-red-700 font-semibold">If anything is missing or invalid in any row, the entire import is rejected — nothing gets saved.</p>
              </div>
              <input
                type="file" accept=".xlsx,.xls,.csv"
                disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcel(f); }}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-semibold file:cursor-pointer cursor-pointer"
              />
              {busy && (
                <p className="text-xs text-slate-600 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading and validating the sheet…
                </p>
              )}
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">← Back</button>
              </div>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <>
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3.5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <p className="font-bold">{importResult?.inserted ?? 0} students imported</p>
                  <p className="mt-1 font-mono">
                    {Object.entries(importResult?.perSection || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="rounded-md border border-slate-300 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow text-slate-600">Department HOD PIN</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Reserved for the department HOD portal login.</p>
                  </div>
                  <span className="font-mono text-2xl font-bold text-slate-950">{hodPin || "······"}</span>
                </div>
                {!hodPin && (
                  <button onClick={ensureHodPin} disabled={busy}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    Generate HOD PIN
                  </button>
                )}
              </div>
              <button onClick={buildPack} disabled={packBuilding}
                className="w-full py-2.5 rounded-md bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold font-mono uppercase tracking-[0.14em] transition-colors cursor-pointer flex items-center justify-center gap-2">
                {packBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Open QR Pack (Print / Save as PDF)
              </button>
              <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Download className="w-3 h-3" /> The pack contains every student's QR code plus the HOD PIN and faculty keys — print it or save as PDF.
              </p>
              <div className="flex justify-between pt-1">
                <button onClick={() => setStep(2)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">← Back</button>
                <button onClick={() => setStep(4)} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer">
                  Continue to Faculty
                </button>
              </div>
            </>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <>
              <p className="text-xs text-slate-700">
                Add the faculty for <span className="font-semibold">{form.code}</span>. Each mentor gets a login key and their section students are assigned to them automatically.
              </p>
              <div className="space-y-2">
                {mentorRows.map((m, idx) => (
                  <div key={idx} className="rounded-md border border-slate-200 p-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={m.name} placeholder="Faculty name"
                        onChange={(e) => setMentorRows(mentorRows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-emerald-600" />
                      <input value={m.subject} placeholder="Subject(s), e.g. PA, CN"
                        onChange={(e) => setMentorRows(mentorRows.map((r, i) => (i === idx ? { ...r, subject: e.target.value } : r)))}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="eyebrow text-slate-500">Key</span>
                        <input value={m.key} placeholder="101"
                          onChange={(e) => setMentorRows(mentorRows.map((r, i) => (i === idx ? { ...r, key: e.target.value.replace(/[^0-9]/g, "") } : r)))}
                          className="w-20 px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600" />
                        <button
                          onClick={() => setMentorRows(mentorRows.map((r, i) => (i === idx ? { ...r, key: randomKey(usedKeys) } : r)))}
                          className="px-2 py-1.5 rounded-md border border-slate-300 text-[10px] font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                          title="Auto-generate a free key"
                        >Auto</button>
                      </div>
                      <input value={m.sections} placeholder="Sections e.g. 2A,2B"
                        onChange={(e) => setMentorRows(mentorRows.map((r, i) => (i === idx ? { ...r, sections: e.target.value } : r)))}
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600" />
                      {mentorRows.length > 1 && (
                        <button onClick={() => setMentorRows(mentorRows.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setMentorRows([...mentorRows, { name: "", subject: "", key: randomKey(usedKeys), sections: "" }])}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add another mentor
              </button>

              {mentorsResult ? (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900">
                    {mentorsResult.length} mentors created and students assigned. Their keys are in the QR pack.
                  </p>
                </div>
              ) : (
                <button onClick={saveMentors} disabled={busy}
                  className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold font-mono uppercase tracking-[0.14em] transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  Save Faculty &amp; Assign Students
                </button>
              )}

              <div className="flex justify-between pt-1">
                <button onClick={() => setStep(3)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">← Back</button>
                <button onClick={() => setStep(5)} disabled={!mentorsResult}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer">
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── STEP 5 ── */}
          {step === 5 && (
            <>
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-center space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <p className="font-bold text-emerald-900">{form.code} is live</p>
                <p className="text-xs text-emerald-900">
                  {importResult?.inserted ?? 0} students · {mentorsResult?.length ?? 0} mentors · HOD PIN {hodPin}
                </p>
              </div>
              <p className="text-xs text-slate-700">
                Last step: send me the faculty details and the department's <span className="font-semibold">timetable</span> on WhatsApp so I can load the schedule into the database. The button below opens WhatsApp with everything pre-filled.
              </p>
              <a href={whatsappLink()} target="_blank" rel="noreferrer"
                className="w-full py-3 rounded-md bg-[#1faa53] hover:bg-[#178a42] text-white text-xs font-semibold font-mono uppercase tracking-[0.14em] transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline">
                <MessageCircle className="w-4 h-4" /> Send details on WhatsApp
              </a>
              <p className="text-[11px] text-slate-500 text-center">Opens WhatsApp for {WHATSAPP_NUMBER}</p>
              <button onClick={() => { onDone(); onClose(); }}
                className="w-full py-2.5 rounded-md bg-slate-950 text-white text-xs font-semibold font-mono uppercase tracking-[0.14em] cursor-pointer">
                Done
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Denial popup (bottom-right) ── */}
      {denial && (
        <div className="fixed bottom-5 right-5 z-200 w-[360px] max-w-[calc(100vw-2.5rem)] bg-white rounded-lg border border-red-300 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="h-1 bg-red-600" />
          <div className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-red-800">{denial.title}</p>
              <ul className="mt-1.5 space-y-1">
                {denial.problems.map((p, i) => (
                  <li key={i} className="text-[11px] text-slate-700 font-mono leading-snug break-words">• {p}</li>
                ))}
              </ul>
              {denial.more > 0 && <p className="text-[11px] text-slate-500 mt-1.5 font-semibold">…and {denial.more} more problems</p>}
            </div>
            <button onClick={() => setDenial(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
