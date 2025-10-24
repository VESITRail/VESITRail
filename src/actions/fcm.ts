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

		return success({ success: true });
	} catch (error) {
		console.error("Error saving FCM token:", error);
		return failure(databaseError("Failed to save FCM token"));
	}
};

export const removeFcmToken = async (
	userId: string,
	deviceId?: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
	try {
		if (!userId?.trim()) {
			return failure(validationError("User ID is required"));
		}

		await prisma.fcmToken.deleteMany({
			where: {
				userId,
				deviceId: deviceId ?? null
			}
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error removing FCM token:", error);
		return failure(databaseError("Failed to remove FCM token"));
	}
};
