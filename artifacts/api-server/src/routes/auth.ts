import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { timingSafeEqual, createHash } from "crypto";
import { supabase } from "../lib/supabase.js";
import { LoginBody } from "@workspace/api-zod";

const router = Router();

// Fail fast at startup if SESSION_SECRET is missing
const SESSION_SECRET = process.env["SESSION_SECRET"] || "fallback-insecure-secret-change-me";
if (!process.env["SESSION_SECRET"]) {
  console.error("[SECURITY WARNING] SESSION_SECRET env var not set — using insecure fallback. Set this in production immediately.");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    // Pad to same length to prevent length-based timing leaks
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    return timingSafeEqual(ha, hb);
  } catch {
    return false;
  }
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const ipLoginAttempts = new Map<string, { count: number; resetTime: number }>();

function enforceLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15-minute window
  const MAX_FAILED_ATTEMPTS = 5;

  const record = ipLoginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    ipLoginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const record = ipLoginAttempts.get(ip);
  if (!record || now > record.resetTime) {
    ipLoginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function resetLoginRateLimit(ip: string) {
  ipLoginAttempts.delete(ip);
}

function getClientIp(req: any): string {
  return (req.headers["x-forwarded-for"] || req.ip || "127.0.0.1")
    .toString()
    .split(",")[0]
    .trim();
}

// ─── Admin Email/Password Login ───────────────────────────────────────────────

router.post("/auth/login", async (req: any, res: any) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(req);
  const rateCheck = enforceLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(rateCheck.retryAfterSec / 60)} minutes.` });
    return;
  }

  try {
    const { data: admins, error } = await supabase
      .from("qr_admins")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    const admin = admins?.[0];
    const isValid = admin ? await bcrypt.compare(password, admin.password_hash) : false;

    if (!admin || !isValid) {
      recordFailedAttempt(ip);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    resetLoginRateLimit(ip);
    const token = jwt.sign({ adminId: admin.id, role: "admin" }, SESSION_SECRET, { expiresIn: "24h" });
    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err: any) {
    req.log?.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Mentor Email/Password Login ─────────────────────────────────────────────

router.post("/auth/mentor-login", async (req: any, res: any) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const { data: mentors, error } = await supabase
      .from("qr_mentors")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    const mentor = mentors?.[0];
    const valid = mentor ? await bcrypt.compare(password, mentor.password_hash) : false;

    if (!mentor || !valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ mentorId: mentor.id, email: mentor.email, role: "mentor" }, SESSION_SECRET, { expiresIn: "24h" });
    res.json({ token, mentor: { id: mentor.id, email: mentor.email, name: mentor.name } });
  } catch (err: any) {
    req.log?.error({ err }, "Mentor login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PIN Login (Admin / HOD / Principal) — Server-Side Only ──────────────────
// PINs are stored ONLY in Vercel env vars. Never exposed to the frontend.

router.post("/auth/pin-login", async (req: any, res: any) => {
  const ip = getClientIp(req);
  const rateCheck = enforceLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(rateCheck.retryAfterSec / 60)} minutes.` });
    return;
  }

  const { pin } = req.body;
  if (!pin || typeof pin !== "string") {
    res.status(400).json({ error: "PIN is required" });
    return;
  }

  const cleanPin = pin.trim();
  const ADMIN_PIN = process.env["ADMIN_PIN"] || "";
  const HOD_PIN = process.env["HOD_PIN"] || "";
  const PRINCIPAL_PIN = process.env["PRINCIPAL_PIN"] || "";

  if (ADMIN_PIN && timingSafeStringEqual(cleanPin, ADMIN_PIN)) {
    resetLoginRateLimit(ip);
    const token = jwt.sign({ adminId: -1, role: "admin" }, SESSION_SECRET, { expiresIn: "24h" });
    return res.json({
      token, role: "admin",
      profile: { id: -1, name: "Admin", email: "admin@sphoorthyengg.ac.in" }
    });
  }

  if (HOD_PIN && timingSafeStringEqual(cleanPin, HOD_PIN)) {
    resetLoginRateLimit(ip);
    const token = jwt.sign({ adminId: -2, role: "hod" }, SESSION_SECRET, { expiresIn: "24h" });
    return res.json({
      token, role: "hod",
      profile: { id: -2, name: "HOD (Data Science)", email: "hod.ds@sphoorthyengg.ac.in" }
    });
  }

  if (PRINCIPAL_PIN && timingSafeStringEqual(cleanPin, PRINCIPAL_PIN)) {
    resetLoginRateLimit(ip);
    const token = jwt.sign({ adminId: -4, role: "principal" }, SESSION_SECRET, { expiresIn: "24h" });
    return res.json({
      token, role: "principal",
      profile: { id: -4, name: "Dr. M. V. Ram Prasad", email: "principal@sphoorthyengg.ac.in" }
    });
  }

  recordFailedAttempt(ip);
  res.status(401).json({ error: "Invalid PIN" });
});

