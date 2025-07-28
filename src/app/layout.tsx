import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VESITRail",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vesitrail.ves.ac.in"
  ),
  description:
    "Apply for railway student concessions online with ease! Enjoy a smooth application process and real-time tracking - Made for VESIT students.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`antialiased ${inter.variable}`}>
        <ThemeProvider
          enableSystem
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <NextTopLoader color="#9333EA" showSpinner={false} />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
