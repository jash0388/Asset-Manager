import { db, adminsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger.js";

export async function seed() {
  try {
    const existing = await db.select().from(adminsTable).limit(1);
    if (existing.length > 0) {
      logger.info("Admin already exists, skipping seed");
      return;
    }

    const passwordHash = await bcrypt.hash("ADMIN", 10);
    await db.insert(adminsTable).values({
      email: "jashwanth038@gmail.com",
      name: "Admin",
      passwordHash,
    });

    logger.info("Admin seeded. Login: jashwanth038@gmail.com / ADMIN");
  } catch (err) {
    logger.error({ err }, "Seed error");
  }
}
