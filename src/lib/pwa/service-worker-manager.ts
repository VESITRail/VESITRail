import { PWA_CONFIG } from "./config";
import { versionManager } from "./version-manager";

type ServiceWorkerRegistrationResult = {
  error?: Error;
  isSupported: boolean;
  registration: ServiceWorkerRegistration | null;
};

export class ServiceWorkerManager {
  private isRegistered = false;
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<ServiceWorkerRegistrationResult> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return {
        registration: null,
        isSupported: false,
      };
    }

    if (this.isRegistered && this.registration) {
      return {
        registration: this.registration,
        isSupported: true,
      };
    }

    try {
      await versionManager.getCurrentVersion();

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: PWA_CONFIG.serviceWorker.scope,
        updateViaCache: PWA_CONFIG.serviceWorker.updateViaCache,
      });

      this.registration = registration;
      this.isRegistered = true;

      this.setupEventListeners(registration);

      return {
        registration,
        isSupported: true,
      };
    } catch (error) {
      console.error("Service worker registration failed:", error);
      return {
        registration: null,
        isSupported: true,
        error: error as Error,
      };
    }
  }

  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          console.log("New service worker installed, ready to activate");
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service worker controller changed, reloading page");
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      this.handleMessage(event);
    });
  }

  private handleUpdate(): void {
    console.log("Service worker update detected");
    versionManager.clearCache();
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data?.type === "SW_ACTIVATED") {
      console.log("Service Worker activated:", event.data.version);
    }

    if (event.data?.type === "CACHE_CLEARED_RESPONSE") {
      console.log("Cache cleared:", event.data.timestamp);
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.warn("Service worker not registered");
      return;
    }

    try {
      await this.registration.update();

      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      }

      if (this.registration.installing) {
        await new Promise<void>((resolve, reject) => {
          const newWorker = this.registration!.installing!;
          const timeout = setTimeout(() => {
            reject(new Error("Service worker installation timeout"));
          }, 10000);

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              clearTimeout(timeout);
              newWorker.postMessage({ type: "SKIP_WAITING" });
              resolve();
            } else if (newWorker.state === "redundant") {
              clearTimeout(timeout);
              reject(new Error("Service worker became redundant"));
            }
          });
        });
        return;
      }

      const hasUpdates = await versionManager.checkForUpdates();

      if (hasUpdates) {
        versionManager.clearCache();
        window.location.reload();
      }
    } catch (error) {
      console.error("Service worker update failed:", error);
      throw error;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      this.isRegistered = false;
      return result;
    } catch (error) {
      console.error("Service worker unregistration failed:", error);
      return false;
    }
  }

  async getVersion(): Promise<string | null> {
    if (!navigator.serviceWorker.controller) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.type === "VERSION_RESPONSE") {
          resolve(event.data.version);
        } else {
          resolve(null);
        }
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: "GET_VERSION" },
          [messageChannel.port2]
        );
      } else {
        resolve(null);
      }

      setTimeout(() => resolve(null), 1000);
    });
  }

  async clearCaches(): Promise<void> {
    if (!("caches" in window)) {
      throw new Error("Cache API not supported");
    }

    try {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
        })
      );

      if ("sessionStorage" in window) {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn("Failed to clear sessionStorage:", e);
        }
      }

      if ("indexedDB" in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map((db) => {
              if (db.name && !db.name.startsWith("firebase")) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
        } catch (e) {
          console.warn("Failed to clear IndexedDB:", e);
        }
      }

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CACHE_CLEARED",
        });
      }

      versionManager.clearCache();
    } catch (error) {
      console.error("Failed to clear caches:", error);
      throw error;
    }
  }

  async getCacheInfo(): Promise<Array<{ name: string; size: number }>> {
    if (!("caches" in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();

      const cacheInfo = await Promise.all(
        cacheNames.map(async (cacheName) => {
          try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            return {
              name: cacheName,
              size: keys.length,
            };
          } catch (error) {
            console.error(`Failed to get info for cache ${cacheName}:`, error);
            return {
              size: 0,
              name: cacheName,
            };
          }
        })
      );

      return cacheInfo.filter((cache) => cache.size > 0);
    } catch (error) {
      console.error("Failed to get cache info:", error);
      return [];
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
