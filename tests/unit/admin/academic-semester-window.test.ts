import { describe, expect, it } from "vitest";
import * as semesterWindow from "@/lib/academic-semester-window";

describe("getAcademicSemesterOverlapBounds", () => {
	it.each([
		["2027-08-01", "2027-12-15", "2027-07-25", "2027-12-22"],
		["2028-01-02", "2028-12-28", "2027-12-26", "2029-01-04"],
		["2028-02-01", "2028-02-22", "2028-01-25", "2028-02-29"],
		["2028-03-07", "2028-06-15", "2028-02-29", "2028-06-22"],
		["0001-01-01", "0001-01-01", "0001-01-01", "0001-01-08"],
		["9999-12-31", "9999-12-31", "9999-12-24", "9999-12-31"]
	])("derives the inclusive overlap bounds for %s through %s", (startDate, endDate, earliestEnd, latestStart) => {
		expect(semesterWindow.getAcademicSemesterOverlapBounds(new Date(startDate), new Date(endDate))).toEqual({
			earliestEndDate: new Date(earliestEnd),
			latestStartDate: new Date(latestStart)
		});
	});
});

describe("getAcademicSemesterApplicationOpening", () => {
	it.each([
		["2027-08-01", "2027-07-25"],
		["2028-03-07", "2028-02-29"],
		["2028-01-02", "2027-12-26"]
	])("derives the opening date for %s", (startDate, opening) => {
		expect(semesterWindow.getAcademicSemesterApplicationOpening(new Date(startDate))).toEqual(new Date(opening));
	});
});

describe("getCollegeCalendarDate", () => {
	it.each([
		["2027-07-24T18:29:59.999Z", "2027-07-24"],
		["2027-07-24T18:30:00.000Z", "2027-07-25"],
		["2027-12-31T18:30:00.000Z", "2028-01-01"]
	])("maps %s to the college calendar date", (timestamp, date) => {
		expect(semesterWindow.getCollegeCalendarDate(new Date(timestamp))).toEqual(new Date(date));
	});
});
