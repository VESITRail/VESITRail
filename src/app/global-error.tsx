"use client";

import Image from "next/image";
import Logo from "@/app/icon.svg";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, RefreshCcw, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorDetails = {
	url: string;
	stack?: string;
	message: string;
	digest?: string;
	timestamp: string;
	userAgent: string;
};

const getErrorDetails = (error: Error & { digest?: string }): ErrorDetails => {
	return {
		stack: error.stack,
		digest: error.digest,
		timestamp: new Date().toISOString(),
		message: error.message || "An unexpected error occurred",
		url: typeof window !== "undefined" ? window.location.href : "Unknown",
		userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"
	};
};

const createGitHubIssueUrl = (details: ErrorDetails): string => {
	const prefix = "[Error] ";
	const maxTitleLength = 100;
	const availableLength = maxTitleLength - prefix.length - 3;

	let errorMessage = details.message;
	if (errorMessage.length > availableLength) {
		errorMessage = errorMessage.substring(0, availableLength) + "...";
	}

	const labels = "bug,needs-triage";
	const title = `${prefix}${errorMessage}`;

	const params = new URLSearchParams({
		title,
		labels
	});

	return `https://github.com/VESITRail/VESITRail/issues/new?${params.toString()}`;
};

const GlobalError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
	const [theme, setTheme] = useState<string>("dark");

	useEffect(() => {
		setErrorDetails(getErrorDetails(error));

		const storedTheme = localStorage.getItem("theme") || "dark";
		setTheme(storedTheme);

		setIsLoading(false);

		console.error("Global Error:", error);
	}, [error]);

	const handleReportIssue = () => {
		if (!errorDetails) return;
		window.open(createGitHubIssueUrl(errorDetails), "_blank");
	};

	const handleReset = () => {
		reset();
	};

	if (isLoading) {
		return (
			<html lang="en" className={theme}>
				<head>
					<title>Error | VESITRail</title>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
				</head>

				<body className="min-h-screen bg-background flex items-center justify-center p-4">
					<div className="w-full max-w-3xl space-y-6">
						<div className="flex items-center justify-center gap-3 mb-8">
							<Skeleton className="size-12 rounded-lg" />
							<Skeleton className="h-8 w-32" />
						</div>

						<Card className="border-destructive/50">
							<CardHeader>
								<div className="flex items-start gap-4">
									<Skeleton className="size-12 rounded-lg shrink-0" />
									<div className="space-y-2 flex-1">
										<Skeleton className="h-8 w-3/4" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-5/6" />
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-20 w-full" />
								</div>

								<Separator />

								<div className="space-y-3">
									<Skeleton className="h-5 w-40" />
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<Skeleton className="h-16 w-full" />
										<Skeleton className="h-16 w-full" />
									</div>
								</div>
							</CardContent>

							<CardFooter className="flex justify-end gap-3">
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-10 w-32" />
							</CardFooter>
						</Card>

						<div className="text-center space-y-2">
							<Skeleton className="h-4 w-3/4 mx-auto" />
							<Skeleton className="h-3 w-1/2 mx-auto" />
						</div>
					</div>
				</body>
			</html>
		);
	}

	if (!errorDetails) {
		return null;
	}

	return (
		<html lang="en" className={theme}>
			<head>
				<title>Error | VESITRail</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>

			<body className="min-h-screen bg-background flex items-center justify-center p-4">
				<div className="w-full max-w-3xl space-y-6">
					<div className="flex items-center justify-center gap-3 mb-8">
						<Image src={Logo} alt="VESITRail Logo" className="size-12 rounded-lg" />
						<h1 className="text-2xl font-bold text-foreground">VESITRail</h1>
					</div>

					<Card className="border-destructive/50 shadow-xl">
						<CardHeader>
							<div className="flex items-start gap-4">
								<div className="size-12 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
									<AlertTriangle className="size-6 text-destructive" />
								</div>
								<div className="space-y-2 flex-1">
									<CardTitle className="text-2xl text-foreground">Something went wrong</CardTitle>
									<CardDescription className="text-muted-foreground">
										An unexpected error occurred while rendering this page. Our team has been notified and is working on
										a fix.
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						<CardContent className="space-y-4">
							<Alert variant="destructive" className="bg-destructive/10 border-destructive">
								<AlertTriangle className="size-4" />
								<AlertTitle className="text-destructive">Error Details</AlertTitle>
								<AlertDescription>
									<p className="font-mono text-xs break-all text-destructive">{errorDetails.message}</p>
									{errorDetails.digest && (
										<div className="mt-2 flex items-center gap-2">
											<Badge variant="outline" className="font-mono text-xs border-destructive/50 text-destructive">
												{errorDetails.digest}
											</Badge>
										</div>
									)}
								</AlertDescription>
							</Alert>

							<Separator />

							<div className="space-y-4">
								<h3 className="text-sm font-semibold text-foreground">Technical Information</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-2 p-4 rounded-lg bg-card border border-border">
										<p className="text-xs font-medium text-muted-foreground">Timestamp</p>
										<p className="font-mono text-xs break-all text-foreground">
											{new Date(errorDetails.timestamp).toLocaleString()}
										</p>
									</div>
									<div className="space-y-2 p-4 rounded-lg bg-card border border-border">
										<p className="text-xs font-medium text-muted-foreground">URL</p>
										<p className="font-mono text-xs break-all truncate text-foreground" title={errorDetails.url}>
											{errorDetails.url}
										</p>
									</div>
								</div>

								{errorDetails.stack && (
									<details className="group">
										<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
											View Stack Trace
										</summary>
										<div className="mt-3 p-4 bg-card rounded-lg overflow-x-auto border border-border">
											<pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
												{errorDetails.stack}
											</pre>
										</div>
									</details>
								)}
							</div>
						</CardContent>

						<CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
							<Button onClick={handleReset} variant="outline" className="w-full sm:w-auto" size="lg">
								<RefreshCcw className="size-4" />
								Try Again
							</Button>

							<Button onClick={handleReportIssue} className="w-full sm:w-auto" size="lg">
								Report Issue
								<ExternalLink className="size-4" />
							</Button>
						</CardFooter>
					</Card>

					<div className="text-center space-y-2">
						<p className="text-sm text-muted-foreground">
							If this problem persists, please report it to our{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href="https://github.com/VESITRail/VESITRail/issues"
								className="text-primary hover:underline font-medium transition-colors"
							>
								GitHub Issues
							</a>{" "}
							page.
						</p>
						<p className="text-xs text-muted-foreground">
							Error occurred at {new Date(errorDetails.timestamp).toLocaleTimeString()}
						</p>
					</div>
				</div>
			</body>
		</html>
	);
};

export default GlobalError;
