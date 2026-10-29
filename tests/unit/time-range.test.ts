import { getStartDateForFilter } from "@/lib/time-range";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Time Range Helpers (src/lib/time-range.ts)", () => {
	describe("getStartDateForFilter", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it.each([
			["1m", new Date(2024, 4, 15, 10, 0, 0)],
			["3m", new Date(2024, 2, 15, 10, 0, 0)],
			["6m", new Date(2023, 11, 15, 10, 0, 0)],
			["1y", new Date(2023, 5, 15, 10, 0, 0)]
		] as const)("returns the start date for the %s filter", (filter, expected) => {
			vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));
			expect(getStartDateForFilter(filter)).toEqual(expected);
		});

		it("returns null for the all filter", () => {
			vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));
			expect(getStartDateForFilter("all")).toBeNull();
		});

		it("clamps to the last day of a shorter month", () => {
			vi.setSystemTime(new Date(2024, 2, 31, 10, 0, 0));
			expect(getStartDateForFilter("1m")).toEqual(new Date(2024, 1, 29, 10, 0, 0));
		});

		it("clamps leap day to 28 February one year earlier", () => {
			vi.setSystemTime(new Date(2024, 1, 29, 10, 0, 0));
			expect(getStartDateForFilter("1y")).toEqual(new Date(2023, 1, 28, 10, 0, 0));
		});
	});
});
