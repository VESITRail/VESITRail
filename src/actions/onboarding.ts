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
import { Year, Class, Branch, Station, Student, ConcessionClass, ConcessionPeriod } from "@/generated/zod";

export type LegacyStudentData = {
	stationId: string;
	station: Pick<Station, "id" | "code" | "name">;
} | null;

export type ReviewData = Pick<
	Student,
	"classId" | "stationId" | "preferredConcessionClassId" | "preferredConcessionPeriodId"
>;

export type Review = {
	class: Pick<Class, "id" | "code"> & {
		year: Pick<Year, "id" | "code" | "name">;
		branch: Pick<Branch, "id" | "code" | "name">;
	};
	station: Pick<Station, "id" | "code" | "name">;
	concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
	concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export type OnboardingData = Pick<
	Student,
	| "status"
	| "gender"
	| "classId"
	| "address"
	| "lastName"
	| "firstName"
	| "stationId"
	| "middleName"
	| "dateOfBirth"
	| "rejectionReason"
	| "submissionCount"
	| "verificationDocUrl"
	| "preferredConcessionClassId"
	| "preferredConcessionPeriodId"
> & {
	class: Pick<Class, "id"> & {
		year: Pick<Year, "id" | "code" | "name">;
		branch: Pick<Branch, "id" | "code" | "name">;
	};
};

export const getReviewData = async (
	data: ReviewData
): Promise<Result<Review, AuthError | ValidationError | DatabaseError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const [_class, station, concessionClass, concessionPeriod] = await Promise.all([
			prisma.class.findUnique({
				where: { id: data.classId },
				select: {
					id: true,
					code: true,
					year: { select: { id: true, code: true, name: true } },
					branch: { select: { id: true, code: true, name: true } }
				}
			}),
			prisma.station.findUnique({
				where: { id: data.stationId },
				select: { id: true, code: true, name: true }
			}),
			prisma.concessionClass.findUnique({
				where: { id: data.preferredConcessionClassId },
				select: { id: true, code: true, name: true }
			}),
			prisma.concessionPeriod.findUnique({
				where: { id: data.preferredConcessionPeriodId },
				select: { id: true, name: true, duration: true }
			})
		]);

		if (!_class || !station || !concessionClass || !concessionPeriod) {
			return failure(validationError("Some review fields are missing"));
		}

		return success({
			station,
			class: _class,
			concessionClass,
			concessionPeriod
		});
	} catch (error) {
		console.error("Error while fetching review data:", error);
		return failure(databaseError("Failed to fetch review data"));
	}
};

export const getExistingStudentData = async (): Promise<Result<OnboardingData | null, AuthError | DatabaseError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetUserId = authResult.data.userId;
		const student = await prisma.student.findUnique({
			where: { userId: targetUserId },
			select: {
				status: true,
				gender: true,
				classId: true,
				address: true,
				lastName: true,
				firstName: true,
				stationId: true,
				middleName: true,
				dateOfBirth: true,
				rejectionReason: true,
				submissionCount: true,
				verificationDocUrl: true,
				preferredConcessionClassId: true,
				preferredConcessionPeriodId: true,
				class: {
					select: {
						id: true,
						year: {
							select: {
								id: true,
								code: true,
								name: true
							}
						},
						branch: {
							select: {
								id: true,
								code: true,
								name: true
							}
						}
					}
				}
			}
		});

		return success(student);
	} catch (error) {
		console.error("Error while fetching existing student data:", error);
		return failure(databaseError("Failed to fetch existing student data"));
	}
};

export const getLegacyStudentByEmail = async (): Promise<Result<LegacyStudentData, AuthError | DatabaseError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const targetEmail = authResult.data.email.toLowerCase();
		const legacyStudent = await prisma.legacyStudent.findUnique({
			where: { email: targetEmail },
			select: {
				stationId: true,
				station: {
					select: { id: true, code: true, name: true }
				}
			}
		});

		return success(legacyStudent);
	} catch (error) {
		console.error("Error while fetching legacy student data:", error);
		return failure(databaseError("Failed to fetch legacy student data"));
	}
};

export const submitOnboarding = async (
	data: OnboardingData
): Promise<Result<Student, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	if (!data) {
		return failure(validationError("Onboarding data is required"));
	}

	try {
		const targetUserId = authResult.data.userId;
		const { class: _classData, ...dbData } = data;

		const [_class, station, concessionClass, concessionPeriod] = await Promise.all([
			prisma.class.findFirst({
				where: {
					isActive: true,
					id: dbData.classId,
					year: { isActive: true },
					branch: { isActive: true }
				}
			}),
			prisma.station.findFirst({
				where: { id: dbData.stationId, isActive: true }
			}),
			prisma.concessionClass.findFirst({
				where: { id: dbData.preferredConcessionClassId, isActive: true }
			}),
			prisma.concessionPeriod.findFirst({
				where: { id: dbData.preferredConcessionPeriodId, isActive: true }
			})
		]);

		if (!_class) {
			return failure(validationError("Selected class, year, or branch is currently unavailable", "classId"));
		}

		if (!station) {
			return failure(validationError("Selected station is currently unavailable", "stationId"));
		}

		if (!concessionClass) {
			return failure(
				validationError("Selected preferred concession class is currently unavailable", "preferredConcessionClassId")
			);
		}

		if (!concessionPeriod) {
			return failure(
				validationError("Selected preferred concession period is currently unavailable", "preferredConcessionPeriodId")
			);
		}

		const legacyRecord = await prisma.legacyStudent.findUnique({
			where: { email: authResult.data.email.toLowerCase() }
		});
		const shouldAutoApprove = Boolean(legacyRecord);
		const status = shouldAutoApprove ? "Approved" : "Pending";

		const student = await prisma.student.upsert({
			where: { userId: targetUserId },
			create: {
				...dbData,
				status,
				userId: targetUserId,
				submissionCount: 1,
				rejectionReason: null,
				...(shouldAutoApprove && { reviewedAt: new Date() })
			},
			update: {
				...dbData,
				reviewedById: null,
				rejectionReason: null,
				submissionCount: { increment: 1 },
				reviewedAt: shouldAutoApprove ? new Date() : null,
				status: shouldAutoApprove ? "Approved" : "Pending"
			}
		});

		return success(student);
	} catch (error) {
		console.error("Error while submitting student onboarding:", error);
		return failure(databaseError("Failed to submit student onboarding"));
	}
};
