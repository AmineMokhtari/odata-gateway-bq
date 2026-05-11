import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'http://localhost:3002/:path*'
      }
    ]
  }
};

export default nextConfig;
