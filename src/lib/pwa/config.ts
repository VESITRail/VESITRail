export const PWA_CONFIG = {
  github: {
    branch: "main",
    repo: "VESITRail",
    owner: "VESITRail",
  },
  version: {
    checkInterval: 30 * 60 * 1000,
    storageKey: "app-version-info",
  },
  serviceWorker: {
    scope: "/",
    updateViaCache: "none" as ServiceWorkerUpdateViaCache,
  },
  cache: {
    expiryTime: 24 * 60 * 60 * 1000,
    staticAssets: {
      scripts: ["js-static", "js-assets"],
      styles: ["css-static", "css-assets"],
      images: ["image-assets", "next-images"],
      media: ["audio-assets", "video-assets"],
      fonts: ["google-fonts", "gstatic-fonts", "font-assets"],
    },
  },
} as const;
