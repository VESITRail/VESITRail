import {
	isBot,
	toReleaseData,
	mapContributors,
	mapContributorStats,
	type GitHubContributor,
	type GitHubReleaseResponse
} from "@/lib/github/transform";
import { describe, it, expect } from "vitest";

const contributor = (overrides: Partial<GitHubContributor> = {}): GitHubContributor => ({
	id: 1,
	type: "User",
	login: "jaykerkar",
	contributions: 10,
	html_url: "https://github.com/jaykerkar",
	avatar_url: "https://avatars.githubusercontent.com/u/1",
	...overrides
});

const release = (overrides: Partial<GitHubReleaseResponse> = {}): GitHubReleaseResponse => ({
	draft: false,
	tag_name: "v2.3.1",
	prerelease: false,
	body: "## Changes\n- Fixes",
	published_at: "2026-10-01T10:00:00Z",
	...overrides
});

describe("GitHub Transforms (src/lib/github/transform.ts)", () => {
	describe("isBot", () => {
		it("treats any account with type Bot as a bot", () => {
			expect(isBot("totally-human", "Bot")).toBe(true);
		});

		it.each(["dependabot[bot]", "github-actions", "renovate", "greenkeeper", "semantic-release-bot", "DependaBot"])(
			"detects bot username %s",
			(username) => {
				expect(isBot(username, "User")).toBe(true);
			}
		);

		it.each(["jaykerkar", "octocat"])("does not flag regular user %s", (username) => {
			expect(isBot(username, "User")).toBe(false);
		});
	});

	describe("toReleaseData", () => {
		it("maps a stable release and strips the v prefix", () => {
			expect(toReleaseData(release())).toEqual({
				version: "2.3.1",
				tagName: "v2.3.1",
				changelog: "## Changes\n- Fixes",
				publishedAt: "2026-10-01T10:00:00Z"
			});
		});

		it("keeps tags without a v prefix unchanged", () => {
			expect(toReleaseData(release({ tag_name: "2.3.1" }))?.version).toBe("2.3.1");
		});

		it.each([null, ""])("falls back to a default changelog when body is %j", (body) => {
			expect(toReleaseData(release({ body }))?.changelog).toBe("No changelog available.");
		});

		it("returns null for draft releases", () => {
			expect(toReleaseData(release({ draft: true }))).toBeNull();
		});

		it("returns null for prereleases", () => {
			expect(toReleaseData(release({ prerelease: true }))).toBeNull();
		});
	});

	describe("mapContributors", () => {
		it("maps, filters bots, and sorts by contributions descending", () => {
			const result = mapContributors([
				contributor({ login: "alice", contributions: 5 }),
				contributor({ login: "dependabot[bot]", type: "Bot", contributions: 100 }),
				contributor({ login: "bob", contributions: 20 })
			]);

			expect(result.map((c) => c.username)).toEqual(["bob", "alice"]);
			expect(result[0]).toEqual({
				commits: 20,
				username: "bob",
				profileUrl: "https://github.com/jaykerkar",
				avatar: "https://avatars.githubusercontent.com/u/1"
			});
		});

		it("returns an empty array for no contributors", () => {
			expect(mapContributors([])).toEqual([]);
		});
	});

	describe("mapContributorStats", () => {
		it("maps stats, skips missing authors and bots, and sorts by total commits", () => {
			const result = mapContributorStats([
				{ total: 3, author: contributor({ login: "alice" }) },
				{ total: 50, author: contributor({ login: "github-actions", type: "Bot" }) },
				{ total: 9, author: null as unknown as GitHubContributor },
				{ total: 12, author: contributor({ login: "bob" }) }
			]);

			expect(result.map((c) => [c.username, c.commits])).toEqual([
				["bob", 12],
				["alice", 3]
			]);
		});

		it("returns an empty array for no stats", () => {
			expect(mapContributorStats([])).toEqual([]);
		});
	});
});
