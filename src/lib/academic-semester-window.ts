const latestSemesterDate = Date.parse("9999-12-31");
const earliestSemesterDate = Date.parse("0001-01-01");
const earlyApplicationWindowMs = 7 * 24 * 60 * 60 * 1_000;

export function getAcademicSemesterOverlapBounds(startDate: Date, endDate: Date) {
	return {
		earliestEndDate: new Date(Math.max(startDate.getTime() - earlyApplicationWindowMs, earliestSemesterDate)),
		latestStartDate: new Date(Math.min(endDate.getTime() + earlyApplicationWindowMs, latestSemesterDate))
	};
}
