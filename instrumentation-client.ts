import posthog from "posthog-js";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
		api_host: "/ingest",
		defaults: "2026-05-30",
		capture_pageview: true,
		capture_pageleave: true,
		person_profiles: "identified_only",
		ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
	});
}
