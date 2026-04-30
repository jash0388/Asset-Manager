import { db, adminsTable, usersTable, mentorsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger.js";
import { runMigrations } from "./migrate.js";
import studentsData from "./students-data.json" with { type: "json" };

type StudentRow = { uniqueId: string; name: string };

let seeded = false;

export async function seed() {
  if (seeded) return;
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    const admins = [
      { email: "admin@college.edu", name: "Admin", passwordHash },
      { email: "jashwanth038@gmail.com", name: "Jashwanth", passwordHash }
    ];

    for (const admin of admins) {
      await db.insert(adminsTable)
        .values(admin)
        .onConflictDoUpdate({
          target: adminsTable.email,
          set: { passwordHash: admin.passwordHash, name: admin.name }
        });
    }

    const students = await db.insert(usersTable).values([
      { name: "Arjun Sharma", uniqueId: "STU001", role: "student" },
      { name: "Priya Patel", uniqueId: "STU002", role: "student" },
      { name: "Rahul Kumar", uniqueId: "STU003", role: "student" },
      { name: "Prof. Meera Singh", uniqueId: "STA001", role: "staff" },
      { name: "Dr. Vikram Nair", uniqueId: "STA002", role: "staff" },
    ]).returning();

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (students[0]) {
      await db.insert(attendanceTable).values({
        userId: students[0].id,
        date: today,
        entryTime: new Date(new Date().setHours(8, 30, 0)),
        scanCount: 1,
        lastScanAt: new Date(new Date().setHours(8, 30, 0)),
      });
      await db.insert(attendanceTable).values({
        userId: students[1].id,
        date: today,
        entryTime: new Date(new Date().setHours(9, 15, 0)),
        exitTime: new Date(new Date().setHours(14, 0, 0)),
        scanCount: 2,
        lastScanAt: new Date(new Date().setHours(14, 0, 0)),
      });
      await db.insert(attendanceTable).values({
        userId: students[0].id,
        date: yesterday,
        entryTime: new Date(new Date(yesterday).setHours(8, 0, 0)),
        exitTime: new Date(new Date(yesterday).setHours(16, 30, 0)),
        scanCount: 2,
        lastScanAt: new Date(new Date(yesterday).setHours(16, 30, 0)),
      });
      logger.info("Sample mentor seeded. Login: mentor@example.com / mentor@2006");
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
