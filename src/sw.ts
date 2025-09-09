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

interface ServiceWorkerGlobalScopeEventMap {
  install: ExtendableEvent;
  activate: ExtendableEvent;
  message: ExtendableMessageEvent;
  notificationclick: NotificationClickEvent;
}

interface ServiceWorkerGlobalScopeWithEvents extends WorkerGlobalScope {
  addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
    type: K,
    listener: (event: ServiceWorkerGlobalScopeEventMap[K]) => void
  ): void;
}

interface FirebasePayload {
  data?: {
    url?: string;
    body?: string;
    title?: string;
  };
  messageId?: string;
  notification?: unknown;
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
      type: "notificationclick",
      listener: (event: NotificationClickEvent) => void
    ) => void) &
    ((type: "message", listener: (event: MessageEvent) => void) => void);
  clients: ServiceWorkerClients;
  skipWaiting: () => Promise<void>;
  registration: ServiceWorkerRegistration;
}

declare const self: ServiceWorkerGlobalScopeWithUtils;

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

const FIREBASE_CONFIG = {
  projectId: "vesitrail-e16b0",
  messagingSenderId: "166739007948",
  authDomain: "vesitrail-e16b0.firebaseapp.com",
  apiKey: "AIzaSyDmv7VLR6SGerZcsNHQYBEnAv3dk_PSMmY",
  appId: "1:166739007948:web:c7aab5a492437b13d9e569",
  storageBucket: "vesitrail-e16b0.firebasestorage.app",
};

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const { initializeApp } = await import("firebase/app");
        const { getMessaging, onBackgroundMessage } = await import(
          "firebase/messaging/sw"
        );

        const app = initializeApp(FIREBASE_CONFIG);
        const messaging = getMessaging(app);

        onBackgroundMessage(messaging, (payload: FirebasePayload) => {
          if (!payload.notification && payload.data) {
            const notificationTitle =
              payload.data.title || "VESITRail Notification";

            const notificationOptions = {
              icon: "/icons/ios/256.png",
              tag: "vesitrail-notification",
              body: payload.data.body || "You have a new notification",
              data: {
                url: payload.data.url || "/dashboard/student",
                messageId: payload.messageId || Date.now().toString(),
              },
              actions: [
                {
                  action: "open",
                  title: "Open App",
                },
              ],
            };

            return self.registration.showNotification(
              notificationTitle,
              notificationOptions
            );
          }
        });
      } catch (error) {
        console.error("Failed to initialize Firebase messaging:", error);
      }
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

interface NotificationClickEvent extends ExtendableEvent {
  notification: Notification & {
    close: () => void;
    data?: { url?: string };
  };
  action?: string;
}

self.addEventListener("notificationclick", (event: NotificationClickEvent) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const url = event.notification.data?.url || "/dashboard/student";

    event.waitUntil(
      (async () => {
        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(url.split("?")[0]) && "focus" in client) {
            await client.focus();
            return;
          }
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(url);
        }
      })()
    );
  }
});

(self as ServiceWorkerGlobalScopeWithEvents).addEventListener(
  "message",
  (event: ExtendableMessageEvent) => {
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
  }
);
