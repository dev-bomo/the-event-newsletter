import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import {
  generateNewsletter,
  sendNewsletter,
} from "../controllers/newsletters.js";
import { sendEmail } from "./email.js";

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DB_RETRY_ATTEMPTS = 5;
const DB_RETRY_BASE_DELAY_MS = 5 * 1000; // 5 seconds
const WEEKLY_ALERT_EMAIL =
  process.env.WEEKLY_NEWSLETTER_ALERT_EMAIL || "bogdan.moldovean@live.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operationName: string,
  operation: () => Promise<T>,
  attempts: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `${operationName} failed (attempt ${attempt}/${attempts}). Retrying in ${delayMs}ms...`,
        error
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function sendWeeklyFailureAlert(error: unknown, startedAt: Date) {
  const finishedAt = new Date();
  const err = error instanceof Error ? error : new Error(String(error));

  try {
    await sendEmail({
      to: WEEKLY_ALERT_EMAIL,
      subject: "[ALERT] Weekly newsletter cron failed",
      html: `
        <h2>Weekly newsletter cron failed</h2>
        <p><strong>Started at:</strong> ${startedAt.toISOString()}</p>
        <p><strong>Failed at:</strong> ${finishedAt.toISOString()}</p>
        <p><strong>Message:</strong> ${err.message}</p>
        <pre style="white-space: pre-wrap; font-family: monospace;">${err.stack || "No stack trace available"}</pre>
      `,
    });
    console.log(`Weekly failure alert email sent to ${WEEKLY_ALERT_EMAIL}`);
  } catch (alertError) {
    console.error("Failed to send weekly failure alert email:", alertError);
  }
}

async function processNewsletterBatch(
  users: { id: string; email: string }[]
): Promise<number> {
  let failedUsers = 0;
  for (const user of users) {
    try {
      const { newsletter } = await generateNewsletter(user.id, {
        isScheduledRun: true,
      });
      await sendNewsletter(user.id, newsletter.id);
      console.log(`Newsletter sent to ${user.email}`);
    } catch (error) {
      failedUsers++;
      console.error(`Error sending newsletter to ${user.email}:`, error);
    }
  }
  return failedUsers;
}

/**
 * Setup background cron jobs
 */
export function setupCronJobs() {
  // Run every Thursday at 4 PM - auto-generate and send newsletters
  // Batches of 10 users every 5 minutes
  cron.schedule("0 16 * * 4", async () => {
    const startedAt = new Date();
    console.log("Running weekly auto-newsletter job (Thursday 4 PM)...");

    try {
      const now = new Date();
      const users = await retryWithBackoff(
        "weekly users query",
        () =>
          prisma.user.findMany({
            where: {
              verified: true,
              city: { not: null },
              preferences: { isNot: null },
              subscriptionExpiresAt: { gt: now },
            },
            select: { id: true, email: true },
          }),
        DB_RETRY_ATTEMPTS,
        DB_RETRY_BASE_DELAY_MS
      );

      console.log(`Found ${users.length} users for auto-newsletter`);

      const batches: { id: string; email: string }[][] = [];
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        batches.push(users.slice(i, i + BATCH_SIZE));
      }

      let failedUsers = 0;
      for (let i = 0; i < batches.length; i++) {
        if (i > 0) {
          await sleep(BATCH_INTERVAL_MS);
        }
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        failedUsers += await processNewsletterBatch(batches[i]);
      }

      if (failedUsers > 0) {
        throw new Error(
          `Weekly auto-newsletter completed with ${failedUsers} user failures`
        );
      }

      console.log("Weekly auto-newsletter job completed");
    } catch (error) {
      console.error("Error in weekly auto-newsletter job:", error);
      await sendWeeklyFailureAlert(error, startedAt);
    }
  });

  console.log("✅ Cron jobs scheduled (auto-newsletter: Thu 4 PM)");
}
