import type { NextConfig } from "next";
import { config } from 'dotenv';
import { resolve } from 'path';

// Force load .env file and override system environment
config({ path: resolve(__dirname, '.env'), override: true });

const nextConfig: NextConfig = {
  // Output mode - Vercel handles this automatically
  // Use 'standalone' only for Docker/self-hosted deployments
  // output: "standalone", // Uncomment for Docker deployment
  
  typescript: {
    // Production builds should fail on TypeScript errors
    ignoreBuildErrors: false,
  },
  
  reactStrictMode: true,
  
  // Allow dev requests from preview environments
  allowedDevOrigins: [
    '.space.z.ai',
    '.z.ai',
  ],
  
  // Vercel-specific: Enable Edge Runtime optimizations
  experimental: {
    // Enable optimized package imports for faster builds
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

export default nextConfig;

