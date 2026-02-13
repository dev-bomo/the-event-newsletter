import { Router } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import {
  getUserHates,
  addHate,
  deleteHate,
  deleteAllHates,
} from "../controllers/hates.js";

const router = Router();

const addHateSchema = z.object({
  type: z.enum(["organizer", "artist", "venue", "event"]),
  value: z.string().min(1).max(500),
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const hates = await getUserHates(req.userId!);
    res.json(hates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { type, value } = addHateSchema.parse(req.body);
    const { hate } = await addHate(req.userId!, type, value);
    res.status(201).json(hate);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "This exclusion already exists" });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await deleteHate(req.userId!, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === "Hate not found") {
      return res.status(404).json({ error: "Exclusion not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req: AuthRequest, res) => {
  try {
    await deleteAllHates(req.userId!);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export const hateRoutes = router;
