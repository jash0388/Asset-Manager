
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const email = "jashwanth038@gmail.com";
    
    // Check if exists
    const res = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    if (res.rows.length > 0) {
      console.log("Admin already exists, updating password...");
      await pool.query("UPDATE admins SET password_hash = $1 WHERE email = $2", [passwordHash, email]);
    } else {
      console.log("Inserting new admin...");
      await pool.query("INSERT INTO admins (email, name, password_hash) VALUES ($1, $2, $3)", [email, "Jashwanth", passwordHash]);
    }
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
