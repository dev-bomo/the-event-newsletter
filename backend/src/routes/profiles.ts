import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import {
  discoverProfiles,
  selectProfiles,
  crawlSelectedProfiles,
  getUserProfiles,
} from '../controllers/profiles.js';

const router = Router();

const discoverSchema = z.object({
  email: z.string().email().optional(),
  profileUrl: z.string().url().optional(),
}).refine(data => data.email || data.profileUrl, {
  message: "Either email or profileUrl must be provided"
});

const selectSchema = z.object({
  profileIds: z.array(z.string()),
});

router.post('/discover', async (req: AuthRequest, res) => {
  try {
    console.log('Profile discovery request:', { email: req.body.email, profileUrl: req.body.profileUrl, userId: req.userId });
    const data = discoverSchema.parse(req.body);
    console.log('Validation passed, calling discoverProfiles...');
    const result = await discoverProfiles(req.userId!, data.email, data.profileUrl);
    console.log('Profile discovery successful, found', result.length, 'profiles');
    res.json(result);
  } catch (error) {
    console.error('Profile discovery error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: error.errors, message: 'Validation failed' });
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      // Check if it's a configuration error (should be 500)
      if (error.message.includes('not configured') || error.message.includes('API')) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message, details: error.stack });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const profiles = await getUserProfiles(req.userId!);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/select', async (req: AuthRequest, res) => {
  try {
    const data = selectSchema.parse(req.body);
    await selectProfiles(req.userId!, data.profileIds);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/crawl', async (req: AuthRequest, res) => {
  try {
    await crawlSelectedProfiles(req.userId!);
    res.json({ success: true, message: 'Profile crawling started' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as profileRoutes };

