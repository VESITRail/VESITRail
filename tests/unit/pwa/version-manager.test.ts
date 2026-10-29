import { PWA_CONFIG } from "@/lib/pwa/config";
import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from "vitest";

vi.mock(import("@/lib/github-client"), () => ({
	fetchGitHubStars: vi.fn(),
	fetchGitHubRelease: vi.fn(),
	fetchGitHubContributors: vi.fn()
}));

type GitHubClientModule = typeof import("@/lib/github-client");
type VersionManagerModule = typeof import("@/lib/pwa/version-manager");

const NOW = new Date("2026-10-29T10:00:00Z");
const STORAGE_KEY = PWA_CONFIG.version.storageKey;

const createStorage = (initial: Record<string, string> = {}) => {
	const store = new Map(Object.entries(initial));
	return {
		store,
		getItem: vi.fn((key: string) => store.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			store.delete(key);
		})
	};
};

const throwingStorage = () => ({
	getItem: vi.fn(() => {
		throw new Error("blocked");
	}),
	setItem: vi.fn(() => {
		throw new Error("blocked");
	}),
	removeItem: vi.fn(() => {
		throw new Error("blocked");
	})
});

const releaseData = (version: string) => ({
	version,
	changelog: "",
	tagName: `v${version}`,
	publishedAt: "2026-10-01T00:00:00Z"
});

