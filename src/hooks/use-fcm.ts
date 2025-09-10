"use client";

import { toast } from "sonner";
import { saveFcmToken } from "@/actions/fcm";
import { messaging } from "@/config/firebase";
import { FcmPlatformType } from "@/generated/zod";
import { useCallback, useEffect, useState } from "react";
import { getToken, onMessage, type Messaging } from "firebase/messaging";

type FcmState = {
  loading: boolean;
  error: string | null;
  token: string | null;
  permission: NotificationPermission;
};

const getPlatform = (): FcmPlatformType => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/.test(userAgent)) return "iOS";
  return "Web";
};

const generateDeviceId = (): string => {
  const stored = localStorage.getItem("fcm_device_id");
  if (stored) return stored;

  const deviceId = crypto.randomUUID();
  localStorage.setItem("fcm_device_id", deviceId);

  return deviceId;
};

export const useFcm = (userId?: string) => {
  const [state, setState] = useState<FcmState>({
    token: null,
    error: null,
    loading: true,
    permission: "default",
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [hasShownToasts, setHasShownToasts] = useState<boolean>(false);

  const saveTokenToDb = useCallback(
    async (token: string): Promise<void> => {
      if (!userId) return;

      try {
        const deviceId = generateDeviceId();

        const result = await saveFcmToken({
          token,
          userId,
          deviceId,
          platform: getPlatform(),
        });

        if (!result.isSuccess) {
          if (!hasShownToasts) {
            setHasShownToasts(true);
            toast.error("Notification Setup Failed", {
              description:
                "Could not enable notifications. Please try again later",
            });
          }
        }
      } catch (error) {
        console.error("Notification Setup Failed:", error);
        if (!hasShownToasts) {
          setHasShownToasts(true);
          toast.error("Notification Setup Failed", {
            description:
              "An unexpected error occurred while setting up notifications",
          });
        }
      }
    },
    [userId, hasShownToasts]
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Window object not available",
        }));
        return false;
      }

      if (!("Notification" in window)) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "This browser does not support push notifications",
        }));

        return false;
      }

      if (!("serviceWorker" in navigator)) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Service workers are not supported in this browser",
        }));

        return false;
      }

      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission === "granted") {
        if (!hasShownToasts) {
          setHasShownToasts(true);
          toast.success("Notifications Enabled", {
            description:
              "You'll now receive push notifications for important updates",
          });
        }
        return true;
      } else if (permission === "denied") {
        if (!hasShownToasts) {
          setHasShownToasts(true);
          toast.error("Notifications Blocked", {
            description:
              "You can enable notifications later from your browser settings",
          });
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Push notification permission denied by user",
        }));

        return false;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Push notification permission not granted",
      }));

      return false;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to request notification permission",
      }));
      return false;
    }
  }, [hasShownToasts]);

  const setupInAppNotifications = useCallback(
    async (messagingInstance: Messaging) => {
      try {
        onMessage(messagingInstance, (payload) => {
          const { title, body } = payload.notification || {};

          if (title && body) {
            toast.info(title, {
              description: body,
            });
          } else if (title) {
            toast.info(title);
          } else {
            toast.info("New notification received");
          }
        });
      } catch (error) {
        console.error("Error setting up in-app notifications:", error);
      }
    },
    []
  );

  const generateToken = useCallback(async (): Promise<void> => {
    try {
      const messagingInstance = await messaging();

      if (!messagingInstance) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Firebase messaging not supported in this browser",
        }));

        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            "VAPID key not configured. Please check environment variables.",
        }));

        return;
      }

      const serviceWorkerRegistration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messagingInstance, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: serviceWorkerRegistration,
      });

      if (currentToken) {
        setState((prev) => ({
          ...prev,
          error: null,
          loading: false,
          token: currentToken,
        }));

        await saveTokenToDb(currentToken);
        await setupInAppNotifications(messagingInstance);
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            "Failed to generate FCM token. Please ensure service worker is registered.",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate FCM token",
      }));
    }
  }, [saveTokenToDb, setupInAppNotifications]);

  const initializeFcm = useCallback(async (): Promise<void> => {
    if (isInitialized) return;
    setIsInitialized(true);

    try {
      const currentPermission = Notification.permission;
      setState((prev) => ({ ...prev, permission: currentPermission }));

      if (currentPermission === "granted") {
        await generateToken();
      } else if (currentPermission === "default") {
        const permissionGranted = await requestPermission();
        if (permissionGranted) {
          await generateToken();
        }
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Notification permission previously denied",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to initialize FCM",
      }));
    }
  }, [generateToken, requestPermission, isInitialized]);

  useEffect(() => {
    if (typeof window !== "undefined" && userId && !isInitialized) {
      const timer = setTimeout(() => {
        initializeFcm();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [initializeFcm, userId, isInitialized]);

  return {
    ...state,
    initializeFcm,
    requestPermission,
  };
};
