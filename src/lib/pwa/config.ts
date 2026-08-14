export const CACHE_PREFIXES = [
	"pages",
	"api-cache",
	"js-static",
	"js-assets",
	"css-static",
	"css-assets",
	"font-assets",
	"next-images",
	"google-fonts",
	"image-assets",
	"audio-assets",
	"video-assets",
	"gstatic-fonts"
] as const;

export const PWA_CONFIG = {
	github: {
		branch: "main",
		repo: "VESITRail",
		owner: "VESITRail"
	},
	version: {
		checkInterval: 30 * 60 * 1000,
		storageKey: "app-version-info"
	},
	serviceWorker: {
		scope: "/",
		updateViaCache: "none" as ServiceWorkerUpdateViaCache
	},
	cache: {
		expiryTime: 24 * 60 * 60 * 1000,
		expiration: {
			api: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
			pages: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
			media: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
			fonts: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
			static: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
			images: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }
		},
		staticAssets: {
			scripts: ["js-static", "js-assets"],
			styles: ["css-static", "css-assets"],
			images: ["image-assets", "next-images"],
			media: ["audio-assets", "video-assets"],
			fonts: ["google-fonts", "gstatic-fonts", "font-assets"]
		}
	}
} as const;
