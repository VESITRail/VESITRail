import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { PWAInitializer } from "@/lib/pwa-initializer";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UpdateProvider } from "@/components/providers/update-provider";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter"
});

export const metadata: Metadata = {
	title: "VESITRail",
	manifest: "/manifest.webmanifest",
	description:
		"Apply for railway student concessions online with ease! Enjoy a smooth application process and real-time tracking - Made for VESIT students.",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/icon.svg", type: "image/svg+xml" },
			{ url: "/icons/ios/16.png", sizes: "16x16", type: "image/png" },
			{ url: "/icons/ios/32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/android/android-launchericon-48-48.png", sizes: "48x48", type: "image/png" },
			{ url: "/icons/android/android-launchericon-96-96.png", sizes: "96x96", type: "image/png" },
			{ url: "/icons/android/android-launchericon-192-192.png", sizes: "192x192", type: "image/png" }
		],
		shortcut: ["/favicon.ico"],
		apple: [{ url: "/icons/ios/180.png", sizes: "180x180", type: "image/png" }]
	},
	verification: {
		google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
	},
	authors: [
		{ name: "Afnan Kazi", url: "https://github.com/Afnankazi" },
		{ name: "Jay Kerkar", url: "https://github.com/jaykerkar0405" }
	],
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rail.vesit.ves.ac.in")
};

const RootLayout = ({
	children
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<html lang="en" className="scroll-smooth">
			<body className={`antialiased ${inter.variable}`}>
				<ThemeProvider enableSystem attribute="class" defaultTheme="system" disableTransitionOnChange>
					<UpdateProvider>
						<NextTopLoader color="#9333EA" showSpinner={false} />
						{children}
						<Toaster richColors />
						<PWAInitializer />
					</UpdateProvider>
				</ThemeProvider>
			</body>
		</html>
	);
};

export default RootLayout;
