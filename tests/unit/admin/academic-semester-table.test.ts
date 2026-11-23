import {
	formatAcademicYear,
	filterAcademicSemesters,
	paginateAcademicSemesters,
	AcademicSemesterListSchema
} from "@/lib/academic-semester-table";
import { describe, expect, it } from "vitest";

const semesters = [
	{ academicYearStart: 2027, term: "Odd" },
	{ academicYearStart: 2026, term: "Even" },
	{ academicYearStart: 2026, term: "Odd" }
] as const;

describe("AcademicSemesterListSchema", () => {
	const params = { page: 1, searchQuery: "", term: "all" };

	it("trims a valid search and keeps its selected term", () => {
		expect(AcademicSemesterListSchema.parse({ ...params, searchQuery: " 2026 ", term: "Odd" })).toEqual({
			page: 1,
			term: "Odd",
			searchQuery: "2026"
		});
	});

	it.each([
		null,
		undefined,
		{ ...params, page: 0 },
		{ ...params, page: 1.5 },
		{ ...params, page: "1" },
		{ ...params, term: "Winter" },
		{ ...params, searchQuery: "x".repeat(151) },
		{ ...params, pageSize: 1 }
	])("rejects invalid list input %j", (input) =>
		expect(AcademicSemesterListSchema.safeParse(input).success).toBe(false)
	);
});

describe("paginateAcademicSemesters", () => {
	const calendar = Array.from({ length: 11 }, (_, index) => ({
		term: "Odd" as const,
		academicYearStart: 2040 - index
	}));

	it("returns ten rows and pagination metadata for the first page", () => {
		expect(paginateAcademicSemesters(calendar, { page: 1, searchQuery: "", term: "all" })).toEqual({
			totalPages: 2,
			currentPage: 1,
			totalCount: 11,
			hasNextPage: true,
			hasPreviousPage: false,
			data: calendar.slice(0, 10)
		});
	});

	it("clamps a stale request to the last page", () => {
		expect(paginateAcademicSemesters(calendar, { page: 3, searchQuery: "", term: "all" })).toEqual({
			totalPages: 2,
			currentPage: 2,
			totalCount: 11,
			hasNextPage: false,
			hasPreviousPage: true,
			data: calendar.slice(10)
		});
	});

	it("applies filters before calculating pagination", () => {
		expect(paginateAcademicSemesters(calendar, { page: 2, searchQuery: "2040", term: "Even" })).toEqual({
			data: [],
			totalCount: 0,
			totalPages: 0,
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false
		});
	});
});

describe("formatAcademicYear", () => {
	it("displays consecutive years with an en dash", () => {
		expect(formatAcademicYear(2026)).toBe("2026–2027");
	});
});

describe("filterAcademicSemesters", () => {
	it.each(["", "  "])("keeps the original order for a blank query %j", (query) => {
		expect(filterAcademicSemesters(semesters, query, "all")).toEqual(semesters);
	});

	it.each(["2026-2027 EVEN", " 2026 – 2027 Even  ", "even", "2026—2027 even"])(
		"matches academic-year labels and terms in %j",
		(query) => {
			expect(filterAcademicSemesters(semesters, query, "all")).toEqual([semesters[1]]);
		}
	);

	it("combines the term filter with a query matching either year", () => {
		expect(filterAcademicSemesters(semesters, "2027", "Even")).toEqual([semesters[1]]);
	});

	it("can return multiple results for one year", () => {
		expect(filterAcademicSemesters(semesters, "2027", "Odd")).toEqual([semesters[0], semesters[2]]);
	});

	it("returns an empty result if the query conflicts with the term filter", () => {
		expect(filterAcademicSemesters(semesters, "odd", "Even")).toEqual([]);
	});

	it("returns an empty result for an empty calendar", () => {
		expect(filterAcademicSemesters([], "2026", "all")).toEqual([]);
	});
});
