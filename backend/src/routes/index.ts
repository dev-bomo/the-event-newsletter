import { Express } from "express";
import { authRoutes } from "./auth.js";
import { preferenceRoutes } from "./preferences.js";
import { eventRoutes } from "./events.js";
import { eventSourceRoutes } from "./eventSources.js";
import { newsletterRoutes } from "./newsletters.js";
import { hateRoutes } from "./hates.js";
import { authenticateToken } from "../middleware/auth.js";

export function setupRoutes(app: Express) {
  // Public routes
  app.use("/api/auth", authRoutes);

  // Protected routes
  app.use("/api/preferences", authenticateToken, preferenceRoutes);
  app.use("/api/event-sources", authenticateToken, eventSourceRoutes);
  app.use("/api/events", authenticateToken, eventRoutes);
  app.use("/api/newsletters", authenticateToken, newsletterRoutes);
  app.use("/api/hates", authenticateToken, hateRoutes);
}
