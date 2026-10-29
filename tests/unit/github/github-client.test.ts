import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type GitHubClient = typeof import("@/lib/github-client");

const jsonResponse = (data: unknown, status = 200) => ({
	status,
	ok: status >= 200 && status < 300,
	json: vi.fn().mockResolvedValue(data)
});

describe("GitHub Client (src/lib/github-client.ts)", () => {
	let client: GitHubClient;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-29T10:00:00Z"));
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		vi.resetModules();
		client = await import("@/lib/github-client");
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fetches stars from the internal API route", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ stars: 42 }));

		await expect(client.fetchGitHubStars()).resolves.toEqual({ stars: 42 });
		expect(fetchMock).toHaveBeenCalledWith("/api/github?type=stars");
	});

	it("fetches contributors and release data using their type parameter", async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([{ username: "alice" }]));
		fetchMock.mockResolvedValueOnce(jsonResponse({ version: "2.0.0" }));

		await expect(client.fetchGitHubContributors()).resolves.toEqual([{ username: "alice" }]);
		await expect(client.fetchGitHubRelease()).resolves.toEqual({ version: "2.0.0" });
		expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/github?type=contributors");
		expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/github?type=release");
	});

	it("serves cached data within the five minute TTL", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ stars: 42 }));

		await client.fetchGitHubStars();
		vi.advanceTimersByTime(5 * 60 * 1000 - 1);
		await expect(client.fetchGitHubStars()).resolves.toEqual({ stars: 42 });

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("refetches once the TTL has expired", async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ stars: 42 }));
		fetchMock.mockResolvedValueOnce(jsonResponse({ stars: 43 }));

		await client.fetchGitHubStars();
		vi.advanceTimersByTime(5 * 60 * 1000);
		await expect(client.fetchGitHubStars()).resolves.toEqual({ stars: 43 });

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("caches each data type independently", async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ stars: 42 }));
		fetchMock.mockResolvedValueOnce(jsonResponse({ version: "2.0.0" }));

		await client.fetchGitHubStars();
		await client.fetchGitHubRelease();

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("deduplicates concurrent in-flight requests", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ stars: 42 }));

		const [first, second] = await Promise.all([client.fetchGitHubStars(), client.fetchGitHubStars()]);

		expect(first).toEqual({ stars: 42 });
		expect(second).toEqual({ stars: 42 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on a non-OK response and does not cache the failure", async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));
		fetchMock.mockResolvedValueOnce(jsonResponse({ stars: 42 }));

		await expect(client.fetchGitHubStars()).rejects.toThrow("Failed to fetch stars data: 500");
		await expect(client.fetchGitHubStars()).resolves.toEqual({ stars: 42 });

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("clears the pending request after a network error so it can be retried", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Network down"));
		fetchMock.mockResolvedValueOnce(jsonResponse({ stars: 42 }));

		await expect(client.fetchGitHubStars()).rejects.toThrow("Network down");
		await expect(client.fetchGitHubStars()).resolves.toEqual({ stars: 42 });
	});
});
