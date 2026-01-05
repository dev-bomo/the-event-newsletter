import { Router } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import {
  getUserEventSources,
  addEventSource,
  deleteEventSource,
} from "../controllers/eventSources.js";

const router = Router();

const addSourceSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const sources = await getUserEventSources(req.userId!);
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const data = addSourceSchema.parse(req.body);
    const source = await addEventSource(req.userId!, data.url, data.name);
    res.json(source);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await deleteEventSource(req.userId!, req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as eventSourceRoutes };
