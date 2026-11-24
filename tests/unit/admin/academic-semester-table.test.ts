import {
	formatAcademicYear,
	filterAcademicSemesters,
	paginateAcademicSemesters,
	applyAcademicSemesterEdit,
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

describe("applyAcademicSemesterEdit", () => {
	const request = { page: 1, searchQuery: "", term: "all" } as const;

	const calendar = Array.from({ length: 11 }, (_, index) => ({
		id: String(index),
		_count: { applications: 0 },
		term: "Odd" as "Odd" | "Even",
		academicYearStart: 2040 - index,
		startDate: new Date(Date.UTC(2040 - index, 6, 1)),
		endDate: new Date(Date.UTC(2040 - index, 11, 1))
	}));

	it("updates a row on a later page using the saved record and retains the page metadata", () => {
		const params = { ...request, page: 2 };
		const page = paginateAcademicSemesters(calendar, params);

		const edited = {
			...calendar[10],
			_count: { applications: 2 },
			endDate: new Date("2030-12-15")
		};

		expect(applyAcademicSemesterEdit(page, edited, params)).toEqual({
			...page,
			data: [edited]
		});
		expect(page.data).toEqual([calendar[10]]);
	});

	it("restores descending start-date order when all matching rows fit on the current page", () => {
		const page = paginateAcademicSemesters(calendar.slice(0, 3), request);
		const edited = { ...calendar[0], startDate: new Date("2037-07-01") };

		expect(applyAcademicSemesterEdit(page, edited, request)).toEqual({
			...page,
			data: [calendar[1], calendar[2], edited]
		});
	});

	it.each([
		{ ...request, term: "Odd" as const },
		{ ...request, searchQuery: "  odd  " }
	])("removes a row that no longer matches and updates the count for %j", (params) => {
		const page = paginateAcademicSemesters(calendar.slice(0, 2), params);
		const edited = { ...calendar[0], term: "Even" as const };

		expect(applyAcademicSemesterEdit(page, edited, params)).toMatchObject({
			totalCount: 1,
			data: [calendar[1]]
		});
	});

	it("presents an empty result when the last matching row no longer matches", () => {
		const params = { ...request, searchQuery: "2041" };
		const page = paginateAcademicSemesters(calendar, params);
		const edited = { ...calendar[0], academicYearStart: 2042 };

		expect(applyAcademicSemesterEdit(page, edited, params)).toMatchObject({
			data: [],
			totalCount: 0,
			totalPages: 0,
			currentPage: 1
		});
	});

	it("requires a refreshed page when a row could move between pages", () => {
		const page = paginateAcademicSemesters(calendar, request);
		const edited = { ...calendar[0], startDate: new Date("2029-07-01") };
		expect(applyAcademicSemesterEdit(page, edited, request)).toBeNull();
	});

	it("requires a refreshed page to fill the gap after a row stops matching a multi-page filter", () => {
		const params = { ...request, term: "Odd" as const };
		const page = paginateAcademicSemesters(calendar, params);
		const edited = { ...calendar[0], term: "Even" as const };
		expect(applyAcademicSemesterEdit(page, edited, params)).toBeNull();
	});

	it("requires a refreshed page when the saved row is missing from the loaded page", () => {
		const page = paginateAcademicSemesters(calendar, request);
		expect(applyAcademicSemesterEdit(page, calendar[10], request)).toBeNull();
	});
});
