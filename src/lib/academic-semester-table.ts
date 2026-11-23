import { z } from "zod";
import { getPaginationMeta } from "@/lib/pagination";
import { AcademicSemesterInputSchema, type AcademicSemesterInput } from "@/lib/validations/admin/academic-semester";

export const ACADEMIC_SEMESTER_PAGE_SIZE = 10;
export type AcademicSemesterTermFilter = AcademicSemesterInput["term"] | "all";

export const AcademicSemesterListSchema = z.strictObject({
	page: z.int32().positive(),
	searchQuery: z.string().trim().max(150),
	term: AcademicSemesterInputSchema.shape.term.or(z.literal("all"))
});

export type AcademicSemesterListParams = z.input<typeof AcademicSemesterListSchema>;

export function paginateAcademicSemesters<T extends Pick<AcademicSemesterInput, "academicYearStart" | "term">>(
	semesters: readonly T[],
	{ page, searchQuery, term }: AcademicSemesterListParams
) {
	const filtered = filterAcademicSemesters(semesters, searchQuery, term);
	const lastPage = Math.max(1, Math.ceil(filtered.length / ACADEMIC_SEMESTER_PAGE_SIZE));
	const currentPage = Math.min(page, lastPage);
	const start = (currentPage - 1) * ACADEMIC_SEMESTER_PAGE_SIZE;
	return {
		...getPaginationMeta(filtered.length, currentPage, ACADEMIC_SEMESTER_PAGE_SIZE),
		data: filtered.slice(start, start + ACADEMIC_SEMESTER_PAGE_SIZE),
		totalCount: filtered.length
	};
}

export function formatAcademicYear(academicYearStart: number) {
	return `${academicYearStart}–${academicYearStart + 1}`;
}

export function filterAcademicSemesters<T extends Pick<AcademicSemesterInput, "academicYearStart" | "term">>(
	semesters: readonly T[],
	query: string,
	term: AcademicSemesterTermFilter
) {
	const search = query
		.trim()
		.toLowerCase()
		.replace(/\s*[-–—]\s*/g, "–")
		.replace(/\s+/g, " ");
	return semesters.filter((semester) => {
		const label = `${formatAcademicYear(semester.academicYearStart)} ${semester.term.toLowerCase()} semester`;
		return (term === "all" || semester.term === term) && label.includes(search);
	});
}
