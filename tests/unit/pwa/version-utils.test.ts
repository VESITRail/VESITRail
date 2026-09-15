import { describe, it, expect } from "vitest";
import { normalizeVersion, formatVersion, compareVersions } from "@/lib/pwa/version-utils";

describe("PWA Version Utilities (src/lib/pwa/version-utils.ts)", () => {
	describe("normalizeVersion", () => {
		it("strips leading 'v' prefix", () => {
			expect(normalizeVersion("v1.2.3")).toBe("1.2.3");
			expect(normalizeVersion("v0.0.1")).toBe("0.0.1");
		});

		it("leaves version without prefix intact", () => {
			expect(normalizeVersion("1.2.3")).toBe("1.2.3");
		});
	});

	describe("formatVersion", () => {
		it("prepends 'v' if missing", () => {
			expect(formatVersion("1.2.3")).toBe("v1.2.3");
		});

		it("does not duplicate 'v' if already present", () => {
			expect(formatVersion("v1.2.3")).toBe("v1.2.3");
		});
	});

	describe("compareVersions", () => {
		it("returns 0 for identical versions", () => {
			expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
			expect(compareVersions("v1.2.3", "1.2.3")).toBe(0);
		});

		it("returns -1 when currentVersion is older than newVersion", () => {
			expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
			expect(compareVersions("1.2.3", "1.3.0")).toBe(-1);
			expect(compareVersions("1.2.3", "1.2.4")).toBe(-1);
			expect(compareVersions("v1.0.0", "v2.0.0")).toBe(-1);
		});

		it("returns 1 when currentVersion is newer than newVersion", () => {
			expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
			expect(compareVersions("1.3.0", "1.2.3")).toBe(1);
			expect(compareVersions("1.2.4", "1.2.3")).toBe(1);
		});

		it("handles different segment counts treating missing parts as 0", () => {
			expect(compareVersions("1.0", "1.0.0")).toBe(0);
			expect(compareVersions("1.0.0", "1.0")).toBe(0);
			expect(compareVersions("1.0.0.1", "1.0.0")).toBe(1);
			expect(compareVersions("1.0.0", "1.0.0.1")).toBe(-1);
		});
	});
});
