import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import {
  generateNewsletter,
  sendNewsletter,
} from "../controllers/newsletters.js";

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processNewsletterBatch(users: { id: string; email: string }[]) {
  for (const user of users) {
    try {
      const { newsletter } = await generateNewsletter(user.id, {
        isScheduledRun: true,
      });
      await sendNewsletter(user.id, newsletter.id);
      console.log(`Newsletter sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending newsletter to ${user.email}:`, error);
    }
  }
}

/**
 * Setup background cron jobs
 */
export function setupCronJobs() {
  // Run every Thursday at 4 PM - auto-generate and send newsletters
  // Batches of 10 users every 5 minutes
  cron.schedule("0 16 * * 4", async () => {
    console.log("Running weekly auto-newsletter job (Thursday 4 PM)...");

    try {
      const users = await prisma.user.findMany({
        where: {
          verified: true,
          city: { not: null },
          preferences: { isNot: null },
        },
        select: { id: true, email: true },
      });

      console.log(`Found ${users.length} users for auto-newsletter`);

      const batches: { id: string; email: string }[][] = [];
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        batches.push(users.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        if (i > 0) {
          await sleep(BATCH_INTERVAL_MS);
        }
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        await processNewsletterBatch(batches[i]);
      }

      console.log("Weekly auto-newsletter job completed");
    } catch (error) {
      console.error("Error in weekly auto-newsletter job:", error);
    }
  });

  console.log("✅ Cron jobs scheduled (auto-newsletter: Thu 4 PM)");
}
