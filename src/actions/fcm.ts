"use server";

import { Result, success, failure, databaseError, DatabaseError, validationError, ValidationError } from "@/lib/result";
import prisma from "@/lib/prisma";
import { FcmPlatformType } from "@/generated/zod";

export type FcmTokenData = {
	token: string;
	userId: string;
	deviceId?: string;
	platform: FcmPlatformType;
};

export const saveFcmToken = async (
	data: FcmTokenData
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!data.token?.trim()) {
			return failure(validationError("FCM token is required"));
		}

		if (!data.userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		const user = await prisma.user.findUnique({
			select: { id: true },
			where: { id: data.userId }
		});

		if (!user) {
			return failure(validationError("User not found"));
		}

		const whereClause = data.deviceId
			? {
					userId_deviceId: {
						userId: data.userId,
						deviceId: data.deviceId
					}
				}
			: { token: data.token };

		await prisma.fcmToken.upsert({
			where: whereClause,
			create: {
				token: data.token,
				userId: data.userId,
				platform: data.platform,
				deviceId: data.deviceId ?? null
			},
			update: {
				token: data.token,
				platform: data.platform
			}
		});

		await prisma.user.update({
			where: { id: data.userId },
			data: { pushNotificationsEnabled: true }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error saving FCM token:", error);
		return failure(databaseError("Failed to save FCM token"));
	}
};

export const removeFcmToken = async (
	userId: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		await prisma.$transaction([
			prisma.fcmToken.deleteMany({
				where: {
					userId
				}
			}),
			prisma.user.update({
				where: { id: userId },
				data: { pushNotificationsEnabled: false }
			})
		]);

		return success({ success: true });
	} catch (error) {
		console.error("Error removing FCM token:", error);
		return failure(databaseError("Failed to remove FCM token"));
	}
};

export const updatePushNotificationStatus = async (
	userId: string,
	enabled: boolean
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		await prisma.user.update({
			where: { id: userId },
			data: { pushNotificationsEnabled: enabled }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error updating push notification status:", error);
		return failure(databaseError("Failed to update push notification status"));
	}
};
