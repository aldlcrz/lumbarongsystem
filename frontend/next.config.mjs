import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Turbopack that the root of the project is THIS folder (frontend/),
  // not the parent lumbarong-main/ which has its own package-lock.json.
  // This eliminates the "node_modules doesn't exist" warnings.
  turbopack: {
    root: __dirname,
  },

  // Required for Capacitor static export
  output: 'export',
  distDir: 'out',
  trailingSlash: true,

  // Allow images from any domain (useful for product images from backend)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
