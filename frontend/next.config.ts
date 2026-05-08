import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/web',
  output: 'standalone',
  transpilePackages: ['msw'],
  /* config options here */
};

export default nextConfig;
