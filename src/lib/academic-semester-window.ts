import { formatInTimeZone } from "date-fns-tz";

const latestSemesterDate = Date.parse("9999-12-31");
const earliestSemesterDate = Date.parse("0001-01-01");
const earlyApplicationWindowMs = 7 * 24 * 60 * 60 * 1_000;

export function getCollegeCalendarDate(now: Date) {
	return new Date(`${formatInTimeZone(now, "Asia/Kolkata", "yyyy-MM-dd")}T00:00:00.000Z`);
}

export function getAcademicSemesterApplicationOpening(startDate: Date) {
	return new Date(Math.max(startDate.getTime() - earlyApplicationWindowMs, earliestSemesterDate));
}

export function getAcademicSemesterOverlapBounds(startDate: Date, endDate: Date) {
	return {
		earliestEndDate: getAcademicSemesterApplicationOpening(startDate),
		latestStartDate: new Date(Math.min(endDate.getTime() + earlyApplicationWindowMs, latestSemesterDate))
	};
}
