import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
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
  }
};

export default nextConfig;
