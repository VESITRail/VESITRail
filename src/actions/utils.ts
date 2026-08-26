"use server";

import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-guard";
import { sortByRomanKey, sortByYearOrder } from "@/lib/utils";
import { Result, success, failure, AuthError, databaseError, DatabaseError } from "@/lib/result";
import { Year, Class, Branch, Station, ConcessionClass, ConcessionPeriod } from "@/generated/zod";

export type StudentStation = Pick<Station, "id" | "code" | "name">;

export type StudentPreferences = {
	preferredConcessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
	preferredConcessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

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

export const getYears = async (): Promise<Result<Year[], DatabaseError>> => {
	try {
		const years = await prisma.year.findMany({
			orderBy: [{ isActive: "desc" }]
		});

		return success(sortByYearOrder(years));
	} catch (error) {
		console.error("Error while fetching years:", error);
		return failure(databaseError("Failed to fetch years"));
	}
};

export const getBranches = async (): Promise<Result<Branch[], DatabaseError>> => {
	try {
		const branches = await prisma.branch.findMany({
			orderBy: [{ isActive: "desc" }, { name: "asc" }]
		});

		return success(branches);
	} catch (error) {
		console.error("Error while fetching branches:", error);
		return failure(databaseError("Failed to fetch branches"));
	}
};

export const getClasses = async (): Promise<Result<Class[], DatabaseError>> => {
	try {
		const classes = await prisma.class.findMany({
			orderBy: [{ isActive: "desc" }, { code: "asc" }]
		});

		return success(classes);
	} catch (error) {
		console.error("Error while fetching classes:", error);
		return failure(databaseError("Failed to fetch classes"));
	}
};

export const getStations = async (): Promise<Result<Station[], DatabaseError>> => {
	try {
		const stations = await prisma.station.findMany({
			orderBy: [{ isActive: "desc" }, { name: "asc" }]
		});

		return success(stations);
	} catch (error) {
		console.error("Error while fetching stations:", error);
		return failure(databaseError("Failed to fetch stations"));
	}
};

export const getConcessionClasses = async (): Promise<Result<ConcessionClass[], DatabaseError>> => {
	try {
		const classes = await prisma.concessionClass.findMany({
			orderBy: [{ isActive: "desc" }]
		});

		return success(sortByRomanKey(classes, "code"));
	} catch (error) {
		console.error("Error while fetching concession classes:", error);
		return failure(databaseError("Failed to fetch concession classes"));
	}
};

export const getConcessionPeriods = async (): Promise<Result<ConcessionPeriod[], DatabaseError>> => {
	try {
		const periods = await prisma.concessionPeriod.findMany({
			orderBy: [{ isActive: "desc" }, { duration: "asc" }]
		});

		return success(periods);
	} catch (error) {
		console.error("Error while fetching concession periods:", error);
		return failure(databaseError("Failed to fetch concession periods"));
	}
};

export const getStudentStation = async (): Promise<Result<StudentStation, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const student = await prisma.student.findUnique({
			where: { userId: targetStudentId },
			select: {
				status: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
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

		return success(student.station);
	} catch (error) {
		console.error("Error while fetching student's station:", error);
		return failure(databaseError("Failed to fetch student's station"));
	}
};