describe("Version Manager (src/lib/pwa/version-manager.ts)", () => {
	let manager: VersionManagerModule["versionManager"];
	let fetchGitHubRelease: MockedFunction<GitHubClientModule["fetchGitHubRelease"]>;

	const load = async (storage: object) => {
		vi.stubGlobal("localStorage", storage);
		vi.resetModules();
		manager = (await import("@/lib/pwa/version-manager")).versionManager;
		fetchGitHubRelease = vi.mocked((await import("@/lib/github-client")).fetchGitHubRelease);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("getCurrentVersion", () => {
		it("returns the stored version without fetching", async () => {
			const stored = { version: "1.2.0", tagName: "v1.2.0", timestamp: 1 };
			await load(createStorage({ [STORAGE_KEY]: JSON.stringify(stored) }));

			await expect(manager.getCurrentVersion()).resolves.toEqual(stored);
			expect(fetchGitHubRelease).not.toHaveBeenCalled();
		});

		it("serves subsequent calls from the in-memory cache", async () => {
			const storage = createStorage({
				[STORAGE_KEY]: JSON.stringify({ version: "1.2.0", tagName: "v1.2.0", timestamp: 1 })
			});
			await load(storage);

			await manager.getCurrentVersion();
			await manager.getCurrentVersion();

			expect(storage.getItem).toHaveBeenCalledTimes(1);
		});

		it("fetches and stores the latest release when nothing is stored", async () => {
			const storage = createStorage();
			await load(storage);
			fetchGitHubRelease.mockResolvedValue(releaseData("2.1.0"));

			await expect(manager.getCurrentVersion()).resolves.toEqual({
				version: "2.1.0",
				tagName: "v2.1.0",
				timestamp: NOW.getTime()
			});
			expect(JSON.parse(storage.store.get(STORAGE_KEY)!)).toMatchObject({ version: "2.1.0" });
		});

		it("falls back to the latest release when stored JSON is corrupted", async () => {
			await load(createStorage({ [STORAGE_KEY]: "{not-json" }));
			fetchGitHubRelease.mockResolvedValue(releaseData("2.1.0"));

			await expect(manager.getCurrentVersion()).resolves.toMatchObject({ version: "2.1.0" });
		});

		it("returns and stores the fallback version when the release fetch fails", async () => {
			const storage = createStorage();
			await load(storage);
			fetchGitHubRelease.mockRejectedValue(new Error("offline"));

			const expected = { version: "1.0.0", tagName: "v1.0.0", timestamp: NOW.getTime() };
			await expect(manager.getCurrentVersion()).resolves.toEqual(expected);
			expect(JSON.parse(storage.store.get(STORAGE_KEY)!)).toEqual(expected);
		});

		it("still returns the fallback version when storage is unavailable", async () => {
			await load(throwingStorage());
			fetchGitHubRelease.mockRejectedValue(new Error("offline"));

			await expect(manager.getCurrentVersion()).resolves.toMatchObject({ version: "1.0.0" });
		});
	});

	describe("checkForUpdates", () => {
		it("returns true when the latest release is newer than the current version", async () => {
			await load(
				createStorage({ [STORAGE_KEY]: JSON.stringify({ version: "1.0.0", tagName: "v1.0.0", timestamp: 1 }) })
			);
			fetchGitHubRelease.mockResolvedValue(releaseData("1.1.0"));

			await expect(manager.checkForUpdates()).resolves.toBe(true);
		});

		it.each(["1.0.0", "0.9.9"])("returns false when the latest release is %s", async (latest) => {
			await load(
				createStorage({ [STORAGE_KEY]: JSON.stringify({ version: "1.0.0", tagName: "v1.0.0", timestamp: 1 }) })
			);
			fetchGitHubRelease.mockResolvedValue(releaseData(latest));

			await expect(manager.checkForUpdates()).resolves.toBe(false);
		});

		it("returns false when the latest release cannot be fetched", async () => {
			await load(
				createStorage({ [STORAGE_KEY]: JSON.stringify({ version: "1.0.0", tagName: "v1.0.0", timestamp: 1 }) })
			);
			fetchGitHubRelease.mockRejectedValue(new Error("offline"));

			await expect(manager.checkForUpdates()).resolves.toBe(false);
		});
	});

	describe("storeNewVersion", () => {
		it("normalizes the version before storing it", async () => {
			const storage = createStorage();
			await load(storage);

			await manager.storeNewVersion("v2.0.0", "v2.0.0");

			expect(JSON.parse(storage.store.get(STORAGE_KEY)!)).toEqual({
				version: "2.0.0",
				tagName: "v2.0.0",
				timestamp: NOW.getTime()
			});
			expect(manager.getStoredVersion()).toMatchObject({ version: "2.0.0" });
		});

		it("does not throw when storage is unavailable", async () => {
			await load(throwingStorage());

			await expect(manager.storeNewVersion("2.0.0", "v2.0.0")).resolves.toBeUndefined();
			expect(manager.getStoredVersion()).toBeNull();
		});
	});

	describe("getStoredVersion", () => {
		it("returns null when nothing is stored", async () => {
			await load(createStorage());

			expect(manager.getStoredVersion()).toBeNull();
		});

		it("reads the version from storage", async () => {
			const stored = { version: "1.5.0", tagName: "v1.5.0", timestamp: 1 };
			await load(createStorage({ [STORAGE_KEY]: JSON.stringify(stored) }));

			expect(manager.getStoredVersion()).toEqual(stored);
		});

		it("returns null when stored JSON is corrupted", async () => {
			await load(createStorage({ [STORAGE_KEY]: "{not-json" }));

			expect(manager.getStoredVersion()).toBeNull();
		});
	});

	describe("clearCache", () => {
		it("removes the stored version and in-memory cache", async () => {
			const storage = createStorage({
				[STORAGE_KEY]: JSON.stringify({ version: "1.5.0", tagName: "v1.5.0", timestamp: 1 })
			});
			await load(storage);
			manager.getStoredVersion();

			manager.clearCache();

			expect(storage.store.has(STORAGE_KEY)).toBe(false);
			expect(manager.getStoredVersion()).toBeNull();
		});

		it("does not throw when storage is unavailable", async () => {
			await load(throwingStorage());

			expect(() => manager.clearCache()).not.toThrow();
		});
	});

	describe("compareVersions", () => {
		it.each([
			["1.0.0", "1.1.0", -1],
			["1.1.0", "1.0.0", 1],
			["1.0.0", "1.0.0", 0]
		])("compares %s with %s as %i", async (current, next, expected) => {
			await load(createStorage());

			expect(Math.sign(manager.compareVersions(current, next))).toBe(expected);
		});
	});

	describe("getVersionString", () => {
		it("prefixes the current version with v", async () => {
			await load(
				createStorage({ [STORAGE_KEY]: JSON.stringify({ version: "1.5.0", tagName: "v1.5.0", timestamp: 1 }) })
			);

			await expect(manager.getVersionString()).resolves.toBe("v1.5.0");
		});

		it("returns the fallback version string when the release fetch fails", async () => {
			await load(createStorage());
			fetchGitHubRelease.mockRejectedValue(new Error("offline"));

			await expect(manager.getVersionString()).resolves.toBe("v1.0.0");
		});
	});
});
