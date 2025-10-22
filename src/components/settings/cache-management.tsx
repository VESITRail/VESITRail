"use client";

import { Trash2, Database, HardDrive, AlertCircle, CheckCircle } from "lucide-react";
import {
	AlertDialog,
	AlertDialogTitle,
	AlertDialogCancel,
	AlertDialogAction,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogTrigger,
	AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { serviceWorkerManager } from "@/lib/pwa";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

type CacheInfo = {
	name: string;
	size: number;
};

type CacheUsageInfo = {
	totalSize: number;
	cacheCount: number;
	percentage: number;
};

const CacheManagement = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [clearing, setClearing] = useState<boolean>(false);
	const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
	const [isSupported, setIsSupported] = useState<boolean>(false);
	const [cacheUsage, setCacheUsage] = useState<CacheUsageInfo | null>(null);

	const clearCache = async (): Promise<void> => {
		await serviceWorkerManager.clearCaches();
	};

	const getCacheInfo = useCallback(async (): Promise<CacheInfo[]> => {
		return await serviceWorkerManager.getCacheInfo();
	}, []);

	const getCacheUsage = useCallback(async (): Promise<CacheUsageInfo> => {
		const caches = await getCacheInfo();
		const totalItems = caches.reduce((sum, cache) => sum + cache.size, 0);

		const maxReasonableCache = 500;
		const percentage = Math.min((totalItems / maxReasonableCache) * 100, 100);

		return {
			percentage,
			totalSize: totalItems,
			cacheCount: caches.length
		};
	}, [getCacheInfo]);

	const handleClearCache = async (): Promise<void> => {
		setClearing(true);
		try {
			await clearCache();
			setCacheInfo([]);

			toast.success("Cache Cleared", {
				duration: 2000,
				description: "All cached data has been cleared successfully."
			});

			setTimeout(async () => {
				try {
					const info = await getCacheInfo();
					setCacheInfo(info);
					const usage = await getCacheUsage();
					setCacheUsage(usage);
				} catch (error) {
					console.error("Failed to reload cache info after clearing:", error);
					setCacheInfo([]);
					setCacheUsage(null);
				}
			}, 1000);
		} catch (error) {
			console.error("Failed to clear cache:", error);
			toast.error("Failed to Clear Cache", {
				description: "Unable to clear cached data. Please try again."
			});
		} finally {
			setClearing(false);
		}
	};

	useEffect(() => {
		const checkSupport = (): void => {
			const supported = typeof window !== "undefined" && "caches" in window;
			setIsSupported(supported);
		};

		checkSupport();

		if (isSupported) {
			const loadCacheInfo = async (): Promise<void> => {
				setLoading(true);
				try {
					const info = await getCacheInfo();
					setCacheInfo(info);
					const usage = await getCacheUsage();
					setCacheUsage(usage);
				} catch (error) {
					console.error("Failed to load cache info:", error);
					toast.error("Failed to Load Cache Info", {
						description: "Unable to retrieve cache information."
					});
				} finally {
					setLoading(false);
				}
			};
			loadCacheInfo();
		} else {
			setLoading(false);
		}
	}, [isSupported, getCacheInfo, getCacheUsage]);

	const totalCacheEntries = cacheInfo.reduce((sum, cache) => sum + cache.size, 0);

	if (!isSupported) {
		return (
			<div id="cache-management" className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold mb-2">Cache Management</h2>
					<p className="text-sm text-muted-foreground">Manage application cache and storage to optimize performance.</p>
				</div>

				<Card>
					<CardContent className="py-2.5">
						<div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
							<div className="size-16 rounded-full bg-destructive flex items-center justify-center">
								<AlertCircle className="text-white size-7" />
							</div>

							<div className="text-center space-y-2">
								<h3 className="text-lg font-medium text-foreground">Cache Not Supported</h3>

								<p className="text-sm text-muted-foreground max-w-md">
									Your browser doesn&apos;t support the Cache API or Service Workers. Cache management features are not
									available.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (loading) {
		return (
			<div id="cache-management" className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold mb-2">Cache Management</h2>
					<p className="text-sm text-muted-foreground">Manage application cache and storage to optimize performance.</p>
				</div>

				<Card>
					<CardContent className="py-2.5">
						<div className="space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-4 w-48" />
							</div>

							<div className="space-y-4">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-full" />
								<Skeleton className="h-3 w-48" />
							</div>

							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="space-y-1">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-20" />
										</div>
										<Skeleton className="h-4 w-16" />
									</div>
								))}
							</div>

							<Skeleton className="h-10 w-32 ml-auto" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div id="cache-management" className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold mb-2">Cache Management</h2>
				<p className="text-sm text-muted-foreground">Manage application cache and storage to optimize performance.</p>
			</div>

			<Card>
				<CardContent className="py-2.5">
					<div className="space-y-6">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Database className="size-4 text-muted-foreground" />
								<h3 className="font-medium">Cache Overview</h3>
							</div>
							<p className="text-sm text-muted-foreground">
								Total cached resources: {totalCacheEntries} {totalCacheEntries === 1 ? "item" : "items"}
							</p>
						</div>

						{cacheUsage && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Cache Usage</span>
									<span className="text-sm text-muted-foreground">{cacheUsage.percentage.toFixed(1)}%</span>
								</div>

								<Progress className="h-3" value={cacheUsage.percentage} />
							</div>
						)}

						{cacheInfo.length > 0 && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium">Cache Details</h4>
									<span className="text-sm text-muted-foreground">
										{cacheInfo.length} cache{cacheInfo.length !== 1 ? "s" : ""}
									</span>
								</div>

								<div className="space-y-3">
									{cacheInfo.map((cache) => (
										<div
											key={cache.name}
											className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<HardDrive className="size-4 text-muted-foreground flex-shrink-0" />
													<span className="font-medium text-sm truncate pr-2">{cache.name}</span>
												</div>

												<p className="text-xs text-muted-foreground">
													{cache.size} {cache.size === 1 ? "item" : "items"}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{cacheInfo.length === 0 && (
							<div className="flex flex-col items-center justify-center py-8 space-y-4">
								<div className="size-16 rounded-full bg-primary flex items-center justify-center">
									<CheckCircle className="text-white size-7" />
								</div>

								<div className="text-center space-y-2">
									<h3 className="text-lg font-medium text-foreground">No Cache Data</h3>
									<p className="text-sm text-muted-foreground max-w-md">
										There are currently no cached resources. Cache will be populated as you use the application.
									</p>
								</div>
							</div>
						)}

						<div className="flex justify-end">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive" disabled={clearing || loading || cacheInfo.length === 0}>
										<Trash2 className="size-4 mr-1" />
										Clear Cache
									</Button>
								</AlertDialogTrigger>

								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Clear All Cache?</AlertDialogTitle>
										<AlertDialogDescription>
											This will clear all cached data including images, fonts, and static assets. The app might load
											slower until the cache is rebuilt. This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>

									<AlertDialogFooter className="gap-4">
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleClearCache}
											className="bg-destructive text-white hover:bg-destructive/90"
										>
											{clearing ? (
												<>
													<div className="size-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
													Clearing...
												</>
											) : (
												<>
													<Trash2 className="size-4 mr-1" />
													Clear Cache
												</>
											)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default CacheManagement;
