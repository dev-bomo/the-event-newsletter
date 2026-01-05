import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import {
  generateNewsletter,
  sendNewsletter,
} from "../controllers/newsletters.js";

/**
 * Setup background cron jobs
 */
export function setupCronJobs() {
  // Run every Monday at 9 AM
  // Each newsletter will look 30 days ahead, so events can appear in multiple newsletters
  cron.schedule("0 9 * * 1", async () => {
    console.log("Running weekly newsletter job (looking 30 days ahead)...");

    try {
      // Get all users with preferences and city set
      const users = await prisma.user.findMany({
        where: {
          city: { not: null },
          preferences: { isNot: null },
        },
        include: {
          preferences: true,
        },
      });

      console.log(`Found ${users.length} users for newsletter`);

      for (const user of users) {
        try {
          // Generate newsletter
          const newsletter = await generateNewsletter(user.id);

          // Send newsletter
          await sendNewsletter(user.id, newsletter.id);

          console.log(`Newsletter sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending newsletter to ${user.email}:`, error);
          // Continue with other users
        }
      }

      console.log("Weekly newsletter job completed");
    } catch (error) {
      console.error("Error in weekly newsletter job:", error);
    }
  });

  console.log("✅ Cron jobs scheduled");
}
