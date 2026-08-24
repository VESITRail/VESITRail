"use server";

import {
	Result,
	success,
	failure,
	AuthError,
	databaseError,
	DatabaseError,
	validationError,
	ValidationError
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { FcmPlatformType } from "@/generated/zod";

export type FcmTokenData = {
	token: string;
	deviceId?: string;
	platform: FcmPlatformType;
};

export const saveFcmToken = async (
	data: FcmTokenData
): Promise<Result<{ success: boolean }, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		if (!data.token?.trim()) {
			return failure(validationError("FCM token is required"));
		}

		const targetUserId = authResult.data.userId;

		await prisma.$transaction(async (tx) => {
			await tx.fcmToken.deleteMany({
				where: { token: data.token }
			});

			if (data.deviceId) {
				await tx.fcmToken.upsert({
					where: {
						userId_deviceId: {
							userId: targetUserId,
							deviceId: data.deviceId
						}
					},
					create: {
						token: data.token,
						userId: targetUserId,
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
						userId: targetUserId,
						platform: data.platform
					}
				});
			}

			await tx.user.update({
				where: { id: targetUserId },
				data: { pushNotificationsEnabled: true }
			});
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error saving FCM token:", error);
		return failure(databaseError("Failed to save FCM token"));
	}
};

export const disablePushNotifications = async (): Promise<
	Result<{ success: boolean }, AuthError | DatabaseError | ValidationError>
> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		await prisma.user.update({
			where: { id: targetUserId },
			data: { pushNotificationsEnabled: false }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error disabling push notifications:", error);
		return failure(databaseError("Failed to disable push notifications"));
	}
};

export const removeFcmTokenForDevice = async (
	deviceId: string
): Promise<Result<{ success: boolean }, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		if (!deviceId?.trim()) {
			return failure(validationError("Device ID is required"));
		}

		const targetUserId = authResult.data.userId;

		await prisma.fcmToken.deleteMany({
			where: {
				userId: targetUserId,
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
	enabled: boolean
): Promise<Result<{ success: boolean }, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		await prisma.user.update({
			where: { id: targetUserId },
			data: { pushNotificationsEnabled: enabled }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error updating push notification status:", error);
		return failure(databaseError("Failed to update push notification status"));
	}
};