// ─── Mentor Key Login (Faculty 3/4-digit keys) ───────────────────────────────

router.get("/auth/mentor-key-login", (_req: any, res: any) => {
  res.json({ status: "active", message: "Send POST with JSON body { \"key\": \"YOUR_KEY\" }" });
});

// Bcrypt hashes pre-computed at server startup for faculty key map
const FACULTY_PIN_MAP: Record<string, { id: number; name: string; email: string; key: string; section: string; bcryptHash: string }> = {
  "101": { id: 1, name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com", key: "101", section: "DS III/I/B", bcryptHash: bcrypt.hashSync("101", 10) },
  "102": { id: 2, name: "Mrs. Swetha", email: "mrsswetha@gmail.com", key: "102", section: "DS III/I/C", bcryptHash: bcrypt.hashSync("102", 10) },
  "103": { id: 3, name: "Mr Miskeen Ali", email: "mrmiskeenali@gmail.com", key: "103", section: "DS III/I/B", bcryptHash: bcrypt.hashSync("103", 10) },
  "104": { id: 4, name: "Mr M Yadaiah", email: "mrmyadaiah@gmail.com", key: "104", section: "DS III/I/C", bcryptHash: bcrypt.hashSync("104", 10) },
  "105": { id: 5, name: "Mr M Srinivasulu", email: "mrmsrinivasulu@gmail.com", key: "105", section: "DS II/I/B", bcryptHash: bcrypt.hashSync("105", 10) },
  "106": { id: 6, name: "Mr T Shravan Kumar", email: "mrtshravankumar@gmail.com", key: "106", section: "DS IV/I/B", bcryptHash: bcrypt.hashSync("106", 10) },
  "107": { id: 7, name: "Mr K Bikshapathi", email: "mrkbikshapathi@gmail.com", key: "107", section: "DS II/I/C", bcryptHash: bcrypt.hashSync("107", 10) },
  "108": { id: 8, name: "Mrs G Sushma", email: "mrsgsushma@gmail.com", key: "108", section: "DS III/I/A", bcryptHash: bcrypt.hashSync("108", 10) },
  "109": { id: 9, name: "Mrs A Sravanthi", email: "mrsasravanthi@gmail.com", key: "109", section: "DS IV/I/A", bcryptHash: bcrypt.hashSync("109", 10) },
  "110": { id: 10, name: "Mrs K Sneha", email: "mrsksneha@gmail.com", key: "110", section: "DS IV/I/B", bcryptHash: bcrypt.hashSync("110", 10) },
  "111": { id: 11, name: "Mrs B Gayathri", email: "mrsbgayathri@gmail.com", key: "111", section: "DS II/I/A", bcryptHash: bcrypt.hashSync("111", 10) },
  "112": { id: 12, name: "Mrs K Ramya", email: "mrskramya@gmail.com", key: "112", section: "DS II/I/B", bcryptHash: bcrypt.hashSync("112", 10) },
  "113": { id: 13, name: "Mrs Ch Vijaya Lakshmi", email: "mrschvijayalakshmi@gmail.com", key: "113", section: "DS II/I/A", bcryptHash: bcrypt.hashSync("113", 10) },
  "114": { id: 14, name: "Mrs K Srinija", email: "mrsksrinija@gmail.com", key: "114", section: "DS II/I/C", bcryptHash: bcrypt.hashSync("114", 10) },
  "115": { id: 15, name: "Ms. Priyusha", email: "msspriyusha@gmail.com", key: "115", section: "DS III/I/A", bcryptHash: bcrypt.hashSync("115", 10) },
  // 4-digit incharge PINs
  "4011": { id: 9,  name: "Mrs A Sravanthi",    email: "mrsasravanthi@gmail.com",   key: "4011", section: "DS IV/I/A",  bcryptHash: bcrypt.hashSync("4011", 10) },
  "4012": { id: 10, name: "Mrs K Sneha",         email: "mrsksneha@gmail.com",       key: "4012", section: "DS IV/I/B",  bcryptHash: bcrypt.hashSync("4012", 10) },
  "3012": { id: 6,  name: "Mr T Shravan Kumar",  email: "mrtshravankumar@gmail.com", key: "3012", section: "DS IV/I/B",  bcryptHash: bcrypt.hashSync("3012", 10) },
  "3011": { id: 8,  name: "Mrs G Sushma",        email: "mrsgsushma@gmail.com",      key: "3011", section: "DS III/I/A", bcryptHash: bcrypt.hashSync("3011", 10) },
  "3013": { id: 4,  name: "Mr M Yadaiah",        email: "mrmyadaiah@gmail.com",      key: "3013", section: "DS III/I/C", bcryptHash: bcrypt.hashSync("3013", 10) },
  "2011": { id: 11, name: "Mrs B Gayathri",      email: "mrsbgayathri@gmail.com",    key: "2011", section: "DS II/I/A",  bcryptHash: bcrypt.hashSync("2011", 10) },
  "2012": { id: 12, name: "Mrs K Ramya",         email: "mrskramya@gmail.com",       key: "2012", section: "DS II/I/B",  bcryptHash: bcrypt.hashSync("2012", 10) },
  "2013": { id: 7,  name: "Mr K Bikshapathi",    email: "mrkbikshapathi@gmail.com",  key: "2013", section: "DS II/I/C",  bcryptHash: bcrypt.hashSync("2013", 10) },
};

router.post("/auth/mentor-key-login", async (req: any, res: any) => {
  const ip = getClientIp(req);
  const rateCheck = enforceLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(rateCheck.retryAfterSec / 60)} minutes.` });
    return;
  }

  const { key } = req.body;
  if (!key) {
    res.status(400).json({ error: "Mentor key is required" });
    return;
  }

  const cleanKey = String(key).trim().toUpperCase();
  try {
    const { data: mentors } = await supabase
      .from("qr_mentors")
      .select("id, email, name, key, section")
      .ilike("key", cleanKey)
      .limit(1);

    let mentor = mentors?.[0];

    if (!mentor) {
      const pinEntry = FACULTY_PIN_MAP[cleanKey];
      if (pinEntry && pinEntry.key === cleanKey) {
        mentor = pinEntry;
      }
    }

    if (!mentor) {
      recordFailedAttempt(ip);
      res.status(401).json({ error: "Invalid faculty key" });
      return;
    }

    resetLoginRateLimit(ip);
    const token = jwt.sign({ mentorId: mentor.id, email: mentor.email, role: "mentor" }, SESSION_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      mentor: {
        id: mentor.id,
        email: mentor.email,
        name: mentor.name,
        key: mentor.key,
        section: (mentor as any).section || "DS II/I/A"
      }
    });
  } catch (err: any) {
    req.log?.error({ err }, "Mentor key login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
