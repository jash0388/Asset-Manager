import { db, adminsTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger.js";
import { runMigrations } from "./migrate.js";
import studentsData from "./students-data.json" with { type: "json" };

type StudentRow = { uniqueId: string; name: string };

let seeded = false;

export async function seed() {
  if (seeded) return;
  try {
    await runMigrations();

    const existing = await db.select().from(adminsTable).limit(1);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("admin@2006", 10);
      await db.insert(adminsTable).values({
        email: "jashwanth038@gmail.com",
        name: "Admin",
        passwordHash,
      });
      logger.info("Admin seeded. Login: jashwanth038@gmail.com / admin@2006");
    }

    const existingUsers = await db.select().from(usersTable).limit(1);
    if (existingUsers.length === 0) {
      const students = studentsData as StudentRow[];
      const batchSize = 100;
      let inserted = 0;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize).map((s) => ({
          name: s.name,
          uniqueId: s.uniqueId,
          role: "student" as const,
        }));
        await db.insert(usersTable).values(batch).onConflictDoNothing();
        inserted += batch.length;
      }
      logger.info({ count: inserted }, "Bulk-seeded students");
    }

    seeded = true;
  } catch (err) {
    logger.error({ err }, "Seed error");
  }
}
