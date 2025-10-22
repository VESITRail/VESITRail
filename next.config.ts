import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  disable: false,
  swSrc: "src/sw.ts",
  reloadOnOnline: true,
  swDest: "public/sw.js",
  cacheOnNavigation: true,
});

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const {
        PrismaPlugin,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      } = require("@prisma/nextjs-monorepo-workaround-plugin");
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
};

export default withSerwist(nextConfig);
