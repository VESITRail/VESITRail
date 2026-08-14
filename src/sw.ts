import type {
	PrecacheEntry,
	StrategyOptions,
	SerwistGlobalConfig,
	NetworkFirstOptions,
	RouteHandlerCallbackOptions
} from "serwist";
import type { Strategy as StrategyType } from "serwist";
import { Serwist, CacheFirst, NetworkOnly, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[];
	}
}

declare function importScripts(...urls: string[]): void;

type ExtendableEvent = Event & {
	waitUntil: (promise: Promise<void>) => void;
};

type ExtendableMessageEvent = ExtendableEvent & {
	ports: MessagePort[];
	data: {
		type?: string;
		[key: string]: unknown;
	};
};

type ServiceWorkerClient = {
	url: string;
	focus: () => Promise<void>;
	postMessage: (message: unknown) => void;
};

type ServiceWorkerClients = {
	claim: () => Promise<void>;
	openWindow: (url: string) => Promise<ServiceWorkerClient | null>;
	matchAll: (options?: { type?: string; includeUncontrolled?: boolean }) => Promise<ServiceWorkerClient[]>;
};

type ServiceWorkerGlobalScopeWithUtils = WorkerGlobalScope & {
	clients: ServiceWorkerClients;
	skipWaiting: () => Promise<void>;
	registration: ServiceWorkerRegistration;
	addEventListener: ((type: "install" | "activate", listener: (event: ExtendableEvent) => void) => void) &
		((type: "message", listener: (event: ExtendableMessageEvent) => void) => void);
};

declare const self: ServiceWorkerGlobalScopeWithUtils;

importScripts("/firebase-messaging-sw.js");

let APP_VERSION = "v1.0.0";

const CACHE_PREFIXES = [
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

const initializeVersion = async (): Promise<void> => {
	try {
		const clients = await self.clients.matchAll({ includeUncontrolled: true });
		for (const client of clients) {
			const messageChannel = new MessageChannel();

			const versionPromise = new Promise<string>((resolve) => {
				const timeout = setTimeout(() => resolve("v1.0.0"), 500);

				messageChannel.port1.onmessage = (event) => {
					clearTimeout(timeout);
					if (event.data?.version) {
						resolve(event.data.version);
					} else {
						resolve("v1.0.0");
					}
				};
			});

			(client as unknown as { postMessage: (msg: unknown, transfer: Transferable[]) => void }).postMessage(
				{ type: "REQUEST_VERSION" },
				[messageChannel.port2]
			);

			const version = await versionPromise;
			if (version && version !== "v1.0.0") {
				APP_VERSION = version;
				break;
			}
		}
	} catch (error) {
		console.error("Failed to initialize version:", error);
	}
};

type StrategyConstructor = new (options?: StrategyOptions) => StrategyType;

const createStrategy = (
	StrategyClass: StrategyConstructor,
	cacheNamePrefix: string,
	options: StrategyOptions & Partial<Pick<NetworkFirstOptions, "networkTimeoutSeconds">> = {}
) => {
	return async ({ request, event, params }: RouteHandlerCallbackOptions) => {
		const cacheName = `${cacheNamePrefix}-${APP_VERSION}`;
		const strategy = new StrategyClass({
			cacheName,
			...options,
			plugins: [
				...(options.plugins || []),
				{
					cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
						return `${request.url}?v=${APP_VERSION}`;
					},
					cacheWillUpdate: async ({ response }: { response: Response }) => {
						if (!response || response.status !== 200 || response.type === "error") {
							return null;
						}
						return response;
					}
				}
			]
		});
		return strategy.handle({ request, event, params });
	};
};

