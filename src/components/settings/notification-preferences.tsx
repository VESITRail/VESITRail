"use client";

import {
	Dialog,
	DialogTitle,
	DialogFooter,
	DialogHeader,
	DialogContent,
	DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { useFcm } from "@/hooks/use-fcm";
import { Info, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getNotificationPreferences, updateNotificationPreferences } from "@/actions/settings";

const NotificationPreferences = () => {
	const { data, isPending } = authClient.useSession();
	const { cleanupFcmToken, enablePushNotifications } = useFcm(data?.user?.id);

	const [loading, setLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);
	const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState<boolean>(true);
	const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(true);

	useEffect(() => {
		const fetchPreferences = async () => {
			if (!data?.user?.id) {
				setLoading(false);
				return;
			}

			try {
				const result = await getNotificationPreferences(data.user.id);

				if (result.isSuccess) {
					setPushNotificationsEnabled(result.data.pushEnabled);
					setEmailNotificationsEnabled(result.data.emailEnabled);
				}
			} catch (error) {
				console.error("Error fetching notification preferences:", error);
			} finally {
				setLoading(false);
			}
		};

		if (!isPending) {
			fetchPreferences();
		}
	}, [data?.user?.id, isPending]);

	const handleToggle = async (type: "push" | "email", enabled: boolean) => {
		if (!data?.user?.id || isUpdating) return;

		setIsUpdating(true);
		setShowPermissionDialog(false);

		if (type === "push") {
			const previousValue = pushNotificationsEnabled;
			setPushNotificationsEnabled(enabled);

			if (!enabled) {
				toast.promise(
					cleanupFcmToken().then((success) => {
						if (!success) {
							setPushNotificationsEnabled(previousValue);
							throw new Error("Failed to cleanup FCM token");
						}
					}),
					{
						finally: () => setIsUpdating(false),
						loading: "Disabling push notifications...",
						success: "Push notifications disabled successfully!",
						error: "Failed to disable push notifications. Please try again."
					}
				);
			} else {
				if (typeof window !== "undefined" && "Notification" in window) {
					const permission = Notification.permission;

					if (permission === "denied") {
						setPushNotificationsEnabled(previousValue);
						setShowPermissionDialog(true);
						setIsUpdating(false);
						return;
					}
				}

				let needsPermission = false;

				toast.promise(
					enablePushNotifications().then((result) => {
						if (result.needsPermission) {
							needsPermission = true;
							setPushNotificationsEnabled(previousValue);
							setShowPermissionDialog(true);
							return Promise.resolve();
						}
						if (!result.success) {
							setPushNotificationsEnabled(previousValue);
							throw new Error("Failed to enable push notifications");
						}
					}),
					{
						finally: () => setIsUpdating(false),
						loading: "Enabling push notifications...",
						success: () => {
							if (needsPermission) return null;
							return "Push notifications enabled successfully!";
						},
						error: "Failed to enable push notifications. Please try again."
					}
				);
			}
		} else {
			const previousValue = emailNotificationsEnabled;
			setEmailNotificationsEnabled(enabled);

			toast.promise(
				updateNotificationPreferences(data.user.id, { emailEnabled: enabled }).then((result) => {
					if (!result.isSuccess) {
						setEmailNotificationsEnabled(previousValue);
						throw new Error("Failed to update preferences");
					}
				}),
				{
					finally: () => setIsUpdating(false),
					error: "Failed to update email notification preferences",
					loading: `${enabled ? "Enabling" : "Disabling"} email notifications...`,
					success: `Email notifications ${enabled ? "enabled" : "disabled"} successfully!`
				}
			);
		}
	};

	if (isPending || loading) {
		return (
			<div id="notification-preferences" className="mb-6 space-y-6">
				<div>
					<h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
					<p className="text-sm text-muted-foreground">Manage how you receive updates and announcements.</p>
				</div>

				<Card>
					<CardContent className="py-2.5">
						<div className="grid grid-cols-1 gap-6">
							<div className="flex items-center justify-between gap-4">
								<div className="space-y-1 flex-1 min-w-0">
									<Skeleton className="h-3.5 w-32" />
									<Skeleton className="h-3 w-3/4" />
								</div>
								<Skeleton className="h-6 w-11 rounded-full shrink-0" />
							</div>

							<div className="flex items-center justify-between gap-4">
								<div className="space-y-1 flex-1 min-w-0">
									<Skeleton className="h-3.5 w-32" />
									<Skeleton className="h-3 w-3/4" />
								</div>
								<Skeleton className="h-6 w-11 rounded-full shrink-0" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div id="notification-preferences" className="mb-6 space-y-6">
			<div>
				<h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
				<p className="text-sm text-muted-foreground">Manage how you receive updates and announcements.</p>
			</div>

			<Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							Browser Permission Required
						</DialogTitle>
						<DialogDescription>
							To enable push notifications, you need to grant permission in your browser settings.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-4">
						<div className="flex items-start gap-3 p-3 rounded-md border bg-muted/50">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
								1
							</div>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">Access Site Settings</p>
								<p className="text-xs text-muted-foreground">
									Click the <Lock className="inline h-3 w-3 mx-1" /> lock or info icon in your browser&apos;s address
									bar
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3 p-3 rounded-md border bg-muted/50">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
								2
							</div>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">Find Notifications</p>
								<p className="text-xs text-muted-foreground">
									Locate &quot;Notifications&quot; in the permissions list
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3 p-3 rounded-md border bg-muted/50">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
								3
							</div>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">Allow Notifications</p>
								<p className="text-xs text-muted-foreground">
									Change the setting from &quot;Block&quot; to &quot;Allow&quot;
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3 p-3 rounded-md border bg-muted/50">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
								4
							</div>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">Refresh & Retry</p>
								<p className="text-xs text-muted-foreground">Reload this page and toggle push notifications again</p>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={() => setShowPermissionDialog(false)} className="w-full sm:w-auto">
							Got it
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Card>
				<CardContent className="py-2.5">
					<div className="grid grid-cols-1 gap-6">
						<div className="flex items-center justify-between gap-4">
							<div className="space-y-1 flex-1 min-w-0">
								<Label htmlFor="push-notifications-toggle" className="text-sm font-medium cursor-pointer">
									Push Notifications
								</Label>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Receive push notifications about concession status updates and important announcements
								</p>
							</div>
							<Switch
								className="shrink-0"
								disabled={isUpdating}
								id="push-notifications-toggle"
								checked={pushNotificationsEnabled}
								onCheckedChange={(enabled) => handleToggle("push", enabled)}
							/>
						</div>

						<div className="flex items-center justify-between gap-4">
							<div className="space-y-1 flex-1 min-w-0">
								<Label htmlFor="email-notifications-toggle" className="text-sm font-medium cursor-pointer">
									Email Notifications
								</Label>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Receive email notifications about concession status updates and important announcements
								</p>
							</div>
							<Switch
								className="shrink-0"
								disabled={isUpdating}
								id="email-notifications-toggle"
								checked={emailNotificationsEnabled}
								onCheckedChange={(enabled) => handleToggle("email", enabled)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default NotificationPreferences;
