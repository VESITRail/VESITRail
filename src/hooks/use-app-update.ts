"use client";

import { useState, useEffect, useCallback } from "react";
import { versionManager, serviceWorkerManager } from "@/lib/pwa";

type UpdateInfo = {
  version: string;
  tagName: string;
  changelog: string;
  publishedAt: string;
};

type UpdateState = {
  loading: boolean;
  available: boolean;
  info: UpdateInfo | null;
  lastChecked: Date | null;
};

const LAST_CHECKED_KEY = "app-version-last-checked";
const UPDATE_IGNORED_KEY = "app-update-ignored-version";

const compareVersions = (
  currentVersion: string,
  newVersion: string
): number => {
  const latest = newVersion.split(".").map(Number);
  const current = currentVersion.split(".").map(Number);

  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const latestPart = latest[i] || 0;
    const currentPart = current[i] || 0;

    if (currentPart < latestPart) return -1;
    if (currentPart > latestPart) return 1;
  }

  return 0;
};

export const useAppUpdate = () => {
  const [state, setState] = useState<UpdateState>({
    loading: false,
    available: false,
    info: null,
    lastChecked: null,
  });

  const loadLastChecked = useCallback((): Date | null => {
    try {
      const stored = localStorage.getItem(LAST_CHECKED_KEY);
      return stored ? new Date(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const saveLastChecked = useCallback((date: Date): void => {
    try {
      localStorage.setItem(LAST_CHECKED_KEY, date.toISOString());
      setState((prev) => ({ ...prev, lastChecked: date }));
    } catch (error) {
      console.warn("Failed to save last checked time:", error);
      setState((prev) => ({ ...prev, lastChecked: date }));
    }
  }, []);

  const isVersionIgnored = useCallback((version: string): boolean => {
    try {
      const ignored = localStorage.getItem(UPDATE_IGNORED_KEY);
      return ignored === version;
    } catch {
      return false;
    }
  }, []);

  const ignoreVersion = useCallback((version: string): void => {
    try {
      localStorage.setItem(UPDATE_IGNORED_KEY, version);
    } catch (error) {
      console.warn("Failed to save ignored version:", error);
    }
  }, []);

  const clearIgnoredVersion = useCallback((): void => {
    try {
      localStorage.removeItem(UPDATE_IGNORED_KEY);
    } catch (error) {
      console.warn("Failed to clear ignored version:", error);
    }
  }, []);

  const checkForUpdates = useCallback(
    async (force = false): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const current = await versionManager.getCurrentVersion();
        if (!current) {
          setState((prev) => ({ ...prev, loading: false }));
          return false;
        }

        const latest = await versionManager.getLatestRelease();
        if (!latest) {
          setState((prev) => ({ ...prev, loading: false }));
          return false;
        }

        const response = await fetch(
          `https://api.github.com/repos/VESITRail/VESITRail/releases/latest`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          setState((prev) => ({ ...prev, loading: false }));
          return false;
        }

        const releaseData = await response.json();

        const hasUpdate = compareVersions(current.version, latest.version) < 0;

        if (hasUpdate && (force || !isVersionIgnored(latest.version))) {
          const updateInfo: UpdateInfo = {
            version: latest.version,
            tagName: latest.tagName,
            publishedAt: releaseData.published_at,
            changelog: releaseData.body || "No changelog available.",
          };

          setState({
            loading: false,
            available: true,
            info: updateInfo,
            lastChecked: new Date(),
          });

          saveLastChecked(new Date());
          return true;
        }

        setState({
          info: null,
          loading: false,
          available: false,
          lastChecked: new Date(),
        });

        saveLastChecked(new Date());
        return false;
      } catch (error) {
        console.error("Failed to check for updates:", error);
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }
    },
    [isVersionIgnored, saveLastChecked]
  );

  const dismissUpdate = useCallback(() => {
    if (state.info) {
      ignoreVersion(state.info.version);
    }
    setState((prev) => ({ ...prev, available: false, info: null }));
  }, [state.info, ignoreVersion]);

  const applyUpdate = useCallback(async (): Promise<void> => {
    if (!state.info) return;

    try {
      await serviceWorkerManager.update();
      await versionManager.storeNewVersion(
        state.info.version,
        state.info.tagName
      );
      clearIgnoredVersion();

      setState((prev) => ({ ...prev, available: false, info: null }));

      window.location.reload();
    } catch (error) {
      console.error("Failed to apply update:", error);
      throw error;
    }
  }, [state.info, clearIgnoredVersion]);

  const backgroundCheck = useCallback(async (): Promise<void> => {
    const lastChecked = loadLastChecked();
    const now = new Date();
    const checkInterval = 30 * 60 * 1000; // 30 minutes

    if (!lastChecked || now.getTime() - lastChecked.getTime() > checkInterval) {
      await checkForUpdates(false);
    }
  }, [loadLastChecked, checkForUpdates]);

  useEffect(() => {
    const stored = loadLastChecked();
    if (stored) {
      setState((prev) => ({ ...prev, lastChecked: stored }));
    }
  }, [loadLastChecked]);

  return {
    ...state,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
    backgroundCheck,
  };
};
