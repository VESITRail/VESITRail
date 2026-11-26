import { addDays, getDay, getDaysInMonth, startOfMonth } from "date-fns";

export function getCalendarDays(month: Date) {
	const monthStart = startOfMonth(month);
	const leadingDays = getDay(monthStart);
	const daysInMonth = getDaysInMonth(monthStart);
	const daysThroughEndOfMonth = leadingDays + daysInMonth;
	const totalDays = Math.ceil(daysThroughEndOfMonth / 7) * 7;

	return Array.from({ length: totalDays }, (_, index) => ({
		date: addDays(monthStart, index - leadingDays),
		isCurrentMonth: index >= leadingDays && index < daysThroughEndOfMonth
	}));
}
