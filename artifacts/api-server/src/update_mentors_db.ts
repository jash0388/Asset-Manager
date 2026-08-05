import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env.production.local") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Updating database mentors table to match new official list...");

  // Update Dr.A.Balaram (101) to Mrs. CH. Naga Rohini
  const { error: err1 } = await supabase
    .from("qr_mentors")
    .update({ name: "Mrs. CH. Naga Rohini", email: "mrschnagarohini@gmail.com" })
    .eq("key", "101");

  if (err1) console.error("Error updating 101:", err1);
  else console.log("Updated key 101 to Mrs. CH. Naga Rohini");

  // Update Dr Abdul Azeem (102) to Mrs. Swetha
  const { error: err2 } = await supabase
    .from("qr_mentors")
    .update({ name: "Mrs. Swetha", email: "mrsswetha@gmail.com" })
    .eq("key", "102");

  if (err2) console.error("Error updating 102:", err2);
  else console.log("Updated key 102 to Mrs. Swetha");

  // Insert Ms. Priyusha (115) if not present
  const { data: existing } = await supabase
    .from("qr_mentors")
    .select("id")
    .eq("key", "115");

  if (!existing || existing.length === 0) {
    // Get hash from another mentor to match password
    const { data: sample } = await supabase
      .from("qr_mentors")
      .select("password_hash")
      .limit(1);

    const hash = sample?.[0]?.password_hash || "$2b$10$nIov2uR3Z7FESz4/Z3KkRuyhXFszBf6o3fS1Z05.1lFfP17822h1y";

    const { error: insertErr } = await supabase
      .from("qr_mentors")
      .insert({
        key: "115",
        name: "Ms. Priyusha",
        email: "msspriyusha@gmail.com",
        password_hash: hash
      });

    if (insertErr) console.error("Error inserting Ms. Priyusha:", insertErr);
    else console.log("Inserted Ms. Priyusha with key 115");
  } else {
    console.log("Ms. Priyusha (115) already exists.");
  }
}

main();
