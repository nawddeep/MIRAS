import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: pages read local JSON/SQLite per request,
  // and the classic dynamic model is simpler to keep reliable for the demo.
  cacheComponents: false,
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
