import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware, mentorOnly } from "../middlewares/auth.js";

const router = Router();

// GET /faculty/delegations
router.get("/faculty/delegations", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  try {
    const { data: delegations } = await supabase
      .from("qr_delegate_attendance")
      .select(`
        *,
        substitute:qr_mentors!qr_delegate_attendance_substitute_id_fkey(id, name, email)
      `)
      .eq("delegator_id", mentorId)
      .order("created_at", { ascending: false });

    res.json(delegations || []);
  } catch (err: any) {
    res.json([]);
  }
});

// GET /faculty/delegated-to-me
router.get("/faculty/delegated-to-me", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  try {
    const { data: delegations } = await supabase
      .from("qr_delegate_attendance")
      .select(`
        *,
        delegator:qr_mentors!qr_delegate_attendance_delegator_id_fkey(id, name, email)
      `)
      .eq("substitute_id", mentorId)
      .order("created_at", { ascending: false });

    res.json(delegations || []);
  } catch (err: any) {
    res.json([]);
  }
});

// POST /faculty/delegations
router.post("/faculty/delegations", authMiddleware, mentorOnly, async (req: any, res: any) => {
  const mentorId = req.mentorId!;
  const { substituteId, courseAssignmentId, date, periods, notes } = req.body;

  try {
    const { data, error } = await supabase
      .from("qr_delegate_attendance")
      .insert({
        delegator_id: mentorId,
        substitute_id: parseInt(substituteId),
        course_assignment_id: courseAssignmentId ? parseInt(courseAssignmentId) : 1,
        date: date || new Date().toISOString().split("T")[0],
        periods: periods || "Regular",
        notes: notes || "",
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create delegation" });
  }
});

export default router;
