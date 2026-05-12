import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'http://127.0.0.1:3002/:path*'
      }
    ]
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
  }
};

export default nextConfig;
