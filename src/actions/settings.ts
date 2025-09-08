"use server";

import {
  Result,
  success,
  failure,
  databaseError,
  DatabaseError,
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { Student } from "@/generated/zod";
import { StudentPreferences } from "./utils";

export type UpdatePreferencesData = Pick<
  Student,
  "preferredConcessionClassId" | "preferredConcessionPeriodId"
>;

export const getStudentPreferences = async (
  studentId: string
): Promise<Result<StudentPreferences, DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      select: {
        status: true,
        preferredConcessionClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        preferredConcessionPeriod: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!student) {
      return failure(databaseError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(databaseError("Student is not approved"));
    }

    const { preferredConcessionClass, preferredConcessionPeriod } = student;

    return success({
      preferredConcessionClass,
      preferredConcessionPeriod,
    });
  } catch (error) {
    console.error("Error while fetching preferences:", error);
    return failure(databaseError("Failed to fetch preferences"));
  }
};

export const updateStudentPreferences = async (
  studentId: string,
  data: UpdatePreferencesData
): Promise<Result<StudentPreferences, DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(databaseError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(databaseError("Student is not approved"));
    }

    const [concessionClass, concessionPeriod] = await Promise.all([
      prisma.concessionClass.findFirst({
        where: {
          isActive: true,
          id: data.preferredConcessionClassId,
        },
      }),
      prisma.concessionPeriod.findFirst({
        where: {
          isActive: true,
          id: data.preferredConcessionPeriodId,
        },
      }),
    ]);

    if (!concessionClass) {
      return failure(databaseError("Invalid concession class selected"));
    }

    if (!concessionPeriod) {
      return failure(databaseError("Invalid concession period selected"));
    }

    const updatedStudent = await prisma.student.update({
      where: { userId: studentId },
      data: {
        preferredConcessionClassId: data.preferredConcessionClassId,
        preferredConcessionPeriodId: data.preferredConcessionPeriodId,
      },
      select: {
        preferredConcessionClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        preferredConcessionPeriod: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    return success(updatedStudent);
  } catch (error) {
    console.error("Error while updating preferences:", error);
    return failure(databaseError("Failed to update preferences"));
  }
};

export async function updateNotificationPreferences(
  userId: string,
  preferences: { pushEnabled?: boolean; emailEnabled?: boolean }
): Promise<Result<{ success: boolean }, DatabaseError>> {
  try {
    const updateData: {
      pushNotificationsEnabled?: boolean;
      emailNotificationsEnabled?: boolean;
    } = {};

    if (preferences.pushEnabled !== undefined) {
      updateData.pushNotificationsEnabled = preferences.pushEnabled;
    }
    if (preferences.emailEnabled !== undefined) {
      updateData.emailNotificationsEnabled = preferences.emailEnabled;
    }

    await prisma.user.update({
      data: updateData,
      where: { id: userId },
    });

    return success({ success: true });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return failure(databaseError("Failed to update notification preferences"));
  }
}

export async function getNotificationPreferences(
  userId: string
): Promise<
  Result<{ pushEnabled: boolean; emailEnabled: boolean }, DatabaseError>
> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
      },
    });

    if (!user) {
      return failure(databaseError("User not found"));
    }

    return success({
      pushEnabled: user.pushNotificationsEnabled,
      emailEnabled: user.emailNotificationsEnabled,
    });
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return failure(databaseError("Failed to get notification preferences"));
  }
}
