import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import { setupRoutes } from "./routes/index.js";
import { setupCronJobs } from "./services/cron.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get local IP address for network access
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIP();
const FRONTEND_URL = process.env.FRONTEND_URL || `http://${localIP}:5173`;

// Middleware
app.use(
  cors({
    origin: [FRONTEND_URL, `http://${localIP}:5173`, "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
setupRoutes(app);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://${localIP}:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL || "Not configured"}`);
  console.log(
    `🔑 JWT Secret: ${process.env.JWT_SECRET ? "Set" : "⚠️  NOT SET"}`
  );
  console.log(`\n📱 Access from your phone: http://${localIP}:5173`);

  // Setup background jobs
  setupCronJobs();
});
