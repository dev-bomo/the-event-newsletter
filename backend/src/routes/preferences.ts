import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import {
  getUserPreferences,
  updateUserPreferences,
  updateUserCity,
} from '../controllers/preferences.js';

const router = Router();

const updatePreferencesSchema = z.object({
  interests: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
  venues: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
});

const updateCitySchema = z.object({
  city: z.string().min(1),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const preferences = await getUserPreferences(req.userId!);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', async (req: AuthRequest, res) => {
  try {
    const data = updatePreferencesSchema.parse(req.body);
    const preferences = await updateUserPreferences(req.userId!, data);
    res.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/city', async (req: AuthRequest, res) => {
  try {
    const data = updateCitySchema.parse(req.body);
    await updateUserCity(req.userId!, data.city);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as preferenceRoutes };

