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
  originalSubject?: string;
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
export const classReassignmentsStore: ClassReassignment[] = [];

// GET /admin/reassignments — Get all reassignments for HOD / Admin notifications
router.get("/admin/reassignments", authMiddleware, async (req: any, res: any) => {
  try {
    let list = [...classReassignmentsStore];

    // Sort: pending first, then newest
    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ success: true, reassignments: list });
  } catch (err: any) {
    res.json({ success: true, reassignments: [] });
  }
});

// GET /faculty/reassignments — Get all reassignments or filter by faculty/date/status
router.get("/faculty/reassignments", authMiddleware, async (req: any, res: any) => {
  const { date, facultyKey, status } = req.query as Record<string, string>;
  try {
    let list = [...classReassignmentsStore];

    if (date) {
      list = list.filter((r) => r.date === date);
    } else {
      // Emergency swaps are strictly date-bound: do not show past-date reassignments as active
      const todayIso = new Date().toISOString().slice(0, 10);
      list = list.filter((r) => r.date >= todayIso);
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
      originalSubject,
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
      originalSubject: originalSubject || subject || "Course",
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
      message: "Reassignment request sent to substitute faculty for acceptance",
      reassignment: newRecord,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create reassignment request" });
  }
});

// POST /faculty/reassignments/:id/action & /admin/reassignments/:id/action — Faculty or HOD accepts/declines request
const handleReassignmentAction = async (req: any, res: any) => {
  const { id } = req.params;
  const { action, decidedBy } = req.body;

  try {
    const item = classReassignmentsStore.find(
      (r) => r.id === id || String(r.scheduleId) === String(id)
    );
    if (!item) {
      res.status(404).json({ error: "Reassignment request not found" });
      return;
    }

    if (action === "accept" || action === "approve") {
      item.status = "accepted";
      item.decidedAt = new Date().toISOString();
      item.decidedBy = decidedBy || (req.user?.name ? `${req.user.name} (Substitute Faculty)` : "Substitute Faculty");
    } else if (action === "decline" || action === "reject") {
      item.status = "declined";
      item.decidedAt = new Date().toISOString();
      item.decidedBy = decidedBy || (req.user?.name ? `${req.user.name} (Substitute Faculty)` : "Substitute Faculty");
    } else {
      res.status(400).json({ error: "Invalid action. Must be accept or decline." });
      return;
    }

    res.json({
      success: true,
      message: `Reassignment request ${item.status === "accepted" ? "Accepted" : "Declined"} successfully`,
      reassignment: item,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update reassignment action" });
  }
};

router.post("/admin/reassignments/:id/action", authMiddleware, handleReassignmentAction);
router.post("/faculty/reassignments/:id/action", authMiddleware, handleReassignmentAction);
router.post("/faculty/reassignments/:id/respond", authMiddleware, handleReassignmentAction);

// Resilient cancel / delete handler
const handleCancelReassignment = async (req: any, res: any) => {
  const paramId = req.params.id;
  const bodyId = req.body?.id || req.body?.reassignmentId;
  const scheduleId = req.body?.scheduleId;
  const targetId = paramId || bodyId;

  try {
    const idx = classReassignmentsStore.findIndex((r) => {
      if (targetId && targetId !== "active" && (r.id === targetId || String(r.id) === String(targetId))) return true;
      if (targetId && targetId !== "active" && String(r.scheduleId) === String(targetId)) return true;
      if (scheduleId && String(r.scheduleId) === String(scheduleId)) return true;
      return false;
    });

    if (idx === -1) {
      res.json({
        success: true,
        message: "Reassignment request cancelled or already cleared",
        reassignment: null,
      });
      return;
    }

    const removed = classReassignmentsStore.splice(idx, 1)[0];
    res.json({
      success: true,
      message: "Reassignment request cancelled successfully",
      reassignment: removed,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to cancel reassignment request" });
  }
};

// POST /faculty/reassignments/:id/cancel
router.post("/faculty/reassignments/:id/cancel", authMiddleware, handleCancelReassignment);
router.post("/faculty/reassignments/cancel", authMiddleware, handleCancelReassignment);
router.delete("/faculty/reassignments/:id", authMiddleware, handleCancelReassignment);

// Backward compatibility for old delegation endpoints
router.get("/faculty/delegations", authMiddleware, mentorOnly, async (req: any, res: any) => {
  res.json(classReassignmentsStore);
});

router.get("/faculty/delegated-to-me", authMiddleware, mentorOnly, async (req: any, res: any) => {
  res.json(classReassignmentsStore);
});

export default router;
