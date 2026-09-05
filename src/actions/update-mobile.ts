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
import { requireStudent } from "@/lib/auth-guard";
import { MobileNumberSchema } from "@/lib/validations/onboarding/personal-info";

export const updateStudentMobileNumber = async (
	mobileNumber: string
): Promise<Result<{ mobileNumber: string }, AuthError | ValidationError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	const validationResult = MobileNumberSchema.safeParse({ mobileNumber });
	if (!validationResult.success) {
		const firstIssue = validationResult.error.issues[0];
		return failure(validationError(firstIssue?.message || "Invalid mobile number", "mobileNumber"));
	}

	try {
		const studentId = studentResult.data.studentId;

		await prisma.student.update({
			where: { userId: studentId },
			data: { mobileNumber: validationResult.data.mobileNumber }
		});

		return success({ mobileNumber: validationResult.data.mobileNumber });
	} catch (error) {
		console.error("Error updating mobile number:", error);
		return failure(databaseError("Failed to update mobile number"));
	}
};

export const getStudentMobileStatus = async (): Promise<
	Result<{ hasMobileNumber: boolean }, AuthError | DatabaseError>
> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const student = await prisma.student.findUnique({
			select: { mobileNumber: true },
			where: { userId: studentResult.data.studentId }
		});

		const hasMobileNumber = Boolean(student?.mobileNumber && /^[6-9]\d{9}$/.test(student.mobileNumber));
		return success({ hasMobileNumber });
	} catch (error) {
		console.error("Error checking mobile number status:", error);
		return failure(databaseError("Failed to check mobile number status"));
	}
};
