import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";

const router = Router();

export interface ClassReassignment {
  id: string;
  date: string;
  slot: string;
  scheduleId?: number | string;
  fromFacultyKey: string;
  fromFacultyName: string;
  toFacultyKey: string;
  toFacultyName: string;
  subject: string;
  year: string;
  section: string;
  room: string;
  reason?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

// In-memory persistent store for dynamic reassignments
export const classReassignmentsStore: ClassReassignment[] = [
  {
    id: "reassign_demo_1",
    date: new Date().toISOString().slice(0, 10),
    slot: "11:10 – 12:10",
    scheduleId: 939,
    fromFacultyKey: "106",
    fromFacultyName: "Mr T Shravan Kumar",
    toFacultyKey: "108",
    toFacultyName: "Mrs G Sushma",
    subject: "IDS",
    year: "III",
    section: "DS-3A",
    room: "Hall 412",
    reason: "Official NBA Accreditation Meeting",
    status: "accepted",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    decidedAt: new Date(Date.now() - 1800000).toISOString(),
    decidedBy: "Dr. K. Srinivas Rao (HOD)",
  },
];

// GET /faculty/reassignments — Get all reassignments or filter by faculty/date/status
router.get("/faculty/reassignments", authMiddleware, async (req: any, res: any) => {
  const { date, facultyKey, status } = req.query as Record<string, string>;
  try {
    let list = [...classReassignmentsStore];

    if (date) {
      list = list.filter((r) => r.date === date);
    }
    if (facultyKey) {
      list = list.filter(
        (r) => r.fromFacultyKey === facultyKey || r.toFacultyKey === facultyKey
      );
    }
    if (status && status !== "all") {
      list = list.filter((r) => r.status === status);
    }

    // Sort: pending first, then newest
    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(list);
  } catch (err: any) {
    res.json([]);
  }
});

// POST /faculty/reassignments — Create a new class reassignment request
router.post("/faculty/reassignments", authMiddleware, async (req: any, res: any) => {
  try {
    const {
      date,
      slot,
      scheduleId,
      fromFacultyKey,
      fromFacultyName,
      toFacultyKey,
      toFacultyName,
      subject,
      year,
      section,
      room,
      reason,
    } = req.body;

    if (!fromFacultyName || !toFacultyName || !subject) {
      res.status(400).json({ error: "Missing required reassignment fields" });
      return;
    }

    const newRecord: ClassReassignment = {
      id: `reassign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: date || new Date().toISOString().slice(0, 10),
      slot: slot || "09:00 – 10:00",
      scheduleId: scheduleId || null,
      fromFacultyKey: fromFacultyKey || "106",
      fromFacultyName: fromFacultyName || "Faculty",
      toFacultyKey: toFacultyKey || "108",
      toFacultyName: toFacultyName || "Substitute Faculty",
      subject: subject || "Course",
      year: year || "III",
      section: section || "DS-3A",
      room: room || "Hall 412",
      reason: reason || "Faculty Leave / Official Assignment",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    classReassignmentsStore.unshift(newRecord);

    res.status(201).json({
      success: true,
      message: "Reassignment request sent to HOD for approval",
      reassignment: newRecord,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create reassignment request" });
  }
});

// POST /admin/reassignments/:id/action — HOD accepts or declines request
router.post("/admin/reassignments/:id/action", authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  const { action, decidedBy } = req.body;

  try {
    const item = classReassignmentsStore.find((r) => r.id === id);
    if (!item) {
      res.status(404).json({ error: "Reassignment request not found" });
      return;
    }

    if (action === "accept" || action === "approve") {
      item.status = "accepted";
      item.decidedAt = new Date().toISOString();
      item.decidedBy = decidedBy || "Dr. K. Srinivas Rao (HOD)";
    } else if (action === "decline" || action === "reject") {
      item.status = "declined";
      item.decidedAt = new Date().toISOString();
      item.decidedBy = decidedBy || "Dr. K. Srinivas Rao (HOD)";
    } else {
      res.status(400).json({ error: "Invalid action. Must be accept or decline." });
      return;
    }

    res.json({
      success: true,
      message: `Reassignment ${item.status === "accepted" ? "Approved" : "Declined"} successfully`,
      reassignment: item,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update reassignment action" });
  }
});

// GET /admin/reassignments — Get list for HOD Dashboard & Notification Badge
router.get("/admin/reassignments", authMiddleware, async (req: any, res: any) => {
  try {
    const pendingCount = classReassignmentsStore.filter((r) => r.status === "pending").length;
    const acceptedCount = classReassignmentsStore.filter((r) => r.status === "accepted").length;
    const declinedCount = classReassignmentsStore.filter((r) => r.status === "declined").length;

    const list = [...classReassignmentsStore].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      total: list.length,
      pendingCount,
      acceptedCount,
      declinedCount,
      reassignments: list,
    });
  } catch (err: any) {
    res.json({ total: 0, pendingCount: 0, acceptedCount: 0, declinedCount: 0, reassignments: [] });
  }
});

// Backward compatibility for old delegation endpoints
router.get("/faculty/delegations", authMiddleware, mentorOnly, async (req: any, res: any) => {
  res.json(classReassignmentsStore);
});

router.get("/faculty/delegated-to-me", authMiddleware, mentorOnly, async (req: any, res: any) => {
  res.json(classReassignmentsStore);
});

export default router;
