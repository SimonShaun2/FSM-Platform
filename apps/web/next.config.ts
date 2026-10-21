import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/public/:path*",
        destination: `${apiOrigin}/api/v1/public/:path*`
      }
    ];
  }
};

export default nextConfig;
