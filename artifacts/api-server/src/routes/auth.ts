import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";
import { LoginBody } from "@workspace/api-zod";

const router = Router();
const SESSION_SECRET = process.env["SESSION_SECRET"] || "fallback-dev-secret";

router.post("/auth/login", async (req, res) => {
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

export default router;
