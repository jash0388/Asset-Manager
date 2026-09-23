import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/holidays - List all declared holidays and academic calendar events
router.get("/api/holidays", async (_req, res): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("qr_holidays")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching holidays:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ holidays: data || [] });
  } catch (err: any) {
    console.error("Holidays GET error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// POST /api/holidays - Add or update a holiday or exam day
router.post("/api/holidays", async (req, res): Promise<any> => {
  try {
    const { date, reason, type = "holiday", year_applies = "ALL" } = req.body || {};

    if (!date || !date.trim()) {
      return res.status(400).json({ error: "Date is required (YYYY-MM-DD)" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Reason/title is required" });
    }

    const cleanDate = date.trim();
    const cleanReason = reason.trim();
    const cleanType = (type || "holiday").trim().toLowerCase();
    const cleanYear = (year_applies || "ALL").trim();

    const { data, error } = await supabase
      .from("qr_holidays")
      .upsert(
        {
          date: cleanDate,
          reason: cleanReason,
          type: cleanType,
          year_applies: cleanYear,
        },
        { onConflict: "date" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting holiday:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, holiday: data });
  } catch (err: any) {
    console.error("Holidays POST error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// DELETE /api/holidays/:date - Remove a declared holiday
router.delete("/api/holidays/:date", async (req, res): Promise<any> => {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const { error } = await supabase
      .from("qr_holidays")
      .delete()
      .eq("date", date);

    if (error) {
      console.error("Error deleting holiday:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, deletedDate: date });
  } catch (err: any) {
    console.error("Holidays DELETE error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

export default router;
