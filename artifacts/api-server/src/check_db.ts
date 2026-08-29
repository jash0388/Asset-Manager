import { supabase } from "./lib/supabase.js";

async function main() {
  const tables = [
    "qr_delegate_attendance",
    "qr_notifications",
    "qr_settings",
    "qr_app_settings",
    "qr_attendance",
    "qr_mentors",
    "qr_students",
    "qr_mentor_sessions",
    "qr_schedules",
    "qr_reassignments",
    "qr_class_delegations",
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    console.log(`Table ${t}:`, error ? `ERROR: ${error.message}` : `OK (rows: ${data?.length})`);
  }
}

main();
