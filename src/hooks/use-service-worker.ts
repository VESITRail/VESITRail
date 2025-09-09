"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";

type ServiceWorkerState = {
  isWaiting: boolean;
  isInstalled: boolean;
  isSupported: boolean;
  updateAvailable: boolean;
};

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isWaiting: false,
    isSupported: false,
    isInstalled: false,
    updateAvailable: false,
  });
  const [updateToastShown, setUpdateToastShown] = useState(false);

  const updateServiceWorker = () => {
    if (state.isWaiting && navigator.serviceWorker.controller) {
      toast.dismiss();

      toast.loading("Updating app...", {
        duration: 3000,
        description: "Please wait while the app updates.",
      });

      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });

      setState((prev) => ({
        ...prev,
        isWaiting: false,
        updateAvailable: false,
      }));
      setUpdateToastShown(false);
    }
  };

  const showUpdateToast = () => {
    if (!state.updateAvailable || updateToastShown) return;

    setUpdateToastShown(true);
    toast.info("App Update Available", {
      duration: Infinity,
      description:
        "A new version of the app is available. Would you like to update?",
      action: {
        label: "Update",
        onClick: updateServiceWorker,
      },
      cancel: {
        label: "Later",
        onClick: () => {
          toast.dismiss();
          setUpdateToastShown(false);
        },
      },
    });
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setState((prev) => ({ ...prev, isInstalled: true }));

        const checkForWaiting = () => {
          if (registration.waiting) {
            setState((prev) => ({
              ...prev,
              isWaiting: true,
              updateAvailable: true,
            }));
          }
        };

        checkForWaiting();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                setState((prev) => ({
                  ...prev,
                  isWaiting: true,
                  updateAvailable: true,
                }));
              } else {
                setState((prev) => ({
                  ...prev,
                  isInstalled: true,
                }));
              }
            }
          });
        });

        let controllerChangeHandled = false;

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (controllerChangeHandled) return;
          controllerChangeHandled = true;

          toast.success("App Updated!", {
            duration: 2000,
            description: "The app has been updated successfully.",
          });

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });

        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_ACTIVATED") {
            setState((prev) => ({
              ...prev,
              isInstalled: true,
            }));
          }

          if (event.data?.type === "SW_UPDATED") {
            setState((prev) => ({
              ...prev,
              isWaiting: true,
              updateAvailable: true,
            }));
          }
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerSW();
  }, []);

  useEffect(() => {
    if (state.updateAvailable && !updateToastShown) {
      showUpdateToast();
    }
  }, [state.updateAvailable, updateToastShown]);

  const clearCache = async () => {
    if (!("caches" in window)) {
      throw new Error("Cache API not supported");
    }

    try {
      const cacheNames = await caches.keys();

      const clearPromises = cacheNames.map(async (cacheName) => {
        const deleted = await caches.delete(cacheName);
        console.log(`Cache ${cacheName} deleted:`, deleted);
        return deleted;
      });

      await Promise.all(clearPromises);

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

                  deleteReq.onsuccess = () => {
                    resolve();
                  };

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

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CACHE_CLEARED",
        });
      }

      toast.success("Cache Cleared", {
        duration: 2000,
        description: "All cached data has been cleared successfully.",
      });

      return true;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  };

  const getCacheInfo = async () => {
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
  };

  return {
    ...state,
    clearCache,
    getCacheInfo,
    updateServiceWorker,
  };
};
