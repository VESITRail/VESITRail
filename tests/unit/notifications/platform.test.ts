import { describe, it, expect } from "vitest";
import { getPlatform } from "@/lib/platform";

describe("Platform Detection (src/lib/platform.ts)", () => {
	describe("getPlatform", () => {
		it.each([
			["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36", "Android"],
			["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148", "iOS"],
			["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148", "iOS"],
			["Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)", "iOS"],
			["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36", "Web"],
			["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15", "Web"],
			["MOZILLA/5.0 (LINUX; ANDROID 14)", "Android"],
			["", "Web"]
		])("detects %j as %s", (userAgent, expected) => {
			expect(getPlatform(userAgent)).toBe(expected);
		});
	});
});
