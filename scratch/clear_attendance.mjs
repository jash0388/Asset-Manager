import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('artifacts/api-server/.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);
async function run() {
  const { error } = await supabase.from('qr_attendance').delete().gte('id', 0);
  console.log("Deleted old attendance records:", error || "success");
}
run();
