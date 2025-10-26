import { Serwist, CacheFirst, NetworkOnly, NetworkFirst, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

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
	matchAll: (options?: { type?: string; includeUncontrolled?: boolean }) => Promise<ServiceWorkerClient[]>;
	openWindow: (url: string) => Promise<ServiceWorkerClient | null>;
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

const getAppVersion = (): string => {
	try {
		const stored = globalThis.localStorage?.getItem("app-version-info");
		if (stored) {
			const parsed = JSON.parse(stored);
			return `v${parsed.version || "1.0.0"}`;
		}
	} catch (error) {
		console.warn("Failed to get version from storage:", error);
	}

	return "v1.0.0";
};

const APP_VERSION = getAppVersion();

const serwist = new Serwist({
	skipWaiting: false,
	clientsClaim: true,
	navigationPreload: true,
	precacheEntries: self.__SW_MANIFEST,
	runtimeCaching: [
		{
			matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
			handler: new CacheFirst({
				cacheName: `google-fonts-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
			handler: new CacheFirst({
				cacheName: `gstatic-fonts-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
			handler: new CacheFirst({
				cacheName: `font-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
			handler: new StaleWhileRevalidate({
				cacheName: `image-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		},
		{
			matcher: /\/_next\/image\?url=.*/i,
			handler: new StaleWhileRevalidate({
				cacheName: `next-images-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:mp3|wav|ogg|m4a|aac)$/i,
			handler: new CacheFirst({
				cacheName: `audio-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:mp4|webm|ogg|avi|mov)$/i,
			handler: new CacheFirst({
				cacheName: `video-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\/_next\/static\/.+\.js$/i,
			handler: new CacheFirst({
				cacheName: `js-static-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\/_next\/static\/.+\.css$/i,
			handler: new CacheFirst({
				cacheName: `css-static-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:js|mjs)$/i,
			handler: new StaleWhileRevalidate({
				cacheName: `js-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		},
		{
			matcher: /\.(?:css)$/i,
			handler: new StaleWhileRevalidate({
				cacheName: `css-assets-${APP_VERSION}`,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				request.method === "GET" && sameOrigin && url.pathname.startsWith("/api/auth/"),
			handler: new NetworkOnly()
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				request.method === "GET" &&
				sameOrigin &&
				url.pathname.startsWith("/api/") &&
				!url.pathname.startsWith("/api/auth/"),
			handler: new NetworkFirst({
				cacheName: `api-cache-${APP_VERSION}`,
				networkTimeoutSeconds: 3,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		},
		{
			matcher: ({ url, request, sameOrigin }) =>
				request.method === "GET" &&
				sameOrigin &&
				!url.pathname.startsWith("/api/") &&
				!url.pathname.includes("_next/data") &&
				!url.pathname.startsWith("/_next/webpack-hmr"),
			handler: new NetworkFirst({
				cacheName: `pages-${APP_VERSION}`,
				networkTimeoutSeconds: 5,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							return `${request.url}?v=${APP_VERSION}`;
						},
						cacheWillUpdate: async ({ response }) => {
							return response.status === 200;
						}
					}
				]
			})
		}
	]
});

serwist.addEventListeners();

const cleanupOldCaches = async (): Promise<void> => {
	try {
		const cacheNames = await caches.keys();
		const oldCaches = cacheNames.filter(
			(name) =>
				!name.includes(APP_VERSION) &&
				(name.includes("google-fonts") ||
					name.includes("gstatic-fonts") ||
					name.includes("font-assets") ||
					name.includes("image-assets") ||
					name.includes("next-images") ||
					name.includes("audio-assets") ||
					name.includes("video-assets") ||
					name.includes("js-static") ||
					name.includes("css-static") ||
					name.includes("js-assets") ||
					name.includes("css-assets") ||
					name.includes("api-cache") ||
					name.includes("pages"))
		);

		await Promise.all(oldCaches.map((cacheName) => caches.delete(cacheName)));
	} catch (error) {
		console.error("Failed to cleanup old caches:", error);
	}
};

self.addEventListener("install", (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
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

			await self.clients.claim();
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
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
		event.ports?.[0]?.postMessage({
			type: "SKIP_WAITING_RESPONSE",
			version: APP_VERSION
		});
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
