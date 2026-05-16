import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
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
