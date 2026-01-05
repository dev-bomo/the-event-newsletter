import { Router } from 'express';
import { z } from 'zod';
import { register, login } from '../controllers/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await register(data);
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRoutes };

