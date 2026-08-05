import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load dotenv from workspace root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.production.local") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data: mentors } = await supabase.from("qr_mentors").select("*");
  console.log("=== MENTORS ===");
  console.log(JSON.stringify(mentors, null, 2));

  const { data: schedules } = await supabase.from("qr_schedules").select("*").order("day_of_week").order("start_time");
  console.log("\n=== SCHEDULES ===");
  console.log(JSON.stringify(schedules, null, 2));
}

list();
