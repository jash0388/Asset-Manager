import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback-insecure-secret-change-me";

// Bypass is ONLY allowed when explicitly enabled in env (for local dev, never production)
const BYPASS_ENABLED = process.env.ALLOW_BYPASS_TOKEN === "true";

export interface AuthRequest extends Request {
  adminId?: number;
  mentorId?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);

  // Only allow bypass tokens when BYPASS_ENABLED is explicitly true (local dev only)
  if (BYPASS_ENABLED) {
    if (token === "bypass-token" || token === "bypass-token-hod" || token === "bypass-token-principal" || token.startsWith("bypass-token-mentor")) {
      req.adminId = token === "bypass-token-hod" ? -2 : token.startsWith("bypass-token-mentor") ? -3 : token === "bypass-token-principal" ? -4 : -1;
      if (token.startsWith("bypass-token-mentor")) {
        const key = token.replace("bypass-token-mentor-", "");
        const keyToIdMap: Record<string, number> = {
          "101": 1, "102": 2, "103": 3, "104": 4, "105": 5, "106": 6, "107": 7, "108": 8, "109": 9,
          "110": 10, "111": 11, "112": 12, "113": 13, "114": 14, "115": 15,
          "4011": 9, "4012": 10, "3012": 6, "3011": 8, "3013": 4, "2011": 11, "2012": 12, "2013": 7
        };
        req.mentorId = keyToIdMap[key] || -3;
      }
      next();
      return;
    }
  }

  // Reject bypass tokens when BYPASS_ENABLED is false (production)
  if (
    token === "bypass-token" ||
    token === "bypass-token-hod" ||
    token === "bypass-token-principal" ||
    token.startsWith("bypass-token-mentor")
  ) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId?: number;
      mentorId?: number;
      role?: string;
    };
    if (decoded.adminId !== undefined) req.adminId = decoded.adminId;
    if (decoded.mentorId !== undefined) req.mentorId = decoded.mentorId;
    if (decoded.adminId === undefined && decoded.mentorId === undefined) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.adminId === undefined || req.adminId === null) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function mentorOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.mentorId) {
    res.status(403).json({ error: "Mentor access required" });
    return;
  }
  next();
}

export function signToken(adminId: number): string {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: "3650d" });
}

export function signMentorToken(mentorId: number): string {
  return jwt.sign({ mentorId }, JWT_SECRET, { expiresIn: "3650d" });
}
