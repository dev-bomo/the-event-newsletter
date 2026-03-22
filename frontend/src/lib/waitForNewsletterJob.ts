import api from "./api";

/** First status check at 30s; then every 10s until 1 min elapsed; then every 5s. */
const FIRST_POLL_MS = 30_000;
const POLL_MS_UNTIL_1_MIN = 10_000;
const POLL_MS_AFTER_1_MIN = 5_000;
const ONE_MIN_MS = 60_000;
const MAX_WAIT_MS = 3 * 60 * 1000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface NewsletterJobResult {
  newsletter: unknown;
  rawResponses?: string[];
}

/**
 * POST /newsletters/generate returns 202 { jobId }. Poll until completed or failed.
 */
export async function waitForNewsletterJob(
  jobId: string
): Promise<NewsletterJobResult> {
  const start = Date.now();
  await sleep(FIRST_POLL_MS);

  while (Date.now() - start < MAX_WAIT_MS) {
    const { data } = await api.get<{
      status: string;
      newsletter?: unknown;
      rawResponses?: string[];
      error?: string;
      code?: string;
    }>(`/newsletters/generate-status/${jobId}`);

    if (data.status === "completed" && data.newsletter !== undefined) {
      return {
        newsletter: data.newsletter,
        rawResponses: data.rawResponses,
      };
    }

    if (data.status === "failed") {
      const err: any = new Error(data.error || "Newsletter generation failed");
      err.response = {
        data: {
          error: data.error,
          code: data.code,
        },
      };
      throw err;
    }

    const elapsed = Date.now() - start;
    const waitMs =
      elapsed < ONE_MIN_MS ? POLL_MS_UNTIL_1_MIN : POLL_MS_AFTER_1_MIN;
    await sleep(waitMs);
  }

  throw new Error(
    "Newsletter generation timed out while waiting for results (3 minutes)."
  );
}

export async function postNewsletterGenerateAndWait(
  query: string
): Promise<NewsletterJobResult> {
  const res = await api.post(`/newsletters/generate${query}`);

  if (res.status !== 202 || !res.data?.jobId) {
    throw new Error("Unexpected response from generate endpoint.");
  }

  return waitForNewsletterJob(res.data.jobId as string);
}
