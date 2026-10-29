import { auth } from "./test-auth";
import { NextRequest } from "next/server";
import { GET as githubGET } from "@/app/api/github/route";
import { GET as authGET } from "@/app/api/auth/[...all]/route";
import { getTestPrisma, cleanAllTables, createTestUser } from "./helpers";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

const githubResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const githubRequest = (type?: string) =>
	new NextRequest(new URL(`/api/github${type ? `?type=${type}` : ""}`, "http://localhost:3000"));

const contributor = (login: string, contributions: number, type = "User") => ({
	id: contributions,
	type,
	login,
	contributions,
	html_url: `https://github.com/${login}`,
	avatar_url: `https://avatars.githubusercontent.com/${login}`
});

describe("API Routes Integration", () => {
	describe("GET /api/github", () => {
		let fetchMock: ReturnType<typeof vi.fn>;

		const stubGitHub = (routes: Record<string, () => Response | Promise<Response>>) => {
			fetchMock = vi.fn(async (input: string | URL) => {
				const url = input.toString();
				const match = Object.keys(routes)
					.sort((a, b) => b.length - a.length)
					.find((suffix) => url.endsWith(suffix));
				if (!match) throw new Error(`Unexpected GitHub request: ${url}`);
				return routes[match]();
			});
			vi.stubGlobal("fetch", fetchMock);
		};

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("returns the star count with cache headers", async () => {
			stubGitHub({ "/repos/VESITRail/VESITRail": () => githubResponse({ stargazers_count: 128 }) });

			const res = await githubGET(githubRequest("stars"));

			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ stars: 128 });
			expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600, stale-while-revalidate=7200");
			expect(fetchMock).toHaveBeenCalledWith(
				"https://api.github.com/repos/VESITRail/VESITRail",
				expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/vnd.github.v3+json" }) })
			);
		});

		it("returns the latest stable release without the v prefix", async () => {
			stubGitHub({
				"/releases/latest": () =>
					githubResponse({
						draft: false,
						prerelease: false,
						tag_name: "v3.1.0",
						body: "## Changes",
						published_at: "2026-10-01T00:00:00Z"
					})
			});

			const res = await githubGET(githubRequest("release"));

			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({
				version: "3.1.0",
				tagName: "v3.1.0",
				changelog: "## Changes",
				publishedAt: "2026-10-01T00:00:00Z"
			});
			expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=1800, stale-while-revalidate=3600");
		});

		it.each([
			["draft", { draft: true, prerelease: false }],
			["prerelease", { draft: false, prerelease: true }]
		])("returns 404 when the latest release is a %s", async (_label, flags) => {
			stubGitHub({
				"/releases/latest": () =>
					githubResponse({ ...flags, tag_name: "v4.0.0-beta", body: null, published_at: "2026-10-01T00:00:00Z" })
			});

			const res = await githubGET(githubRequest("release"));

			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({ error: "No stable release available" });
		});

		it("returns contributors from stats, excluding bots and sorted by commits", async () => {
			stubGitHub({
				"/stats/contributors": () =>
					githubResponse([
						{ total: 4, author: contributor("alice", 0) },
						{ total: 90, author: contributor("dependabot[bot]", 0, "Bot") },
						{ total: 12, author: contributor("bob", 0) }
					])
			});

			const res = await githubGET(githubRequest("contributors"));

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.map((c: { username: string; commits: number }) => [c.username, c.commits])).toEqual([
				["bob", 12],
				["alice", 4]
			]);
			expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600, stale-while-revalidate=7200");
		});

		it.each([
			["fails", () => githubResponse({ message: "busy" }, 502)],
			["is empty", () => githubResponse({})]
		])("falls back to the contributors endpoint when stats %s", async (_label, statsResponse) => {
			stubGitHub({
				"/stats/contributors": statsResponse,
				"/contributors?per_page=100": () =>
					githubResponse([contributor("carol", 3), contributor("renovate", 50), contributor("dave", 8)])
			});

			const res = await githubGET(githubRequest("contributors"));

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.map((c: { username: string }) => c.username)).toEqual(["dave", "carol"]);
		});

		it("returns an empty contributor list when both GitHub endpoints fail", async () => {
			stubGitHub({
				"/stats/contributors": () => githubResponse({}, 500),
				"/contributors?per_page=100": () => githubResponse({}, 500)
			});

			const res = await githubGET(githubRequest("contributors"));

			expect(res.status).toBe(200);
			expect(await res.json()).toEqual([]);
		});

		it.each([undefined, "unknown"])("returns 400 for type %s", async (type) => {
			stubGitHub({});

			const res = await githubGET(githubRequest(type));

			expect(res.status).toBe(400);
			expect(await res.json()).toEqual({ error: "Invalid type parameter" });
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it.each([
			["stars", "/repos/VESITRail/VESITRail"],
			["release", "/releases/latest"]
		])("returns 500 when GitHub fails for %s", async (type, path) => {
			stubGitHub({ [path]: () => githubResponse({ message: "rate limited" }, 403) });

			const res = await githubGET(githubRequest(type));

			expect(res.status).toBe(500);
			expect(await res.json()).toEqual({ error: "Failed to fetch data from GitHub" });
		});
	});

	describe("GET /api/auth/[...all]", () => {
		const { prisma, pool } = getTestPrisma();
		const sessionRequest = (headers?: Headers) =>
			new Request(new URL("/api/auth/get-session", process.env.BETTER_AUTH_URL), { headers });

		beforeAll(async () => {
			await cleanAllTables(prisma);
		});

		afterAll(async () => {
			await cleanAllTables(prisma);
			await prisma.$disconnect();
			await pool.end();
		});

		it("returns no session for an anonymous request", async () => {
			const res = await authGET(sessionRequest());

			expect(res.status).toBe(200);
			expect(await res.json()).toBeNull();
		});

		it("returns the session for a signed-in user", async () => {
			const user = await createTestUser(prisma, { email: "vesitrail.apiroute@ves.ac.in" });
			const ctx = await auth.$context;
			const { headers } = await (ctx as any).test.login({ userId: user.id });

			const res = await authGET(sessionRequest(headers));

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.user).toMatchObject({ id: user.id, email: "vesitrail.apiroute@ves.ac.in" });
		});
	});
});
