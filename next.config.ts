import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Suppress React Router future flag warnings (these are informational only)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
