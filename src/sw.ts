import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

declare function importScripts(...urls: string[]): void;

interface ExtendableEvent extends Event {
  waitUntil: (promise: Promise<void>) => void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  ports: MessagePort[];
  data: {
    type?: string;
    [key: string]: unknown;
  };
}

interface ServiceWorkerClient {
  url: string;
  focus: () => Promise<void>;
  postMessage: (message: unknown) => void;
}

interface ServiceWorkerClients {
  claim: () => Promise<void>;
  matchAll: (options?: {
    type?: string;
    includeUncontrolled?: boolean;
  }) => Promise<ServiceWorkerClient[]>;
  openWindow: (url: string) => Promise<ServiceWorkerClient | null>;
}

interface ServiceWorkerGlobalScopeWithUtils extends WorkerGlobalScope {
  addEventListener: ((
    type: "install" | "activate",
    listener: (event: ExtendableEvent) => void
  ) => void) &
    ((
      type: "message",
      listener: (event: ExtendableMessageEvent) => void
    ) => void);
  clients: ServiceWorkerClients;
  skipWaiting: () => Promise<void>;
  registration: ServiceWorkerRegistration;
}

declare const self: ServiceWorkerGlobalScopeWithUtils;

importScripts("/firebase-messaging-sw.js");

const serwist = new Serwist({
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "google-fonts-cache",
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "gstatic-fonts-cache",
      }),
    },
    {
      matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-font-assets",
      }),
    },
    {
      matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-image-assets",
      }),
    },
    {
      matcher: /\/_next\/image\?url=.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "next-image",
      }),
    },
    {
      matcher: /\.(?:mp3|wav|ogg)$/i,
      handler: new CacheFirst({
        cacheName: "static-audio-assets",
      }),
    },
    {
      matcher: /\.(?:mp4)$/i,
      handler: new CacheFirst({
        cacheName: "static-video-assets",
      }),
    },
    {
      matcher: /\.(?:js)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-js-assets",
      }),
    },
    {
      matcher: /\.(?:css)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-style-assets",
      }),
    },
    {
      matcher: /\/_next\/static.+\.js$/i,
      handler: new CacheFirst({
        cacheName: "next-static-js-assets",
      }),
    },
    {
      matcher: /\/_next\/static.+\.css$/i,
      handler: new CacheFirst({
        cacheName: "next-static-css-assets",
      }),
    },
    {
      matcher: ({
        request,
        url,
        sameOrigin,
      }: {
        request: Request;
        url: URL;
        sameOrigin: boolean;
      }) =>
        request.method === "GET" &&
        sameOrigin &&
        !url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/dashboard/") &&
        !url.pathname.includes("_next/data"),
      handler: new NetworkFirst({
        cacheName: "pages",
      }),
    },
  ],
});

serwist.addEventListeners();

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();

      const clients = await self.clients.matchAll();
      clients.forEach((client: ServiceWorkerClient) => {
        client.postMessage({
          type: "SW_ACTIVATED",
          payload: Date.now(),
        });
      });
    })()
  );
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();

    event.ports?.[0]?.postMessage({
      type: "SKIP_WAITING_RESPONSE",
      payload: "Updating service worker...",
    });
  }

  if (event.data && event.data.type === "CACHE_CLEARED") {
    event.waitUntil(
      (async () => {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );

          const clients = await self.clients.matchAll();
          clients.forEach((client: ServiceWorkerClient) => {
            client.postMessage({
              type: "CACHE_CLEARED_RESPONSE",
              payload: "All caches cleared successfully",
            });
          });
        } catch (error) {
          console.error("Failed to clear caches in service worker:", error);
        }
      })()
    );
  }

  if (event.data && event.data.type === "CACHE_UPDATED") {
    event.ports?.[0]?.postMessage({
      type: "CACHE_UPDATED_RESPONSE",
      payload: "Cache has been updated",
    });
  }
});
