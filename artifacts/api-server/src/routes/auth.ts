import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminsTable, mentorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { signToken, signMentorToken } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const admins = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    const admin = admins[0];
    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken(admin.id);
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/mentor-login", async (req, res) => {
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
