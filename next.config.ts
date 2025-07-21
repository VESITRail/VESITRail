import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   serverActions: {
  //     allowedOrigins: ["localhost:3000", "cb8l64jv-3000.inc1.devtunnels.ms"],
  //   },
  // },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const {
        PrismaPlugin,
      } = require("@prisma/nextjs-monorepo-workaround-plugin");
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
};

export default nextConfig;
