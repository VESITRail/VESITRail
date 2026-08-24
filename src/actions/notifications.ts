"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import type { Notification } from "@/generated/zod";
import { Result, success, failure, authError, AuthError, DatabaseError, databaseError } from "@/lib/result";

export type NotificationItem = Pick<Notification, "id" | "title" | "body" | "url" | "isRead" | "createdAt">;

export type PaginatedNotificationsResult = {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	unreadCount: number;
	hasNextPage: boolean;
	data: NotificationItem[];
	hasPreviousPage: boolean;
};

export type NotificationPaginationParams = {
	page: number;
	pageSize: number;
};

export const getNotifications = async (
	params: NotificationPaginationParams
): Promise<Result<PaginatedNotificationsResult, DatabaseError | AuthError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const { page, pageSize } = params;
		const skip = (page - 1) * pageSize;
		const targetUserId = authResult.data.userId;

		const whereClause = {
			userId: targetUserId
		};

		const [notifications, totalCount, unreadCount] = await Promise.all([
			prisma.notification.findMany({
				skip,
				take: pageSize,
				where: whereClause,
				orderBy: {
					createdAt: "desc"
				},
				select: {
					id: true,
					url: true,
					body: true,
					title: true,
					isRead: true,
					createdAt: true
				}
			}),
			prisma.notification.count({
				where: whereClause
			}),
			prisma.notification.count({
				where: {
					isRead: false,
					userId: targetUserId
				}
			})
		]);

		const totalPages = Math.ceil(totalCount / pageSize);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		return success({
			totalCount,
			totalPages,
			hasNextPage,
			unreadCount,
			hasPreviousPage,
			currentPage: page,
			data: notifications
		});
	} catch (error) {
		console.error("Error while fetching notifications:", error);
		return failure(databaseError("Failed to fetch notifications"));
	}
};

export const markNotificationAsRead = async (
	notificationId: string
): Promise<Result<{ success: boolean }, DatabaseError | AuthError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const notification = await prisma.notification.findFirst({
			where: {
				userId: targetUserId,
				id: notificationId
			}
		});

		if (!notification) {
			return failure(authError("Notification not found"));
		}

		await prisma.notification.update({
			data: { isRead: true },
			where: { id: notificationId }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error while marking notification as read:", error);
		return failure(databaseError("Failed to mark notification as read"));
	}
};

export const markAllNotificationsAsRead = async (): Promise<
	Result<{ success: boolean; count: number }, DatabaseError | AuthError>
> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const result = await prisma.notification.updateMany({
			where: {
				userId: targetUserId,
				isRead: false
			},
			data: {
				isRead: true
			}
		});

		return success({ success: true, count: result.count });
	} catch (error) {
		console.error("Error while marking all notifications as read:", error);
		return failure(databaseError("Failed to mark all notifications as read"));
	}
};

export const getUnreadNotificationCount = async (): Promise<Result<{ count: number }, DatabaseError | AuthError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const count = await prisma.notification.count({
			where: {
				isRead: false,
				userId: targetUserId
			}
		});

		return success({ count });
	} catch (error) {
		console.error("Error while fetching unread notification count:", error);
		return failure(databaseError("Failed to fetch unread notification count"));
	}
};
