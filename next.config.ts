import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: pages read local JSON/SQLite per request,
  // and the classic dynamic model is simpler to keep reliable for the demo.
  cacheComponents: false,
  // No Content-Security-Policy on purpose: it can break the 360 viewer, fonts and the service worker, and it has not been tested here.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
