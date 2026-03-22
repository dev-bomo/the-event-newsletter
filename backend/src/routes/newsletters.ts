import { Router } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  getUserNewsletters,
  sendNewsletter,
  sendTestNewsletterTemplate,
} from "../controllers/newsletters.js";
import {
  createGenerationJob,
  getGenerationJob,
  startGenerationJob,
} from "../services/generationJobs.js";

const router = Router();

router.get("/", async (req: AuthRequest, res) => {
  try {
    const newsletters = await getUserNewsletters(req.userId!);
    res.json(newsletters);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/generate", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const showDump =
      req.query.showDump === "true" || req.query.showDump === "1";

    const jobId = createGenerationJob(userId, showDump);
    console.log("Queued newsletter generation job:", jobId, "user:", userId);
    startGenerationJob(jobId);

    return res.status(202).json({
      jobId,
      status: "pending",
      message:
        "Generation started. Poll GET /newsletters/generate-status/:jobId until completed.",
    });
  } catch (error) {
    console.error("Newsletter generation queue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/generate-status/:jobId", async (req: AuthRequest, res) => {
  const job = getGenerationJob(req.params.jobId, req.userId!);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status === "pending" || job.status === "running") {
    return res.json({ status: job.status, jobId: job.id });
  }

  if (job.status === "failed") {
    return res.json({
      status: "failed",
      jobId: job.id,
      error: job.error,
      code: job.code,
    });
  }

  return res.json({
    status: "completed",
    jobId: job.id,
    newsletter: job.newsletter,
    ...(job.showDump && job.rawResponses
      ? { rawResponses: job.rawResponses }
      : {}),
  });
});

router.post("/test-template/send", async (req: AuthRequest, res) => {
  try {
    await sendTestNewsletterTemplate(req.userId!);
    res.json({ success: true, message: "Test template email sent successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/send", async (req: AuthRequest, res) => {
  try {
    const newsletterId = req.params.id;
    console.log("Send newsletter request:", {
      newsletterId,
      userId: req.userId,
    });
    await sendNewsletter(req.userId!, newsletterId);
    res.json({ success: true, message: "Newsletter sent successfully" });
  } catch (error) {
    console.error("Error in send newsletter route:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as newsletterRoutes };
