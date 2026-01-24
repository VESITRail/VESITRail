"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GitHubStars from "@/components/utils/github-stars";
import { Lead, Heading1, Heading2, Paragraph } from "@/components/ui/typography";
import { LogIn, Rocket, Activity, FileCheck, AlertCircle, ClipboardCheck } from "lucide-react";

const Hero = () => {
	const session = authClient.useSession();

	const handleGoogleAuth = async () => {
		posthog.capture("auth_google_initiated", {
			location: "hero_section"
		});

		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/dashboard",
			errorCallbackURL: "/auth-error",
			newUserCallbackURL: "/onboarding"
		});
	};

	return (
		<section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center px-4 md:px-8 bg-background overflow-x-hidden py-12">
			<div className="absolute inset-0 bg-linear-to-br from-muted/60 to-background pointer-events-none -z-10" />

			<div className="container grid lg:grid-cols-2 gap-4 md:gap-8 items-center mx-auto max-w-7xl">
				<div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left px-2 md:px-8">
					<div className="space-y-6 max-w-135 w-full">
						<div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
							<Badge variant="secondary" className="px-4 py-1 text-sm font-medium rounded-full">
								VESIT Students Only
							</Badge>

							<GitHubStars />
						</div>

						<Heading1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-linear-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent lg:pb-2">
							Apply with Ease!
						</Heading1>

						<Lead className="text-muted-foreground text-lg leading-normal">
							Streamlined Railway Concessions with Real-time Tracking
						</Lead>
					</div>

					{session.isPending ? (
						<Skeleton className="w-full max-w-sm h-12 rounded-lg" />
					) : (
						!session.data?.user && (
							<div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 w-full max-w-sm">
								<AlertCircle className="size-4 text-destructive shrink-0" />

								<p className="text-xs text-destructive font-medium">
									Only <span className="bg-destructive text-white py-0.5 px-1.5 rounded">@ves.ac.in</span> emails
									allowed
								</p>
							</div>
						)
					)}

					<div className="flex flex-col w-full max-w-sm gap-4">
						{session.isPending ? (
							<Button
								disabled
								variant="outline"
								className="w-full h-12 text-base font-medium border border-input bg-background transition-all duration-300 flex items-center justify-center gap-2"
							>
								<Skeleton className="size-5 rounded" />
								<Skeleton className="h-4 w-32" />
							</Button>
						) : session.data?.user ? (
							<Link href="/dashboard">
								<Button
									variant="outline"
									className="w-full h-12 text-base font-medium border border-input bg-background hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
								>
									<LogIn className="size-5" />
									<span>Continue to Dashboard</span>
								</Button>
							</Link>
						) : (
							<Button
								variant="outline"
								onClick={handleGoogleAuth}
								className="w-full h-12 text-base font-medium border border-input bg-background hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
							>
								<svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 mr-2">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								<span>Continue with Google</span>
							</Button>
						)}

						<Paragraph className="text-muted-foreground text-center text-sm lg:text-left">
							{session.isPending ? (
								<Skeleton className="h-4 w-full max-w-xs mx-auto lg:mx-0" />
							) : (
								!session.data?.user && "New to the platform? Your account will be created automatically"
							)}
						</Paragraph>
					</div>
				</div>

				<div className="flex flex-col gap-4 md:gap-6 px-2 md:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card className="group space-y-2 p-5 hover:shadow-lg transition-all duration-300 bg-card border border-border hover:border-primary/60">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-muted text-foreground flex items-center justify-center">
									<Rocket size={18} />
								</div>
								<Badge variant="default" className="text-xs py-0.5 px-2">
									PWA & Fast
								</Badge>
							</div>
							<Heading2 className="text-base font-semibold -mb-9 lg:mb-0">Lightning Fast & Installable</Heading2>
							<Paragraph className="text-sm text-muted-foreground">
								Enjoy a fast experience. Install as an app and access anytime
							</Paragraph>
						</Card>

						<Card className="group p-5 space-y-2 hover:shadow-lg transition-all duration-300 bg-card border border-border hover:border-primary/60">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-muted text-foreground flex items-center justify-center">
									<ClipboardCheck size={18} />
								</div>
								<Badge variant="default" className="text-xs py-0.5 px-2">
									Automated
								</Badge>
							</div>
							<Heading2 className="text-base font-semibold -mb-9 lg:mb-0">Auto-Filled Details</Heading2>
							<Paragraph className="text-sm text-muted-foreground">
								Class, period, and past pass info are auto-filled
							</Paragraph>
						</Card>

						<Card className="group p-5 space-y-2 hover:shadow-lg transition-all duration-300 bg-card border border-border hover:border-primary/60">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-muted text-foreground flex items-center justify-center">
									<FileCheck size={18} />
								</div>
								<Badge variant="default" className="text-xs py-0.5 px-2">
									Simplified
								</Badge>
							</div>
							<Heading2 className="text-base font-semibold -mb-9 lg:mb-0">No Sheet Filling</Heading2>
							<Paragraph className="text-sm text-muted-foreground">
								DOB, address, pass number, and other details are auto-filled
							</Paragraph>
						</Card>

						<Card className="group p-5 space-y-2 hover:shadow-lg transition-all duration-300 bg-card border border-border hover:border-primary/60">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-muted text-foreground flex items-center justify-center">
									<Activity size={18} />
								</div>
								<Badge variant="default" className="text-xs py-0.5 px-2">
									Smart Tracking
								</Badge>
							</div>
							<Heading2 className="text-base font-semibold -mb-9 lg:mb-0">Real-time Updates</Heading2>
							<Paragraph className="text-sm text-muted-foreground">
								Track your application status in real-time
							</Paragraph>
						</Card>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
