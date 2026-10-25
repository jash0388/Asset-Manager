import { Router, Request, Response } from "express";
import { Client } from "pg";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middlewares/auth.js";

// Department onboarding. Departments are stored in a qr_departments table that
// this module creates on demand via DATABASE_URL (PostgREST cannot run DDL).
// Students imported for a department land in qr_users with a canonical section
// string: "<CODE> <ROMAN>/<LETTER>" e.g. "CSE II/A".

const router = Router();

const ROMAN = { "1": "I", "2": "II", "3": "III", "4": "IV" } as Record<string, string>;

const SEED_DEPARTMENTS = [
  { code: "DS", name: "Computer Science (Data Science)", status: "live" },
  { code: "CSE", name: "Computer Science & Engineering", status: "pending" },
  { code: "AIML", name: "Artificial Intelligence & ML", status: "pending" },
  { code: "CS", name: "Computer Science (Cyber Security)", status: "pending" },
  { code: "CIVIL", name: "Civil Engineering", status: "pending" },
  { code: "ECE", name: "Electronics & Communication", status: "pending" },
];

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try { await client.end(); } catch {}
  }
}

async function ensureDepartmentsTable(): Promise<void> {
  await withDb(async (c) => {
    await c.query(`
      CREATE TABLE IF NOT EXISTS public.qr_departments (
        id serial PRIMARY KEY,
        code text UNIQUE NOT NULL,
        name text NOT NULL,
        years text NOT NULL DEFAULT '1,2,3,4',
        sections text NOT NULL DEFAULT 'A',
        academic_year text,
        status text NOT NULL DEFAULT 'pending',
        hod_pin text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await c.query("ALTER TABLE public.qr_departments ADD COLUMN IF NOT EXISTS hod_pin text");
    const { rowCount } = await c.query("SELECT 1 FROM public.qr_departments LIMIT 1");
    if (rowCount === 0) {
      for (const d of SEED_DEPARTMENTS) {
        await c.query(
          "INSERT INTO public.qr_departments (code, name, status) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING",
          [d.code, d.name, d.status]
        );
      }
    }
  });
}

router.use("/admin/departments", authMiddleware, adminOnly);

// List departments with live student counts.
router.get("/admin/departments", async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDepartmentsTable();
    const { data: depts, error } = await supabase
      .from("qr_departments")
      .select("*")
      .order("id");
    if (error) throw error;

    const enriched = await Promise.all(
      (depts || []).map(async (d: any) => {
        const { count } = await supabase
          .from("qr_users")
          .select("id", { count: "exact", head: true })
          .eq("role", "student")
          .ilike("section", `${d.code} %`);
        return { ...d, studentCount: count ?? 0 };
      })
    );
    res.json(enriched);
  } catch (err: any) {
    console.error("departments list error:", err?.message);
    res.status(500).json({ error: "Failed to load departments" });
  }
});

// Create or update a department's setup details.
router.post("/admin/departments", async (req: Request, res: Response) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  const name = String(req.body?.name || "").trim();
  const years = String(req.body?.years || "1,2,3,4").trim();
  const sections = String(req.body?.sections || "A").trim().toUpperCase().replace(/\s/g, "");
  const academicYear = String(req.body?.academicYear || "").trim() || null;

  if (!/^[A-Z]{2,8}$/.test(code)) {
    res.status(400).json({ error: "Department code must be 2-8 letters (e.g. CSE)" });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "Department name is required" });
    return;
  }
  if (!/^[A-D](,[A-D])*$/.test(sections)) {
    res.status(400).json({ error: "Sections must be letters A-D, e.g. A,B,C" });
    return;
  }
  try {
    await ensureDepartmentsTable();
    const { data, error } = await supabase
      .from("qr_departments")
      .upsert({ code, name, years, sections, academic_year: academicYear, status: "setup" }, { onConflict: "code" })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("department upsert error:", err?.message);
    res.status(500).json({ error: "Failed to save department" });
  }
});

// ── Strict student import ────────────────────────────────────────────────────
// The frontend parses the Excel and posts normalized rows; the server is the
// authority: any missing/invalid field in ANY row, or any duplicate roll,
// rejects the whole import. Nothing is inserted unless every row is valid.

const NORMALIZE = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function detectColumn(headers: string[], candidates: string[]): number {
  for (const cand of candidates) {
    const idx = headers.findIndex((h) => h === cand);
    if (idx >= 0) return idx;
  }
  // substring fallback (e.g. "studentrollnumber" contains "rollnumber")
  for (const cand of candidates) {
    const idx = headers.findIndex((h) => h && (h.includes(cand) || cand.includes(h)));
    if (idx >= 0) return idx;
  }
  return -1;
}

const ROMAN_FROM: Record<string, string> = {
  "1": "1", "i": "1", "1st": "1", "first": "1",
  "2": "2", "ii": "2", "2nd": "2", "second": "2",
  "3": "3", "iii": "3", "3rd": "3", "third": "3",
  "4": "4", "iv": "4", "4th": "4", "fourth": "4",
};

function parseYear(v: string): string | null {
  const n = NORMALIZE(v);
  if (!n) return null;
  return ROMAN_FROM[n] ?? null;
}

router.post("/admin/departments/import-students", async (req: Request, res: Response) => {
  const code = String(req.query.code || req.body?.code || "").trim().toUpperCase();
  const rows: string[][] = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!/^[A-Z]{2,8}$/.test(code)) {
    res.status(400).json({ error: "Valid department code is required" });
    return;
  }
  if (rows.length < 2) {
    res.status(400).json({ error: "The sheet has no data rows — upload the full student Excel sheet." });
    return;
  }

  // Row 0 is the header row.
  const headers = rows[0].map(NORMALIZE);
  const rollIdx = detectColumn(headers, ["rollnumber", "rollno", "uniqueid", "uid", "regdno", "registrationnumber", "roll"]);
  const nameIdx = detectColumn(headers, ["studentname", "name"]);
  const yearIdx = detectColumn(headers, ["year", "classyear", "studyyear"]);
  const sectionIdx = detectColumn(headers, ["sectionletter", "section", "sec"]);
  const classIdx = detectColumn(headers, ["class", "sectionclass", "classsection"]);
  const batchIdx = detectColumn(headers, ["batch", "admissionyear", "passingyear"]);

  const problems: string[] = [];

  if (rollIdx < 0) problems.push("Missing required column: Roll Number");
  if (nameIdx < 0) problems.push("Missing required column: Student Name");
  if (yearIdx < 0 && classIdx < 0) problems.push("Missing required column: Year (or combined Class like 2A)");
  if (sectionIdx < 0 && classIdx < 0) problems.push("Missing required column: Section (or combined Class like 2A)");
  if (problems.length > 0) {
    res.status(400).json({ error: "The Excel sheet is missing required columns.", problems });
    return;
  }

  const seenRolls = new Map<string, number>();
  const parsed: { roll: string; name: string; year: string; letter: string; batch: string | null }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !String(c ?? "").trim())) continue; // skip blank rows
    const lineNo = i + 1;

    const roll = String(row[rollIdx] ?? "").trim().toUpperCase();
    const name = String(row[nameIdx] ?? "").trim().replace(/\s+/g, " ");
    const yearRaw = yearIdx >= 0 ? String(row[yearIdx] ?? "").trim() : "";
    const sectionRaw = sectionIdx >= 0 ? String(row[sectionIdx] ?? "").trim() : "";
    const classRaw = classIdx >= 0 ? String(row[classIdx] ?? "").trim() : "";
    const batchRaw = batchIdx >= 0 ? String(row[batchIdx] ?? "").trim() : "";

    const fail = (msg: string) => problems.push(`Row ${lineNo}: ${msg}`);

    if (!roll) fail("Roll Number is empty");
    else if (!/^[A-Z0-9]{4,20}$/.test(roll)) fail(`Roll Number "${roll}" is not a valid roll number`);
    if (!name) fail("Student Name is empty");
    else if (name.length < 2 || !/[A-Za-z]/.test(name)) fail(`Name "${name}" is not a valid name`);

    let year = parseYear(yearRaw);
    let letter = sectionRaw.replace(/[^A-Da-d]/g, "").toUpperCase().slice(0, 1);

    if (!year && classRaw) {
      const clsYear = parseYear(classRaw.split(/[^A-Za-z0-9]/)[0] || classRaw);
      if (clsYear) year = clsYear;
    }
    if (!letter && classRaw) {
      const m = classRaw.match(/([1-4])\s*[-_ ]?\s*([A-Da-d])\b/) || classRaw.match(/(I{1,3}|IV)\s*[-_ ]?\s*([A-Da-d])\b/);
      if (m) letter = m[2].toUpperCase();
    }

    if (!year) fail(`Year "${yearRaw || classRaw}" is missing or not a valid year (1-4 / I-IV)`);
    if (!letter) fail(`Section "${sectionRaw || classRaw}" is missing or not a valid section letter (A-D)`);
    if (batchRaw && !/^(19|20)\d{2}$/.test(batchRaw)) fail(`Batch "${batchRaw}" is not a valid year`);

    if (roll && name && year && letter) {
      if (seenRolls.has(roll)) fail(`Roll Number "${roll}" appears twice in the sheet (also row ${seenRolls.get(roll)})`);
      else seenRolls.set(roll, lineNo);
      parsed.push({ roll, name, year, letter, batch: batchRaw || null });
    }
  }

  if (parsed.length === 0) {
    problems.unshift("No valid student rows were found.");
  }
  if (problems.length > 0) {
    // STRICT: reject the entire import, insert nothing.
    res.status(400).json({
      error: "Import rejected — the sheet has invalid or missing data. Nothing was saved.",
      problems: problems.slice(0, 40),
      totalProblems: problems.length,
      validRows: parsed.length,
    });
    return;
  }

  // Cross-check against the database: every roll must be new.
  const rolls = parsed.map((p) => p.roll);
  const existing = new Set<string>();
  for (let i = 0; i < rolls.length; i += 200) {
    const chunk = rolls.slice(i, i + 200);
    const { data: dupes } = await supabase
      .from("qr_users")
      .select("unique_id")
      .in("unique_id", chunk);
    (dupes || []).forEach((d: any) => existing.add(d.unique_id));
  }
  if (existing.size > 0) {
    res.status(400).json({
      error: "Import rejected — some roll numbers already exist in the system. Nothing was saved.",
      problems: [...existing].slice(0, 40).map((r) => `Roll Number "${r}" is already registered`),
      totalProblems: existing.size,
      validRows: parsed.length,
    });
    return;
  }

  // Insert everything (single batch; strictness guaranteed above).
  const payload = parsed.map((p) => ({
    name: p.name,
    unique_id: p.roll,
    role: "student",
    section: `${code} ${ROMAN[p.year]}/${p.letter}`,
    ...(p.batch ? { batch: p.batch } : {}),
  }));
  for (let i = 0; i < payload.length; i += 200) {
    const { error } = await supabase.from("qr_users").insert(payload.slice(i, i + 200));
    if (error) {
      console.error("import insert error:", error.message);
      res.status(500).json({ error: `Database rejected the import: ${error.message}` });
      return;
    }
  }

  // Mark the department live once students are in.
  await supabase.from("qr_departments").update({ status: "live" }).eq("code", code);

  const perSection: Record<string, number> = {};
  parsed.forEach((p) => {
    const key = `${p.year}${p.letter}`;
    perSection[key] = (perSection[key] || 0) + 1;
  });

  res.json({ inserted: payload.length, perSection, department: code });
});

// ── Faculty & keys import ────────────────────────────────────────────────────
// Creates qr_mentors rows (bcrypt-hashed login keys) and assigns the imported
// students of each mentor's sections to them via qr_users.mentor_id.
router.post("/admin/departments/import-mentors", async (req: Request, res: Response) => {
  const code = String(req.query.code || req.body?.code || "").trim().toUpperCase();
  const mentors: { name: string; subject?: string; key: string; sections?: string[] }[] = Array.isArray(req.body?.mentors) ? req.body.mentors : [];

  if (!/^[A-Z]{2,8}$/.test(code)) {
    res.status(400).json({ error: "Valid department code is required" });
    return;
  }
  if (mentors.length === 0) {
    res.status(400).json({ error: "No mentors provided" });
    return;
  }

  const problems: string[] = [];
  const seenKeys = new Map<string, number>();
  const clean: { name: string; subject: string; key: string; sections: string[] }[] = [];

  mentors.forEach((m, i) => {
    const name = String(m?.name || "").trim().replace(/\s+/g, " ");
    const subject = String(m?.subject || "").trim();
    const key = String(m?.key || "").trim();
    const sections = Array.isArray(m?.sections) ? m.sections.map((x: string) => String(x).trim().toUpperCase()).filter(Boolean) : [];
    const fail = (msg: string) => problems.push(`Mentor ${i + 1}${name ? ` (${name})` : ""}: ${msg}`);

    if (!name || name.length < 2) fail("Name is required");
    if (!/^[0-9]{3,6}$/.test(key)) fail(`Login key "${key}" must be 3-6 digits`);
    if (sections.length === 0) fail("At least one section (e.g. 2A) is required so students can be assigned");
    if (seenKeys.has(key)) fail(`Login key "${key}" appears twice (also mentor ${seenKeys.get(key)})`);
    else if (key) seenKeys.set(key, i + 1);

    if (name && /^[0-9]{3,6}$/.test(key) && sections.length > 0) {
      clean.push({ name, subject, key, sections });
    }
  });

  if (problems.length > 0) {
    res.status(400).json({ error: "Mentor details are invalid. Nothing was saved.", problems: problems.slice(0, 40), totalProblems: problems.length });
    return;
  }

  // Keys must be globally unique in qr_mentors.
  const keys = clean.map((m) => m.key);
  const { data: taken } = await supabase.from("qr_mentors").select("key").in("key", keys);
  if (taken && taken.length > 0) {
    res.status(400).json({
      error: "Some login keys are already used by existing faculty. Nothing was saved.",
      problems: taken.map((t: any) => `Key "${t.key}" is already taken`),
      totalProblems: taken.length,
    });
    return;
  }

  const bcrypt = await import("bcryptjs");
  const created: { id: number; name: string; key: string }[] = [];
  for (const m of clean) {
    const passwordHash = await bcrypt.hash(m.key, 10);
    const email = `${m.key}.${code.toLowerCase()}@faculty.sphn.local`;
    const { data, error } = await supabase
      .from("qr_mentors")
      .insert({ name: m.name, email, key: m.key, password_hash: passwordHash })
      .select("id, name, key")
      .single();
    if (error) {
      console.error("mentor insert error:", error.message);
      res.status(500).json({ error: `Failed to create mentor ${m.name}: ${error.message}` });
      return;
    }
    created.push({ id: data.id, name: data.name, key: data.key });

    // Assign this mentor's section students (canonical "<CODE> <ROMAN>/<LETTER>").
    for (const sec of m.sections) {
      const ym = sec.match(/([1-4])/);
      const sm = sec.match(/([A-D])/);
      if (!ym || !sm) continue;
      const canonical = `${code} ${(ROMAN as Record<string, string>)[ym[1]]}/${sm[1]}`;
      await supabase.from("qr_users").update({ mentor_id: data.id }).eq("section", canonical).eq("role", "student");
    }
  }

  res.json({ created, assignedTo: created.map((c) => c.id) });
});

// ── HOD PIN for the department ───────────────────────────────────────────────
// Generates a 6-digit PIN once and stores it on the department record.
router.post("/admin/departments/hod-pin", async (req: Request, res: Response) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!/^[A-Z]{2,8}$/.test(code)) {
    res.status(400).json({ error: "Valid department code is required" });
    return;
  }
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  const { data, error } = await supabase
    .from("qr_departments")
    .update({ hod_pin: pin })
    .eq("code", code)
    .select("code, hod_pin")
    .single();
  if (error) {
    console.error("hod pin error:", error.message);
    res.status(500).json({ error: "Failed to set HOD PIN" });
    return;
  }
  res.json(data);
});

export default router;
