"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const CONSENT_VERSION = "1.0";
const CONSENT_STORAGE_KEY = "cookie_consent";

export const CookieConsent = () => {
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [isRendered, setIsRendered] = useState<boolean>(false);

	useEffect(() => {
		let hasConsent = false;

		try {
			const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
			if (savedConsent) {
				const parsed = JSON.parse(savedConsent);
				if (parsed && parsed.version === CONSENT_VERSION) {
					hasConsent = true;
				}
			}
		} catch (error) {
			console.warn("localStorage is unavailable or restricted. Checking fallback cookie:", error);
		}

		if (!hasConsent) {
			try {
				const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_STORAGE_KEY}=([^;]*)`));
				if (cookieMatch && cookieMatch[1] === "true") {
					hasConsent = true;
				}
			} catch (cookieError) {
				console.error("Error reading fallback cookie:", cookieError);
			}
		}

		if (hasConsent) {
			return;
		}

		const timer = setTimeout(() => {
			setIsRendered(true);
			requestAnimationFrame(() => {
				setIsVisible(true);
			});
		}, 600);

		return () => clearTimeout(timer);
	}, []);

	const handleAcknowledge = () => {
		try {
			localStorage.setItem(
				CONSENT_STORAGE_KEY,
				JSON.stringify({
					version: CONSENT_VERSION,
					consentedAt: new Date().toISOString()
				})
			);
		} catch (error) {
			console.warn("localStorage is unavailable or restricted. Falling back to cookie storage:", error);
		}

		try {
			document.cookie = `${CONSENT_STORAGE_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
		} catch (cookieError) {
			console.error("Error saving cookie consent fallback:", cookieError);
		}

		setIsVisible(false);
		setTimeout(() => {
			setIsRendered(false);
		}, 300);
	};

	if (!isRendered) {
		return null;
	}

	return (
		<aside
			role="region"
			aria-label="Cookie & Privacy Notice"
			className={cn(
				"fixed z-50 transition-all duration-300 ease-out",
				"bottom-4 inset-x-4 max-w-lg mx-auto sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-md sm:mx-0",
				isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
			)}
		>
			<Card className="border-border/80 bg-card/95 backdrop-blur-md shadow-2xl py-5 gap-4">
				<CardHeader className="p-0 px-5 gap-2">
					<div className="flex items-center gap-3">
						<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
							<Cookie className="size-6" />
						</div>
						<CardTitle className="text-base font-semibold tracking-tight text-foreground">
							Cookie & Privacy Notice
						</CardTitle>
					</div>
				</CardHeader>

				<CardContent className="p-0 px-5 text-sm text-muted-foreground leading-relaxed">
					<p>
						We use essential cookies for secure authentication and session management, along with analytics to enhance
						your experience. By continuing to use VESITRail, you agree to our use of cookies in accordance with our{" "}
						<Link
							href="/privacy-policy"
							className="font-medium text-foreground underline-offset-4 hover:underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
						>
							Privacy Policy
						</Link>{" "}
						and{" "}
						<Link
							href="/terms-of-service"
							className="font-medium text-foreground underline-offset-4 hover:underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
						>
							Terms of Service
						</Link>
						.
					</p>
				</CardContent>

				<CardFooter className="p-0 px-5 pt-1">
					<Button onClick={handleAcknowledge} className="w-full font-medium" size="default">
						I Understand
					</Button>
				</CardFooter>
			</Card>
		</aside>
	);
};

export default CookieConsent;