const serwist = new Serwist({
	clientsClaim: true,
	skipWaiting: false,
	navigationPreload: true,
	precacheEntries: self.__SW_MANIFEST,
	runtimeCaching: [
		{
			matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
			handler: createStrategy(CacheFirst, "google-fonts", {
				plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
			handler: createStrategy(CacheFirst, "gstatic-fonts", {
				plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
			handler: createStrategy(CacheFirst, "font-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
			handler: createStrategy(StaleWhileRevalidate, "image-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\/_next\/image\?url=.*/i,
			handler: createStrategy(StaleWhileRevalidate, "next-images", {
				plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:mp3|wav|ogg|m4a|aac)$/i,
			handler: createStrategy(CacheFirst, "audio-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:mp4|webm|ogg|avi|mov)$/i,
			handler: createStrategy(CacheFirst, "video-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\/_next\/static\/.+\.js$/i,
			handler: createStrategy(CacheFirst, "js-static", {
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\/_next\/static\/.+\.css$/i,
			handler: createStrategy(CacheFirst, "css-static", {
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:js|mjs)$/i,
			handler: createStrategy(StaleWhileRevalidate, "js-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: /\.(?:css)$/i,
			handler: createStrategy(StaleWhileRevalidate, "css-assets", {
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })]
			})
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				request.method === "GET" && sameOrigin && url.pathname.startsWith("/api/auth/"),
			handler: new NetworkOnly()
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				sameOrigin &&
				request.method === "GET" &&
				url.pathname.startsWith("/api/") &&
				!url.pathname.startsWith("/api/auth/"),
			handler: createStrategy(NetworkFirst, "api-cache", {
				networkTimeoutSeconds: 3,
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })]
			})
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				sameOrigin &&
				request.method === "GET" &&
				!url.pathname.startsWith("/api/") &&
				!url.pathname.includes("_next/data") &&
				!url.pathname.startsWith("/_next/webpack-hmr"),
			handler: createStrategy(NetworkFirst, "pages", {
				networkTimeoutSeconds: 5,
				plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 })]
			})
		}
	]
});

serwist.addEventListeners();

const cleanupOldCaches = async (): Promise<void> => {
	try {
		const cacheNames = await caches.keys();
		const oldCaches = cacheNames.filter(
			(name) => !name.includes(APP_VERSION) && CACHE_PREFIXES.some((prefix) => name.includes(prefix))
		);

		await Promise.all(oldCaches.map((cacheName) => caches.delete(cacheName)));
	} catch (error) {
		console.error("Failed to cleanup old caches:", error);
	}
};

self.addEventListener("install", (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
			await initializeVersion();
			await cleanupOldCaches();
		})()
	);
});

self.addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
			if (self.registration.navigationPreload) {
				await self.registration.navigationPreload.enable();
			}

			await initializeVersion();
			await cleanupOldCaches();

			const clients = await self.clients.matchAll();
			clients.forEach((client: ServiceWorkerClient) => {
				client.postMessage({
					type: "SW_ACTIVATED",
					version: APP_VERSION,
					timestamp: Date.now()
				});
			});
		})()
	);
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
	if (event.data?.type === "SET_VERSION") {
		const rawVersion = String(event.data.version || "v1.0.0");
		APP_VERSION = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;

		event.waitUntil(
			(async () => {
				await cleanupOldCaches();
				event.ports?.[0]?.postMessage({
					success: true,
					version: APP_VERSION,
					type: "VERSION_SET_RESPONSE"
				});
			})()
		);
	}

	if (event.data?.type === "SKIP_WAITING") {
		event.waitUntil(
			(async () => {
				try {
					await self.skipWaiting();
					event.ports?.[0]?.postMessage({
						success: true,
						version: APP_VERSION,
						type: "SKIP_WAITING_RESPONSE"
					});
				} catch (error) {
					console.error("Skip waiting failed:", error);
					event.ports?.[0]?.postMessage({
						success: false,
						version: APP_VERSION,
						type: "SKIP_WAITING_RESPONSE",
						error: error instanceof Error ? error.message : String(error)
					});
				}
			})()
		);
	}

	if (event.data?.type === "CACHE_CLEARED") {
		event.waitUntil(
			(async () => {
				try {
					const cacheNames = await caches.keys();
					await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

					const clients = await self.clients.matchAll();
					clients.forEach((client: ServiceWorkerClient) => {
						client.postMessage({
							version: APP_VERSION,
							timestamp: Date.now(),
							type: "CACHE_CLEARED_RESPONSE"
						});
					});
				} catch (error) {
					console.error("Failed to clear caches:", error);
				}
			})()
		);
	}

	if (event.data?.type === "GET_VERSION") {
		event.ports?.[0]?.postMessage({
			version: APP_VERSION,
			type: "VERSION_RESPONSE"
		});
	}
});
