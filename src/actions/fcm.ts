"use server";

import prisma from "@/lib/prisma";
import { FcmPlatformType } from "@/generated/zod";
import { Result, success, failure, databaseError, DatabaseError, validationError, ValidationError } from "@/lib/result";

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

		await prisma.$transaction(async (tx) => {
			await tx.fcmToken.deleteMany({
				where: { token: data.token }
			});

			if (data.deviceId) {
				await tx.fcmToken.upsert({
					where: {
						userId_deviceId: {
							userId: data.userId,
							deviceId: data.deviceId
						}
					},
					create: {
						token: data.token,
						userId: data.userId,
						platform: data.platform,
						deviceId: data.deviceId
					},
					update: {
						token: data.token,
						platform: data.platform
					}
				});
			} else {
				await tx.fcmToken.create({
					data: {
						deviceId: null,
						token: data.token,
						userId: data.userId,
						platform: data.platform
					}
				});
			}

			await tx.user.update({
				where: { id: data.userId },
				data: { pushNotificationsEnabled: true }
			});
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error saving FCM token:", error);
		return failure(databaseError("Failed to save FCM token"));
	}
};

export const disablePushNotifications = async (
	userId: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		await prisma.user.update({
			where: { id: userId },
			data: { pushNotificationsEnabled: false }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error disabling push notifications:", error);
		return failure(databaseError("Failed to disable push notifications"));
	}
};

export const removeFcmTokenForDevice = async (
	userId: string,
	deviceId: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		if (!deviceId?.trim()) {
			return failure(validationError("Device ID is required"));
		}

		await prisma.fcmToken.deleteMany({
			where: {
				userId,
				deviceId
			}
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error removing FCM token for device:", error);
		return failure(databaseError("Failed to remove FCM token for device"));
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
