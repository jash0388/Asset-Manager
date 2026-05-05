import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load .env.local from the root
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(line => line && !line.startsWith("#"))
    .map(line => line.split("="))
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function checkStatus() {
  const { data: records, error } = await supabase
    .from("qr_attendance")
    .select("*")
    .order("date", { ascending: false })
    .order("last_scan_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log("Latest 10 attendance records:");
  console.table(records);
}

checkStatus();
