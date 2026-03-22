import { randomUUID } from "crypto";
import {
  generateNewsletter,
  PAYWALL_MESSAGE,
} from "../controllers/newsletters.js";

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export interface GenerationJob {
  id: string;
  userId: string;
  status: GenerationJobStatus;
  showDump: boolean;
  newsletter?: unknown;
  rawResponses?: string[];
  error?: string;
  code?: "PAYWALL";
}

const jobs = new Map<string, GenerationJob>();

const CLEANUP_MS = 15 * 60 * 1000;

function scheduleJobCleanup(jobId: string) {
  setTimeout(() => {
    jobs.delete(jobId);
  }, CLEANUP_MS);
}

export function createGenerationJob(
  userId: string,
  showDump: boolean
): string {
  const id = randomUUID();
  jobs.set(id, {
    id,
    userId,
    status: "pending",
    showDump,
  });
  return id;
}

export function getGenerationJob(
  jobId: string,
  userId: string
): GenerationJob | undefined {
  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return undefined;
  return job;
}

export function startGenerationJob(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) return;

  setImmediate(() => {
    void runJob(jobId);
  });
}

async function runJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";

  try {
    const { newsletter, rawResponses } = await generateNewsletter(job.userId);
    job.status = "completed";
    job.newsletter = newsletter;
    job.rawResponses = rawResponses;
  } catch (error) {
    job.status = "failed";
    job.error =
      error instanceof Error ? error.message : "Newsletter generation failed";
    if (job.error === PAYWALL_MESSAGE) {
      job.code = "PAYWALL";
    }
  } finally {
    scheduleJobCleanup(jobId);
  }
}
