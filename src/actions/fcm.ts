"use server";

import {
  Result,
  success,
  failure,
  databaseError,
  DatabaseError,
  validationError,
  ValidationError,
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { FcmPlatformType } from "@/generated/zod";

export type FcmTokenData = {
  token: string;
  studentId: string;
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

    if (!data.studentId?.trim()) {
      return failure(validationError("Student ID is required"));
    }

    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: data.studentId },
    });

    if (!student) {
      return failure(validationError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(validationError("Student is not approved"));
    }

    const whereClause = data.deviceId
      ? {
          studentId_deviceId: {
            deviceId: data.deviceId,
            studentId: data.studentId,
          },
        }
      : { token: data.token };

    await prisma.fcmToken.upsert({
      where: whereClause,
      create: {
        token: data.token,
        platform: data.platform,
        studentId: data.studentId,
        deviceId: data.deviceId ?? null,
      },
      update: {
        token: data.token,
        platform: data.platform,
      },
    });

    return success({ success: true });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return failure(databaseError("Failed to save FCM token"));
  }
};

export const removeFcmToken = async (
  studentId: string,
  deviceId?: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
  try {
    if (!studentId?.trim()) {
      return failure(validationError("Student ID is required"));
    }

    await prisma.fcmToken.deleteMany({
      where: {
        studentId,
        deviceId: deviceId ?? null,
      },
    });

    return success({ success: true });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return failure(databaseError("Failed to remove FCM token"));
  }
};
