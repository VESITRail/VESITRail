"use server";

import prisma from "@/lib/prisma";
import { Year, Class, Branch, Station, Student, ConcessionClass, ConcessionPeriod } from "@/generated/zod";
import { Result, success, failure, databaseError, DatabaseError, validationError, ValidationError } from "@/lib/result";

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

export const getReviewData = async (data: ReviewData): Promise<Result<Review, ValidationError | DatabaseError>> => {
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

export const getExistingStudentData = async (userId: string): Promise<Result<OnboardingData | null, DatabaseError>> => {
	try {
		const student = await prisma.student.findUnique({
			where: { userId },
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

export const getLegacyStudentByEmail = async (email: string): Promise<Result<LegacyStudentData, DatabaseError>> => {
	try {
		const legacyStudent = await prisma.legacyStudent.findUnique({
			where: { email: email.toLowerCase() },
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
	studentId: string,
	data: OnboardingData,
	isLegacyStudent: boolean = false
): Promise<Result<Student, DatabaseError>> => {
	try {
		const { class: _classData, ...dbData } = data;

		const shouldAutoApprove = isLegacyStudent;
		const status = shouldAutoApprove ? "Approved" : "Pending";

		const student = await prisma.student.upsert({
			where: { userId: studentId },
			create: {
				...dbData,
				status,
				userId: studentId,
				submissionCount: 1,
				rejectionReason: null,
				...(shouldAutoApprove && { reviewedAt: new Date() })
			},
			update: {
				...dbData,
				reviewedAt: null,
				status: "Pending",
				reviewedById: null,
				rejectionReason: null,
				submissionCount: { increment: 1 }
			}
		});

		return success(student);
	} catch (error) {
		console.error("Error while submitting student onboarding:", error);
		return failure(databaseError("Failed to submit student onboarding"));
	}
};
