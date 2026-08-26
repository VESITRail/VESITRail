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
import { Student } from "@/generated/zod";
import { StudentPreferences } from "./utils";
import { requireAuth, requireStudent } from "@/lib/auth-guard";

export type UpdatePreferencesData = Pick<Student, "preferredConcessionClassId" | "preferredConcessionPeriodId">;

export const getStudentPreferences = async (): Promise<Result<StudentPreferences, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const student = await prisma.student.findUnique({
			where: { userId: targetStudentId },
			select: {
				status: true,
				preferredConcessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				}
			}
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
			preferredConcessionPeriod
		});
	} catch (error) {
		console.error("Error while fetching preferences:", error);
		return failure(databaseError("Failed to fetch preferences"));
	}
};

export const updateStudentPreferences = async (
	data: UpdatePreferencesData
): Promise<Result<StudentPreferences, AuthError | DatabaseError | ValidationError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: targetStudentId }
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
					id: data.preferredConcessionClassId
				}
			}),
			prisma.concessionPeriod.findFirst({
				where: {
					isActive: true,
					id: data.preferredConcessionPeriodId
				}
			})
		]);

		if (!concessionClass) {
			return failure(
				validationError("Selected concession class is currently unavailable", "preferredConcessionClassId")
			);
		}

		if (!concessionPeriod) {
			return failure(
				validationError("Selected concession period is currently unavailable", "preferredConcessionPeriodId")
			);
		}

		const updatedStudent = await prisma.student.update({
			where: { userId: targetStudentId },
			data: {
				preferredConcessionClassId: data.preferredConcessionClassId,
				preferredConcessionPeriodId: data.preferredConcessionPeriodId
			},
			select: {
				preferredConcessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				}
			}
		});

		return success(updatedStudent);
	} catch (error) {
		console.error("Error while updating preferences:", error);
		return failure(databaseError("Failed to update preferences"));
	}
};

export async function updateNotificationPreferences(preferences: {
	pushEnabled?: boolean;
	emailEnabled?: boolean;
}): Promise<Result<{ success: boolean }, AuthError | DatabaseError>> {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

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
			where: { id: targetUserId }
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error updating notification preferences:", error);
		return failure(databaseError("Failed to update notification preferences"));
	}
}

export async function getNotificationPreferences(): Promise<
	Result<{ pushEnabled: boolean; emailEnabled: boolean }, AuthError | DatabaseError>
> {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const user = await prisma.user.findUnique({
			where: { id: targetUserId },
			select: {
				pushNotificationsEnabled: true,
				emailNotificationsEnabled: true
			}
		});

		if (!user) {
			return failure(databaseError("User not found"));
		}

		return success({
			pushEnabled: user.pushNotificationsEnabled,
			emailEnabled: user.emailNotificationsEnabled
		});
	} catch (error) {
		console.error("Error getting notification preferences:", error);
		return failure(databaseError("Failed to get notification preferences"));
	}
}
