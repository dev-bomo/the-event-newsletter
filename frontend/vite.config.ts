import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import os from "os";

// Get local IP address
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

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Proxy to localhost since Vite runs on same machine
        changeOrigin: true,
      },
    },
  },
});
