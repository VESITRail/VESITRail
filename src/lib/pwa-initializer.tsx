"use client";

import { useEffect } from "react";
import { serviceWorkerManager, versionManager } from "./pwa";

export const PWAInitializer = (): null => {
	useEffect(() => {
		const initializePWA = async (): Promise<void> => {
			if (typeof window === "undefined") return;

			try {
				await versionManager.getCurrentVersion();
				await serviceWorkerManager.register();
			} catch (error) {
				console.error("PWA initialization failed:", error);
			}
		};

		initializePWA();
	}, []);

	return null;
};
