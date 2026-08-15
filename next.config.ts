import path from "path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
	swSrc: "src/sw.ts",
	reloadOnOnline: true,
	swDest: "public/sw.js",
	cacheOnNavigation: true,
	disable: process.env.NODE_ENV !== "production"
});

const nextConfig: NextConfig = {
	skipTrailingSlashRedirect: true,
	turbopack: {
		root: path.resolve(__dirname)
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com"
			}
		]
	},
	async rewrites() {
		return [
			{
				source: "/ingest/:path*",
				destination: "https://us.i.posthog.com/:path*"
			},
			{
				source: "/ingest/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*"
			}
		];
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");
			config.plugins = [...config.plugins, new PrismaPlugin()];
		}

		return config;
	}
};

export default withSerwist(nextConfig);
