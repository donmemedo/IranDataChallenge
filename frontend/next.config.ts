import type { NextConfig } from "next";

// Baked in at build time; in Docker it points at the compose service.
const api = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  redirects: async () => [{ source: "/", destination: "/fa", permanent: false }],
  rewrites: async () => [{ source: "/api/:path*", destination: `${api}/api/:path*` }],
};

export default nextConfig;
