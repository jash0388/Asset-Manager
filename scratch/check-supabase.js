
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ayevvaecybqjvlvmrbme.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZXZ2YWVjeWJxanZsdm1yYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ1MTg1MiwiZXhwIjoyMDkzMDI3ODUyfQ.mIyomUW0MtEvGtUVYaKmbiIdHPW-4For-6b0YRtfCjg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTables() {
  const tables = ['admins', 'users', 'attendance'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table ${table} does not exist or error: ${error.message}`);
    } else {
      console.log(`Table ${table} exists!`);
    }
  }
}

checkTables();
