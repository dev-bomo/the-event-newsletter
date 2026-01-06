import { Router } from "express";
import { z } from "zod";
import {
  register,
  login,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.js";

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

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await register(data);
    res.json(result);
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
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
    res.status(500).json({ error: "Internal server error" });
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

router.post("/forgot-password", async (req, res) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(data.email);
    res.json({
      success: true,
      message:
        "If an account exists with this email, a reset code has been sent.",
    });
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

router.post("/reset-password", async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await resetPassword(data);
    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
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

export { router as authRoutes };
