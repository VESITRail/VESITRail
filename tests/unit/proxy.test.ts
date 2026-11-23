import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";
import { getSessionCookie } from "better-auth/cookies";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

vi.mock(import("better-auth/cookies"), () => ({
	getSessionCookie: vi.fn()
}));

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:3000"));

const isPassThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

describe("Route Protection Proxy (src/proxy.ts)", () => {
	beforeEach(() => {
		vi.mocked(getSessionCookie).mockReturnValue(null);
	});

	describe("proxy", () => {
		it.each(["/", "/auth-error", "/privacy-policy", "/terms-of-service"])(
			"allows public route %s without a session",
			async (path) => {
				const response = await proxy(request(path));

				expect(isPassThrough(response)).toBe(true);
				expect(getSessionCookie).not.toHaveBeenCalled();
			}
		);

		it.each(["/dashboard", "/dashboard/student/apply-concession", "/dashboard/admin/booklets", "/onboarding"])(
			"redirects protected route %s to the home page without a session",
			async (path) => {
				const response = await proxy(request(path));

				expect(response.status).toBe(307);
				expect(response.headers.get("location")).toBe("http://localhost:3000/");
			}
		);

		it("allows a protected route when a session cookie is present", async () => {
			vi.mocked(getSessionCookie).mockReturnValue("session-token");

			const response = await proxy(request("/dashboard/student"));

			expect(isPassThrough(response)).toBe(true);
		});

		it("does not treat sub-paths of public routes as public", async () => {
			const response = await proxy(request("/auth-error/details"));

			expect(response.status).toBe(307);
		});
	});

	describe("config.matcher", () => {
		const matcher = new RegExp(`^${config.matcher[0]}$`);

		it.each(["/", "/dashboard", "/dashboard/admin/students", "/onboarding", "/auth-error"])(
			"runs the proxy for %s",
			(path) => {
				expect(matcher.test(path)).toBe(true);
			}
		);

		it.each([
			"/api/auth/session",
			"/api/github",
			"/_next/static/chunk.js",
			"/_next/image",
			"/favicon.ico",
			"/sitemap.xml",
			"/robots.txt",
			"/manifest.webmanifest",
			"/icons/icon-192.png",
			"/opengraph-image.png",
			"/twitter-image.png",
			"/privacy-policy",
			"/terms-of-service"
		])("skips the proxy for %s", (path) => {
			expect(matcher.test(path)).toBe(false);
		});

		it.each([
			"/sw.js",
			"/swe-worker-f61931bc2770d10b.js",
			"/firebase-messaging-sw.js",
			"/google74cc593637a99f30.html",
			"/icon.svg",
			"/apple-icon.png"
		])("skips the proxy for public asset %s in Next.js", (url) => {
			expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
		});

		it.each(["/ingest/e", "/ingest/static/array.js", "/ingest/decide"])(
			"skips the proxy for PostHog rewrite %s in Next.js",
			(url) => {
				expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
			}
		);

		it.each([
			"/dashboard/student/apply-concession",
			"/dashboard/admin/booklets",
			"/dashboard/student/settings",
			"/ingest",
			"/ingestion-report",
			"/some-random-page",
			"/some-random-page.html",
			"/swXjs",
			"/firebase-messaging-swXjs",
			"/google74cc593637a99f30Xhtml"
		])("runs the proxy for %s in Next.js", (url) => {
			expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
		});
	});
});
