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

const FACULTY_PIN_MAP: Record<string, { id: number; name: string; email: string; key: string; section: string }> = {
  "4011": { id: 101, name: "Mrs. A. Sravanthi", email: "sravanthi.ds@sphoorthyengg.ac.in", key: "4011", section: "DS IV/I/A" },
  "4012": { id: 102, name: "Mrs. K. Sneha", email: "sneha.ds@sphoorthyengg.ac.in", key: "4012", section: "DS IV/I/B" },
  "4013": { id: 103, name: "Mr. T. Shravan Kumar", email: "shravan.ds@sphoorthyengg.ac.in", key: "4013", section: "DS III/I/B" },
  "3011": { id: 104, name: "Mrs. G. Sushma", email: "sushma.ds@sphoorthyengg.ac.in", key: "3011", section: "DS III/I/A" },
  "3012": { id: 105, name: "Mr. M. Yadaiah", email: "yadaiah.ds@sphoorthyengg.ac.in", key: "3012", section: "DS III/I/C" },
  "3013": { id: 106, name: "Ms. Priyusha", email: "priyusha.ds@sphoorthyengg.ac.in", key: "3013", section: "DS III/I/A" },
  "3014": { id: 107, name: "Mrs. CH. Naga Rohini", email: "rohini.ds@sphoorthyengg.ac.in", key: "3014", section: "DS III/I/B" },
  "3015": { id: 108, name: "Mr. Miskeen Ali", email: "miskeen.ds@sphoorthyengg.ac.in", key: "3015", section: "DS III/I/B" },
  "3016": { id: 109, name: "Mrs. Swetha", email: "swetha.ds@sphoorthyengg.ac.in", key: "3016", section: "DS III/I/C" },
  "2011": { id: 110, name: "Mrs. B. Gayathri", email: "gayathri.ds@sphoorthyengg.ac.in", key: "2011", section: "DS II/I/A" },
  "2012": { id: 111, name: "Mrs. K. Ramya", email: "ramya.ds@sphoorthyengg.ac.in", key: "2012", section: "DS II/I/B" },
  "2013": { id: 112, name: "Mr. K. Bikshapathi", email: "bikshapathi.ds@sphoorthyengg.ac.in", key: "2013", section: "DS II/I/C" },
  "2014": { id: 113, name: "Mrs. CH. Vijaya Lakshmi", email: "vijayalaksmi.ds@sphoorthyengg.ac.in", key: "2014", section: "DS II/I/A" },
  "2015": { id: 114, name: "Mr. M. Srinivasulu", email: "srinivasulu.ds@sphoorthyengg.ac.in", key: "2015", section: "DS II/I/B" },
};

router.post("/auth/mentor-key-login", async (req: any, res: any) => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ error: "Mentor key is required" });
    return;
  }
  const cleanKey = String(key).trim().toUpperCase();
  try {
    const { data: mentors, error } = await supabase
      .from("qr_mentors")
      .select("*")
      .ilike("key", cleanKey)
      .limit(1);

    let mentor = mentors?.[0];

    // Fallback to static PIN map if not found in db
    if (!mentor) {
      const pinMatch = FACULTY_PIN_MAP[cleanKey] || Object.values(FACULTY_PIN_MAP).find(f => f.key === cleanKey);
      if (pinMatch) {
        mentor = pinMatch;
      }
    }

    if (!mentor) {
      res.status(401).json({ error: "Invalid mentor key" });
      return;
    }

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
