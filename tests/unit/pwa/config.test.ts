import { describe, it, expect } from "vitest";
import { CACHE_PREFIXES, PWA_CONFIG } from "@/lib/pwa/config";

describe("PWA Configuration (src/lib/pwa/config.ts)", () => {
	describe("CACHE_PREFIXES", () => {
		it("contains non-empty list of unique cache prefixes", () => {
			expect(CACHE_PREFIXES.length).toBeGreaterThan(0);
			const uniquePrefixes = new Set(CACHE_PREFIXES);
			expect(uniquePrefixes.size).toBe(CACHE_PREFIXES.length);
		});

		it("ensures each prefix is a trimmed non-empty string", () => {
			for (const prefix of CACHE_PREFIXES) {
				expect(typeof prefix).toBe("string");
				expect(prefix.trim().length).toBeGreaterThan(0);
				expect(prefix).toBe(prefix.trim());
			}
		});
	});

	describe("PWA_CONFIG", () => {
		it("contains valid github repository metadata", () => {
			expect(PWA_CONFIG.github.owner).toBe("VESITRail");
			expect(PWA_CONFIG.github.repo).toBe("VESITRail");
			expect(PWA_CONFIG.github.branch).toBe("main");
		});

		it("contains valid version check settings", () => {
			expect(PWA_CONFIG.version.checkInterval).toBeGreaterThan(0);
			expect(PWA_CONFIG.version.storageKey).toBeTruthy();
		});

		it("contains valid service worker settings", () => {
			expect(PWA_CONFIG.serviceWorker.scope).toBe("/");
			expect(PWA_CONFIG.serviceWorker.updateViaCache).toBe("none");
		});

		it("contains valid cache expiry configuration", () => {
			expect(PWA_CONFIG.cache.expiryTime).toBeGreaterThan(0);
			const expirationCategories = Object.values(PWA_CONFIG.cache.expiration);
			expect(expirationCategories.length).toBeGreaterThan(0);
			for (const exp of expirationCategories) {
				expect(exp.maxEntries).toBeGreaterThan(0);
				expect(exp.maxAgeSeconds).toBeGreaterThan(0);
			}
		});

		it("ensures every static asset grouping references a valid cache prefix", () => {
			const prefixSet = new Set<string>(CACHE_PREFIXES);
			const { scripts, styles, images, media, fonts } = PWA_CONFIG.cache.staticAssets;

			const allGroupedAssets = [...scripts, ...styles, ...images, ...media, ...fonts];
			expect(allGroupedAssets.length).toBeGreaterThan(0);

			for (const assetPrefix of allGroupedAssets) {
				expect(prefixSet.has(assetPrefix)).toBe(true);
			}
		});
	});
});
