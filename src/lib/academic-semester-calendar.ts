export function getAcademicYearDateRange(academicYearStart: number) {
	const nextYear = academicYearStart + 1;
	return {
		toYear: nextYear,
		fromYear: academicYearStart,
		lastDate: `${String(nextYear).padStart(4, "0")}-12-31`,
		firstDate: `${String(academicYearStart).padStart(4, "0")}-01-01`
	};
}

export function isDateInAcademicYear(
	date: string,
	{ firstDate, lastDate }: ReturnType<typeof getAcademicYearDateRange>
) {
	return firstDate <= date && date <= lastDate;
}
