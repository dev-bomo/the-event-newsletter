import { Router } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  getUserNewsletters,
  generateNewsletter,
  sendNewsletter,
} from "../controllers/newsletters.js";

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
    console.log("Generating newsletter for user:", req.userId);
    const { newsletter, rawResponses } = await generateNewsletter(req.userId!);
    console.log(
      "Newsletter generated successfully with",
      newsletter.events.length,
      "events"
    );

    // Check if showDump query parameter is present
    const showDump =
      req.query.showDump === "true" || req.query.showDump === "1";

    if (showDump) {
      res.json({ newsletter, rawResponses });
    } else {
      res.json(newsletter);
    }
  } catch (error) {
    console.error("Newsletter generation error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    if (error instanceof Error) {
      return res
        .status(400)
        .json({
          error: error.message,
          details:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
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
