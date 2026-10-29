import { subMonths, subYears } from "date-fns";

export type TimeRangeFilter = "1m" | "3m" | "6m" | "1y" | "all";

export const getStartDateForFilter = (filter: TimeRangeFilter): Date | null => {
	const now = new Date();
	switch (filter) {
		case "1m":
			return subMonths(now, 1);
		case "3m":
			return subMonths(now, 3);
		case "6m":
			return subMonths(now, 6);
		case "1y":
			return subYears(now, 1);
		case "all":
		default:
			return null;
	}
};
