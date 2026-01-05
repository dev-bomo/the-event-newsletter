import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { discoverEventsForUser } from '../controllers/events.js';

const router = Router();

router.post('/discover', async (req: AuthRequest, res) => {
  try {
    const events = await discoverEventsForUser(req.userId!);
    res.json(events);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as eventRoutes };

