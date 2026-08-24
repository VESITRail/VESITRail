"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { StudentApprovalStatusType } from "@/generated/zod";
import { Result, success, failure, AuthError, databaseError, DatabaseError } from "@/lib/result";

export type UserRole = {
	rejectionReason?: string;
	submissionCount?: number;
	role: "admin" | "student";
	status: "Active" | "Inactive" | "NeedsOnboarding" | StudentApprovalStatusType;
};

export type UserRoles = {
	admin?: {
		status: "Active" | "Inactive";
	};
	student?: {
		submissionCount?: number;
		rejectionReason?: string;
		status: StudentApprovalStatusType | "NeedsOnboarding";
	};
};

export const checkUserRole = async (): Promise<Result<UserRole, AuthError | DatabaseError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const admin = await prisma.admin.findUnique({
			where: { userId: targetUserId },
			select: { isActive: true }
		});

		if (admin) {
			if (!admin.isActive) {
				return success({
					role: "admin",
					status: "Inactive"
				});
			}

			return success({ role: "admin", status: "Active" });
		}

		const student = await prisma.student.findUnique({
			where: { userId: targetUserId },
			select: {
				status: true,
				rejectionReason: true,
				submissionCount: true
			}
		});

		if (student) {
			return success({
				role: "student",
				status: student.status,
				submissionCount: student.submissionCount,
				rejectionReason: student.rejectionReason || undefined
			});
		}

		return success({
			role: "student",
			status: "NeedsOnboarding"
		});
	} catch (error) {
		console.error("Error while checking user role:", error);
		return failure(databaseError("Failed to check user role"));
	}
};

export const checkAllUserRoles = async (): Promise<Result<UserRoles, AuthError | DatabaseError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;

		const [admin, student] = await Promise.all([
			prisma.admin.findUnique({
				where: { userId: targetUserId },
				select: { isActive: true }
			}),
			prisma.student.findUnique({
				where: { userId: targetUserId },
				select: {
					status: true,
					rejectionReason: true,
					submissionCount: true
				}
			})
		]);

		const roles: UserRoles = {};

		if (admin) {
			roles.admin = {
				status: admin.isActive ? "Active" : "Inactive"
			};
		}

		if (student) {
			roles.student = {
				status: student.status,
				submissionCount: student.submissionCount,
				rejectionReason: student.rejectionReason || undefined
			};
		} else if (!admin) {
			roles.student = {
				status: "NeedsOnboarding"
			};
		}

		return success(roles);
	} catch (error) {
		console.error("Error while checking all user roles:", error);
		return failure(databaseError("Failed to check user roles"));
	}
};
