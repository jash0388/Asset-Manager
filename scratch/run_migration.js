const pg = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:drallambalaram@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = fs.readFileSync(path.join(__dirname, 'supabase_migration.sql'), 'utf8');

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    servername: 'db.fothvpivwytaibkdhkci.supabase.co'
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database successfully using SNI! Running migration...");
    
    // Split SQL by semicolons or run it as a single block
    // pg client can execute multiple commands in a single query block if it is a string
    await client.query(sql);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

main();
