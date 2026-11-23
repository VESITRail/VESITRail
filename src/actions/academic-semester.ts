"use server";

import {
	failure,
	success,
	type Result,
	databaseError,
	type AuthError,
	validationError,
	type DatabaseError,
	type ValidationError
} from "@/lib/result";
import {
	paginateAcademicSemesters,
	AcademicSemesterListSchema,
	type AcademicSemesterListParams
} from "@/lib/academic-semester-table";
import {
	AcademicSemesterIdSchema,
	type AcademicSemesterInput,
	AcademicSemesterInputSchema
} from "@/lib/validations/admin/academic-semester";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { Prisma } from "@/generated/prisma/client";
import { getAcademicSemesterOverlapBounds } from "@/lib/academic-semester-window";

const semesterSelect = {
	id: true,
	term: true,
	endDate: true,
	startDate: true,
	academicYearStart: true,
	_count: { select: { applications: true } }
} satisfies Prisma.AcademicSemesterSelect;

const academicSemestersPath = "/dashboard/admin/academic-semesters";
type SemesterActionError = AuthError | DatabaseError | ValidationError;

export type AcademicSemesterItem = Prisma.AcademicSemesterGetPayload<{ select: typeof semesterSelect }>;
export type AcademicSemesterPage = ReturnType<typeof paginateAcademicSemesters<AcademicSemesterItem>>;

export async function getAcademicSemesters(): Promise<Result<AcademicSemesterItem[], AuthError | DatabaseError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const semesters = await prisma.academicSemester.findMany({
			select: semesterSelect,
			orderBy: { startDate: "desc" }
		});
		return success(semesters);
	} catch (error) {
		console.error("Error listing academic semesters:", error);
		return failure(databaseError("Failed to list academic semesters"));
	}
}

export async function getPaginatedAcademicSemesters(
	params: AcademicSemesterListParams
): Promise<Result<AcademicSemesterPage, SemesterActionError>> {
	const result = await getAcademicSemesters();
	if (!result.isSuccess) return result;
	const parsed = AcademicSemesterListSchema.safeParse(params);
	if (!parsed.success) return failure(validationError("Invalid semester filters or page"));
	return success(paginateAcademicSemesters(result.data, parsed.data));
}

export async function getAcademicSemester(id: string): Promise<Result<AcademicSemesterItem, SemesterActionError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	const semesterId = AcademicSemesterIdSchema.safeParse(id);
	if (!semesterId.success) return failure(validationError("Invalid academic semester ID", "id"));

	try {
		const semester = await prisma.academicSemester.findUnique({
			select: semesterSelect,
			where: { id: semesterId.data }
		});
		if (!semester) return failure(validationError("Academic semester not found"));
		return success(semester);
	} catch (error) {
		console.error("Error fetching academic semester:", error);
		return failure(databaseError("Failed to fetch academic semester"));
	}
}

async function saveAcademicSemester(
	input: AcademicSemesterInput,
	id?: string
): Promise<Result<AcademicSemesterItem, DatabaseError | ValidationError>> {
	const parsed = AcademicSemesterInputSchema.safeParse(input);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		const field = issue?.path[0];
		return failure(
			validationError(issue?.message ?? "Invalid academic semester", typeof field === "string" ? field : undefined)
		);
	}

	const { academicYearStart, term, startDate, endDate } = parsed.data;
	const data = { academicYearStart, term, startDate: new Date(startDate), endDate: new Date(endDate) };
	const { earliestEndDate, latestStartDate } = getAcademicSemesterOverlapBounds(data.startDate, data.endDate);

	try {
		const result = await prisma.$transaction(
			async (tx) => {
				await tx.$executeRaw`LOCK TABLE "AcademicSemester" IN SHARE ROW EXCLUSIVE MODE`;

				if (id) {
					await tx.academicSemester.findUniqueOrThrow({ where: { id }, select: { id: true } });
				}

				const sameTerm = await tx.academicSemester.findUnique({
					select: { id: true },
					where: { academicYearStart_term: { academicYearStart, term } }
				});
				if (sameTerm && sameTerm.id !== id) {
					return failure(validationError("A semester already exists for this academic year and term"));
				}

				const overlappingSemester = await tx.academicSemester.findFirst({
					select: { id: true },
					where: {
						...(id ? { id: { not: id } } : {}),
						endDate: { gte: earliestEndDate },
						startDate: { lte: latestStartDate }
					}
				});
				if (overlappingSemester) {
					return failure(validationError("The application window overlaps another academic semester"));
				}

				const semester = id
					? await tx.academicSemester.update({ where: { id }, data, select: semesterSelect })
					: await tx.academicSemester.create({ data, select: semesterSelect });
				return success(semester);
			},
			{ isolationLevel: "ReadCommitted" }
		);
		if (result.isSuccess) revalidatePath(academicSemestersPath);
		return result;
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
			return failure(validationError("Academic semester not found"));
		}
		console.error("Error saving academic semester:", error);
		return failure(databaseError("Failed to save academic semester"));
	}
}

export async function createAcademicSemester(
	input: AcademicSemesterInput
): Promise<Result<AcademicSemesterItem, SemesterActionError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	return saveAcademicSemester(input);
}

export async function updateAcademicSemester(
	id: string,
	input: AcademicSemesterInput
): Promise<Result<AcademicSemesterItem, SemesterActionError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	const semesterId = AcademicSemesterIdSchema.safeParse(id);
	if (!semesterId.success) return failure(validationError("Invalid academic semester ID", "id"));

	return saveAcademicSemester(input, semesterId.data);
}

export async function deleteAcademicSemester(id: string): Promise<Result<{ id: string }, SemesterActionError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	const semesterId = AcademicSemesterIdSchema.safeParse(id);
	if (!semesterId.success) return failure(validationError("Invalid academic semester ID", "id"));

	try {
		const semester = await prisma.academicSemester.delete({
			select: { id: true },
			where: { id: semesterId.data }
		});
		revalidatePath(academicSemestersPath);
		return success(semester);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2003") {
				return failure(validationError("This semester cannot be deleted because it has applications"));
			}
			if (error.code === "P2025") {
				return failure(validationError("Academic semester not found"));
			}
		}
		console.error("Error deleting academic semester:", error);
		return failure(databaseError("Failed to delete academic semester"));
	}
}
