"use client";

import { Sheet, SheetTitle, SheetHeader, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	getNotifications,
	type NotificationItem,
	markNotificationAsRead,
	type NotificationPaginationParams
} from "@/actions/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback } from "react";

type NotificationSheetProps = {
	children: React.ReactNode;
};

const NotificationSheet: React.FC<NotificationSheetProps> = ({ children }) => {
	const router = useRouter();
	const isMobile = useIsMobile();
	const { data: session } = authClient.useSession();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [hasNextPage, setHasNextPage] = useState<boolean>(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);

	const pageSize = 10;

	const fetchNotifications = useCallback(
		async (page: number = 1, reset: boolean = true) => {
			if (!session?.user?.id) return;

			if (page === 1) {
				setLoading(true);
			} else {
				setLoadingMore(true);
			}

			try {
				const params: NotificationPaginationParams = {
					page,
					pageSize
				};

				const result = await getNotifications(session.user.id, params);

				if (result.isSuccess) {
					const { data, unreadCount: unread, hasNextPage: hasNext } = result.data;

					if (reset) {
						setNotifications(data);
					} else {
						setNotifications((prev) => [...prev, ...data]);
					}

					setCurrentPage(page);
					setUnreadCount(unread);
					setHasNextPage(hasNext);
				} else {
					toast.error("Error", {
						description: "Failed to fetch notifications"
					});
				}
			} catch (error) {
				console.error("Error fetching notifications:", error);
				toast.error("Error", {
					description: "Failed to fetch notifications"
				});
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[session?.user?.id, pageSize]
	);

	const loadMore = useCallback(() => {
		if (hasNextPage && !loadingMore) {
			fetchNotifications(currentPage + 1, false);
		}
	}, [hasNextPage, loadingMore, currentPage, fetchNotifications]);

	const handleNotificationClick = async (notification: NotificationItem) => {
		if (!session?.user?.id) return;

		if (!notification.isRead) {
			try {
				const result = await markNotificationAsRead(session.user.id, notification.id);
				if (result.isSuccess) {
					setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
					setUnreadCount((prev) => Math.max(0, prev - 1));
				}
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}

		if (isMobile) {
			setIsOpen(false);
		}

		if (notification.url) {
			router.push(notification.url);
		}
	};

	useEffect(() => {
		if (isOpen) {
			fetchNotifications(1, true);
		}
	}, [isOpen, fetchNotifications]);

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
			if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !loadingMore) {
				loadMore();
			}
		},
		[hasNextPage, loadingMore, loadMore]
	);

	const NotificationSkeleton = () => (
		<div className="space-y-4 py-2">
			{Array.from({ length: 10 }).map((_, i) => (
				<div key={i} className="flex gap-3 p-3">
					<Skeleton className="size-4 rounded-full flex-shrink-0 mt-1" />
					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="size-2 rounded-full" />
						</div>
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-2/3" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-3 w-3 rounded-full" />
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-4 w-12 rounded-full" />
						</div>
					</div>
				</div>
			))}
		</div>
	);

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>{children}</SheetTrigger>

			<SheetContent side="right" className="w-full sm:max-w-md p-0">
				<SheetHeader className="p-4 pb-0">
					<SheetTitle className="flex items-center gap-2">
						<Bell className="size-5" />
						Notifications
						{unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
					</SheetTitle>
				</SheetHeader>

				<Separator />

				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full px-4" onScrollCapture={handleScroll}>
						{loading ? (
							<NotificationSkeleton />
						) : notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Bell className="size-12 text-muted-foreground mb-4" />
								<h3 className="font-medium text-lg mb-2">No notifications</h3>
								<p className="text-muted-foreground text-sm">
									You&apos;re all caught up! No new notifications at this time.
								</p>
							</div>
						) : (
							<div className="space-y-1 py-2">
								{notifications.map((notification, index) => (
									<div key={notification.id}>
										<div
											className={cn(
												!notification.isRead && "bg-muted/30",
												"flex gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
											)}
											onClick={() => handleNotificationClick(notification)}
										>
											<div className="flex-shrink-0 mt-1">
												<Bell className="size-4" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2 mb-1">
													<h4 className={cn("font-medium text-sm truncate", !notification.isRead && "font-semibold")}>
														{notification.title}
													</h4>
													{!notification.isRead && <div className="size-2 bg-primary rounded-full flex-shrink-0" />}
												</div>
												<p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-2">
													{notification.body}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Clock className="size-3" />
													<span>
														{new Date(notification.createdAt).toLocaleDateString("en-US", {
															hour12: true,
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit"
														})}
													</span>
												</div>
											</div>
										</div>
										{index < notifications.length - 1 && <Separator className="my-1" />}
									</div>
								))}

								{loadingMore && (
									<div className="flex justify-center py-4">
										<Loader2 className="size-6 animate-spin text-muted-foreground" />
									</div>
								)}

								{hasNextPage && !loadingMore && (
									<div className="flex justify-center py-4">
										<Button size="sm" variant="ghost" onClick={loadMore} className="text-muted-foreground">
											Load more notifications
										</Button>
									</div>
								)}
							</div>
						)}
					</ScrollArea>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default NotificationSheet;
