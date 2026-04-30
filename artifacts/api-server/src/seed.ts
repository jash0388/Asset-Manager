import { db, adminsTable, usersTable, attendanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger.js";

export async function seed() {
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
    }

    logger.info("Database seeded successfully. Admin: admin@college.edu / admin123");
  } catch (err) {
    logger.error({ err }, "Seed error");
  }
}
