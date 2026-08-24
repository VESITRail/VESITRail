"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, requireStudent } from "@/lib/auth-guard";
import { Result, success, failure, AuthError, authError, DatabaseError, databaseError } from "@/lib/result";
import { Year, User, Class, Admin, Branch, Student, Station, ConcessionClass, ConcessionPeriod } from "@/generated/zod";

export type AdminProfile = Admin & {
	user: User;
	studentsCount: number;
	applicationsCount: number;
	addressChangesCount: number;
};

export type StudentProfile = Student & {
	class: Class & {
		year: Year;
		branch: Branch;
	};
	station: Station;
	preferredConcessionClass: ConcessionClass;
	preferredConcessionPeriod: ConcessionPeriod;
};

export const getStudentProfile = async (): Promise<Result<StudentProfile, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const student = await prisma.student.findUnique({
			where: {
				userId: targetStudentId
			},
			include: {
				class: {
					include: {
						year: true,
						branch: true
					}
				},
				station: true,
				preferredConcessionClass: true,
				preferredConcessionPeriod: true
			}
		});

		if (!student) {
			return failure(authError("Student profile not found"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student is not approved"));
		}

		return success(student);
	} catch (error) {
		console.error("Error while loading student profile:", error);
		return failure(databaseError("Failed to load student profile"));
	}
};

export const getAdminProfile = async (): Promise<Result<AdminProfile, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const targetAdminId = adminResult.data.userId;

		const admin = await prisma.admin.findUnique({
			where: {
				userId: targetAdminId
			},
			include: {
				user: true
			}
		});

		if (!admin) {
			return failure(authError("Admin profile not found"));
		}

		if (!admin.isActive) {
			return failure(authError("Admin account is not active"));
		}

		const [studentsCount, applicationsCount, addressChangesCount] = await Promise.all([
			prisma.student.count({
				where: {
					reviewedById: targetAdminId
				}
			}),
			prisma.concessionApplication.count({
				where: {
					reviewedById: targetAdminId
				}
			}),
			prisma.addressChange.count({
				where: {
					reviewedById: targetAdminId
				}
			})
		]);

		const adminProfile: AdminProfile = {
			...admin,
			studentsCount,
			applicationsCount,
			addressChangesCount
		};

		return success(adminProfile);
	} catch (error) {
		console.error("Error while loading admin profile:", error);
		return failure(databaseError("Failed to load admin profile"));
	}
};
