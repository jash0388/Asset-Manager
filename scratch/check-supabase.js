
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ayevvaecybqjvlvmrbme.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZXZ2YWVjeWJxanZsdm1yYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ1MTg1MiwiZXhwIjoyMDkzMDI3ODUyfQ.mIyomUW0MtEvGtUVYaKmbiIdHPW-4For-6b0YRtfCjg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('qr_users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Columns in qr_users:`, Object.keys(data[0] || {}));
  }
}

checkColumns();
