import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  defaults: "2025-05-24",
  capture_exceptions: true,
  ui_host: "https://eu.posthog.com",
  debug: process.env.NODE_ENV === "development",
});
