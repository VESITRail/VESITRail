"use server";

import {
  Result,
  success,
  failure,
  authError,
  AuthError,
  DatabaseError,
  databaseError,
} from "@/lib/result";
import prisma from "@/lib/prisma";
import type { Notification } from "@/generated/zod";

export type NotificationItem = Pick<
  Notification,
  "id" | "title" | "body" | "url" | "isRead" | "createdAt"
>;

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
  studentId: string,
  params: NotificationPaginationParams
): Promise<Result<PaginatedNotificationsResult, DatabaseError | AuthError>> => {
  try {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(authError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(authError("Student is not approved"));
    }

    const whereClause = {
      studentId: studentId,
    };

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        skip,
        take: pageSize,
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          url: true,
          body: true,
          title: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: {
          isRead: false,
          studentId: studentId,
        },
      }),
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
      data: notifications,
    });
  } catch (error) {
    console.error("Error while fetching notifications:", error);
    return failure(databaseError("Failed to fetch notifications"));
  }
};

export const markNotificationAsRead = async (
  studentId: string,
  notificationId: string
): Promise<Result<{ success: boolean }, DatabaseError | AuthError>> => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        studentId: studentId,
      },
    });

    if (!notification) {
      return failure(authError("Notification not found"));
    }

    await prisma.notification.update({
      data: { isRead: true },
      where: { id: notificationId },
    });

    return success({ success: true });
  } catch (error) {
    console.error("Error while marking notification as read:", error);
    return failure(databaseError("Failed to mark notification as read"));
  }
};

export const getUnreadNotificationCount = async (
  studentId: string
): Promise<Result<{ count: number }, DatabaseError | AuthError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(authError("Student not found"));
    }

    const count = await prisma.notification.count({
      where: {
        isRead: false,
        studentId: studentId,
      },
    });

    return success({ count });
  } catch (error) {
    console.error("Error while fetching unread notification count:", error);
    return failure(databaseError("Failed to fetch unread notification count"));
  }
};
