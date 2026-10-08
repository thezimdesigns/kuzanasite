import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  images: {
    localPatterns: [
      { pathname: "/files/**", search: "" },
      { pathname: "/brand/**", search: "" },
    ],
    qualities: [75],
    // Uploaded files never change (UUID keys), so optimised variants can be cached long.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    // Allows staff to submit large forms (e.g. long press releases).
    serverActions: { bodySizeLimit: "2mb" },
  },
  // One canonical address: kuzana.org.zw → www.kuzana.org.zw (admin sign-in trusts the www origin).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "kuzana.org.zw" }],
        destination: "https://www.kuzana.org.zw/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
