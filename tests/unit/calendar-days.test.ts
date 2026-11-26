import { describe, expect, it } from "vitest";
import { formatISO, parseISO } from "date-fns";
import { getCalendarDays } from "@/lib/calendar-days";

describe("getCalendarDays", () => {
	it.each([
		["2015-02-01", "2015-02-01", "2015-02-28", 28, 28],
		["2024-02-15", "2024-01-28", "2024-03-02", 35, 29],
		["2026-08-08", "2026-07-26", "2026-09-05", 42, 31],
		["0004-02-20", "0004-02-01", "0004-03-06", 35, 29]
	])("builds complete weeks for the month containing %s", (month, first, last, length, daysInMonth) => {
		const days = getCalendarDays(parseISO(month));
		const dayStrings = days.map(({ date }) => formatISO(date, { representation: "date" }));

		expect(dayStrings).toHaveLength(length);
		expect(dayStrings[0]).toBe(first);
		expect(dayStrings.at(-1)).toBe(last);
		expect(days.filter(({ isCurrentMonth }) => isCurrentMonth)).toHaveLength(daysInMonth);
		expect(
			days.every(({ isCurrentMonth }, index) => isCurrentMonth === dayStrings[index].startsWith(month.slice(0, 7)))
		).toBe(true);
	});
});
