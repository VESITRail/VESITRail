import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      const {
        PrismaPlugin,
      } = require("@prisma/nextjs-monorepo-workaround-plugin");
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
  // experimental: {
  //   serverActions: {
  //     allowedOrigins: ["localhost:3000", "cb8l64jv-3000.inc1.devtunnels.ms"],
  //   },
  // },
};

export default nextConfig;
