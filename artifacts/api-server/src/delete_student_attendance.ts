import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: '../../.env.production.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const rollNumber = "24N81A6758";
  const dateStr = "2026-08-05";

  console.log(`Searching for student with roll number: ${rollNumber}`);
  const { data: user, error: userError } = await supabase
    .from("qr_users")
    .select("id, name")
    .eq("unique_id", rollNumber)
    .single();

  if (userError || !user) {
    console.error("Error finding student:", userError?.message || "Student not found");
    return;
  }

  console.log(`Found student: ${user.name} (ID: ${user.id})`);
  console.log(`Deleting attendance records for date: ${dateStr}`);

  const { error, count } = await supabase
    .from("qr_attendance")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("date", dateStr);

  if (error) {
    console.error("Error deleting attendance:", error.message);
  } else {
    console.log(`Successfully deleted ${count} attendance record(s) for ${user.name}.`);
  }
}

run();
