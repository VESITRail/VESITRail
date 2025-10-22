"use client";

import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	readonly platforms: string[];
	readonly userChoice: Promise<{
		platform: string;
		outcome: "accepted" | "dismissed";
	}>;
}

declare global {
	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
	}
}

interface PWAInstallButtonProps {
	variant?: "link" | "ghost" | "outline" | "default" | "secondary" | "destructive";
	className?: string;
	children?: React.ReactNode;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
	children,
	variant = "default",
	className = "gap-1.5"
}) => {
	const [deferred_prompt, set_deferred_prompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [is_installing, set_is_installing] = useState<boolean>(false);
	const [is_installable, set_is_installable] = useState<boolean>(false);

	const handle_app_installed = (): void => {
		set_is_installable(false);
		set_is_installing(false);
	};

	const handle_install = async (): Promise<void> => {
		if (deferred_prompt && !is_installing) {
			try {
				set_is_installing(true);
				await deferred_prompt.prompt();

				const choice_result = await deferred_prompt.userChoice;

				if (choice_result.outcome === "accepted") {
					handle_app_installed();
				} else {
					set_is_installing(false);
				}

				set_deferred_prompt(null);
			} catch (error) {
				console.error("Error during app installation:", error);
				set_is_installing(false);
			}
		}
	};

	useEffect(() => {
		const handle_before_install_prompt = (event: BeforeInstallPromptEvent): void => {
			event.preventDefault();
			set_is_installable(true);
			set_deferred_prompt(event);
		};

		if (window.matchMedia("(display-mode: standalone)").matches) {
			handle_app_installed();
		}

		window.addEventListener("beforeinstallprompt", handle_before_install_prompt);
		window.addEventListener("appinstalled", handle_app_installed);

		return (): void => {
			window.removeEventListener("beforeinstallprompt", handle_before_install_prompt);
			window.removeEventListener("appinstalled", handle_app_installed);
		};
	}, []);

	if (!is_installable) {
		return null;
	}

	return (
		<Button variant={variant} className={className} onClick={handle_install} disabled={is_installing}>
			<Download className="size-4" />
			{is_installing ? "Installing..." : children || "Install App"}
		</Button>
	);
};

export default PWAInstallButton;
