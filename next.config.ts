import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev resources from non-localhost hosts (puppeteer hitting 127.0.0.1
  // is treated as cross-origin and blocks the HMR WebSocket, which in turn
  // stalls client hydration and prevents client components from mounting).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
