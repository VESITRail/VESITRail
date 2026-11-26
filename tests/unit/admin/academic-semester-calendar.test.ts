import { describe, expect, it } from "vitest";
import { getAcademicYearDateRange, isDateInAcademicYear } from "@/lib/academic-semester-calendar";

describe("getAcademicYearDateRange", () => {
	it.each([
		[1, 2, "0001-01-01", "0002-12-31"],
		[2026, 2027, "2026-01-01", "2027-12-31"],
		[9998, 9999, "9998-01-01", "9999-12-31"]
	])("returns inclusive bounds for academic year %i", (fromYear, toYear, firstDate, lastDate) => {
		expect(getAcademicYearDateRange(fromYear)).toEqual({ fromYear, toYear, firstDate, lastDate });
	});
});

describe("isDateInAcademicYear", () => {
	it.each([
		["2025-12-31", false],
		["2026-01-01", true],
		["2027-01-01", true],
		["2027-12-31", true],
		["2028-01-01", false]
	])("checks whether %s falls within academic year 2026–2027", (date, isInRange) => {
		expect(isDateInAcademicYear(date, getAcademicYearDateRange(2026))).toBe(isInRange);
	});
});
