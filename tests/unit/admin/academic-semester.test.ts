import { describe, expect, it } from "vitest";
import { AcademicSemesterIdSchema, AcademicSemesterInputSchema } from "@/lib/validations/admin/academic-semester";

const semester = {
	term: "Even",
	endDate: "2027-06-15",
	academicYearStart: 2026,
	startDate: "2027-01-11"
};

describe("AcademicSemesterInputSchema", () => {
	it("accepts dates in the next calendar year and trims date strings", () => {
		expect(AcademicSemesterInputSchema.parse({ ...semester, startDate: " 2027-01-11 " })).toEqual(semester);
	});

	it("accepts a one-day semester on a leap day", () => {
		const leapDaySemester = { ...semester, term: "Odd", startDate: "2028-02-29", endDate: "2028-02-29" };
		expect(AcademicSemesterInputSchema.parse(leapDaySemester)).toEqual(leapDaySemester);
	});

	it.each([
		"",
		" ",
		null,
		undefined,
		"2027-02-29",
		"2027-02-30",
		"2027-04-31",
		"0000-01-01",
		"2027-1-1",
		"2027-01-11T00:00:00+05:30",
		new Date("2027-01-11")
	])("rejects an invalid date %j in either field", (date) => {
		for (const field of ["startDate", "endDate"] as const) {
			expect(AcademicSemesterInputSchema.safeParse({ ...semester, [field]: date })).toMatchObject({
				success: false,
				error: { issues: [{ path: [field] }] }
			});
		}
	});

	it.each([1, 2_147_483_647])("accepts the valid academic year boundary %i", (academicYearStart) => {
		expect(AcademicSemesterInputSchema.parse({ ...semester, academicYearStart }).academicYearStart).toBe(
			academicYearStart
		);
	});

	it.each([0, -1, 2026.5, 2_147_483_648, "2026", null, undefined])(
		"rejects an invalid academic year %j",
		(academicYearStart) => {
			expect(AcademicSemesterInputSchema.safeParse({ ...semester, academicYearStart })).toMatchObject({
				success: false,
				error: { issues: [{ path: ["academicYearStart"] }] }
			});
		}
	);

	it.each(["", "Spring", "even", null, undefined])("rejects an invalid term %j", (term) => {
		expect(AcademicSemesterInputSchema.safeParse({ ...semester, term })).toMatchObject({
			success: false,
			error: { issues: [{ path: ["term"] }] }
		});
	});

	it("rejects an end date before the start date", () => {
		expect(AcademicSemesterInputSchema.safeParse({ ...semester, endDate: "2027-01-10" })).toMatchObject({
			success: false,
			error: { issues: [{ path: ["endDate"] }] }
		});
	});

	it("rejects extra properties", () => {
		expect(AcademicSemesterInputSchema.safeParse({ ...semester, id: "overridden-id" })).toMatchObject({
			success: false,
			error: { issues: [{ code: "unrecognized_keys", keys: ["id"] }] }
		});
	});

	it.each([[null], [undefined], [""], [[]]])("rejects a non-object payload %j", (input) => {
		expect(AcademicSemesterInputSchema.safeParse(input)).toMatchObject({ success: false });
	});
});

describe("AcademicSemesterIdSchema", () => {
	it("normalizes a valid semester ID", () => {
		expect(AcademicSemesterIdSchema.parse(" 550E8400-E29B-41D4-A716-446655440000 ")).toBe(
			"550e8400-e29b-41d4-a716-446655440000"
		);
	});

	it.each(["", " ", "wrong-id", null, undefined, "00000000-0000-0000-0000-000000000000"])(
		"rejects an invalid semester ID %j",
		(id) => {
			expect(AcademicSemesterIdSchema.safeParse(id)).toMatchObject({ success: false });
		}
	);
});
