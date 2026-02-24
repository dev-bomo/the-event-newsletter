import { Router } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import {
  getUserPreferences,
  updateUserPreferences,
  updateUserCity,
  resetPreferences,
} from "../controllers/preferences.js";

const router = Router();

const updatePreferencesSchema = z.object({
  interests: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
  venues: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
  city: z.string().min(1).optional(), // Optional: when provided, updates city in same request (counts as 1 edit)
});

const updateCitySchema = z.object({
  city: z.string().min(1),
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const preferences = await getUserPreferences(req.userId!);
    res.json({
      ...preferences,
      _limits: { canEdit: true },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/", async (req: AuthRequest, res) => {
  try {
    const data = updatePreferencesSchema.parse(req.body);
    const { city, ...prefsData } = data;
    const preferences = await updateUserPreferences(req.userId!, prefsData, city);
    res.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/city", async (req: AuthRequest, res) => {
  try {
    const data = updateCitySchema.parse(req.body);
    await updateUserCity(req.userId!, data.city);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/reset", async (req: AuthRequest, res) => {
  try {
    const preferences = await resetPreferences(req.userId!);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as preferenceRoutes };
