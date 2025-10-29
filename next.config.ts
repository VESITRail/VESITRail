import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
	disable: false,
	swSrc: "src/sw.ts",
	reloadOnOnline: true,
	swDest: "public/sw.js",
	cacheOnNavigation: true
});

const nextConfig: NextConfig = {
	turbopack: {},
	skipTrailingSlashRedirect: true,
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*"
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*"
			}
		];
	},
	webpack: async (config, { isServer }) => {
		if (isServer) {
			const { PrismaPlugin } = await import("@prisma/nextjs-monorepo-workaround-plugin");
			config.plugins = [...config.plugins, new PrismaPlugin()];
		}

		return config;
	}
};

export default withSerwist(nextConfig);
