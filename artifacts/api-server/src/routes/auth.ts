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

    const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, SESSION_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
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
    const mentors = await db
      .select()
      .from(mentorsTable)
      .where(eq(mentorsTable.email, email))
      .limit(1);
    const mentor = mentors[0];
    if (!mentor) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, mentor.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signMentorToken(mentor.id);
    res.json({
      token,
      mentor: { id: mentor.id, email: mentor.email, name: mentor.name },
    });
  } catch (err) {
    req.log.error({ err }, "Mentor login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
