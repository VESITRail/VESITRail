import { describe, it, expect } from "vitest";
import { LATEST_APPLICATION_ORDER } from "@/lib/application-order";

describe("LATEST_APPLICATION_ORDER", () => {
	it("sorts by createdAt descending first", () => {
		expect(LATEST_APPLICATION_ORDER[0]).toEqual({ createdAt: "desc" });
	});

	it("breaks createdAt ties with shortId descending", () => {
		expect(LATEST_APPLICATION_ORDER[1]).toEqual({ shortId: "desc" });
	});

	it("contains exactly two sort keys", () => {
		expect(LATEST_APPLICATION_ORDER).toHaveLength(2);
	});
});
