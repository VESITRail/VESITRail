"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { versionManager } from "@/lib/pwa";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppUpdate } from "@/hooks/use-app-update";
import { Card, CardContent } from "@/components/ui/card";
import UpdateModal from "@/components/utils/update-modal";

type AppVersionProps = {
	initialVersion?: string | null;
};

export const AppVersion = ({ initialVersion }: AppVersionProps) => {
	const [version, setVersion] = useState<string | null>(initialVersion || null);
	const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
	const [versionLoading, setVersionLoading] = useState<boolean>(!initialVersion);

	const {
		lastChecked,
		applyUpdate,
		dismissUpdate,
		checkForUpdates,
		info: updateInfo,
		loading: updateLoading,
		available: updateAvailable
	} = useAppUpdate();

	const formatLastChecked = (date: Date): string => {
		return format(date, "MMMM d, yyyy HH:mm");
	};

	const handleCheckForUpdates = async (): Promise<void> => {
		try {
			const hasUpdate = await checkForUpdates(true);

			if (hasUpdate) {
				setShowUpdateModal(true);
			} else {
				toast.success("Check Complete", {
					duration: 2000,
					description: "You're running the latest version."
				});
			}
		} catch (error) {
			console.error("Failed to check for updates:", error);
			toast.error("Update Check Failed", {
				description: "Unable to check for updates. Please try again."
			});
		}
	};

	const handleUpdateModalClose = (open: boolean) => {
		setShowUpdateModal(open);
		if (!open && updateAvailable) {
			dismissUpdate();
		}
	};

	useEffect(() => {
		const loadVersion = async (): Promise<void> => {
			if (initialVersion) {
				setVersionLoading(false);
				return;
			}

			setVersionLoading(true);
			try {
				const currentVersion = await versionManager.getVersionString();
				setVersion(currentVersion);
			} catch (error) {
				console.error("Failed to load version:", error);
				setVersion("Unknown");
			} finally {
				setVersionLoading(false);
			}
		};

		loadVersion();
	}, [initialVersion]);

	if (versionLoading) {
		return (
			<div id="app-version" className="mb-6 space-y-6">
				<div>
					<h2 className="text-lg font-semibold mb-2">App Version</h2>
					<p className="text-sm text-muted-foreground">Check for updates and manage application version information.</p>
				</div>

				<Card>
					<CardContent className="py-2.5">
						<div className="space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="space-y-1">
									<Skeleton className="h-4 w-40" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-9 w-full sm:w-32" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div id="app-version" className="mb-6 space-y-6">
			<div>
				<h2 className="text-lg font-semibold mb-2">App Version</h2>
				<p className="text-sm text-muted-foreground">Check for updates and manage application version information.</p>
			</div>

			<Card>
				<CardContent className="py-2.5">
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<p className="text-sm font-medium">Current Version: {version || "Loading..."}</p>
								{lastChecked && (
									<p className="text-xs text-muted-foreground">Last checked: {formatLastChecked(lastChecked)}</p>
								)}
							</div>
							<Button size="sm" disabled={updateLoading} className="w-full sm:w-auto" onClick={handleCheckForUpdates}>
								{updateLoading ? (
									<>
										<div className="size-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
										Checking...
									</>
								) : (
									<>
										<RefreshCw className="size-4 mr-1" />
										Check Updates
									</>
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{updateInfo && (
				<UpdateModal
					open={showUpdateModal}
					onUpdate={applyUpdate}
					updateInfo={updateInfo}
					onIgnore={dismissUpdate}
					onOpenChange={handleUpdateModalClose}
				/>
			)}
		</div>
	);
};
