import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  connectYouTube,
  youtubeCallback,
  disconnectYouTube,
  getYouTubeStatus,
  syncYouTubePreferences,
} from '../controllers/youtube.js';

const router = Router();

// Public route for OAuth callback (no auth required)
router.get('/callback', youtubeCallback);

// Protected routes
router.get('/connect', authenticateToken, connectYouTube);
router.get('/status', authenticateToken, getYouTubeStatus);
router.post('/sync', authenticateToken, syncYouTubePreferences);
router.delete('/disconnect', authenticateToken, disconnectYouTube);

export { router as youtubeRoutes };

