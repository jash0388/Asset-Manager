
import { db, adminsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function run() {
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const email = "jashwanth038@gmail.com";
    
    // Check if exists
    const existing = await db.select().from(adminsTable).where(adminsTable.email === email).limit(1);
    if (existing.length > 0) {
      console.log("Admin already exists, updating password...");
      await db.update(adminsTable).set({ passwordHash }).where(adminsTable.email === email);
    } else {
      console.log("Inserting new admin...");
      await db.insert(adminsTable).values({
        email,
        name: "Jashwanth",
        passwordHash
      });
    }
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
