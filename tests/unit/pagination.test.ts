import { describe, it, expect } from "vitest";
import { getPaginationMeta } from "@/lib/pagination";

describe("Pagination Helpers (src/lib/pagination.ts)", () => {
	describe("getPaginationMeta", () => {
		it("returns zero pages for zero results by default", () => {
			expect(getPaginationMeta(0, 1, 10)).toEqual({
				totalPages: 0,
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false
			});
		});

		it("applies a minimum page count when provided", () => {
			expect(getPaginationMeta(0, 1, 10, 1)).toEqual({
				totalPages: 1,
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false
			});
		});

		it("does not let the minimum override a larger page count", () => {
			expect(getPaginationMeta(25, 1, 10, 1).totalPages).toBe(3);
		});

		it.each([
			[25, 1, 10, 3, true, false],
			[25, 2, 10, 3, true, true],
			[25, 3, 10, 3, false, true],
			[30, 3, 10, 3, false, true],
			[1, 1, 10, 1, false, false],
			[10, 1, 10, 1, false, false],
			[11, 1, 10, 2, true, false],
			[25, 5, 10, 3, false, true]
		])(
			"computes meta for total=%i page=%i size=%i",
			(totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage) => {
				expect(getPaginationMeta(totalCount, page, pageSize)).toEqual({
					totalPages,
					hasNextPage,
					hasPreviousPage,
					currentPage: page
				});
			}
		);
	});
});
