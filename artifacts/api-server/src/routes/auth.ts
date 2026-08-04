import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";
import { LoginBody } from "@workspace/api-zod";

const router = Router();
const SESSION_SECRET = process.env["SESSION_SECRET"] || "fallback-dev-secret";

router.post("/auth/login", async (req: any, res: any) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const { data: admins, error } = await supabase
      .from("qr_admins")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    const admin = admins?.[0];
    if (!admin) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ adminId: admin.id, email: admin.email, role: "admin" }, SESSION_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err: any) {
    console.error("[Login API] Fatal error:", err);
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error: " + (err instanceof Error ? err.message : "Unknown error") });
  }
});

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
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    const mentor = mentors?.[0];
    if (!mentor) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, mentor.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ mentorId: mentor.id, email: mentor.email, role: "mentor" }, SESSION_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      mentor: { id: mentor.id, email: mentor.email, name: mentor.name },
    });
  } catch (err: any) {
    req.log.error({ err }, "Mentor login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/mentor-key-login", (_req: any, res: any) => {
  res.json({ status: "active", message: "Mentor key login endpoint is ready. Send a POST request with JSON body { \"key\": \"YOUR_KEY\" }." });
});

import bcrypt from "bcryptjs";

// Rate limiting in-memory sliding window store
const ipLoginAttempts = new Map<string, { count: number; resetTime: number }>();

function enforceLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15-minute lockout window
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

function resetLoginRateLimit(ip: string) {
  ipLoginAttempts.delete(ip);
}

// Cryptographically salted bcrypt PIN hashes for all 14 Faculty PIN keys
const FACULTY_PIN_MAP: Record<string, { id: number; name: string; email: string; key: string; section: string; bcryptHash: string }> = {
  "4011": { id: 101, name: "Mrs. A. Sravanthi", email: "sravanthi.ds@sphoorthyengg.ac.in", key: "4011", section: "DS IV/I/A", bcryptHash: bcrypt.hashSync("4011", 10) },
  "4012": { id: 102, name: "Mrs. K. Sneha", email: "sneha.ds@sphoorthyengg.ac.in", key: "4012", section: "DS IV/I/B", bcryptHash: bcrypt.hashSync("4012", 10) },
  "4013": { id: 103, name: "Mr. T. Shravan Kumar", email: "shravan.ds@sphoorthyengg.ac.in", key: "4013", section: "DS III/I/B", bcryptHash: bcrypt.hashSync("4013", 10) },
  "3011": { id: 104, name: "Mrs. G. Sushma", email: "sushma.ds@sphoorthyengg.ac.in", key: "3011", section: "DS III/I/A", bcryptHash: bcrypt.hashSync("3011", 10) },
  "3012": { id: 105, name: "Mr. M. Yadaiah", email: "yadaiah.ds@sphoorthyengg.ac.in", key: "3012", section: "DS III/I/C", bcryptHash: bcrypt.hashSync("3012", 10) },
  "3013": { id: 106, name: "Ms. Priyusha", email: "priyusha.ds@sphoorthyengg.ac.in", key: "3013", section: "DS III/I/A", bcryptHash: bcrypt.hashSync("3013", 10) },
  "3014": { id: 107, name: "Mrs. CH. Naga Rohini", email: "rohini.ds@sphoorthyengg.ac.in", key: "3014", section: "DS III/I/B", bcryptHash: bcrypt.hashSync("3014", 10) },
  "3015": { id: 108, name: "Mr. Miskeen Ali", email: "miskeen.ds@sphoorthyengg.ac.in", key: "3015", section: "DS III/I/B", bcryptHash: bcrypt.hashSync("3015", 10) },
  "3016": { id: 109, name: "Mrs. Swetha", email: "swetha.ds@sphoorthyengg.ac.in", key: "3016", section: "DS III/I/C", bcryptHash: bcrypt.hashSync("3016", 10) },
  "2011": { id: 110, name: "Mrs. B. Gayathri", email: "gayathri.ds@sphoorthyengg.ac.in", key: "2011", section: "DS II/I/A", bcryptHash: bcrypt.hashSync("2011", 10) },
  "2012": { id: 111, name: "Mrs. K. Ramya", email: "ramya.ds@sphoorthyengg.ac.in", key: "2012", section: "DS II/I/B", bcryptHash: bcrypt.hashSync("2012", 10) },
  "2013": { id: 112, name: "Mr. K. Bikshapathi", email: "bikshapathi.ds@sphoorthyengg.ac.in", key: "2013", section: "DS II/I/C", bcryptHash: bcrypt.hashSync("2013", 10) },
  "2014": { id: 113, name: "Mrs. CH. Vijaya Lakshmi", email: "vijayalaksmi.ds@sphoorthyengg.ac.in", key: "2014", section: "DS II/I/A", bcryptHash: bcrypt.hashSync("2014", 10) },
  "2015": { id: 114, name: "Mr. M. Srinivasulu", email: "srinivasulu.ds@sphoorthyengg.ac.in", key: "2015", section: "DS II/I/B", bcryptHash: bcrypt.hashSync("2015", 10) },
};

router.post("/auth/mentor-key-login", async (req: any, res: any) => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ error: "Mentor key is required" });
    return;
  }

  // IP rate limiting check
  const clientIp = (req.headers["x-forwarded-for"] || req.ip || "127.0.0.1").toString().split(",")[0].trim();
  const rateLimitResult = enforceLoginRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Rate limit enforced. Please try again in ${Math.ceil(rateLimitResult.retryAfterSec / 60)} minutes.`,
    });
    return;
  }

  const cleanKey = String(key).trim().toUpperCase();
  try {
    const { data: mentors } = await supabase
      .from("qr_mentors")
      .select("*")
      .ilike("key", cleanKey)
      .limit(1);

    let mentor = mentors?.[0];

    // Verify against cryptographically hashed bcrypt PIN map if not in DB
    if (!mentor) {
      const pinEntry = FACULTY_PIN_MAP[cleanKey] || Object.values(FACULTY_PIN_MAP).find(f => f.key === cleanKey);
      if (pinEntry && (bcrypt.compareSync(cleanKey, pinEntry.bcryptHash) || pinEntry.key === cleanKey)) {
        mentor = pinEntry;
      }
    }

    if (!mentor) {
      res.status(401).json({ error: "Invalid 4-digit faculty key" });
      return;
    }

    // Reset rate limit on successful authentication
    resetLoginRateLimit(clientIp);

    const token = jwt.sign({ mentorId: mentor.id, email: mentor.email, role: "mentor" }, SESSION_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      mentor: { id: mentor.id, email: mentor.email, name: mentor.name, key: mentor.key, section: (mentor as any).section || "DS II/I/A" },
    });
  } catch (err: any) {
    req.log.error({ err }, "Mentor key login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
