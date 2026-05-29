import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/web',
        permanent: true,
        basePath: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/mockServiceWorker.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  }
};

export default nextConfig;
